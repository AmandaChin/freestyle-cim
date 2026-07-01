import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import vm from "node:vm";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CHROME_BIN = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VISUAL_SELECTION_PARTS = {
  side: ["A", "B", "C", "C1", "C2", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"],
  forty_five: ["A", "C", "C1", "C2", "C3", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"],
  front: ["C", "C1", "C2", "C3", "F1", "G", "H", "I", "J", "K", "L", "M", "N"]
};

const EXPECTED_PART_NAMES = {
  A: "鞋帮",
  B: "后提带",
  C: "鞋舌",
  C1: "鞋舌三角片",
  C2: "皮垫套下片",
  C3: "皮垫套上片",
  D: "CUFF",
  D1: "蘑菇钉",
  E: "碳纤鞋壳",
  F: "下鞋身片",
  F1: "下鞋身片2",
  G: "上鞋身片",
  H: "鞋头下片",
  I: "鞋眼片",
  J: "鞋带",
  K: "前魔术贴绑带",
  L: "防磨片",
  M: "上能量带",
  N: "下能量带"
};
const CANONICAL_PART_KEYS = new Set(Object.keys(EXPECTED_PART_NAMES));
const EXPECTED_ASSET_FILES = {
  side: ["A", "B", "C", "C1", "C2", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"],
  forty_five: ["A", "C", "C1", "C2", "C3", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"],
  front: ["C", "C1", "C2", "C3", "F1", "G", "H", "I", "J", "K", "L", "M", "N"]
};
const RESPONSIVE_VIEWPORTS = [
  { name: "desktop large", width: 1440, height: 1000 },
  { name: "pc compact", width: 1180, height: 680 },
  { name: "pc short", width: 1180, height: 560 },
  { name: "tablet landscape", width: 1024, height: 640 },
  { name: "narrow desktop", width: 900, height: 640 }
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadGlobalScript(relativePath, sandbox = { window: {} }) {
  const source = await readFile(path.join(ROOT_DIR, relativePath), "utf8");
  vm.runInNewContext(source, sandbox, { filename: relativePath });
  return sandbox;
}

async function assertSharedSchemaContract() {
  const sandbox = await loadGlobalScript("shared/yjs-pro-cim-schema.js");
  const schema = sandbox.window.SKATE_CIM_SCHEMA;
  assert(schema, "shared schema should expose window.SKATE_CIM_SCHEMA");
  assert(Array.isArray(schema.parts) && schema.parts.length > 0, "schema.parts should be non-empty");
  assert(Array.isArray(schema.angles) && schema.angles.length > 0, "schema.angles should be non-empty");
  assert(Array.isArray(schema.materials) && schema.materials.length > 0, "schema.materials should be non-empty");
  const abrasivePad = schema.parts.find((part) => part.key === "L");
  assert(abrasivePad?.renderMode === "fixed_variant", "L should use the same fixed variant model as hardware parts");
  assert(Array.isArray(abrasivePad.fixedVariants) && abrasivePad.fixedVariants.length === 4, "L should declare four explicit fixed variants");
  assert(abrasivePad.materialIds?.length === 1 && abrasivePad.materialIds[0] === "fixed-image", "L should be configured as a fixed-image part");
  assert(!abrasivePad.hitMask, "L should not need a separate hit mask after fixed PNG assets are transparent");
  assert(!abrasivePad.variants, "L should not use a separate fixed variant matrix");
  assert(!abrasivePad.fixedStyleSet, "L should not use generated fixedStyleSet mapping");
}

async function assertCanonicalShoePartSchema() {
  const textFiles = ["app.js", "b-side/app.js", "b-side/data/cim-config.js"];
  const disallowedPatterns = [
    /["'`]A1["'`]|\bA1\s*:|\/A1\//,
    /["'`]I1["'`]|\bI1\s*:|\/I1\//,
    /["'`]K1["'`]|\bK1\s*:|\/K1\//,
    /["'`]K2["'`]|\bK2\s*:|\/K2\//,
    /["'`]M1["'`]|\bM1\s*:|\/M1\//,
    /["'`]M2["'`]|\bM2\s*:|\/M2\//,
    /["'`]O["'`]|\bO\s*:|\/O\//,
    /sourceKey/,
    /fixedFileKeys/
  ];
  const failures = [];

  for (const relativePath of textFiles) {
    const content = await readFile(path.join(ROOT_DIR, relativePath), "utf8");
    for (const pattern of disallowedPatterns) {
      if (pattern.test(content)) failures.push(`${relativePath}: contains legacy shoe part semantic ${pattern}`);
    }
  }

  for (const [angle, keys] of Object.entries(EXPECTED_ASSET_FILES)) {
    const partDir = path.join(ROOT_DIR, "assets/skates/yjs-pro-cim", angle, "parts");
    const fixedDir = path.join(ROOT_DIR, "assets/skates/yjs-pro-cim", angle, "fixed");
    const partFiles = (await readdir(partDir)).filter((file) => file.endsWith(".png")).map((file) => path.basename(file, ".png"));
    const fixedDirs = existsSync(fixedDir) ? await readdir(fixedDir, { withFileTypes: true }) : [];
    const fixedKeys = fixedDirs.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    const expected = new Set(keys);
    const actual = new Set([...partFiles, ...fixedKeys]);
    const unexpected = [...actual].filter((key) => !expected.has(key));
    const missing = [...expected].filter((key) => !actual.has(key));
    const nonCanonical = [...actual].filter((key) => !CANONICAL_PART_KEYS.has(key));
    if (unexpected.length || missing.length || nonCanonical.length) {
      failures.push(`${angle}: asset keys mismatch, missing ${missing.join(", ") || "none"}, unexpected ${unexpected.join(", ") || "none"}, non-canonical ${nonCanonical.join(", ") || "none"}`);
    }
  }

  if (failures.length) throw new Error(`Shoe part schema is not canonical:\n${failures.join("\n")}`);
}

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
      const filePath = path.resolve(ROOT_DIR, `.${pathname}`);
      if (!filePath.startsWith(ROOT_DIR)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

async function startChrome() {
  assert(existsSync(CHROME_BIN), `Chrome executable not found at ${CHROME_BIN}`);
  const userDataDir = mkdtempSync(path.join(tmpdir(), "skate-cim-chrome-"));
  const chrome = spawn(CHROME_BIN, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--window-size=1440,1000",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  const activePortFile = path.join(userDataDir, "DevToolsActivePort");
  for (let index = 0; index < 80; index += 1) {
    if (existsSync(activePortFile)) {
      const [port] = (await readFile(activePortFile, "utf8")).trim().split("\n");
      return {
        chrome,
        debugPort: port,
        close: async () => {
          chrome.kill();
          await wait(100);
          rmSync(userDataDir, { recursive: true, force: true });
        }
      };
    }
    await wait(100);
  }

  chrome.kill();
  rmSync(userDataDir, { recursive: true, force: true });
  throw new Error("Chrome did not expose a DevTools port in time");
}

async function openPage(debugPort, url) {
  const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((response) => response.json());
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const sessionEvents = [];

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
      return;
    }
    sessionEvents.push(message);
  });

  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Page.navigate", { url }, sessionId);

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    }, sessionId);
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
    }
    return result.result?.value;
  };

  const waitFor = async (expression, timeoutMs = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await evaluate(expression)) return;
      await wait(50);
    }
    throw new Error(`Timed out waiting for: ${expression}`);
  };

  const setViewport = async (viewport) => {
    await send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
      positionX: 0,
      positionY: 0
    }, sessionId);
  };

  await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('[data-home-product]'))");
  return { ws, send, sessionId, evaluate, waitFor, setViewport, sessionEvents };
}

async function assertBuilderLayout(page, viewport) {
  const layout = await page.evaluate(`(() => {
    const selectors = {
      app: '.app-shell',
      topbar: '.topbar',
      workspace: '#workspace',
      workspaceTopbar: '.workspace-topbar',
      preview: '.preview-stage',
      scene: '#shoeScene',
      shoe: '#shoeArt',
      frame: '#shoeArt .mvp-shoe-frame',
      customizer: '#customizerPanel',
      rail: '.part-rail-block'
    };
    const rect = (selector) => {
      const element = document.querySelector(selector);
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight
      };
    };
    return Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [key, rect(selector)]));
  })()`);
  const label = `${viewport.name} ${viewport.width}x${viewport.height}`;

  assert(layout.app.scrollWidth <= layout.app.clientWidth + 2, `${label}: app should not have horizontal overflow (${layout.app.scrollWidth}/${layout.app.clientWidth})`);
  assert(layout.workspace.right <= viewport.width + 1, `${label}: workspace should stay inside viewport right edge`);
  assert(layout.workspace.bottom <= viewport.height + 1, `${label}: workspace should stay inside viewport bottom edge`);
  assert(layout.workspace.scrollWidth <= layout.workspace.clientWidth + 2, `${label}: workspace should not have horizontal overflow (${layout.workspace.scrollWidth}/${layout.workspace.clientWidth})`);

  assert(layout.topbar.bottom <= layout.workspace.top + 1, `${label}: page topbar should not overlap workspace`);
  assert(layout.workspaceTopbar.bottom <= layout.preview.top + 1, `${label}: workspace topbar should not overlap preview`);
  assert(layout.preview.bottom <= layout.rail.top + 1, `${label}: preview should not overlap part rail`);
  assert(layout.preview.right <= layout.customizer.left + 1, `${label}: preview should not overlap customizer`);

  assert(layout.shoe.left >= layout.scene.left - 1, `${label}: shoe should stay inside scene left edge ${JSON.stringify({ scene: layout.scene, shoe: layout.shoe })}`);
  assert(layout.shoe.right <= layout.scene.right + 1, `${label}: shoe should stay inside scene right edge ${JSON.stringify({ scene: layout.scene, shoe: layout.shoe })}`);
  assert(layout.shoe.top >= layout.scene.top - 1, `${label}: shoe should stay inside scene top edge ${JSON.stringify({ scene: layout.scene, shoe: layout.shoe })}`);
  assert(layout.shoe.bottom <= layout.scene.bottom + 1, `${label}: shoe should stay inside scene bottom edge ${JSON.stringify({ scene: layout.scene, shoe: layout.shoe })}`);
  assert(layout.frame.left >= layout.shoe.left - 1 && layout.frame.right <= layout.shoe.right + 1, `${label}: shoe frame should stay inside shoe art horizontally`);
  assert(layout.frame.top >= layout.shoe.top - 1 && layout.frame.bottom <= layout.shoe.bottom + 1, `${label}: shoe frame should stay inside shoe art vertically`);
}

async function main() {
  await assertSharedSchemaContract();
  await assertCanonicalShoePartSchema();
  const server = await startStaticServer();
  const chrome = await startChrome();
  let page;
  try {
    page = await openPage(chrome.debugPort, `${server.origin}/`);
    await page.evaluate("document.querySelector('[data-home-product]').click()");
    await page.waitFor("document.body.dataset.view === 'builder' && Boolean(document.querySelector('.mvp-shoe-frame'))");

    for (const viewport of RESPONSIVE_VIEWPORTS) {
      await page.setViewport(viewport);
      await page.waitFor("document.body.dataset.view === 'builder' && Boolean(document.querySelector('#shoeArt .mvp-shoe-frame'))");
      await assertBuilderLayout(page, viewport);
    }

    const failures = [];
    const angles = await page.evaluate("Array.from(document.querySelectorAll('[data-angle]')).map((button) => button.dataset.angle)");
    for (const angle of angles) {
      await page.evaluate(`document.querySelector('[data-angle="${angle}"]').click()`);
      await page.waitFor(`document.querySelector('[data-angle="${angle}"]').getAttribute('aria-selected') === 'true'`);

      const partState = await page.evaluate(`(() => {
        const buttons = Array.from(document.querySelectorAll('#partRail [data-part]'));
        const enabledParts = buttons.filter((button) => !button.disabled).map((button) => button.dataset.part);
        const names = Object.fromEntries(buttons.map((button) => [button.dataset.part, button.querySelector('strong')?.textContent.trim() || '']));
        const layerParts = Array.from(document.querySelectorAll('#shoeArt .mvp-part-layer[data-part], #shoeArt .mvp-fixed-image[data-part]'))
          .map((layer) => layer.dataset.part);
        return { enabledParts, layerParts, names };
      })()`);
      const expectedParts = VISUAL_SELECTION_PARTS[angle] || [];
      const missingExpectedParts = expectedParts.filter((part) => !partState.enabledParts.includes(part));
      const extraEnabledParts = partState.enabledParts.filter((part) => !expectedParts.includes(part));
      if (missingExpectedParts.length || extraEnabledParts.length) {
        failures.push(`${angle}: enabled parts mismatch, missing ${missingExpectedParts.join(", ") || "none"}, extra ${extraEnabledParts.join(", ") || "none"}`);
      }
      const expectedPartNames = EXPECTED_PART_NAMES;
      for (const part of partState.enabledParts) {
        if (expectedPartNames[part] && partState.names[part] !== expectedPartNames[part]) {
          failures.push(`${angle}/${part}: expected name "${expectedPartNames[part]}", got "${partState.names[part]}"`);
        }
      }
      const missingLayers = partState.enabledParts.filter((part) => !partState.layerParts.includes(part));
      if (missingLayers.length) {
        failures.push(`${angle}: enabled parts without rendered layer: ${missingLayers.join(", ")}`);
      }

      if (partState.enabledParts.includes("L")) {
        await page.evaluate(`document.querySelector('#partRail [data-part="L"]').click()`);
        await page.waitFor(`document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="L"]')`);
        await page.evaluate(`document.querySelector('#textureList [data-color="pad-new-white"]')?.click()`);
        await page.waitFor(`document.querySelector('#shoeArt .mvp-fixed-image[data-part="L"]')?.src.includes('/${angle}/fixed/L/pad-new-white.png')`);
        await page.waitFor(`document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="L"]')?.dataset.source.includes('/${angle}/fixed/L/pad-new-white.png')`);
        const abrasivePadState = await page.evaluate(`(() => {
          const visual = document.querySelector('#shoeArt .mvp-fixed-image[data-part="L"]');
          const tinted = document.querySelector('#shoeArt .mvp-part-layer[data-part="L"]');
          const ring = document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="L"]');
          return {
            visualSrc: visual?.currentSrc || visual?.src || "",
            ringSource: ring?.dataset.source || "",
            hasTintedLayer: Boolean(tinted)
          };
        })()`);
        if (abrasivePadState.hasTintedLayer) {
          failures.push(`${angle}/L: abrasive pad should render as direct fixed PNG instead of tinted mask layer`);
        }
        if (!abrasivePadState.visualSrc.includes(`/${angle}/fixed/L/pad-new-white.png`)) {
          failures.push(`${angle}/L: abrasive pad default visual should use fixed variant PNG, got ${abrasivePadState.visualSrc}`);
        }
        if (!abrasivePadState.ringSource.includes(`/${angle}/fixed/L/pad-new-white.png`)) {
          failures.push(`${angle}/L: abrasive pad selection ring should follow the current fixed variant PNG, got ${abrasivePadState.ringSource}`);
        }
        await page.evaluate(`document.querySelector('#textureList [data-color="pad-old-white"]')?.click()`);
        await page.waitFor(`document.querySelector('#shoeArt .mvp-fixed-image[data-part="L"]')?.src.includes('/${angle}/fixed/L/pad-old-white.png')`);
        await page.waitFor(`document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="L"]')?.dataset.source.includes('/${angle}/fixed/L/pad-old-white.png')`);
        const switchedAbrasivePadState = await page.evaluate(`(() => {
          const visual = document.querySelector('#shoeArt .mvp-fixed-image[data-part="L"]');
          const ring = document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="L"]');
          return {
            visualSrc: visual?.currentSrc || visual?.src || "",
            ringSource: ring?.dataset.source || ""
          };
        })()`);
        if (!switchedAbrasivePadState.visualSrc.includes(`/${angle}/fixed/L/pad-old-white.png`)) {
          failures.push(`${angle}/L: abrasive pad switched visual should use selected fixed variant PNG, got ${switchedAbrasivePadState.visualSrc}`);
        }
        if (!switchedAbrasivePadState.ringSource.includes(`/${angle}/fixed/L/pad-old-white.png`)) {
          failures.push(`${angle}/L: abrasive pad switched selection ring should follow selected fixed variant PNG, got ${switchedAbrasivePadState.ringSource}`);
        }
      }

      if (angle === "front") {
        const frontLowerPadHit = await page.evaluate(`(async () => {
          const frame = document.querySelector('#shoeArt .mvp-shoe-frame');
          const rect = frame.getBoundingClientRect();
          const hits = {};
          for (let y = 0.24; y <= 0.41; y += 0.01) {
            for (let x = 0.44; x <= 0.63; x += 0.01) {
              const clientX = Math.round(rect.left + rect.width * x);
              const clientY = Math.round(rect.top + rect.height * y);
              const hit = await hitTestShoePart({ clientX, clientY, target: frame });
              if (hit) hits[hit] = (hits[hit] || 0) + 1;
              if (hit === "C2") return { hit, clientX, clientY, x, y };
            }
          }
          return { hit: "", hits };
        })()`);
        if (frontLowerPadHit?.hit !== "C2") {
          failures.push(`front/C2: lower pad cover red-arrow area should be clickable, got ${JSON.stringify(frontLowerPadHit)}`);
        }
      }

      for (const part of partState.enabledParts) {
        await page.evaluate(`document.querySelector('#partRail [data-part="${part}"]').click()`);
        await page.waitFor(`document.querySelector('#partRail [data-part="${part}"]').getAttribute('aria-pressed') === 'true'`);
        await page.waitFor(`document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="${part}"]') || document.querySelector('#shoeArt .mvp-selection-edge.is-selected[data-part="${part}"]')`);
        const selectedState = await page.evaluate(`(() => {
          const legacyEdgeCount = document.querySelectorAll('#shoeArt .mvp-selection-edge.is-selected[data-part="${part}"]').length;
          const rings = Array.from(document.querySelectorAll('#shoeArt .mvp-selection-ring.is-selected[data-part="${part}"]'));
          const selectedLayers = Array.from(document.querySelectorAll('#shoeArt .mvp-part-layer.is-selected[data-part="${part}"], #shoeArt .mvp-fixed-image.is-selected[data-part="${part}"]'));
          const ringState = rings.map((ring) => {
            const style = getComputedStyle(ring);
            return {
              complete: ring.complete,
              filter: style.filter,
              naturalHeight: ring.naturalHeight,
              naturalWidth: ring.naturalWidth,
              pointerEvents: style.pointerEvents,
              rect: ring.getBoundingClientRect().toJSON(),
              source: ring.dataset.source || "",
              src: ring.currentSrc || ring.src,
              zIndex: Number(style.zIndex)
            };
          });
          return selectedLayers.map((layer) => {
            const style = getComputedStyle(layer);
            return {
              backgroundColor: style.backgroundColor,
              className: layer.className,
              legacyEdgeCount,
              filter: style.filter,
              maskImage: style.maskImage || style.webkitMaskImage,
              pointerEvents: style.pointerEvents,
              rect: layer.getBoundingClientRect().toJSON(),
              ringState,
              zIndex: Number(style.zIndex)
            };
          });
        })()`);

        if (!selectedState.length) {
          failures.push(`${angle}/${part}: no selected visual layer`);
          continue;
        }
        selectedState.forEach((layer, index) => {
          if (layer.legacyEdgeCount !== 0) {
            failures.push(`${angle}/${part}#${index}: selected state still uses the old masked blue layer`);
          }
          if (layer.filter !== "none") {
            failures.push(`${angle}/${part}#${index}: selected part body should not receive a blue filter, got "${layer.filter}"`);
          }
          if (!layer.ringState.length) {
            failures.push(`${angle}/${part}#${index}: no selected outside ring layer`);
          }
          layer.ringState.forEach((ring, ringIndex) => {
            if (!ring.src.startsWith("data:image/png")) {
              failures.push(`${angle}/${part}#${index}.${ringIndex}: selection ring should be a generated PNG data URL`);
            }
            if (!ring.source) {
              failures.push(`${angle}/${part}#${index}.${ringIndex}: selection ring should keep its source image URL for pixel validation`);
            }
            if (ring.filter !== "none") {
              failures.push(`${angle}/${part}#${index}.${ringIndex}: selection ring should not rely on CSS filter, got "${ring.filter}"`);
            }
            if (ring.pointerEvents !== "none") {
              failures.push(`${angle}/${part}#${index}.${ringIndex}: selection ring should not intercept clicks`);
            }
            if (!ring.rect.width || !ring.rect.height || !ring.complete || !ring.naturalWidth || !ring.naturalHeight) {
              failures.push(`${angle}/${part}#${index}.${ringIndex}: selection ring is not ready or laid out`);
            }
            if (!(ring.zIndex > layer.zIndex)) {
              failures.push(`${angle}/${part}#${index}.${ringIndex}: selection ring should sit above part layers, got ring ${ring.zIndex} body ${layer.zIndex}`);
            }
          });
          if (layer.backgroundColor.includes("0, 113, 227")) {
            failures.push(`${angle}/${part}#${index}: selected part body should not be blue-filled`);
          }
          if (layer.className.includes("mvp-part-layer") && (!layer.maskImage || layer.maskImage === "none")) {
            failures.push(`${angle}/${part}#${index}: selected layer has no alpha mask`);
          }
          if (layer.pointerEvents !== "none") {
            failures.push(`${angle}/${part}#${index}: selected layer should not intercept clicks`);
          }
          if (!layer.rect.width || !layer.rect.height) {
            failures.push(`${angle}/${part}#${index}: selected layer is not laid out`);
          }
        });

        if ((VISUAL_SELECTION_PARTS[angle] || []).includes(part)) {
          await page.waitFor(`(() => {
            const ring = document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="${part}"]');
            return Boolean(ring && ring.complete && ring.naturalWidth > 0 && ring.naturalHeight > 0);
          })()`);
          const ringAnalysis = await page.evaluate(`(async () => {
            const loadImage = (src) => new Promise((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = "anonymous";
              image.onload = () => resolve(image);
              image.onerror = () => reject(new Error("Failed to load " + src));
              image.src = src;
            });
            const imageDataFor = async (src) => {
              const image = await loadImage(src);
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth || image.width;
              canvas.height = image.naturalHeight || image.height;
              const context = canvas.getContext("2d", { willReadFrequently: true });
              context.drawImage(image, 0, 0, canvas.width, canvas.height);
              return { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
            };
            const ring = document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part="${part}"]');
            if (!ring) return { ok: false, reason: "missing generated ring" };
            const source = await imageDataFor(ring.dataset.source);
            const outline = await imageDataFor(ring.currentSrc || ring.src);
            if (source.width !== outline.width || source.height !== outline.height) {
              return { ok: false, reason: "ring size differs from source", sourceSize: [source.width, source.height], outlineSize: [outline.width, outline.height] };
            }

            let sourceBodyPixels = 0;
            let accentInsideBodyPixels = 0;
            let accentOutsidePixels = 0;
            let accentPixels = 0;
            let maxInsideAlpha = 0;
            let mediumAlphaOutsidePixels = 0;
            let lowAlphaOutsidePixels = 0;
            let minOutsideRed = 255;
            let maxOutsideRed = 0;
            let minOutsideGreen = 255;
            let maxOutsideGreen = 0;
            const outsideAlphaBuckets = new Set();
            const outsideColorBuckets = new Set();
            const step = 4;
            for (let y = 0; y < source.height; y += step) {
              for (let x = 0; x < source.width; x += step) {
                const offset = (y * source.width + x) * 4;
                const sourceAlpha = source.data[offset + 3];
                const red = outline.data[offset];
                const green = outline.data[offset + 1];
                const blue = outline.data[offset + 2];
                const alpha = outline.data[offset + 3];
                const isSelectionAccent = alpha > 20;
                if (isSelectionAccent) accentPixels += 1;
                if (sourceAlpha > 180) {
                  sourceBodyPixels += 1;
                  maxInsideAlpha = Math.max(maxInsideAlpha, alpha);
                  if (isSelectionAccent) accentInsideBodyPixels += 1;
                } else if (sourceAlpha <= 18 && isSelectionAccent) {
                  accentOutsidePixels += 1;
                  minOutsideRed = Math.min(minOutsideRed, red);
                  maxOutsideRed = Math.max(maxOutsideRed, red);
                  minOutsideGreen = Math.min(minOutsideGreen, green);
                  maxOutsideGreen = Math.max(maxOutsideGreen, green);
                  outsideAlphaBuckets.add(Math.floor(alpha / 24));
                  outsideColorBuckets.add([Math.floor(red / 24), Math.floor(green / 24), Math.floor(blue / 24)].join(":"));
                  if (alpha >= 64 && alpha <= 180) mediumAlphaOutsidePixels += 1;
                  if (alpha >= 21 && alpha < 64) lowAlphaOutsidePixels += 1;
                }
              }
            }

            const insideAccentRatio = sourceBodyPixels ? accentInsideBodyPixels / sourceBodyPixels : 1;
            const outsideRedRange = maxOutsideRed - minOutsideRed;
            const outsideGreenRange = maxOutsideGreen - minOutsideGreen;
            return {
              ok: sourceBodyPixels > 0
                && accentOutsidePixels > 5
                && accentPixels > 5
                && insideAccentRatio < 0.001
                && maxInsideAlpha < 18
                && outsideAlphaBuckets.size >= 3
                && (mediumAlphaOutsidePixels > 2 || lowAlphaOutsidePixels > 2),
              sourceBodyPixels,
              accentInsideBodyPixels,
              accentOutsidePixels,
              accentPixels,
              lowAlphaOutsidePixels,
              mediumAlphaOutsidePixels,
              outsideAlphaBucketCount: outsideAlphaBuckets.size,
              outsideColorBucketCount: outsideColorBuckets.size,
              outsideGreenRange,
              outsideRedRange,
              insideAccentRatio,
              maxInsideAlpha
            };
          })()`);
          if (!ringAnalysis.ok) {
            failures.push(`${angle}/${part}: selection ring should be outside-only, got ${JSON.stringify(ringAnalysis)}`);
          }
        }

        const clickPoint = await page.evaluate(`(async () => {
          const frame = document.querySelector('#shoeArt .mvp-shoe-frame');
          const rect = frame.getBoundingClientRect();
          for (let y = 0.04; y <= 0.96; y += 0.015) {
            for (let x = 0.04; x <= 0.96; x += 0.015) {
              const clientX = Math.round(rect.left + rect.width * x);
              const clientY = Math.round(rect.top + rect.height * y);
              const hit = await hitTestShoePart({ clientX, clientY, target: frame });
              if (hit === "${part}") return { clientX, clientY };
            }
          }
          return null;
        })()`);

        if (!clickPoint) {
          failures.push(`${angle}/${part}: no clickable point on shoe art`);
          continue;
        }

        const before = await page.evaluate("document.querySelector('#partRail [aria-pressed=\"true\"]')?.dataset.part || ''");
        await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: clickPoint.clientX, y: clickPoint.clientY }, page.sessionId);
        await page.send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", buttons: 1, clickCount: 1, x: clickPoint.clientX, y: clickPoint.clientY }, page.sessionId);
        await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", buttons: 0, clickCount: 1, x: clickPoint.clientX, y: clickPoint.clientY }, page.sessionId);
        const clickResult = await page.evaluate(`(async () => {
          await new Promise((resolve) => window.setTimeout(resolve, 120));
          return {
            after: document.querySelector('#partRail [aria-pressed="true"]')?.dataset.part || "",
            before: "${before}"
          };
        })()`);
        if (clickResult.after !== part) {
          failures.push(`${angle}/${part}: real mouse click selected "${clickResult.after}", before "${clickResult.before}", point ${JSON.stringify(clickPoint)}`);
        }
      }
    }

    if (failures.length) {
      throw new Error(`Selection state is not unified:\n${failures.join("\n")}`);
    }

    await page.evaluate("document.querySelector('[data-angle=\"side\"]').click()");
    await page.waitFor("document.querySelector('[data-angle=\"side\"]').getAttribute('aria-selected') === 'true'");
    await page.evaluate("document.querySelector('#partRail [data-part=\"G\"]').click()");
    await page.waitFor("document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part=\"G\"]')");
    const blankPoint = await page.evaluate(`(() => {
      const scene = document.querySelector('#shoeScene');
      const rect = scene.getBoundingClientRect();
      return {
        x: Math.round(rect.left + 24),
        y: Math.round(rect.top + 24)
      };
    })()`);
    await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: blankPoint.x, y: blankPoint.y }, page.sessionId);
    await page.send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", buttons: 1, clickCount: 1, x: blankPoint.x, y: blankPoint.y }, page.sessionId);
    await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", buttons: 0, clickCount: 1, x: blankPoint.x, y: blankPoint.y }, page.sessionId);
    await page.waitFor(`document.querySelector('#customizerToggleButton').getAttribute('aria-expanded') === 'false'`);
    const blankCloseState = await page.evaluate(`(() => ({
      pressedParts: document.querySelectorAll('#partRail [aria-pressed="true"]').length,
      selectedPartLabel: document.querySelector('#selectedPartLabel')?.textContent.trim() || "",
      selectedBodyLayers: document.querySelectorAll('#shoeArt .is-selected[data-part]').length,
      selectedRings: document.querySelectorAll('#shoeArt .mvp-selection-ring.is-selected').length
    }))()`);
    if (blankCloseState.pressedParts !== 0 || blankCloseState.selectedPartLabel || blankCloseState.selectedBodyLayers !== 0 || blankCloseState.selectedRings !== 0) {
      failures.push(`blank click should close sidebar and clear selected visuals, got ${JSON.stringify(blankCloseState)}`);
    }

    const closedPanelClickPoint = await page.evaluate(`(async () => {
      const frame = document.querySelector('#shoeArt .mvp-shoe-frame');
      const rect = frame.getBoundingClientRect();
      for (let y = 0.04; y <= 0.96; y += 0.015) {
        for (let x = 0.04; x <= 0.96; x += 0.015) {
          const clientX = Math.round(rect.left + rect.width * x);
          const clientY = Math.round(rect.top + rect.height * y);
          const hit = await hitTestShoePart({ clientX, clientY, target: frame });
          if (hit === "G") return { clientX, clientY };
        }
      }
      return null;
    })()`);
    if (!closedPanelClickPoint) {
      failures.push("closed panel: no clickable point found for G");
    } else {
      await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: closedPanelClickPoint.clientX, y: closedPanelClickPoint.clientY }, page.sessionId);
      await page.send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", buttons: 1, clickCount: 1, x: closedPanelClickPoint.clientX, y: closedPanelClickPoint.clientY }, page.sessionId);
      await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", buttons: 0, clickCount: 1, x: closedPanelClickPoint.clientX, y: closedPanelClickPoint.clientY }, page.sessionId);
      await page.waitFor(`document.querySelector('#customizerToggleButton').getAttribute('aria-expanded') === 'true'`);
      const closedPanelClickState = await page.evaluate(`(() => ({
        pressedPart: document.querySelector('#partRail [aria-pressed="true"]')?.dataset.part || "",
        selectedRings: document.querySelectorAll('#shoeArt .mvp-selection-ring.is-selected[data-part="G"]').length
      }))()`);
      if (closedPanelClickState.pressedPart !== "G" || closedPanelClickState.selectedRings === 0) {
        failures.push(`closed panel shoe click should reopen and select G, got ${JSON.stringify(closedPanelClickState)}`);
      }
    }

    await page.evaluate("document.querySelector('#partRail [data-part=\"G\"]').click()");
    await page.waitFor("document.querySelector('#shoeArt .mvp-selection-ring.is-selected[data-part=\"G\"]')");
    await page.evaluate(`(() => {
      const toggle = document.querySelector('#customizerToggleButton');
      if (toggle?.getAttribute('aria-expanded') === 'true') toggle.click();
    })()`);
    await page.waitFor(`document.querySelector('#customizerToggleButton').getAttribute('aria-expanded') === 'false'`);
    const toggleCloseState = await page.evaluate(`(() => ({
      pressedParts: document.querySelectorAll('#partRail [aria-pressed="true"]').length,
      selectedPartLabel: document.querySelector('#selectedPartLabel')?.textContent.trim() || "",
      selectedBodyLayers: document.querySelectorAll('#shoeArt .is-selected[data-part]').length,
      selectedRings: document.querySelectorAll('#shoeArt .mvp-selection-ring.is-selected').length
    }))()`);
    if (toggleCloseState.pressedParts !== 0 || toggleCloseState.selectedPartLabel || toggleCloseState.selectedBodyLayers !== 0 || toggleCloseState.selectedRings !== 0) {
      failures.push(`toggle close should clear selected visuals, got ${JSON.stringify(toggleCloseState)}`);
    }

    const screenshot = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, page.sessionId);
    const screenshotPath = path.join(tmpdir(), "skate-cim-selection-state.png");
    await import("node:fs/promises").then(({ writeFile }) => writeFile(screenshotPath, Buffer.from(screenshot.data, "base64")));
    console.log(`selection-state: ok (${angles.length} angles checked)`);
    console.log(`screenshot: ${screenshotPath}`);
  } finally {
    page?.ws.close();
    await chrome.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
