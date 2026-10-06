import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createLocalBackend } from "../server/local-backend.mjs";

test("local backend stores design documents and image assets with cloud-shaped identifiers", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-design-backend-"));
  const backend = await createLocalBackend({ dataDir: workspace, logger: { info() {}, error() {} } });
  try {
    const uploadTicket = await backend.createAssetUploadTicket({
      fileName: "logo.png",
      mimeType: "image/png",
      sizeBytes: 8
    });
    assert.equal(uploadTicket.ok, true);
    assert.equal(uploadTicket.asset.status, "pending");
    assert.match(uploadTicket.asset.objectKey, /^design-assets\/asset_[a-f0-9]+$/);

    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const uploaded = await backend.storeAssetContent(uploadTicket.asset.assetId, pngHeader);
    assert.equal(uploaded.ok, true);
    assert.equal(uploaded.asset.status, "ready");
    assert.deepEqual(await readFile((await backend.getAsset(uploadTicket.asset.assetId)).path), pngHeader);
    assert.equal((await backend.completeAssetUpload(uploadTicket.asset.assetId)).ok, true);

    const document = {
      schemaVersion: 1,
      id: "design_local_test",
      productId: "yjs-pro-cim",
      slotId: "tongue",
      templateVersion: 1,
      revision: 2,
      productionFrame: { widthMm: null, heightMm: null, isPlaceholder: true },
      objects: [{ id: "obj_logo", type: "image", sourceAssetId: uploadTicket.asset.assetId }]
    };
    assert.equal((await backend.saveDesignDocument(document)).ok, true);
    assert.deepEqual(await backend.listDesignDocuments("yjs-pro-cim"), [document]);
    assert.equal((await backend.saveDesignDocument({ ...document, revision: 1 })).status, 409);
    assert.equal((await backend.saveDesignDocument({ ...document, id: "design_inline_image", objects: [{ id: "obj", type: "image", dataUrl: "data:image/png;base64,AA==" }] })).status, 413);
    assert.equal((await backend.createAssetUploadTicket({ fileName: "bad.gif", mimeType: "image/gif", sizeBytes: 4 })).status, 415);
    const mismatchedTicket = await backend.createAssetUploadTicket({ fileName: "spoof.png", mimeType: "image/png", sizeBytes: 4 });
    assert.equal((await backend.storeAssetContent(mismatchedTicket.asset.assetId, Buffer.from([1, 2, 3, 4]))).status, 415);
  } finally {
    backend.close();
    await rm(workspace, { recursive: true, force: true });
  }
});

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
      customer: { name: "测试用户", phone: "13800138000", date: "2026-10-06" },
      product: "YJS Pro CIM",
      effectSnapshots: {
        previews: [
          { id: "side", label: "侧面", dataUrl: "data:image/png;base64,U0lERQ==" },
          { id: "three-quarter", label: "45度", dataUrl: "data:image/jpeg;base64,UVVF" },
          { id: "front", label: "正面", dataUrl: "data:image/png;base64,RlJPTlQ=" }
        ]
      },
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(result.ok, true);
    assert.equal(result.to, "orders@example.com");
    assert.match(result.id, /^confirmation-\d+-[a-f0-9]{8}$/);

    const message = JSON.parse(await readFile(path.join(workspace, "outbox", `${result.id}.json`), "utf8"));
    assert.deepEqual(message.to, ["orders@example.com"]);
    assert.equal(message.subject, "YJS Pro CIM 定制确认单 - 测试用户");
    assert.equal(message.attachments[0].filename, "YJS Pro CIM_测试用户_20261006_侧面.png");
    assert.equal(message.attachments[1].filename, "YJS Pro CIM_测试用户_20261006_45度.jpg");
    assert.equal(message.attachments[2].filename, "YJS Pro CIM_测试用户_20261006_正面.png");
    assert.equal(message.attachments.length, 3);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend accepts an English structured confirmation sheet", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "skate-cim-backend-"));
  try {
    const backend = await createLocalBackend({ dataDir: workspace, confirmationEmailTo: "orders@example.com" });
    const result = await backend.queueConfirmationEmail({
      documentType: "skate-cim-confirmation-sheet",
      documentVersion: 1,
      language: "en",
      customer: { name: "English User", email: "customer@example.com" },
      product: "YJS Pro CIM",
      html: '<!doctype html><html lang="en"><head><meta name="skate-cim-document" content="confirmation-sheet"></head><body><h1>Customization Confirmation Sheet</h1></body></html>'
    });

    assert.equal(result.ok, true);
    const message = JSON.parse(await readFile(path.join(workspace, "outbox", `${result.id}.json`), "utf8"));
    assert.equal(message.subject, "YJS Pro CIM Confirmation Sheet - English User");
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

test("local backend rejects invalid project confirmation recipient", async () => {
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
      customer: { name: "测试用户", email: "customer@example.com", date: "2026-10-06" },
      product: "YJS Pro CIM",
      effectSnapshots: {
        previews: [
          { id: "side", label: "侧面", dataUrl: "data:image/png;base64,U0lERQ==" },
          { id: "three-quarter", label: "45度", dataUrl: "data:image/jpeg;base64,UVVF" },
          { id: "front", label: "正面", dataUrl: "data:image/png;base64,RlJPTlQ=" }
        ]
      },
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
    assert.equal(result.to, "orders@example.com, customer@example.com");
    assert.equal(resendRequests.length, 1);
    assert.equal(resendRequests[0].url, "https://api.resend.com/emails");
    assert.equal(resendRequests[0].options.headers.Authorization, "Bearer re_test_key");
    assert.equal(resendRequests[0].body.from, "Skate CIM <orders@example.com>");
    assert.deepEqual(resendRequests[0].body.to, ["orders@example.com", "customer@example.com"]);
    assert.deepEqual(resendRequests[0].body.reply_to, ["customer@example.com"]);
    assert.match(resendRequests[0].body.html, /定制确认单/);
    assert.equal(resendRequests[0].body.attachments[0].filename, "YJS Pro CIM_测试用户_20261006_侧面.png");
    assert.equal(resendRequests[0].body.attachments[1].filename, "YJS Pro CIM_测试用户_20261006_45度.jpg");
    assert.equal(resendRequests[0].body.attachments[2].filename, "YJS Pro CIM_测试用户_20261006_正面.png");
    assert.equal(resendRequests[0].body.attachments[3].filename, "C-鞋舌电绣片-logo.png");
    assert.equal(resendRequests[0].body.attachments[3].content, "QUJD");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("local backend ignores invalid customer email while sending to the project recipient", async () => {
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
        return new Response(JSON.stringify({ id: "email_test_456" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    });

    const result = await backend.queueConfirmationEmail({
      customer: { name: "测试用户", email: "15732152800@163.com'" },
      product: "YJS Pro CIM",
      html: "<!doctype html><html><body><h1>定制确认单</h1></body></html>"
    });

    assert.equal(result.ok, true);
    assert.equal(result.to, "orders@example.com");
    assert.deepEqual(resendRequests[0].body.to, ["orders@example.com"]);
    assert.equal("reply_to" in resendRequests[0].body, false);
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
      to: ["orders@example.com", "customer@example.com"],
      from: "Skate CIM <orders@example.com>",
      subject: "YJS Pro CIM 定制确认单 - 测试用户",
      providerMessage: "Domain not verified"
    });
    assert(!JSON.stringify(logs).includes("re_secret_should_not_leak"));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
