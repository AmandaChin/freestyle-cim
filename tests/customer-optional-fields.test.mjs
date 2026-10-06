import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

test("phone stays optional while size and foot length use one required selection", async () => {
  const app = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");
  const copy = await readFile(path.join(ROOT_DIR, "i18n/c-side-copy.js"), "utf8");
  const requiredFields = app.match(/const REQUIRED_CUSTOMER_FIELDS = \[([\s\S]*?)\n\];/)?.[1] || "";
  const phoneInput = app.match(/<input data-customer="phone"[^>]*>/)?.[0] || "";
  const sizeSelect = app.match(/<select data-customer="size"[^>]*>/)?.[0] || "";

  assert.doesNotMatch(requiredFields, /\["phone", "phone"\]/);
  assert.doesNotMatch(requiredFields, /\["footLength", "footLength"\]/);
  assert.doesNotMatch(phoneInput, /\srequired(?:\s|>)/);
  assert.match(sizeSelect, /\srequired(?:\s|>)/);
  assert.doesNotMatch(app, /<input data-customer="(?:footLength|size)"/);
  assert.match(app, /\$\{t\("phone"\)\}.*\$\{t\("optional"\)\}/);
  assert.match(requiredFields, /\["size", "sizeFootLength"\]/);
  assert.match(copy, /optional:\s*"选填"/);
  assert.match(copy, /optional:\s*"Optional"/);
});
