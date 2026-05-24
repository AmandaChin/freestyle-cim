import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CHROME_BIN = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const mimeTypes = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png" };

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
      response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

async function startChrome() {
  assert(existsSync(CHROME_BIN), `Chrome executable not found at ${CHROME_BIN}`);
  const userDataDir = mkdtempSync(path.join(tmpdir(), "skate-cim-ue-fabric-ui-"));
  const chrome = spawn(CHROME_BIN, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-size=1440,1000", "--remote-debugging-port=0", `--user-data-dir=${userDataDir}`, "about:blank"], { stdio: "ignore" });
  const activePortFile = path.join(userDataDir, "DevToolsActivePort");
  for (let index = 0; index < 80; index += 1) {
    if (existsSync(activePortFile)) {
      const [port] = (await readFile(activePortFile, "utf8")).trim().split("\n");
      return { debugPort: port, close: async () => { chrome.kill(); await wait(100); rmSync(userDataDir, { recursive: true, force: true }); } };
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
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result || {});
  });
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
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
  return { ws, sessionId, send, evaluate, waitFor };
}

const server = await startStaticServer();
const chrome = await startChrome();
let page;
try {
  page = await openPage(chrome.debugPort, `${server.origin}/`);
  await page.waitFor("document.readyState === 'complete' && Boolean(document.querySelector('[data-home-product]'))");
  await page.evaluate("localStorage.removeItem('SKATE_CIM_PUBLISHED_CONFIG'); location.reload()");
  await page.waitFor("document.readyState === 'complete' && Boolean(document.querySelector('[data-home-product]'))");
  await page.evaluate("document.querySelector('[data-home-product]').click()");
  await page.waitFor("!document.querySelector('#workspace').classList.contains('is-hidden') && Boolean(document.querySelector('[data-material=\"ue_pu\"]'))");
  await page.evaluate("document.querySelector('[data-material=\"ue_pu\"]').click()");
  await page.waitFor("Boolean(document.querySelector('[data-fabric-style=\"ue-pu-183\"]'))");
  await page.evaluate("document.querySelector('[data-fabric-style=\"ue-pu-183\"]').click()");
  await page.waitFor("document.querySelector('[data-fabric-style=\"ue-pu-183\"]').getAttribute('aria-pressed') === 'true'");
  const state = await page.evaluate(`(() => {
    const layer = document.querySelector('#shoeArt .mvp-part-layer[data-part="G"]') || document.querySelector('#shoeArt .mvp-part-layer[data-part="A"]');
    return {
      selectedTexture: document.querySelector('#selectedTextureName')?.textContent.trim() || '',
      colorBlockHidden: document.querySelector('.color-block')?.hidden === true,
      subitems: document.querySelectorAll('[data-fabric-style-parent="ue_pu"]').length,
      texture: layer?.style.getPropertyValue('--part-material') || ''
    };
  })()`);
  assert(state.selectedTexture === "183号皮料", `selected texture should be 183号皮料, got ${JSON.stringify(state)}`);
  assert(state.colorBlockHidden, `color block should be hidden for UE image fabric, got ${JSON.stringify(state)}`);
  assert(state.subitems === 5, `PU should expose 5 subitems, got ${JSON.stringify(state)}`);
  assert(state.texture.includes("PU/183.png"), `shoe layer should use PU/183.png, got ${JSON.stringify(state)}`);
  const screenshot = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, page.sessionId);
  const screenshotPath = "/private/tmp/skate-cim-ue-fabric-ui.png";
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
  console.log("UE fabric UI: ok");
  console.log(`screenshot: ${screenshotPath}`);
} finally {
  page?.ws.close();
  await chrome.close();
  await server.close();
}
