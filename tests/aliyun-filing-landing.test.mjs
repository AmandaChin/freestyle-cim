import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Aliyun release keeps the real preview app but removes filing-risk commerce cues", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /轮滑色彩札记/);
  assert.match(html, /配色灵感/);
  assert.match(html, /视觉预览/);
  assert.match(html, /id="homeView"/);
  assert.match(html, /id="workspace"/);
  assert.match(html, /id="customizerPanel"/);
  assert.match(html, /app\.js/);
  assert.match(html, /id="saveButton"[^>]*hidden/);
  assert.doesNotMatch(html, /保存方案|客户|订单|确认单|生产单|发送邮件|定制服务|CIM 表格导出|B 端配置/);
});
