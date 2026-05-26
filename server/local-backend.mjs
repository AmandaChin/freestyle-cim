import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  await mkdir(path.join(dataDir, "uploads"), { recursive: true });
  await mkdir(outboxDir, { recursive: true });

  const db = new DatabaseSync(path.join(dataDir, "skate-cim.db"));
  ensureSchema(db);
  seedAdmin(db);
  await seedDraftConfig(db);

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
      if (!html.includes("定制确认单")) {
        return { ok: false, status: 400, message: "确认单内容不完整" };
      }
      const id = `confirmation-${Date.now()}-${randomBytes(4).toString("hex")}`;
      const attachment = {
        filename: `${safeFileName(productName)}-${safeFileName(customerName)}-confirmation.html`,
        contentType: "text/html; charset=utf-8",
        content: html
      };
      const imageAttachments = embroideryImageAttachments(payload.embroidery);
      const message = {
        id,
        transport: "local-outbox",
        to: recipients,
        subject: `${productName} 定制确认单 - ${customerName}`,
        createdAt: nowString(),
        customer: payload.customer || {},
        attachments: [attachment, ...imageAttachments]
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
            { filename: attachment.filename, content: htmlToBase64(html) },
            ...imageAttachments.map((item) => ({ filename: item.filename, content: item.content }))
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
