import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

test("phone and foot length are optional throughout the confirmation form", async () => {
  const app = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");
  const copy = await readFile(path.join(ROOT_DIR, "i18n/c-side-copy.js"), "utf8");
  const requiredFields = app.match(/const REQUIRED_CUSTOMER_FIELDS = \[([\s\S]*?)\n\];/)?.[1] || "";
  const phoneInput = app.match(/<input data-customer="phone"[^>]*>/)?.[0] || "";
  const footLengthInput = app.match(/<input data-customer="footLength"[^>]*>/)?.[0] || "";

  assert.doesNotMatch(requiredFields, /\["phone", "phone"\]/);
  assert.doesNotMatch(requiredFields, /\["footLength", "footLength"\]/);
  assert.doesNotMatch(phoneInput, /\srequired(?:\s|>)/);
  assert.doesNotMatch(footLengthInput, /\srequired(?:\s|>)/);
  assert.match(app, /\$\{t\("phone"\)\}.*\$\{t\("optional"\)\}/);
  assert.match(app, /\$\{t\("footLength"\)\}.*\$\{t\("optional"\)\}/);
  assert.match(copy, /optional:\s*"选填"/);
  assert.match(copy, /optional:\s*"Optional"/);
});
