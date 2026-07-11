import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

async function loadSchema() {
  const source = await readFile(path.join(ROOT_DIR, "shared", "yjs-pro-cim-schema.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "shared/yjs-pro-cim-schema.js" });
  return sandbox.window.SKATE_CIM_SCHEMA;
}

async function fileExists(relativePath) {
  try {
    await access(path.join(ROOT_DIR, relativePath));
    return true;
  } catch {
    return false;
  }
}

test("every C-side declared angle asset exists", async () => {
  const schema = await loadSchema();
  const partsByKey = new Map(schema.parts.map((part) => [part.key, part]));
  const missing = [];

  for (const angle of schema.angles.filter((item) => item.active !== false)) {
    for (const relativePath of [angle.baseFile, angle.stitchFile || `${angle.key}/stitch.png`]) {
      if (!(await fileExists(path.join("assets/skates/yjs-pro-cim", relativePath)))) missing.push(relativePath);
    }

    for (const partKey of angle.layerPartKeys || []) {
      const part = partsByKey.get(partKey);
      assert(part, `${angle.key} references unknown part ${partKey}`);
      if (part.renderMode === "mask_tint") {
        const relativePath = `${angle.key}/parts/${partKey}.png`;
        if (!(await fileExists(path.join("assets/skates/yjs-pro-cim", relativePath)))) missing.push(relativePath);
        continue;
      }
      for (const variant of part.fixedVariants || []) {
        const relativePath = `${angle.key}/fixed/${partKey}/${variant.id}.png`;
        if (!(await fileExists(path.join("assets/skates/yjs-pro-cim", relativePath)))) missing.push(relativePath);
      }
    }
  }

  assert.deepEqual(missing, [], `schema declares missing assets: ${missing.join(", ")}`);
});

test("all customer-visible material data has English copy", async () => {
  const schema = await loadSchema();
  const missing = [];
  for (const category of schema.materialCategories || []) {
    if (!String(category.en || "").trim()) missing.push(`category:${category.id}`);
  }
  for (const texture of schema.materialTextures || []) {
    if (!String(texture.en || "").trim()) missing.push(`texture:${texture.id}`);
  }
  for (const [partKey, variants] of Object.entries(schema.fixedVariants || {})) {
    for (const variant of variants) {
      if (!String(variant.en || "").trim()) missing.push(`fixed:${partKey}:${variant.id}`);
    }
  }
  const fixedMaterial = (schema.materials || []).find((material) => material.id === "fixed-image");
  if (!String(fixedMaterial?.en || "").trim()) missing.push("material:fixed-image");

  assert.deepEqual(missing, [], `customer-visible data is missing English copy: ${missing.join(", ")}`);
});

test("C-side boot uses only the shared static schema", async () => {
  const [html, appSource] = await Promise.all([
    readFile(path.join(ROOT_DIR, "index.html"), "utf8"),
    readFile(path.join(ROOT_DIR, "app.js"), "utf8")
  ]);

  assert(!html.includes("b-side/data/cim-config.js"), "C-side entry must not load the unfinished B-side config");
  assert(!appSource.includes("SKATE_CIM_PUBLISHED_CONFIG"), "C-side must not consume a local published-config override");
  assert(!appSource.includes("window.SKATE_CIM_CONFIG"), "C-side must not consume the B-side global config");
  assert(!appSource.includes("loadPublishedConfig"), "C-side must not fetch /api/public/config during boot");
  assert(!appSource.includes("applyPublishedConfig"), "C-side must not patch an already-created product catalog");
});

test("C-side emits a language-neutral confirmation document contract", async () => {
  const appSource = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");
  assert(appSource.includes('name="skate-cim-document" content="confirmation-sheet"'), "confirmation HTML must include a language-neutral document marker");
  assert(appSource.includes('documentType: CONFIRMATION_DOCUMENT_TYPE'), "confirmation request must include documentType");
  assert(appSource.includes('documentVersion: CONFIRMATION_DOCUMENT_VERSION'), "confirmation request must include documentVersion");
  assert(appSource.includes('language: state.language'), "confirmation request must include the active language");
});

test("C-side upload and confirmation request sizes stay within production boundaries", async () => {
  const [appSource, pagesFunctionSource, localServerSource, copySource] = await Promise.all([
    readFile(path.join(ROOT_DIR, "app.js"), "utf8"),
    readFile(path.join(ROOT_DIR, "functions", "api", "public", "confirmation-email.js"), "utf8"),
    readFile(path.join(ROOT_DIR, "server", "local-server.mjs"), "utf8"),
    readFile(path.join(ROOT_DIR, "i18n", "c-side-copy.js"), "utf8")
  ]);

  assert(appSource.includes("const MAX_UPLOAD_IMAGE_BYTES = 2 * 1024 * 1024"), "single uploaded images must be limited to 2 MB");
  assert(appSource.includes("const MAX_CONFIRMATION_REQUEST_BYTES = 12 * 1024 * 1024"), "confirmation requests must be limited to 12 MB");
  assert(appSource.includes("new TextEncoder().encode(payloadBody).byteLength"), "confirmation request size must be measured in bytes before sending");
  assert(pagesFunctionSource.includes("const MAX_REQUEST_BODY_BYTES = 12 * 1024 * 1024"), "production Pages function must enforce the 12 MB request boundary");
  assert(localServerSource.includes("const MAX_REQUEST_BODY_BYTES = 12 * 1024 * 1024"), "local server must accept the same 12 MB request boundary");
  assert(copySource.includes('imageTooLarge: "图片过大，请控制在 2MB 内"'), "Chinese upload copy must match the 2 MB limit");
  assert(copySource.includes('imageTooLarge: "Image is too large. Keep it under 2MB."'), "English upload copy must match the 2 MB limit");
  assert(copySource.includes("confirmationTooLarge"), "both languages must explain oversized confirmation requests");
});

test("deployment cache and test scripts cover mutable assets and browser regressions", async () => {
  const [headers, packageSource] = await Promise.all([
    readFile(path.join(ROOT_DIR, "_headers"), "utf8"),
    readFile(path.join(ROOT_DIR, "package.json"), "utf8")
  ]);
  const packageJson = JSON.parse(packageSource);

  assert(!headers.includes("max-age=31536000, immutable"), "mutable image paths must not be cached immutably for one year");
  assert.match(headers, /\/assets\/\*[\s\S]*max-age=300, must-revalidate/, "asset responses must revalidate quickly");
  assert(packageJson.scripts?.["test:unit"], "package scripts must expose unit tests");
  assert(packageJson.scripts?.["test:e2e"], "package scripts must expose browser regression tests");
  assert(packageJson.scripts?.test?.includes("test:unit") && packageJson.scripts.test.includes("test:e2e"), "npm test must run unit and browser suites");
});
