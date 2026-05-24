import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
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
