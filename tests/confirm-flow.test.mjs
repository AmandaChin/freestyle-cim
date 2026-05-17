import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CHROME_BIN = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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
  const userDataDir = mkdtempSync(path.join(tmpdir(), "skate-cim-confirm-flow-"));
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

async function main() {
  const server = await startStaticServer();
  let chrome;
  let page;
  try {
    chrome = await startChrome();
    page = await openPage(chrome.debugPort, `${server.origin}/`);
    await page.evaluate("document.querySelector('[data-home-product]').click()");
    await page.waitFor("document.body.dataset.view === 'builder' && Boolean(document.querySelector('#saveButton'))");

    await page.evaluate("document.querySelector('#saveButton').click()");
    await page.waitFor("document.querySelector('#confirmModal.is-visible #confirmTitle')?.textContent === '填写定制信息'");
    assert(await page.evaluate("!document.querySelector('#effectPickerModal.is-visible')"), "effect picker should not open before form confirmation");
    assert(await page.evaluate("Boolean(document.querySelector('#confirmModal [data-review-effect]'))"), "form modal should expose the next-step effect button");

    await page.evaluate(`(() => {
      document.querySelector('[data-customer="name"]').value = '测试用户';
      document.querySelector('[data-customer="name"]').dispatchEvent(new Event('input', { bubbles: true }));
      const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='), (char) => char.charCodeAt(0));
      const file = new File([bytes], 'logo.png', { type: 'image/png' });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      const input = document.querySelector('[data-embroidery-image]');
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await page.waitFor("Boolean(document.querySelector('.embroidery-upload.has-image img')) && document.querySelector('[data-embroidery-toggle]').checked");

    const formData = await page.evaluate("window.buildExportData()");
    assert(formData.customer.name === "测试用户", "customer form input should update export data");
    assert(formData.embroidery.some((item) => item.image?.name === "logo.png"), "uploaded special customization image should be exported as file metadata");

    await page.evaluate("document.querySelector('[data-review-effect]').click()");
    await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
    assert(await page.evaluate("!document.querySelector('#confirmModal.is-visible')"), "form modal should close before effect confirmation");
    assert(await page.evaluate("Boolean(document.querySelector('#effectPickerModal [data-download-sheet]'))"), "effect modal should expose final download action");
    assert(
      await page.evaluate("!document.querySelector('#effectPickerModal .mvp-selection-ring, #effectPickerModal .mvp-part-layer.is-selected, #effectPickerModal .mvp-fixed-image.is-selected')"),
      "effect confirmation should render shoe previews without part selection state"
    );
  } finally {
    page?.ws?.close();
    await chrome?.close();
    await server.close();
  }

  console.log("confirm-flow: ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
