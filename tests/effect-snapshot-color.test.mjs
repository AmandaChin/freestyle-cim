import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CHROME_BIN = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VIEWPORT = { width: 390, height: 844 };
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

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

async function startChrome() {
  assert(existsSync(CHROME_BIN), `Chrome executable not found at ${CHROME_BIN}`);
  const userDataDir = mkdtempSync(path.join(tmpdir(), "skate-cim-effect-color-"));
  const chrome = spawn(CHROME_BIN, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  const activePortFile = path.join(userDataDir, "DevToolsActivePort");
  for (let index = 0; index < 80; index += 1) {
    if (existsSync(activePortFile)) {
      const [port] = (await readFile(activePortFile, "utf8")).trim().split("\n");
      return {
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
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result || {});
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
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: VIEWPORT.width,
    screenHeight: VIEWPORT.height
  }, sessionId);
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

  await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('[data-home-product]'))");
  return { ws, evaluate, waitFor };
}

const server = await startStaticServer();
const chrome = await startChrome();
let page;

try {
  page = await openPage(chrome.debugPort, `${server.origin}/`);
  const snapshotResult = await page.evaluate(`(async () => {
    showBuilder();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const defaultSnapshot = await renderShoeSnapshot(product(), "front");
    const before = buildExportData().components.find((component) => component.code === "G");
    updatePartConfig("G", { color: "#17171a" });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const colorOnlySnapshot = await renderShoeSnapshot(product(), "front");
    updatePartConfig("G", { material: "34", variant: "34" });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const changedMaterialSnapshot = await renderShoeSnapshot(product(), "front");
    const after = buildExportData().components.find((component) => component.code === "G");
    return {
      before,
      after,
      hasDefaultSnapshot: defaultSnapshot.startsWith("data:image/png"),
      hasColorOnlySnapshot: colorOnlySnapshot.startsWith("data:image/png"),
      hasChangedMaterialSnapshot: changedMaterialSnapshot.startsWith("data:image/png"),
      colorOnlySnapshotsMatch: defaultSnapshot === colorOnlySnapshot,
      materialSnapshotsMatch: defaultSnapshot === changedMaterialSnapshot
    };
  })()`);

  assert(snapshotResult.hasDefaultSnapshot, "default effect snapshot should be generated as a PNG");
  assert(snapshotResult.hasColorOnlySnapshot, "color-only changed effect snapshot should be generated as a PNG");
  assert(snapshotResult.hasChangedMaterialSnapshot, "changed-material effect snapshot should be generated as a PNG");
  assert(snapshotResult.before?.color === "皮料原色", `G should describe official texture color as material-original, got ${JSON.stringify(snapshotResult.before)}`);
  assert(snapshotResult.before?.colorValue === "-", `G should not export a base color for official textures, got ${JSON.stringify(snapshotResult.before)}`);
  assert(snapshotResult.after?.color === "皮料原色", `G should keep material-original color copy after a base color change, got ${JSON.stringify(snapshotResult.after)}`);
  assert(snapshotResult.after?.colorValue === "-", `G should still hide base color values after a color-only change, got ${JSON.stringify(snapshotResult.after)}`);
  assert(snapshotResult.colorOnlySnapshotsMatch, "official texture snapshots should ignore part base color changes");
  assert(!snapshotResult.materialSnapshotsMatch, "official texture snapshots should change when the selected material id changes");

  console.log("effect-snapshot-color: ok");
} finally {
  page?.ws.close();
  await chrome.close();
  await server.close();
}
