import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CHROME_BIN = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MOBILE_VIEWPORTS = [
  { name: "small portrait", width: 360, height: 640 },
  { name: "standard portrait", width: 390, height: 844 },
  { name: "large portrait", width: 430, height: 932 },
  { name: "small landscape", width: 640, height: 360 },
  { name: "large landscape", width: 844, height: 390 }
];
const DEFAULT_VIEWPORT = MOBILE_VIEWPORTS[1];

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
  const userDataDir = mkdtempSync(path.join(tmpdir(), "skate-cim-mobile-layout-"));
  const chrome = spawn(CHROME_BIN, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    `--window-size=${DEFAULT_VIEWPORT.width},${DEFAULT_VIEWPORT.height}`,
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

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
    }
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
  await send("Emulation.setDeviceMetricsOverride", {
    ...DEFAULT_VIEWPORT,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: DEFAULT_VIEWPORT.width,
    screenHeight: DEFAULT_VIEWPORT.height,
    positionX: 0,
    positionY: 0
  }, sessionId);
  await send("Page.navigate", { url }, sessionId);

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
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
  return { evaluate, waitFor, setViewport, close: () => ws.close() };
}

async function assertMobileCustomizerLayout(page, viewport) {
  await page.setViewport(viewport);
  await page.waitFor("document.body.dataset.view === 'builder' && Boolean(document.querySelector('#customizerToggleButton'))");
  await page.evaluate(`(() => {
    const toggle = document.querySelector('#customizerToggleButton');
    if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
  })()`);
  await page.waitFor("document.querySelector('#customizerToggleButton').getAttribute('aria-expanded') === 'true'");

  const layout = await page.evaluate(`(() => {
    const bounds = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
    const customizer = document.querySelector('#customizerPanel');
    const swatchGrid = document.querySelector('#swatchGrid');
    const swatches = Array.from(document.querySelectorAll('#swatchGrid .swatch-button')).map((button) => button.getBoundingClientRect().toJSON());
    const inlineSwatchGrids = Array.from(document.querySelectorAll('#textureList .swatch-grid--inline')).map((grid) => ({
      rect: grid.getBoundingClientRect().toJSON(),
      scrollWidth: grid.scrollWidth,
      clientWidth: grid.clientWidth,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
      swatches: Array.from(grid.querySelectorAll('.swatch-button')).map((button) => button.getBoundingClientRect().toJSON())
    }));
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      customizer: bounds('#customizerPanel'),
      swatchGrid: bounds('#swatchGrid'),
      swatches,
      inlineSwatchGrids,
      customizerScrollWidth: customizer.scrollWidth,
      customizerClientWidth: customizer.clientWidth,
      swatchGridScrollWidth: swatchGrid.scrollWidth,
      swatchGridClientWidth: swatchGrid.clientWidth,
      columns: getComputedStyle(swatchGrid).gridTemplateColumns.split(' ').filter(Boolean).length
    };
  })()`);
  const label = `${viewport.name} ${viewport.width}x${viewport.height}`;

  assert(layout.customizer.width >= 118, `${label}: mobile customizer should be wide enough for controls, got ${layout.customizer.width}`);
  assert(layout.customizer.right <= layout.viewport.width + 1, `${label}: mobile customizer should stay inside viewport`);
  assert(layout.customizerScrollWidth <= layout.customizerClientWidth + 1, `${label}: mobile customizer should not have horizontal overflow (${layout.customizerScrollWidth}/${layout.customizerClientWidth})`);
  assert(layout.swatchGridScrollWidth <= layout.swatchGridClientWidth + 1, `${label}: mobile color grid should not have horizontal overflow (${layout.swatchGridScrollWidth}/${layout.swatchGridClientWidth})`);
  assert(layout.columns >= 2, `${label}: mobile color grid should keep at least two columns, got ${layout.columns}`);
  assert(layout.inlineSwatchGrids.length > 0, `${label}: selected material should render a color sub-list`);
  layout.inlineSwatchGrids.forEach((grid, gridIndex) => {
    assert(grid.columns === 1, `${label}: inline color sub-list #${gridIndex} should be vertical, got ${grid.columns} columns`);
    assert(grid.scrollWidth <= grid.clientWidth + 1, `${label}: inline color sub-list #${gridIndex} should not overflow horizontally (${grid.scrollWidth}/${grid.clientWidth})`);
    grid.swatches.forEach((swatch, swatchIndex) => {
      assert(swatch.left >= grid.rect.left - 1, `${label}: inline color swatch #${gridIndex}.${swatchIndex} should not clip left`);
      assert(swatch.right <= grid.rect.right + 1, `${label}: inline color swatch #${gridIndex}.${swatchIndex} should not clip right`);
    });
  });
  layout.swatches.forEach((swatch, index) => {
    assert(swatch.width >= 30 && swatch.height >= 30, `${label}: mobile swatch #${index} should remain tappable, got ${swatch.width}x${swatch.height}`);
    assert(swatch.left >= layout.swatchGrid.left - 1, `${label}: mobile swatch #${index} should not clip left`);
    assert(swatch.right <= layout.swatchGrid.right + 1, `${label}: mobile swatch #${index} should not clip right`);
  });
}

async function main() {
  const server = await startStaticServer();
  const chrome = await startChrome();
  let page;
  try {
    page = await openPage(chrome.debugPort, `${server.origin}/`);
    await page.evaluate("document.querySelector('[data-home-product]').click()");
    for (const viewport of MOBILE_VIEWPORTS) {
      await assertMobileCustomizerLayout(page, viewport);
    }
    console.log(`mobile-customizer-layout: ok (${MOBILE_VIEWPORTS.length} viewports)`);
  } finally {
    page?.close?.();
    await chrome.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
