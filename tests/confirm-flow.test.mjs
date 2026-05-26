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
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 }, sessionId);
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

  const tap = async (selector) => {
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
    assert(target, `Missing tap target: ${selector}`);
    assert(target.width > 0 && target.height > 0, `Tap target has no size: ${selector}`);
    assert(target.isHitTarget, `Tap target is covered or outside viewport: ${selector}`);
    await send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: target.x, y: target.y, radiusX: 2, radiusY: 2, force: 1, id: 1 }]
    }, sessionId);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }, sessionId);
  };

  await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('[data-home-product]'))");
  return { ws, evaluate, waitFor, click, tap };
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
      shoe: '#effectPickerModal .effect-preview-frame .effect-preview-snapshot',
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
        assert(await page.evaluate("Boolean(document.querySelector('#confirmModal [data-review-effect][disabled]'))"), `${viewport.name}: next-step button should be disabled before required personal info is complete`);
        assert(await page.evaluate("document.querySelector('#confirmModal')?.textContent.includes('请先填写')"), `${viewport.name}: form modal should explain required personal info before next step`);
        await page.click("[data-review-effect]");
        assert(await page.evaluate("!document.querySelector('#effectPickerModal.is-visible')"), `${viewport.name}: disabled next-step button should not open effect confirmation`);
        assert(await page.evaluate(`(() => {
          const input = document.querySelector('[data-customer="name"]');
          input.focus();
          input.value = '测';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return document.activeElement === input && input.value === '测';
        })()`), `${viewport.name}: typing required customer info should keep focus instead of remounting the input`);

        await page.evaluate(`(() => {
          document.querySelector('[data-customer="name"]').value = '测试用户';
          document.querySelector('[data-customer="name"]').dispatchEvent(new Event('input', { bubbles: true }));
          document.querySelector('[data-customer="phone"]').value = '13800138000';
          document.querySelector('[data-customer="phone"]').dispatchEvent(new Event('input', { bubbles: true }));
          document.querySelector('[data-customer="email"]').value = 'customer@example.com';
          document.querySelector('[data-customer="email"]').dispatchEvent(new Event('input', { bubbles: true }));
          document.querySelector('[data-customer="footLength"]').value = '245mm';
          document.querySelector('[data-customer="footLength"]').dispatchEvent(new Event('input', { bubbles: true }));
          document.querySelector('[data-customer="size"]').value = '39';
          document.querySelector('[data-customer="size"]').dispatchEvent(new Event('input', { bubbles: true }));
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
        assert(formData.customer.phone === "13800138000", `${viewport.name}: customer phone input should update export data`);
        assert(formData.customer.email === "customer@example.com", `${viewport.name}: customer email input should update export data`);
        assert(formData.customer.footLength === "245mm", `${viewport.name}: customer foot length input should update export data`);
        assert(formData.customer.size === "39", `${viewport.name}: customer size input should update export data`);
        assert(formData.embroidery.some((item) => item.image?.name === "logo.png"), `${viewport.name}: uploaded special customization image should be exported as file metadata`);
        assert(await page.evaluate("!document.querySelector('#confirmModal [data-review-effect][disabled]')"), `${viewport.name}: next-step button should be enabled after required personal info is complete`);

        await page.tap("[data-review-effect]");
        await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
        await page.waitFor("document.querySelector('#effectPickerModal .effect-preview-snapshot')?.src.startsWith('data:image/png')", 10000);
        assert(await page.evaluate("!document.querySelector('#confirmModal.is-visible')"), `${viewport.name}: form modal should close before effect confirmation`);
        assert(await page.evaluate("Boolean(document.querySelector('#effectPickerModal [data-download-sheet]'))"), `${viewport.name}: effect modal should expose final download action`);
        assert(
          await page.evaluate("!document.querySelector('#effectPickerModal .mvp-selection-ring, #effectPickerModal .mvp-part-layer.is-selected, #effectPickerModal .mvp-fixed-image.is-selected')"),
          `${viewport.name}: effect confirmation should render shoe previews without part selection state`
        );
        assert(
          await page.evaluate("document.querySelectorAll('#effectPickerModal .mvp-shoe-frame').length === 0 && document.querySelector('#effectPickerModal .effect-preview-snapshot')?.src.startsWith('data:image/png')"),
          `${viewport.name}: effect confirmation should render a static PNG snapshot instead of live layered shoe markup`
        );
        await assertEffectModalLayout(page, viewport);
        const firstSnapshotCount = await page.evaluate("window.__shoeSnapshotBuildCount || 0");
        const confirmationHtml = await page.evaluate("window.buildConfirmationSheetHtml(window.buildExportData({ includeImageData: true, includeEffectSnapshots: true }))");
        assert(confirmationHtml.includes("定制确认单"), `${viewport.name}: confirmation sheet should be human-readable HTML`);
        assert(confirmationHtml.includes("最终效果图"), `${viewport.name}: confirmation sheet should include the selected UI preview`);
        assert(confirmationHtml.includes("data:image/png") && !confirmationHtml.includes("mvp-shoe-frame"), `${viewport.name}: confirmation sheet should embed static PNG previews instead of live shoe markup`);
        assert(confirmationHtml.includes("测试用户"), `${viewport.name}: confirmation sheet should include customer data`);
        assert(confirmationHtml.includes("13800138000"), `${viewport.name}: confirmation sheet should include customer phone`);
        assert(confirmationHtml.includes("customer@example.com"), `${viewport.name}: confirmation sheet should include customer email`);
        assert(confirmationHtml.includes("配色选型"), `${viewport.name}: confirmation sheet should keep the original confirmation table data`);
        assert(confirmationHtml.includes("logo.png") && confirmationHtml.includes("data:image/png;base64,"), `${viewport.name}: confirmation sheet should include uploaded reference images`);

        await page.click("[data-back-confirm]");
        await page.waitFor("document.querySelector('#confirmModal.is-visible #confirmTitle')?.textContent === '填写定制信息'");
        assert(await page.evaluate("document.body.dataset.view === 'builder'"), `${viewport.name}: returning to form should stay in builder instead of home`);
        assert(await page.evaluate("!document.querySelector('#effectPickerModal.is-visible')"), `${viewport.name}: returning to form should close effect confirmation`);
        assert(await page.evaluate("document.querySelector('[data-customer=\"name\"]')?.value === '测试用户'"), `${viewport.name}: returning to form should preserve customer input`);
        assert(await page.evaluate("document.querySelector('[data-customer=\"phone\"]')?.value === '13800138000'"), `${viewport.name}: returning to form should preserve customer phone input`);
        assert(await page.evaluate("document.querySelector('[data-customer=\"email\"]')?.value === 'customer@example.com'"), `${viewport.name}: returning to form should preserve customer email input`);
        assert(await page.evaluate("document.querySelector('[data-customer=\"footLength\"]')?.value === '245mm'"), `${viewport.name}: returning to form should preserve customer foot length input`);
        assert(await page.evaluate("document.querySelector('[data-customer=\"size\"]')?.value === '39'"), `${viewport.name}: returning to form should preserve customer size input`);

        await page.tap("[data-review-effect]");
        await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
        await page.waitFor(`(window.__shoeSnapshotBuildCount || 0) > ${firstSnapshotCount}`);
        assert(
          await page.evaluate("document.querySelector('#effectPickerModal .effect-preview-snapshot')?.src.startsWith('data:image/png')"),
          `${viewport.name}: returning from form should regenerate a fresh static preview snapshot`
        );
        await assertEffectModalLayout(page, viewport);
        await page.evaluate(`(() => {
          window.__confirmationSheetWrites = [];
          window.__confirmationOpenCount = 0;
          const fakeDocument = {
            open() {},
            write(html) {
              window.__confirmationSheetWrites.push(html);
            },
            close() {}
          };
          window.open = () => {
            window.__confirmationOpenCount += 1;
            return {
              document: fakeDocument,
              closed: false,
              focus() {}
            };
          };
          window.__fullConfirmationBuildCount = 0;
          window.__confirmationEmailRequests = [];
          window.__confirmationEmailResolvers = [];
          const originalBuildConfirmationSheetHtml = window.buildConfirmationSheetHtml;
          window.buildConfirmationSheetHtml = (data) => {
            window.__fullConfirmationBuildCount += 1;
            return originalBuildConfirmationSheetHtml(data);
          };
          const originalFetch = window.fetch.bind(window);
          window.fetch = (url, options = {}) => {
            if (url === '/api/public/confirmation-email') {
              window.__confirmationEmailRequests.push(JSON.parse(options.body || '{}'));
              return new Promise((resolve) => {
                window.__confirmationEmailResolvers.push(() => resolve(new Response(JSON.stringify({ ok: true, id: 'confirmation-test', to: 'orders@example.com', transport: 'local-outbox' }), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                })));
              });
            }
            return originalFetch(url, options);
          };
        })()`);
        await page.click("[data-download-sheet]");
        await page.waitFor("document.querySelector('#confirmationPreviewModal.is-visible .quick-confirm-card')");
        assert(await page.evaluate("window.__confirmationOpenCount === 0"), `${viewport.name}: quick confirmation should not open a blank tab`);
        assert(await page.evaluate("window.__fullConfirmationBuildCount === 0"), `${viewport.name}: quick confirmation should not build the full production sheet`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal .quick-confirm-image')?.src.startsWith('data:image/png')"), `${viewport.name}: quick confirmation should reuse the selected static preview`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal')?.textContent.includes('测试用户')"), `${viewport.name}: quick confirmation should include customer data`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal')?.textContent.includes('customer@example.com')"), `${viewport.name}: quick confirmation should include customer email`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal')?.textContent.includes('配色摘要')"), `${viewport.name}: quick confirmation should show a compact color summary`);
        assert(await page.evaluate("Boolean(document.querySelector('#confirmationPreviewModal [data-back-confirm]'))"), `${viewport.name}: quick confirmation should keep a return-to-form action`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal [data-send-confirmation]')?.textContent.includes('确认并发送')"), `${viewport.name}: quick confirmation should expose the email send action`);
        assert(await page.evaluate("Boolean(document.querySelector('#confirmationPreviewModal [data-view-full-sheet]'))"), `${viewport.name}: full production sheet should be a secondary action`);
        assert(await page.evaluate(`(() => {
          const rect = document.querySelector('#confirmationPreviewModal .quick-confirm-card')?.getBoundingClientRect();
          return rect && rect.width <= window.innerWidth && rect.height <= window.innerHeight * 1.6;
        })()`), `${viewport.name}: quick confirmation card should stay compact on mobile`);
        await page.click("#confirmationPreviewModal [data-back-confirm]");
        await page.waitFor("document.querySelector('#confirmModal.is-visible #confirmTitle')?.textContent === '填写定制信息'");
        assert(await page.evaluate("window.__confirmationOpenCount === 0"), `${viewport.name}: returning from quick confirmation should not open a sheet`);

        await page.tap("[data-review-effect]");
        await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
        await page.click("[data-download-sheet]");
        await page.waitFor("document.querySelector('#confirmationPreviewModal.is-visible .quick-confirm-card')");
        await page.click("#confirmationPreviewModal [data-send-confirmation]");
        await page.waitFor("document.querySelector('#confirmationPreviewModal [data-send-confirmation]')?.textContent.includes('发送中')");
        assert(await page.evaluate("Boolean(document.querySelector('#confirmationPreviewModal [data-send-confirmation][disabled]'))"), `${viewport.name}: sending action should be disabled immediately to prevent duplicate clicks`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal')?.textContent.includes('正在发送')"), `${viewport.name}: sending action should show an in-card progress message`);
        assert(await page.evaluate("document.querySelector('#toast')?.textContent.includes('正在发送')"), `${viewport.name}: sending action should push a progress toast`);
        await page.click("#confirmationPreviewModal [data-send-confirmation]");
        assert(await page.evaluate("window.__confirmationEmailRequests.length === 1"), `${viewport.name}: duplicate click while sending should not enqueue another email`);
        await page.evaluate("window.__confirmationEmailResolvers.at(-1)()");
        await page.waitFor("window.__confirmationEmailRequests?.length === 1");
        assert(await page.evaluate("window.__confirmationEmailRequests[0].html.includes('定制确认单')"), `${viewport.name}: email action should send the full confirmation sheet HTML`);
        assert(await page.evaluate("window.__confirmationEmailRequests[0].customer.name === '测试用户'"), `${viewport.name}: email action should include customer metadata`);
        assert(await page.evaluate("window.__confirmationEmailRequests[0].customer.email === 'customer@example.com'"), `${viewport.name}: email action should include customer email metadata`);
        assert(await page.evaluate("window.__fullConfirmationBuildCount === 1"), `${viewport.name}: email action should build the full sheet only after explicit confirmation`);
        await page.waitFor("document.querySelector('#confirmationPreviewModal [data-send-confirmation]')?.textContent.includes('已保存')");
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal [data-send-confirmation]')?.textContent.includes('已保存')"), `${viewport.name}: local outbox action should show saved state instead of pretending real email was delivered`);
        assert(await page.evaluate("Boolean(document.querySelector('#confirmationPreviewModal [data-send-confirmation][disabled]'))"), `${viewport.name}: completed send action should stay disabled`);
        await page.click("#confirmationPreviewModal [data-send-confirmation]");
        assert(await page.evaluate("window.__confirmationEmailRequests.length === 1"), `${viewport.name}: clicking saved state should not enqueue another email`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal')?.textContent.includes('已保存到本地发件箱')"), `${viewport.name}: local outbox action should explain that no real email was sent yet`);
        assert(await page.evaluate("document.querySelector('#toast')?.textContent.includes('已保存到本地发件箱')"), `${viewport.name}: local outbox action should push an honest completion toast`);

        await page.evaluate(`(() => {
          window.__confirmationEmailRequests = [];
          window.__confirmationEmailResolvers = [];
          window.fetch = (url, options = {}) => {
            if (url === '/api/public/confirmation-email') {
              window.__confirmationEmailRequests.push(JSON.parse(options.body || '{}'));
              return Promise.resolve(new Response(JSON.stringify({ ok: true, id: 'confirmation-test', to: 'orders@example.com', transport: 'resend' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }));
            }
            return Promise.reject(new Error('unexpected fetch'));
          };
        })()`);
        await page.click("#confirmationPreviewModal [data-back-confirm]");
        await page.waitFor("document.querySelector('#confirmModal.is-visible #confirmTitle')?.textContent === '填写定制信息'");
        await page.tap("[data-review-effect]");
        await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
        await page.click("[data-download-sheet]");
        await page.waitFor("document.querySelector('#confirmationPreviewModal.is-visible .quick-confirm-card')");
        await page.click("#confirmationPreviewModal [data-send-confirmation]");
        await page.waitFor("document.querySelector('#confirmationPreviewModal [data-send-confirmation]')?.textContent.includes('已发送')");
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal')?.textContent.includes('发送完成')"), `${viewport.name}: Resend transport should show real sent completion copy`);
        assert(await page.evaluate("document.querySelector('#toast')?.textContent.includes('确认单已发送至 orders@example.com')"), `${viewport.name}: Resend transport should push a real sent toast`);
        await page.click("#confirmationPreviewModal [data-view-full-sheet]");
        await page.waitFor("window.__confirmationSheetWrites?.some((html) => html.includes('最终效果图'))");
        assert(await page.evaluate("window.__confirmationOpenCount === 1"), `${viewport.name}: final action should open the confirmation page after HTML is ready`);
        assert(await page.evaluate("window.__fullConfirmationBuildCount === 3"), `${viewport.name}: full production sheet should also build for both send transports and the secondary full-sheet action`);
        assert(await page.evaluate("window.__confirmationSheetWrites.at(-1).includes('data:image/png')"), `${viewport.name}: final action should open the HTML confirmation sheet with static PNG previews`);
        assert(await page.evaluate("document.body.dataset.view === 'builder'"), `${viewport.name}: generating the confirmation sheet should keep the customization page state`);

        await page.evaluate(`(() => {
          window.__confirmationEmailRequests = [];
          window.fetch = (url, options = {}) => {
            if (url === '/api/public/confirmation-email') {
              window.__confirmationEmailRequests.push(JSON.parse(options.body || '{}'));
              return Promise.resolve(new Response(JSON.stringify({ ok: false, message: 'Resend 发送失败：Domain not verified' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }));
            }
            return Promise.reject(new Error('unexpected fetch'));
          };
        })()`);
        await page.click("#confirmationPreviewModal [data-back-confirm]");
        await page.waitFor("document.querySelector('#confirmModal.is-visible #confirmTitle')?.textContent === '填写定制信息'");
        await page.tap("[data-review-effect]");
        await page.waitFor("document.querySelector('#effectPickerModal.is-visible #effectPickerTitle')?.textContent === '确认鞋子效果'");
        await page.click("[data-download-sheet]");
        await page.waitFor("document.querySelector('#confirmationPreviewModal.is-visible .quick-confirm-card')");
        await page.click("#confirmationPreviewModal [data-send-confirmation]");
        await page.waitFor("document.querySelector('#toast')?.textContent.includes('发送失败，请截图保存相关配置')");
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal')?.textContent.includes('发送失败，请截图保存相关配置')"), `${viewport.name}: Resend failures should ask users to screenshot the configuration`);
        assert(await page.evaluate("document.querySelector('#confirmationPreviewModal [data-send-confirmation]')?.textContent.includes('确认并发送')"), `${viewport.name}: failed send should restore the retry action`);
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
