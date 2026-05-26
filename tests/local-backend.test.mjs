import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createLocalBackend } from "../server/local-backend.mjs";

test("local backend signs in allowlisted admins and rejects unknown users", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  try {
    const backend = await createLocalBackend({ dataDir: workspace });

    const denied = await backend.signIn({ email: "guest@example.com", password: "admin123" });
    assert.equal(denied.ok, false);
    assert.equal(denied.status, 403);

    const accepted = await backend.signIn({ email: "admin@skate-cim.local", password: "admin123" });
    assert.equal(accepted.ok, true);
    assert.equal(accepted.admin.email, "admin@skate-cim.local");
    assert.equal(typeof accepted.sessionId, "string");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend publishes draft config as the C-side current snapshot", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  try {
    const backend = await createLocalBackend({ dataDir: workspace });
    const signIn = await backend.signIn({ email: "admin@skate-cim.local", password: "admin123" });
    assert.equal(signIn.ok, true);

    const draft = await backend.getDraftConfig(signIn.sessionId);
    draft.shoes[0].name = "YJS-pro CIM 本地后台验证";
    draft.fabrics.push({
      id: "fabric-test-blue",
      materialKey: "test_blue_smooth",
      name: "测试蓝色光面皮",
      mode: "solid_mask",
      color: "#4c8dff",
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-24 00:00"
    });

    const saveResult = await backend.saveDraftConfig(signIn.sessionId, draft);
    assert.equal(saveResult.ok, true);

    const publishResult = await backend.publishDraft(signIn.sessionId, "验证本地发布闭环");
    assert.equal(publishResult.ok, true);
    assert.match(publishResult.version, /^local-v\d+$/);

    const publicConfig = await backend.getPublicConfig();
    assert.equal(publicConfig.release.online.version, publishResult.version);
    assert.equal(publicConfig.shoes[0].name, "YJS-pro CIM 本地后台验证");
    assert.equal(publicConfig.fabrics.at(-1).materialKey, "test_blue_smooth");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend writes confirmation emails to local outbox", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  try {
    const backend = await createLocalBackend({ dataDir: workspace, confirmationEmailTo: "orders@example.com" });
    const result = await backend.queueConfirmationEmail({
      customer: { name: "测试用户", phone: "13800138000" },
      product: "YJS Pro CIM",
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(result.ok, true);
    assert.equal(result.to, "orders@example.com");
    assert.match(result.id, /^confirmation-\d+-[a-f0-9]{8}$/);

    const message = JSON.parse(await readFile(path.join(workspace, "outbox", `${result.id}.json`), "utf8"));
    assert.equal(message.to, "orders@example.com");
    assert.equal(message.subject, "YJS Pro CIM 定制确认单 - 测试用户");
    assert.equal(message.attachments[0].filename, "YJS Pro CIM-测试用户-confirmation.html");
    assert.match(message.attachments[0].content, /定制确认单/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend requires project-level confirmation recipient", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  try {
    const backend = await createLocalBackend({ dataDir: workspace });
    const result = await backend.queueConfirmationEmail({
      customer: { name: "测试用户" },
      product: "YJS Pro CIM",
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 500);
    assert.equal(result.message, "确认单收件邮箱未配置");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend rejects invalid confirmation email addresses", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  try {
    const invalidRecipientBackend = await createLocalBackend({ dataDir: workspace, confirmationEmailTo: "15732152800@163.com'" });
    const invalidRecipient = await invalidRecipientBackend.queueConfirmationEmail({
      customer: { name: "测试用户", email: "customer@example.com" },
      product: "YJS Pro CIM",
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(invalidRecipient.ok, false);
    assert.equal(invalidRecipient.status, 400);
    assert.equal(invalidRecipient.message, "确认单收件邮箱格式不正确");

    const invalidCustomer = await createLocalBackend({ dataDir: workspace, confirmationEmailTo: "orders@example.com" });
    const invalidReplyTo = await invalidCustomer.queueConfirmationEmail({
      customer: { name: "测试用户", email: "15732152800@163.com'" },
      product: "YJS Pro CIM",
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(invalidReplyTo.ok, false);
    assert.equal(invalidReplyTo.status, 400);
    assert.equal(invalidReplyTo.message, "客户邮箱格式不正确");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend sends confirmation emails through Resend transport", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  const resendRequests = [];
  try {
    const backend = await createLocalBackend({
      dataDir: workspace,
      confirmationEmailTo: "orders@example.com",
      emailTransport: "resend",
      resendApiKey: "re_test_key",
      resendFrom: "Skate CIM <orders@example.com>",
      fetchImpl: async (url, options) => {
        resendRequests.push({ url, options, body: JSON.parse(options.body) });
        return new Response(JSON.stringify({ id: "email_test_123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    });
    const result = await backend.queueConfirmationEmail({
      customer: { name: "测试用户", email: "customer@example.com" },
      product: "YJS Pro CIM",
      embroidery: [
        {
          code: "C",
          name: "鞋舌电绣片",
          image: {
            name: "logo.png",
            type: "image/png",
            dataUrl: "data:image/png;base64,QUJD"
          }
        }
      ],
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(result.ok, true);
    assert.equal(result.transport, "resend");
    assert.equal(result.providerId, "email_test_123");
    assert.equal(result.to, "orders@example.com");
    assert.equal(resendRequests.length, 1);
    assert.equal(resendRequests[0].url, "https://api.resend.com/emails");
    assert.equal(resendRequests[0].options.headers.Authorization, "Bearer re_test_key");
    assert.equal(resendRequests[0].body.from, "Skate CIM <orders@example.com>");
    assert.deepEqual(resendRequests[0].body.to, ["orders@example.com"]);
    assert.deepEqual(resendRequests[0].body.reply_to, ["customer@example.com"]);
    assert.match(resendRequests[0].body.html, /定制确认单/);
    assert.equal(resendRequests[0].body.attachments[0].filename, "YJS Pro CIM-测试用户-confirmation.html");
    assert.equal(resendRequests[0].body.attachments[1].filename, "C-鞋舌电绣片-logo.png");
    assert.equal(resendRequests[0].body.attachments[1].content, "QUJD");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend logs Resend failures without leaking secrets", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  const logs = [];
  try {
    const backend = await createLocalBackend({
      dataDir: workspace,
      confirmationEmailTo: "orders@example.com",
      emailTransport: "resend",
      resendApiKey: "re_secret_should_not_leak",
      resendFrom: "Skate CIM <orders@example.com>",
      logger: { error: (...args) => logs.push(args) },
      fetchImpl: async () => new Response(JSON.stringify({ message: "Domain not verified" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      })
    });

    const result = await backend.queueConfirmationEmail({
      customer: { name: "测试用户", email: "customer@example.com" },
      product: "YJS Pro CIM",
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(logs.length, 1);
    assert.equal(logs[0][0], "[confirmation-email] Resend send failed");
    assert.deepEqual(logs[0][1], {
      status: 403,
      to: "orders@example.com",
      from: "Skate CIM <orders@example.com>",
      subject: "YJS Pro CIM 定制确认单 - 测试用户",
      providerMessage: "Domain not verified"
    });
    assert(!JSON.stringify(logs).includes("re_secret_should_not_leak"));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
