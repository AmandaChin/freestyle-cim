import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DATA_DIR = path.join(PROJECT_ROOT, ".local-data");
const SHARED_SCHEMA_PATH = path.join(PROJECT_ROOT, "shared", "yjs-pro-cim-schema.js");
const SHARED_CONFIG_PATH = path.join(PROJECT_ROOT, "b-side", "data", "cim-config.js");
const DEFAULT_ADMIN_EMAIL = "admin@skate-cim.local";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";
const CONFIRMATION_DOCUMENT_TYPE = "skate-cim-confirmation-sheet";
const CONFIRMATION_DOCUMENT_MARKER = '<meta name="skate-cim-document" content="confirmation-sheet"';

function nowString() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeFileName(value) {
  return String(value || "customer").replace(/[\\/:*?"<>|]/g, "-");
}

function imageBytesMatchType(bytes, mimeType) {
  if (!Buffer.isBuffer(bytes)) return false;
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/webp") return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

function htmlToBase64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function dataUrlAttachmentContent(dataUrl = "") {
  const match = String(dataUrl).match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1] || "application/octet-stream", content: match[2] };
}

function isValidEmail(value) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(value || "").trim());
}

function isConfirmationSheetPayload(payload, html) {
  // 新版确认单使用与语言无关的文档契约；保留中文标题识别以兼容旧客户端。
  const structuredDocument = payload?.documentType === CONFIRMATION_DOCUMENT_TYPE
    && Number(payload.documentVersion) >= 1
    && html.includes(CONFIRMATION_DOCUMENT_MARKER);
  return structuredDocument || html.includes("定制确认单");
}

function embroideryImageAttachments(embroidery = []) {
  return embroidery.flatMap((entry) => {
    const image = entry?.image;
    const parsed = dataUrlAttachmentContent(image?.dataUrl);
    if (!parsed) return [];
    const prefix = [entry.code, entry.name].filter(Boolean).join("-") || "remark-image";
    return [{
      filename: safeFileName(`${prefix}-${image.name || "attachment"}`),
      contentType: image.type || parsed.contentType,
      content: parsed.content
    }];
  });
}

function confirmationAttachmentDate(customerDate) {
  const fallback = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return String(customerDate || "")
    .replace(/[^0-9]/g, "")
    .slice(0, 8) || fallback;
}

function effectImageAttachments(effectSnapshots, productName, customerName, customerDate) {
  const previews = Array.isArray(effectSnapshots?.previews) ? effectSnapshots.previews.slice(0, 3) : [];
  const date = confirmationAttachmentDate(customerDate);
  return previews.flatMap((preview, index) => {
    const parsed = dataUrlAttachmentContent(preview?.dataUrl);
    if (!parsed || !String(parsed.contentType).startsWith("image/")) return [];
    const extension = parsed.contentType === "image/jpeg" ? "jpg" : "png";
    const angle = safeFileName(preview.label || preview.id || `view-${index + 1}`);
    return [{
      filename: safeFileName(`${productName}_${customerName}_${date}_${angle}.${extension}`),
      contentType: parsed.contentType,
      content: parsed.content
    }];
  });
}

function confirmationZipAttachment(archive) {
  if (!archive?.filename || !archive?.content) return null;
  return {
    filename: safeFileName(archive.filename),
    contentType: "application/zip",
    content: String(archive.content)
  };
}

function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;
  const candidate = Buffer.from(passwordHash(password, salt).split(":")[1], "hex");
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

