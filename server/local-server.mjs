import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createLocalBackend } from "./local-backend.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8082);
const HOST = process.env.HOST || "127.0.0.1";
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
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body ? JSON.parse(body) : {}));
    request.on("error", reject);
  });
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const resolved = path.resolve(PROJECT_ROOT, `.${pathname}`);
  if (!resolved.startsWith(PROJECT_ROOT)) {
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
  createReadStream(filePath).pipe(response);
}

export async function createLocalServer(options = {}) {
  const backend = await createLocalBackend(options);

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const cookies = parseCookies(request.headers.cookie || "");
      const sessionId = cookies.skate_cim_session || request.headers.authorization?.replace(/^Bearer\s+/i, "");

      if (request.method === "GET" && url.pathname === "/api/public/config") {
        sendJson(response, 200, await backend.getPublicConfig(), { "Cache-Control": "no-cache" });
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

      await serveStatic(request, response);
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
    console.log("Default admin: admin@skate-cim.local / admin123");
  });
}
