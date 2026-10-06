import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLocalBackend } from "./local-backend.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8082);
const HOST = process.env.HOST || "127.0.0.1";
const MAX_REQUEST_BODY_BYTES = 12 * 1024 * 1024;
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
      const index = entry.indexOf("=");
      return [decodeURIComponent(entry.slice(0, index)), decodeURIComponent(entry.slice(index + 1))];
    })
  );
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let receivedBytes = 0;
    request.on("data", (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_REQUEST_BODY_BYTES) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve(body ? JSON.parse(body) : {}));
    request.on("error", reject);
  });
}

function readRawBody(request, maxBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;
    request.on("data", (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function serveStatic(request, response, runtimeId) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const resolved = path.resolve(PROJECT_ROOT, `.${pathname}`);
  const relativePath = path.relative(PROJECT_ROOT, resolved);
  if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  let filePath = resolved;
  const info = await stat(filePath).catch(() => null);
  if (info?.isDirectory()) filePath = path.join(filePath, "index.html");
  const fileInfo = await stat(filePath).catch(() => null);
  if (!fileInfo?.isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=3600" : "no-store"
  });
  if (path.extname(filePath) === ".html") {
    const html = await readFile(filePath, "utf8");
    const runtimeBootstrap = `<script>window.__SKATE_CIM_LOCAL_RUNTIME_ID__=${JSON.stringify(runtimeId)};</script>`;
    response.end(html.replace("</head>", `${runtimeBootstrap}</head>`));
    return;
  }
  createReadStream(filePath).pipe(response);
}

export async function createLocalServer(options = {}) {
  const runtimeId = randomUUID();
  const backend = await createLocalBackend({ ...options, resetDesignCacheOnStart: options.resetDesignCacheOnStart ?? true });

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const cookies = parseCookies(request.headers.cookie || "");
      const sessionId = cookies.skate_cim_session || request.headers.authorization?.replace(/^Bearer\s+/i, "");

      if (request.method === "GET" && url.pathname === "/api/public/config") {
        sendJson(response, 200, await backend.getPublicConfig(), { "Cache-Control": "no-cache" });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/public/confirmation-email") {
        sendJson(response, 200, await backend.queueConfirmationEmail(await readBody(request)));
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/public/designs") {
        sendJson(response, 200, { ok: true, documents: await backend.listDesignDocuments(url.searchParams.get("productId")) });
        return;
      }
      if (request.method === "PUT" && url.pathname === "/api/public/designs") {
        const result = await backend.saveDesignDocument(await readBody(request));
        sendJson(response, result.ok ? 200 : result.status || 400, result);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/public/assets/upload-ticket") {
        const result = await backend.createAssetUploadTicket(await readBody(request));
        sendJson(response, result.ok ? 200 : result.status || 400, result);
        return;
      }
      const assetContentMatch = url.pathname.match(/^\/api\/public\/assets\/([a-zA-Z0-9_-]+)\/content$/);
      const assetCompleteMatch = url.pathname.match(/^\/api\/public\/assets\/([a-zA-Z0-9_-]+)\/complete$/);
      if (assetCompleteMatch && request.method === "POST") {
        const result = await backend.completeAssetUpload(assetCompleteMatch[1]);
        sendJson(response, result.ok ? 200 : result.status || 400, result);
        return;
      }
      if (assetContentMatch && request.method === "PUT") {
        const bytes = await readRawBody(request);
        const result = await backend.storeAssetContent(assetContentMatch[1], bytes);
        sendJson(response, result.ok ? 200 : result.status || 400, result);
        return;
      }
      if (assetContentMatch && request.method === "GET") {
        const asset = await backend.getAsset(assetContentMatch[1]);
        if (!asset) {
          sendJson(response, 404, { ok: false, message: "素材不存在" });
          return;
        }
        response.writeHead(200, {
          "Content-Type": asset.mimeType,
          "Content-Length": asset.sizeBytes,
          "Cache-Control": "private, no-store",
          "Content-Disposition": "inline"
        });
        createReadStream(asset.path).pipe(response);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/admin/login") {
        const body = await readBody(request);
        const result = await backend.signIn(body);
        if (!result.ok) {
          sendJson(response, result.status || 400, result);
          return;
        }
        sendJson(response, 200, { ok: true, admin: result.admin }, {
          "Set-Cookie": `skate_cim_session=${encodeURIComponent(result.sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
        });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/admin/logout") {
        await backend.signOut(sessionId);
        sendJson(response, 200, { ok: true }, {
          "Set-Cookie": "skate_cim_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
        });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/admin/me") {
        const result = await backend.currentAdmin(sessionId);
        sendJson(response, result.ok ? 200 : 401, result);
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/admin/config/draft") {
        sendJson(response, 200, await backend.getDraftConfig(sessionId));
        return;
      }
      if (request.method === "PUT" && url.pathname === "/api/admin/config/draft") {
        sendJson(response, 200, await backend.saveDraftConfig(sessionId, await readBody(request)));
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/admin/publish") {
        const body = await readBody(request);
        sendJson(response, 200, await backend.publishDraft(sessionId, body.note));
        return;
      }

      await serveStatic(request, response, runtimeId);
    } catch (error) {
      sendJson(response, error.status || 500, { ok: false, message: error.message || "Server error" });
    }
  });

  return { server, backend };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { server } = await createLocalServer();
  server.listen(PORT, HOST, () => {
    console.log(`Skate CIM local server: http://${HOST}:${PORT}/`);
    console.log(`B-side admin: http://${HOST}:${PORT}/b-side/`);
  });
}