async function loadSeedConfig() {
  const [schemaSource, configSource] = await Promise.all([
    readFile(SHARED_SCHEMA_PATH, "utf8"),
    readFile(SHARED_CONFIG_PATH, "utf8")
  ]);
  const browserGlobals = { window: {} };
  Function("window", schemaSource)(browserGlobals.window);
  Function("window", configSource)(browserGlobals.window);
  if (!browserGlobals.window.SKATE_CIM_CONFIG) throw new Error("Cannot parse b-side/data/cim-config.js");
  return deepClone(browserGlobals.window.SKATE_CIM_CONFIG);
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(admin_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      note TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS design_documents (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      document_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS design_assets (
      id TEXT PRIMARY KEY,
      object_key TEXT NOT NULL UNIQUE,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function seedAdmin(db) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM admins").get().count;
  if (count > 0) return;
  db.prepare(`
    INSERT INTO admins (email, password_hash, role, status, created_at)
    VALUES (?, ?, 'owner', 'active', ?)
  `).run(DEFAULT_ADMIN_EMAIL, passwordHash(DEFAULT_ADMIN_PASSWORD), nowString());
}

async function seedDraftConfig(db) {
  const existing = db.prepare("SELECT value FROM configs WHERE key = 'draft'").get();
  if (existing) return;
  const seed = await loadSeedConfig();
  db.prepare("INSERT INTO configs (key, value, updated_at) VALUES ('draft', ?, ?)").run(JSON.stringify(seed), nowString());
  db.prepare("INSERT INTO configs (key, value, updated_at) VALUES ('public', ?, ?)").run(JSON.stringify(seed), nowString());
}

function writeAudit(db, actor, action, detail) {
  db.prepare("INSERT INTO audit_logs (actor, action, detail, created_at) VALUES (?, ?, ?, ?)").run(actor, action, detail, nowString());
}

export async function createLocalBackend(options = {}) {
  const dataDir = options.dataDir || DEFAULT_DATA_DIR;
  const outboxDir = path.join(dataDir, "outbox");
  const confirmationEmailTo = String(options.confirmationEmailTo || process.env.CONFIRMATION_EMAIL_TO || "").trim();
  const emailTransport = options.emailTransport || process.env.EMAIL_TRANSPORT || "outbox";
  const resendApiKey = options.resendApiKey || process.env.RESEND_API_KEY || "";
  const resendFrom = options.resendFrom || process.env.RESEND_FROM || "";
  const uploadsDir = path.join(dataDir, "uploads");
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const logger = options.logger || console;
  logger.info?.("[confirmation-email] config", {
    transport: emailTransport,
    hasRecipient: Boolean(confirmationEmailTo),
    recipient: confirmationEmailTo || "UNSET",
    hasResendApiKey: Boolean(resendApiKey),
    resendFrom: resendFrom || "UNSET"
  });
  await mkdir(dataDir, { recursive: true });
  await mkdir(path.join(dataDir, "releases"), { recursive: true });
  await mkdir(uploadsDir, { recursive: true });
  await mkdir(outboxDir, { recursive: true });

  const db = new DatabaseSync(path.join(dataDir, "skate-cim.db"));
  ensureSchema(db);
  seedAdmin(db);
  await seedDraftConfig(db);
  if (options.resetDesignCacheOnStart === true) {
    // 本地画板和上传素材只是联调缓存；保留后台账号、配置和发布记录。
    db.exec("DELETE FROM design_documents; DELETE FROM design_assets; DELETE FROM sessions;");
    const cachedUploads = await readdir(uploadsDir).catch(() => []);
    await Promise.all(cachedUploads.map((name) => rm(path.join(uploadsDir, name), { recursive: true, force: true })));
  }

  function adminForSession(sessionId) {
    if (!sessionId) return null;
    const row = db.prepare(`
      SELECT admins.email, admins.role, admins.status
      FROM sessions
      JOIN admins ON admins.id = sessions.admin_id
      WHERE sessions.id = ? AND sessions.expires_at > ?
    `).get(sessionId, Date.now());
    if (!row || row.status !== "active") return null;
    return { email: row.email, role: row.role };
  }

  function requireAdmin(sessionId) {
    const admin = adminForSession(sessionId);
    if (!admin) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    return admin;
  }

  function readConfig(key) {
    const row = db.prepare("SELECT value FROM configs WHERE key = ?").get(key);
    if (!row) return null;
    return JSON.parse(row.value);
  }

  async function writePublicSnapshot(snapshot) {
    const currentPath = path.join(dataDir, "releases", "published-config.json");
    await writeFile(currentPath, JSON.stringify(snapshot, null, 2));
  }

  return {
    close() {
      db.close();
    },

    async signIn({ email, password }) {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(normalizedEmail);
      if (!admin || admin.status !== "active") {
        return { ok: false, status: 403, message: "当前账号不在管理员白名单中" };
      }
      if (!verifyPassword(String(password || ""), admin.password_hash)) {
        return { ok: false, status: 401, message: "邮箱或密码错误" };
      }
      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      db.prepare("INSERT INTO sessions (id, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(sessionId, admin.id, nowString(), expiresAt);
      db.prepare("UPDATE admins SET last_login_at = ? WHERE id = ?").run(nowString(), admin.id);
      writeAudit(db, normalizedEmail, "sign_in", "管理员登录");
      return { ok: true, sessionId, admin: { email: normalizedEmail, role: admin.role } };
    },

    async signOut(sessionId) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
      return { ok: true };
    },

    async currentAdmin(sessionId) {
      const admin = adminForSession(sessionId);
      return admin ? { ok: true, admin } : { ok: false, status: 401 };
    },

    async getDraftConfig(sessionId) {
      requireAdmin(sessionId);
      return deepClone(readConfig("draft"));
    },

    async saveDraftConfig(sessionId, config) {
      const admin = requireAdmin(sessionId);
      if (!Array.isArray(config?.shoes) || !Array.isArray(config?.fabrics)) {
        return { ok: false, status: 400, message: "配置必须包含 shoes 和 fabrics" };
      }
      db.prepare("UPDATE configs SET value = ?, updated_at = ? WHERE key = 'draft'").run(JSON.stringify(config), nowString());
      writeAudit(db, admin.email, "save_draft", "保存后台草稿配置");
      return { ok: true, updatedAt: nowString() };
    },

    async publishDraft(sessionId, note = "本地发布") {
      const admin = requireAdmin(sessionId);
      const draft = deepClone(readConfig("draft"));
      const version = `local-v${Date.now()}`;
      draft.release = draft.release || {};
      draft.release.online = {
        version,
        publishedAt: nowString(),
        status: "正常"
      };
      draft.release.history = [
        { version, publishedAt: draft.release.online.publishedAt, operator: admin.email, note },
        ...(draft.release.history || [])
      ].slice(0, 20);
      db.prepare("UPDATE configs SET value = ?, updated_at = ? WHERE key = 'public'").run(JSON.stringify(draft), nowString());
      db.prepare("INSERT INTO releases (version, note, snapshot, created_by, created_at) VALUES (?, ?, ?, ?, ?)").run(version, note, JSON.stringify(draft), admin.email, nowString());
      writeAudit(db, admin.email, "publish", `发布版本 ${version}`);
      await writePublicSnapshot(draft);
      return { ok: true, version, publishedAt: draft.release.online.publishedAt };
    },

    async getPublicConfig() {
      return deepClone(readConfig("public"));
    },

    async listDesignDocuments(productId) {
      const rows = db.prepare(`
        SELECT document_json FROM design_documents
        WHERE product_id = ? ORDER BY slot_id
      `).all(String(productId || ""));
      return rows.map((row) => JSON.parse(row.document_json));
    },

    async saveDesignDocument(document) {
      if (!document || document.schemaVersion !== 1 || !document.id || !document.productId || !document.slotId || !Array.isArray(document.objects)) {
        return { ok: false, status: 400, message: "设计文档结构无效" };
      }
      if (document.objects.length > 6) return { ok: false, status: 400, message: "单个裁片最多保存 6 个对象" };
      const serializedDocument = JSON.stringify(document);
      if (Buffer.byteLength(serializedDocument) > 1024 * 1024 || /data:image\/[^;,]+;base64,/i.test(serializedDocument)) {
        return { ok: false, status: 413, message: "设计文档过大或包含内嵌图片数据" };
      }
      for (const object of document.objects) {
        if (object.sourceAssetId) {
          const asset = db.prepare("SELECT status FROM design_assets WHERE id = ?").get(String(object.sourceAssetId));
          if (!asset || asset.status !== "ready") return { ok: false, status: 400, message: "设计引用了未完成的图片素材" };
        }
      }
      const existing = db.prepare("SELECT revision FROM design_documents WHERE id = ?").get(document.id);
      const revision = Math.max(0, Number(document.revision) || 0);
      // 本地联调也按 revision 拒绝旧写入，避免页面并发保存时回滚较新的设计。
      if (existing && revision < existing.revision) {
        return { ok: false, status: 409, message: "设计版本已更新，请重新载入后再保存" };
      }
      const now = nowString();
      db.prepare(`
        INSERT INTO design_documents (id, product_id, slot_id, revision, document_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          product_id = excluded.product_id,
          slot_id = excluded.slot_id,
          revision = excluded.revision,
          document_json = excluded.document_json,
          updated_at = excluded.updated_at
      `).run(document.id, document.productId, document.slotId, revision, serializedDocument, now, now);
      writeAudit(db, "local-customer", "save_design", `${document.productId}/${document.slotId} revision ${revision}`);
      return { ok: true, id: document.id, revision, updatedAt: now };
    },

    async createAssetUploadTicket({ fileName, mimeType, sizeBytes } = {}) {
      const name = safeFileName(fileName || "upload").slice(0, 180);
      const type = String(mimeType || "").toLowerCase();
      const size = Number(sizeBytes);
      if (!/^image\/(png|jpeg|webp)$/.test(type)) return { ok: false, status: 415, message: "仅支持 PNG、JPEG 或 WebP 图片" };
      if (!Number.isInteger(size) || size <= 0 || size > 8 * 1024 * 1024) return { ok: false, status: 413, message: "图片需小于 8MB" };
      const id = `asset_${randomBytes(16).toString("hex")}`;
      const objectKey = `design-assets/${id}`;
      const now = nowString();
      db.prepare(`
        INSERT INTO design_assets (id, object_key, file_name, mime_type, size_bytes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(id, objectKey, name, type, size, now, now);
      return {
        ok: true,
        asset: { assetId: id, objectKey, fileName: name, mimeType: type, sizeBytes: size, status: "pending" },
        uploadUrl: `/api/public/assets/${id}/content`,
        uploadMethod: "PUT",
        uploadHeaders: { "Content-Type": type },
        expiresAt: Date.now() + 10 * 60 * 1000
      };
    },

    async storeAssetContent(assetId, bytes) {
      const asset = db.prepare("SELECT * FROM design_assets WHERE id = ?").get(String(assetId || ""));
      if (!asset) return { ok: false, status: 404, message: "素材上传票据不存在" };
      if (asset.status !== "pending") return { ok: false, status: 409, message: "素材已完成上传" };
      if (!Buffer.isBuffer(bytes) || bytes.length !== asset.size_bytes) return { ok: false, status: 400, message: "上传内容大小与票据不符" };
      if (!imageBytesMatchType(bytes, asset.mime_type)) return { ok: false, status: 415, message: "图片内容与声明格式不一致" };
      const filePath = path.join(uploadsDir, asset.id);
      // 本地把票据映射到隔离目录；云端实现将用相同逻辑字段换成 OSS 临时直传地址。
      await writeFile(filePath, bytes, { flag: "wx" });
      db.prepare("UPDATE design_assets SET status = 'ready', updated_at = ? WHERE id = ?").run(nowString(), asset.id);
      return { ok: true, asset: { assetId: asset.id, objectKey: asset.object_key, fileName: asset.file_name, mimeType: asset.mime_type, sizeBytes: asset.size_bytes, status: "ready" } };
    },

    async completeAssetUpload(assetId) {
      const asset = db.prepare("SELECT * FROM design_assets WHERE id = ? AND status = 'ready'").get(String(assetId || ""));
      if (!asset) return { ok: false, status: 409, message: "素材尚未完成上传" };
      return { ok: true, asset: { assetId: asset.id, objectKey: asset.object_key, fileName: asset.file_name, mimeType: asset.mime_type, sizeBytes: asset.size_bytes, status: asset.status } };
    },

    async getAsset(assetId) {
      const asset = db.prepare("SELECT * FROM design_assets WHERE id = ? AND status = 'ready'").get(String(assetId || ""));
      if (!asset) return null;
      return { path: path.join(uploadsDir, asset.id), mimeType: asset.mime_type, fileName: asset.file_name, sizeBytes: asset.size_bytes };
    },

    async queueConfirmationEmail(payload = {}) {
      logger.info?.("[confirmation-email] queue request", {
        transport: emailTransport,
        hasRecipient: Boolean(confirmationEmailTo),
        hasHtml: Boolean(payload.html),
        htmlLength: String(payload.html || "").length,
        customerEmail: payload.customer?.email || "UNSET",
        embroideryImageCount: embroideryImageAttachments(payload.embroidery).length
      });
      if (!confirmationEmailTo) {
        logger.error?.("[confirmation-email] recipient missing", {
          transport: emailTransport,
          envName: "CONFIRMATION_EMAIL_TO"
        });
        return { ok: false, status: 500, message: "确认单收件邮箱未配置" };
      }
      if (!isValidEmail(confirmationEmailTo)) {
        logger.error?.("[confirmation-email] recipient invalid", {
          transport: emailTransport,
          to: confirmationEmailTo
        });
        return { ok: false, status: 400, message: "确认单收件邮箱格式不正确" };
      }
      const validCustomerEmail = payload.customer?.email && isValidEmail(payload.customer.email) ? payload.customer.email : "";
      const recipients = [confirmationEmailTo, ...(validCustomerEmail ? [validCustomerEmail] : [])];
      const customerName = String(payload.customer?.name || "customer").trim() || "customer";
      const productName = String(payload.product || "Skate CIM").trim() || "Skate CIM";
      const html = String(payload.html || "");
      if (!isConfirmationSheetPayload(payload, html)) {
        return { ok: false, status: 400, message: "确认单内容不完整" };
      }
      const confirmationLabel = payload.language === "en" ? "Confirmation Sheet" : "定制确认单";
      const id = `confirmation-${Date.now()}-${randomBytes(4).toString("hex")}`;
      const zipAttachment = confirmationZipAttachment(payload.confirmationZip);
      // 兼容旧客户端：新客户端发送 ZIP，旧客户端仍可发送三张独立效果图。
      const effectAttachments = zipAttachment ? [] : effectImageAttachments(
        payload.effectSnapshots,
        productName,
        customerName,
        payload.customer?.date
      );
      const confirmationAttachments = zipAttachment
        ? [zipAttachment]
        : [...effectAttachments, ...embroideryImageAttachments(payload.embroidery)];
      const message = {
        id,
        transport: "local-outbox",
        to: recipients,
        subject: `${productName} ${confirmationLabel} - ${customerName}`,
        createdAt: nowString(),
        customer: payload.customer || {},
        attachments: confirmationAttachments
      };
      if (emailTransport === "resend") {
        if (!resendApiKey || !resendFrom) {
          logger.error?.("[confirmation-email] Resend config missing", {
            hasResendApiKey: Boolean(resendApiKey),
            hasResendFrom: Boolean(resendFrom),
            to: confirmationEmailTo
          });
          return { ok: false, status: 500, message: "Resend 邮件配置缺失" };
        }
        const resendBody = {
          from: resendFrom,
          to: recipients,
          subject: message.subject,
          html,
          attachments: [
            ...confirmationAttachments.map((item) => ({ filename: item.filename, content: item.content }))
          ]
        };
        if (validCustomerEmail) resendBody.reply_to = [validCustomerEmail];
        logger.info?.("[confirmation-email] Resend request", {
          endpoint: RESEND_EMAIL_ENDPOINT,
          to: recipients,
          from: resendFrom,
          subject: message.subject,
          attachmentCount: resendBody.attachments.length,
          hasReplyTo: Boolean(validCustomerEmail)
        });
        const response = await fetchImpl(RESEND_EMAIL_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(resendBody)
        });
        const result = await response.json().catch(() => ({}));
        logger.info?.("[confirmation-email] Resend response", {
          status: response.status,
          ok: response.ok,
          providerId: result.id || "UNSET",
          providerMessage: result.message || result.error || ""
        });
        if (!response.ok) {
          logger.error?.("[confirmation-email] Resend send failed", {
            status: response.status,
            to: recipients,
            from: resendFrom,
            subject: message.subject,
            providerMessage: result.message || result.error || "Resend 发送失败"
          });
          return { ok: false, status: response.status, message: result.message || "Resend 发送失败" };
        }
        return { ok: true, id, providerId: result.id, transport: "resend", to: recipients.join(", ") };
      }
      await writeFile(path.join(outboxDir, `${id}.json`), JSON.stringify(message, null, 2));
      return { ok: true, id, transport: "local-outbox", to: recipients.join(", ") };
    },

    async readPublishedSnapshotFile() {
      const currentPath = path.join(dataDir, "releases", "published-config.json");
      return JSON.parse(await readFile(currentPath, "utf8"));
    }
  };
}
