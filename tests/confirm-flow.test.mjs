import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CHROME_BIN = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_VIEWPORTS = [
  { name: "iPhone SE", width: 320, height: 568 },
  { name: "compact tall", width: 360, height: 740 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "large phone", width: 430, height: 932 },
  { name: "phone landscape", width: 844, height: 390 }
];
const CHROME_WINDOW = TEST_VIEWPORTS.reduce(
  (max, viewport) => ({
    width: Math.max(max.width, viewport.width),
    height: Math.max(max.height, viewport.height)
  }),
  { width: 0, height: 0 }
);

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
    `--window-size=${CHROME_WINDOW.width},${CHROME_WINDOW.height}`,
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

async function openPage(debugPort, url, viewport) {
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
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    positionX: 0,
    positionY: 0
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

  const click = async (selector) => {
    const target = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      element.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        x,
        y,
        width: rect.width,
        height: rect.height,
        isHitTarget: Boolean(hit?.closest(${JSON.stringify(selector)}))
      };
    })()`);
    assert(target, `Missing click target: ${selector}`);
    assert(target.width > 0 && target.height > 0, `Click target has no size: ${selector}`);
    assert(target.isHitTarget, `Click target is covered or outside viewport: ${selector}`);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: target.x, y: target.y, button: "left", clickCount: 1 }, sessionId);
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: target.x, y: target.y, button: "left", clickCount: 1 }, sessionId);
  };

  await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('[data-home-product]'))");
  return { ws, evaluate, waitFor, click };
}

async function assertEffectModalLayout(page, viewport) {
  const layout = await page.evaluate(`(() => {
    const selectors = {
      dialog: '#effectPickerModal .effect-dialog',
      header: '#effectPickerModal .confirm-header',
      body: '#effectPickerModal .effect-body',
      footer: '#effectPickerModal .confirm-actions',
      previewPanel: '#effectPickerModal .effect-preview-panel',
      frame: '#effectPickerModal .effect-preview-frame',
      shoe: '#effectPickerModal .effect-preview-frame .mvp-shoe-frame',
      choices: '#effectPickerModal .effect-choice-panel'
    };
    const rect = (selector) => {
      const element = document.querySelector(selector);
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
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
        scrollHeight: element.scrollHeight,
        overflowY: style.overflowY
      };
    };
    const layout = Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [key, rect(selector)]));
    const body = document.querySelector(selectors.body);
    layout.bodyWideChildren = Array.from(body.querySelectorAll('*'))
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className || '',
          text: element.textContent.trim().slice(0, 40),
          width: box.width,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth
        };
      })
      .filter((item) => item.scrollWidth > item.clientWidth + 2 || item.width > layout.body.clientWidth + 2)
      .slice(0, 8);
    return layout;
  })()`);
  const label = `${viewport.name} ${viewport.width}x${viewport.height}`;

  assert(layout.dialog.left >= -0.5, `${label}: dialog should stay inside viewport left edge`);
  assert(layout.dialog.right <= viewport.width + 0.5, `${label}: dialog should stay inside viewport right edge`);
  assert(layout.dialog.top >= -0.5, `${label}: dialog should stay inside viewport top edge`);
  assert(layout.dialog.bottom <= viewport.height + 0.5, `${label}: dialog should stay inside viewport bottom edge`);
  assert(layout.dialog.scrollWidth <= layout.dialog.clientWidth + 2, `${label}: dialog should not have horizontal overflow (${layout.dialog.scrollWidth}/${layout.dialog.clientWidth})`);
  assert(layout.body.scrollWidth <= layout.body.clientWidth + 2, `${label}: body should not have horizontal overflow (${layout.body.scrollWidth}/${layout.body.clientWidth}) ${JSON.stringify(layout.bodyWideChildren)}`);

  assert(layout.header.bottom <= layout.body.top + 1, `${label}: header should not overlap scroll body`);
  assert(layout.body.bottom <= layout.footer.top + 1, `${label}: scroll body should not overlap footer`);
  assert(layout.body.overflowY === "auto", `${label}: effect body should be the vertical scroll container`);

  assert(layout.frame.bottom <= layout.choices.top + 1, `${label}: preview frame should not overlap angle choices ${JSON.stringify({ previewPanel: layout.previewPanel, frame: layout.frame, choices: layout.choices })}`);
  assert(layout.shoe.left >= layout.frame.left + 8, `${label}: shoe should keep left inset inside frame`);
  assert(layout.shoe.right <= layout.frame.right - 8, `${label}: shoe should keep right inset inside frame`);
  assert(layout.shoe.top >= layout.frame.top + 8, `${label}: shoe should keep top inset inside frame`);
  assert(layout.shoe.bottom <= layout.frame.bottom - 8, `${label}: shoe should keep bottom inset inside frame`);
}

async function main() {
  const server = await startStaticServer();
  let chrome;
  try {
    chrome = await startChrome();
    for (const viewport of TEST_VIEWPORTS) {
      let page;
      try {
        page = await openPage(chrome.debugPort, `${server.origin}/`, viewport);
        await page.click("[data-home-product]");
        await page.waitFor("document.body.dataset.view === 'builder' && Boolean(document.querySelector('#saveButton'))");

        await page.click("#saveButton");
        await page.waitFor("document.querySelector('#confirmModal.is-visible #confirmTitle')?.textContent === '填写定制信息'");
        assert(await page.evaluate("!document.querySelector('#effectPickerModal.is-visible')"), `${viewport.name}: effect picker should not open before form confirmation`);
        assert(await page.evaluate("Boolean(document.querySelector('#confirmModal [data-review-effect]'))"), `${viewport.name}: form modal should expose the next-step effect button`);

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
        assert(formData.customer.name === "测试用户", `${viewport.name}: customer form input should update export data`);
        assert(formData.embroidery.some((item) => item.image?.name === "logo.png"), `${viewport.name}: uploaded special customization image should be exported as file metadata`);

        await page.click("[data-review-effect]");
        await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
        assert(await page.evaluate("!document.querySelector('#confirmModal.is-visible')"), `${viewport.name}: form modal should close before effect confirmation`);
        assert(await page.evaluate("Boolean(document.querySelector('#effectPickerModal [data-download-sheet]'))"), `${viewport.name}: effect modal should expose final download action`);
        assert(
          await page.evaluate("!document.querySelector('#effectPickerModal .mvp-selection-ring, #effectPickerModal .mvp-part-layer.is-selected, #effectPickerModal .mvp-fixed-image.is-selected')"),
          `${viewport.name}: effect confirmation should render shoe previews without part selection state`
        );
        await assertEffectModalLayout(page, viewport);
        const confirmationHtml = await page.evaluate("window.buildConfirmationSheetHtml(window.buildExportData({ includeImageData: true }))");
        assert(confirmationHtml.includes("定制确认单"), `${viewport.name}: confirmation sheet should be human-readable HTML`);
        assert(confirmationHtml.includes("最终效果图"), `${viewport.name}: confirmation sheet should include the selected UI preview`);
        assert(confirmationHtml.includes("mvp-shoe-frame"), `${viewport.name}: confirmation sheet should embed the shoe UI preview markup`);
        assert(confirmationHtml.includes("测试用户"), `${viewport.name}: confirmation sheet should include customer data`);
        assert(confirmationHtml.includes("配色选型"), `${viewport.name}: confirmation sheet should keep the original confirmation table data`);
        assert(confirmationHtml.includes("logo.png") && confirmationHtml.includes("data:image/png;base64,"), `${viewport.name}: confirmation sheet should include uploaded reference images`);

        await page.click("[data-back-confirm]");
        await page.waitFor("document.querySelector('#confirmModal.is-visible #confirmTitle')?.textContent === '填写定制信息'");
        assert(await page.evaluate("document.body.dataset.view === 'builder'"), `${viewport.name}: returning to form should stay in builder instead of home`);
        assert(await page.evaluate("!document.querySelector('#effectPickerModal.is-visible')"), `${viewport.name}: returning to form should close effect confirmation`);
        assert(await page.evaluate("document.querySelector('[data-customer=\"name\"]')?.value === '测试用户'"), `${viewport.name}: returning to form should preserve customer input`);

        await page.click("[data-review-effect]");
        await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
        await assertEffectModalLayout(page, viewport);
        await page.evaluate(`(() => {
          window.__confirmationSheetWrites = [];
          const fakeDocument = {
            open() {},
            write(html) {
              window.__confirmationSheetWrites.push(html);
            },
            close() {}
          };
          window.open = () => ({
            document: fakeDocument,
            closed: false,
            focus() {}
          });
        })()`);
        await page.click("[data-download-sheet]");
        await page.waitFor("window.__confirmationSheetWrites?.length === 1");
        assert(await page.evaluate("window.__confirmationSheetWrites[0].includes('最终效果图')"), `${viewport.name}: final action should open the HTML confirmation sheet`);
        assert(await page.evaluate("document.body.dataset.view === 'builder'"), `${viewport.name}: generating the confirmation sheet should keep the customization page state`);
      } finally {
        page?.ws?.close();
      }
    }
  } finally {
    await chrome?.close();
    await server.close();
  }

  console.log(`confirm-flow: ok (${TEST_VIEWPORTS.length} viewports checked)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
