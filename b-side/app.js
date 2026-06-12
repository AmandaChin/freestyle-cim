const STORAGE_KEY = "skate-cim-bside-host-state-v3";
const SHOE_SCHEMA = window.SKATE_CIM_SCHEMA;
const SCHEMA_UTILS = window.SKATE_CIM_SCHEMA_UTILS;
const API_BASE = "/api";

const icons = {
  shoes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15.5c2.2 0 3.8-.2 5.6-1.8l1.7-1.5 2.9 2.3c1.4 1.1 3.1 1.7 4.9 1.7H21v2.3H3z"></path><path d="M9 10.5l.6-3.5 3.3 1.3"></path></svg>',
  fabric: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12l2 4-8 12L4 8z"></path><path d="M8.5 8h7"></path><path d="M7.5 12h5"></path></svg>',
  release: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="M8 7l4-4 4 4"></path><path d="M4 21h16"></path></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16z"></path><path d="M13 7l4 4"></path></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"></path></svg>',
  archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M6 7v13h12V7"></path><path d="M9 11h6"></path></svg>',
  rollback: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H4v5"></path><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8"></path></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>'
};

const modules = {
  shoes: { title: "鞋款管理", eyebrow: "Shoe Drafts", icon: icons.shoes },
  fabrics: { title: "布料管理", eyebrow: "Fabric Library", icon: icons.fabric },
  release: { title: "发布管理", eyebrow: "Release Center", icon: icons.release }
};

const renderModes = {
  solid_mask: "固定色值蒙版",
  texture_tint: "纹理调色",
  image_tile: "图片平铺",
  fixed_style_set: "固定样式组"
};

const officialStyleSeeds = (SHOE_SCHEMA.materialTextures || [])
  .filter((texture) => texture.categoryId === SHOE_SCHEMA.materialCategories?.[0]?.id)
  .map((texture) => ({ id: texture.id, name: texture.name, file: texture.file }));

const shoeStatus = {
  draft: "草稿",
  testing: "测试中",
  published: "已发布",
  archived: "已归档"
};

const partGroups = ["upper", "strap", "hardware", "sole"];
const layerAssetFields = [
  { key: "maskFile", label: "蒙层", fileName: "mask.png" },
  { key: "topLineFile", label: "顶部走线", fileName: "top-line.png" },
  { key: "shadowFile", label: "阴影高亮", fileName: "shadow.png" }
];

function schemaLayerAssets(angle) {
  return Object.fromEntries((angle.layerPartKeys || []).map((partKey) => [partKey, emptyLayerAsset({ maskFile: `${angle.key}/${partKey}/mask.png` })]));
}

function schemaAngles() {
  return SCHEMA_UTILS.clone(SHOE_SCHEMA.angles).map((angle) => ({
    key: angle.key,
    name: angle.name,
    active: angle.active !== false,
    baseFile: angle.baseFile,
    stitchFile: angle.stitchFile,
    layerPartKeys: angle.layerPartKeys || [],
    layerAssets: schemaLayerAssets(angle)
  }));
}

function schemaParts() {
  return SCHEMA_UTILS.clone(SHOE_SCHEMA.parts).map((part) => ({
    key: part.key,
    name: part.name,
    group: part.group || "upper",
    selectable: part.selectable !== false,
    materialRule: part.materialRule || "",
    renderMode: part.renderMode,
    renderOrder: part.renderOrder,
    materialIds: part.materialIds || [],
    defaultStyle: part.defaultStyle || {},
    ...(part.fixedVariants ? { fixedVariants: part.fixedVariants.map((variant) => ({ ...variant })) } : {})
  }));
}

const CIM_SHARED_CONFIG = window.SKATE_CIM_CONFIG || {};

function normalizeLayerAssets(layerAssets = {}) {
  return Object.fromEntries(
    Object.entries(layerAssets).map(([partKey, assets]) => [
      partKey,
      emptyLayerAsset(assets)
    ])
  );
}

function normalizeAngles(angles, parts) {
  const sourceAngles = Array.isArray(angles) && angles.length ? angles : schemaAngles();
  return sourceAngles.map((angle) => {
    const layerAssets = normalizeLayerAssets(angle.layerAssets || schemaLayerAssets(angle));
    return {
      key: angle.key,
      name: angle.name,
      active: Boolean(angle.active),
      baseFile: angle.baseFile || `${angle.key}/base.png`,
      layerAssets
    };
  });
}

function countLayerAssets(angle) {
  return Object.values(angle.layerAssets || {}).reduce((sum, assets) => {
    return sum + (assets.maskFile || assets.topLineFile || assets.shadowFile ? 1 : 0);
  }, 0);
}

function ensureLayerAssetSlot(shoe, partKey) {
  shoe.angles.filter((angle) => angle.active).forEach((angle) => {
    if (!angle.layerAssets) angle.layerAssets = {};
    if (!angle.layerAssets[partKey]) {
      angle.layerAssets[partKey] = emptyLayerAsset();
    }
  });
}

function emptyLayerAsset(source = {}) {
  return {
    maskFile: source.maskFile || "",
    topLineFile: source.topLineFile || "",
    shadowFile: source.shadowFile || ""
  };
}

function normalizePart(part) {
  return {
    key: part.key,
    name: part.name,
    en: part.en || part.name,
    group: part.group || "upper",
    selectable: part.selectable !== false,
    renderMode: part.renderMode,
    renderOrder: part.renderOrder,
    materialIds: part.materialIds || [],
    defaultStyle: part.defaultStyle || {},
    ...(part.fixedVariants ? { fixedVariants: part.fixedVariants.map((variant) => ({ ...variant })) } : {}),
    ...(part.fixedStyleSet ? { fixedStyleSet: SCHEMA_UTILS.clone(part.fixedStyleSet) } : {}),
    ...(part.materialRule ? { materialRule: part.materialRule } : {})
  };
}

function normalizePartKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase();
}

function fileNameFromPath(value) {
  const segments = String(value || "").split("/").filter(Boolean);
  return segments.length ? segments[segments.length - 1] : "";
}

function buildLayerAssetPath(angleKey, partKey, fieldKey, fileName) {
  const field = layerAssetFields.find((item) => item.key === fieldKey);
  const safeName = String(fileName || field?.fileName || "asset.png").trim().replace(/\s+/g, "-");
  return `${angleKey}/${partKey}/${safeName || field?.fileName || "asset.png"}`;
}

function adminShoesFromSource(source) {
  const published = source.filter((item) => item.status === "published");
  return published.map((item) => ({
    id: item.id || `shoe-${item.shoeId}`,
    shoeId: item.shoeId,
    name: item.name,
    code: item.code,
    version: item.version || 1,
    status: item.status,
    defaultAngle: item.defaultAngleKey || "side",
    updatedAt: item.updatedAt || nowString(),
    parts: (item.parts?.length ? item.parts : schemaParts()).map(normalizePart),
    angles: normalizeAngles(item.angles?.length ? item.angles : schemaAngles(), item.parts?.length ? item.parts : schemaParts()),
    notes: item.notes || item.description || ""
  }));
}

function adminShoesFromShared() {
  return adminShoesFromSource(Array.isArray(CIM_SHARED_CONFIG.shoes) ? CIM_SHARED_CONFIG.shoes : []);
}

function adminFabricsFromSource(source) {
  return source.map((item) => ({
    id: item.id || `fabric-${item.materialKey}`,
    materialKey: item.materialKey,
    name: item.name,
    mode: item.mode,
    color: item.color || "",
    textureFile: item.textureFile || null,
    styles: Array.isArray(item.styles) ? item.styles.map((style) => ({ ...style })) : [],
    groups: item.groups || ["upper"],
    status: item.status || "draft",
    updatedAt: item.updatedAt || nowString()
  }));
}

function adminFabricsFromShared() {
  if (Array.isArray(SHOE_SCHEMA.materialCategories) && Array.isArray(SHOE_SCHEMA.materialTextures)) {
    return SHOE_SCHEMA.materialCategories.map((category) => ({
      id: `fabric-${category.id}`,
      materialKey: category.id,
      name: category.name,
      mode: "fixed_style_set",
      color: "",
      textureFile: null,
      styles: SHOE_SCHEMA.materialTextures
        .filter((texture) => texture.categoryId === category.id)
        .map((texture) => ({ id: texture.id, name: texture.name, file: texture.file })),
      groups: category.groups || ["upper"],
      status: "published",
      updatedAt: "2026-06-13 00:00"
    }));
  }
  return adminFabricsFromSource(Array.isArray(CIM_SHARED_CONFIG.fabrics) ? CIM_SHARED_CONFIG.fabrics : []);
}

function adminReleaseFromSource(release) {
  return {
    testing: release?.testing || null,
    online: release?.online || {
      version: "v1.0.0",
      publishedAt: nowString(),
      status: "正常"
    },
    history: release?.history || []
  };
}

function buildPublishedConfig() {
  return {
    schemaVersion: 1,
    generatedAt: nowString(),
    release: clone(state.release),
    shoes: state.shoes
      .filter((shoe) => shoe.status === "published")
      .map((shoe) => ({
        id: shoe.id,
        shoeId: shoe.shoeId,
        name: shoe.name,
        code: shoe.code,
        version: shoe.version,
        status: shoe.status,
        defaultAngleKey: shoe.defaultAngle,
        defaultPartKey: shoe.defaultPartKey || "G",
        updatedAt: shoe.updatedAt,
        description: shoe.description || shoe.notes || "",
        notes: shoe.notes || "",
        homeLabel: shoe.homeLabel || "专业支撑款",
        homeFeatures: shoe.homeFeatures || [shoe.code, "高帮支撑", "CIM 表格导出"],
        assets: SCHEMA_UTILS.clone(SHOE_SCHEMA.assets),
        palettes: SCHEMA_UTILS.clone(SHOE_SCHEMA.palettes),
        materials: SCHEMA_UTILS.clone(SHOE_SCHEMA.materials),
        materialCategories: SCHEMA_UTILS.clone(SHOE_SCHEMA.materialCategories),
        materialTextures: SCHEMA_UTILS.clone(SHOE_SCHEMA.materialTextures),
        materialAvailability: SCHEMA_UTILS.clone(SHOE_SCHEMA.materialAvailability),
        fixedStyleSets: SCHEMA_UTILS.clone(SHOE_SCHEMA.fixedStyleSets),
        fixedVariants: SCHEMA_UTILS.clone(SHOE_SCHEMA.fixedVariants),
        angles: shoe.angles.map((angle) => ({
          key: angle.key,
          name: angle.name,
          active: angle.active,
          baseFile: angle.baseFile,
          stitchFile: angle.stitchFile || `${angle.key}/stitch.png`,
          layerPartKeys: Object.keys(angle.layerAssets || {}),
          layerAssets: normalizeLayerAssets(angle.layerAssets || {})
        })),
        parts: shoe.parts.map(normalizePart)
      })),
    fabrics: state.fabrics.map((fabric) => ({
      id: fabric.id,
      materialKey: fabric.materialKey,
      name: fabric.name,
      mode: fabric.mode,
      ...(fabric.color ? { color: fabric.color } : {}),
      ...(fabric.textureFile ? { textureFile: fabric.textureFile } : {}),
      ...(fabric.mode === "fixed_style_set" && Array.isArray(fabric.styles) && fabric.styles.length
        ? { styles: fabric.styles.map((style) => ({ id: style.id, name: style.name, file: style.file })) }
        : {}),
      groups: fabric.groups,
      status: fabric.status,
      updatedAt: fabric.updatedAt
    }))
  };
}

function configSourceText(config = buildPublishedConfig()) {
  return `window.SKATE_CIM_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
}

function publishConfigToLocalPreview() {
  localStorage.setItem("SKATE_CIM_PUBLISHED_CONFIG", JSON.stringify(buildPublishedConfig()));
}

function downloadText(fileName, text) {
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportPublishedConfig() {
  const text = configSourceText();
  navigator.clipboard?.writeText(text).catch(() => {});
  downloadText("cim-config.js", text);
  toast("发布配置已导出，并已复制到剪贴板");
}

function adminReleaseFromShared() {
  return adminReleaseFromSource(CIM_SHARED_CONFIG.release || {});
}

const defaultState = {
  theme: "light",
  collapsed: false,
  activeModule: "shoes",
  filters: {
    shoeSearch: "",
    shoeStatus: "all",
    fabricSearch: "",
    fabricMode: "all"
  },
  shoes: adminShoesFromShared(),
  fabrics: adminFabricsFromShared(),
  release: adminReleaseFromShared()
};

const els = {
  shell: document.querySelector("#adminShell"),
  nav: document.querySelector("#adminNav"),
  moduleTitle: document.querySelector("#moduleTitle"),
  moduleEyebrow: document.querySelector("#moduleEyebrow"),
  collapseButton: document.querySelector("#collapseButton"),
  themeButton: document.querySelector("#themeButton"),
  themeText: document.querySelector("#themeText"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
  shoeSearch: document.querySelector("#shoeSearch"),
  shoeStatusFilter: document.querySelector("#shoeStatusFilter"),
  shoeMetrics: document.querySelector("#shoeMetrics"),
  shoeList: document.querySelector("#shoeList"),
  addShoeButton: document.querySelector("#addShoeButton"),
  fabricSearch: document.querySelector("#fabricSearch"),
  fabricModeFilter: document.querySelector("#fabricModeFilter"),
  fabricMetrics: document.querySelector("#fabricMetrics"),
  fabricList: document.querySelector("#fabricList"),
  addFabricButton: document.querySelector("#addFabricButton"),
  createTestButton: document.querySelector("#createTestButton"),
  stopTestButton: document.querySelector("#stopTestButton"),
  promoteButton: document.querySelector("#promoteButton"),
  exportConfigButton: document.querySelector("#exportConfigButton"),
  testSummary: document.querySelector("#testSummary"),
  onlineSummary: document.querySelector("#onlineSummary"),
  publishDiff: document.querySelector("#publishDiff"),
  releaseHistory: document.querySelector("#releaseHistory"),
  ratioSlider: document.querySelector("#ratioSlider"),
  ratioText: document.querySelector("#ratioText"),
  modalRoot: document.querySelector("#modalRoot"),
  toastStack: document.querySelector("#toastStack")
};

let state = loadState();
let currentAdmin = null;
let bootedFromApi = false;
let draftSaveTimer = 0;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.shoes && saved?.fabrics && saved?.release) {
      return mergeDefaults(saved);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return clone(defaultState);
}

function mergeDefaults(saved) {
  return {
    ...clone(defaultState),
    ...saved,
    filters: { ...clone(defaultState.filters), ...(saved.filters || {}) },
    release: { ...clone(defaultState.release), ...(saved.release || {}) }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (bootedFromApi) {
    window.clearTimeout(draftSaveTimer);
    draftSaveTimer = window.setTimeout(() => {
      saveDraftToServer().catch((error) => toast(error.message || "草稿保存失败"));
    }, 250);
  }
}

function sharedConfigFromState(source = state) {
  return {
    schemaVersion: CIM_SHARED_CONFIG.schemaVersion || 1,
    release: source.release,
    shoes: source.shoes,
    fabrics: source.fabrics
  };
}

function stateFromSharedConfig(config) {
  return mergeDefaults({
    ...clone(state),
    shoes: adminShoesFromSource(config.shoes || []),
    fabrics: adminFabricsFromSource(config.fabrics || []),
    release: adminReleaseFromSource(config.release || {})
  });
}

async function apiJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `请求失败：${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function saveDraftToServer() {
  await apiJson("/admin/config/draft", {
    method: "PUT",
    body: JSON.stringify(sharedConfigFromState())
  });
}

async function bootstrapFromServer() {
  try {
    const me = await apiJson("/admin/me");
    currentAdmin = me.admin;
    const config = await apiJson("/admin/config/draft");
    state = stateFromSharedConfig(config);
    bootedFromApi = true;
    persist();
    return true;
  } catch (error) {
    if (error.status === 401) return false;
    toast(error.message || "后台服务连接失败");
    return false;
  }
}

async function signIn(email, password) {
  const result = await apiJson("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  currentAdmin = result.admin;
  return bootstrapFromServer();
}

function renderLogin() {
  document.body.innerHTML = `
    <main class="login-screen">
      <form class="login-card" id="loginForm">
        <p class="admin-eyebrow">Admin Access</p>
        <h1>Skate CIM 配置后台</h1>
        <p>只有管理员白名单内账号可以进入并发布 C 端配置。</p>
        <label class="field">
          <span>管理员邮箱</span>
          <input class="input" id="loginEmail" type="email" autocomplete="username" required />
        </label>
        <label class="field">
          <span>密码</span>
          <input class="input" id="loginPassword" type="password" autocomplete="current-password" required />
        </label>
        <button class="primary-button" type="submit">登录后台</button>
        <div class="login-error" id="loginError" role="status"></div>
      </form>
    </main>`;
  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.querySelector("#loginError");
    error.textContent = "";
    try {
      const ok = await signIn(document.querySelector("#loginEmail").value, document.querySelector("#loginPassword").value);
      if (ok) window.location.reload();
    } catch (loginError) {
      error.textContent = loginError.message || "登录失败";
    }
  });
}

function resetDemo() {
  state = clone(defaultState);
  persist();
  render();
  toast("演示数据已重置");
}

function nowString() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value || "shoe")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function initials(text) {
  const source = String(text || "").trim();
  return source ? source.slice(0, 2).toUpperCase() : "CIM";
}

function gradientFor(text) {
  const seed = Array.from(String(text || "CIM")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const hue = seed % 360;
  return `linear-gradient(135deg, hsl(${hue} 72% 56%), hsl(${(hue + 38) % 360} 70% 46%))`;
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  els.themeText.textContent = state.theme === "dark" ? "深色" : "浅色";
}

function applyShell() {
  els.shell.classList.toggle("is-collapsed", state.collapsed);
}

function setModule(moduleKey) {
  state.activeModule = moduleKey;
  persist();
  render();
}

function renderNav() {
  els.nav.innerHTML = Object.entries(modules)
    .map(
      ([key, item]) => `
        <button class="nav-item" type="button" data-module="${key}" aria-current="${state.activeModule === key ? "page" : "false"}">
          ${item.icon}
          <span class="nav-label">${item.title}</span>
        </button>`
    )
    .join("");
  const current = modules[state.activeModule];
  els.moduleTitle.textContent = current.title;
  els.moduleEyebrow.textContent = current.eyebrow;
  document.querySelectorAll(".module-view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${state.activeModule}`);
  });
}

function countBy(list, key) {
  return list.reduce((map, item) => {
    map[item[key]] = (map[item[key]] || 0) + 1;
    return map;
  }, {});
}

function metricCard(label, value, hint = "") {
  return `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(value)}</div>
      <div class="field-hint">${escapeHtml(hint)}</div>
    </div>`;
}

function filteredShoes() {
  const keyword = state.filters.shoeSearch.trim().toLowerCase();
  return state.shoes.filter((item) => {
    const matchesStatus = state.filters.shoeStatus === "all" || item.status === state.filters.shoeStatus;
    const haystack = `${item.name} ${item.code} ${item.shoeId} ${item.parts.map((part) => part.key).join(" ")}`.toLowerCase();
    return matchesStatus && (!keyword || haystack.includes(keyword));
  });
}

function renderShoeMetrics() {
  const stats = countBy(state.shoes, "status");
  const angleCount = state.shoes.reduce((sum, item) => sum + item.angles.filter((angle) => angle.active).length, 0);
  const partCount = state.shoes.reduce((sum, item) => sum + item.parts.length, 0);
  const assetCount = state.shoes.reduce((sum, item) => sum + item.angles.reduce((angleSum, angle) => angleSum + countLayerAssets(angle), 0), 0);
  els.shoeMetrics.innerHTML = [
    metricCard("鞋款总数", state.shoes.length, "草稿和发布版本"),
    metricCard("已发布", stats.published || 0, "C 端可读取"),
    metricCard("角度视图", angleCount, "已启用角度"),
    metricCard("裁片素材", assetCount, `${partCount} 个裁片定义`)
  ].join("");
}

function statusBadge(status) {
  return `<span class="badge ${status}">${shoeStatus[status] || status}</span>`;
}

function shoeThumb(item) {
  if (item.coverData || item.coverImage) {
    return `<div class="thumb"><img src="${escapeHtml(item.coverData || item.coverImage)}" alt="${escapeHtml(item.name)}" /></div>`;
  }
  return `<div class="thumb" style="background:${gradientFor(item.name)};"><span>${escapeHtml(initials(item.name))}</span></div>`;
}

function renderShoes() {
  renderShoeMetrics();
  const list = filteredShoes();
  if (!list.length) {
    els.shoeList.innerHTML = '<div class="empty-state">没有匹配的鞋款</div>';
    return;
  }
  els.shoeList.innerHTML = `
    <div class="table-head shoe-grid">
      <div>鞋款</div>
      <div>状态</div>
      <div>版本</div>
      <div>素材完整度</div>
      <div style="text-align:right;">操作</div>
    </div>
    ${list
      .map((item) => {
        const activeAngles = item.angles.filter((angle) => angle.active);
        const layerCount = activeAngles.reduce((sum, angle) => sum + countLayerAssets(angle), 0);
        const completeness = `${activeAngles.length} 角度 / ${layerCount} 个裁片有素材`;
        return `
          <div class="entity-row shoe-grid" data-shoe-id="${escapeHtml(item.id)}">
            <div class="entity-main">
              ${shoeThumb(item)}
              <div>
                <div class="entity-title">${escapeHtml(item.name)}</div>
                <div class="entity-subtext">${escapeHtml(item.code)} · ${item.parts.length} 个裁片定义</div>
              </div>
            </div>
            <div>${statusBadge(item.status)}</div>
            <div>v${escapeHtml(item.version)}</div>
            <div>
              <div class="entity-title">${escapeHtml(completeness)}</div>
              <div class="entity-subtext">默认角度 ${escapeHtml(item.defaultAngle)}</div>
            </div>
            <div class="row-actions">
              <button class="row-button" type="button" data-action="edit">${icons.edit}<span>编辑</span></button>
              <button class="row-button" type="button" data-action="duplicate">${icons.copy}<span>复制</span></button>
              <button class="${item.status === "archived" ? "secondary-button" : "danger-button"}" type="button" data-action="${item.status === "archived" ? "restore" : "archive"}">${item.status === "archived" ? "恢复" : "归档"}</button>
            </div>
          </div>`;
      })
      .join("")}`;
}

function filteredFabrics() {
  const keyword = state.filters.fabricSearch.trim().toLowerCase();
  return state.fabrics.filter((item) => {
    const matchesMode = state.filters.fabricMode === "all" || item.mode === state.filters.fabricMode;
    const haystack = `${item.name} ${item.materialKey} ${item.textureFile?.name || ""}`.toLowerCase();
    return matchesMode && (!keyword || haystack.includes(keyword));
  });
}

function renderFabricMetrics() {
  const stats = countBy(state.fabrics, "mode");
  els.fabricMetrics.innerHTML = [
    metricCard("布料总数", state.fabrics.length, "独立 materialKey"),
    metricCard("solid_mask", stats.solid_mask || 0, "固定色值蒙版"),
    metricCard("texture_tint", stats.texture_tint || 0, "纹理与颜色混合"),
    metricCard("image_tile", stats.image_tile || 0, "异型图片平铺")
  ].join("");
}

function fabricPreview(item) {
  if (item.mode === "fixed_style_set" && item.styles?.[0]?.file) {
    return `<span class="fabric-preview" style="background:url('../assets/skates/yjs-pro-cim/materials/${escapeHtml(item.styles[0].file)}') center / cover no-repeat;"></span>`;
  }
  if (item.mode === "solid_mask") {
    return `<span class="fabric-preview" style="background:${escapeHtml(item.color || "#8f9298")};"></span>`;
  }
  if (item.mode === "texture_tint") {
    return `<span class="fabric-preview" style="background:repeating-linear-gradient(45deg, rgba(255,255,255,.28) 0 5px, rgba(0,0,0,.08) 5px 10px), ${escapeHtml(item.color || "#b8865e")};"></span>`;
  }
  return '<span class="fabric-preview" style="background:repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 8px, rgba(0,0,0,.16) 8px 16px), linear-gradient(135deg, #d97604, #7a4dd8);"></span>';
}

function renderFabrics() {
  renderFabricMetrics();
  const list = filteredFabrics();
  if (!list.length) {
    els.fabricList.innerHTML = '<div class="empty-state">没有匹配的布料</div>';
    return;
  }
  els.fabricList.innerHTML = `
    <div class="table-head fabric-grid">
      <div>布料</div>
      <div>渲染模式</div>
      <div>适用范围</div>
      <div>预览</div>
      <div style="text-align:right;">操作</div>
    </div>
    ${list
      .map(
        (item) => `
          <div class="entity-row fabric-grid" data-fabric-id="${escapeHtml(item.id)}">
            <div class="entity-main">
              ${fabricPreview(item)}
              <div>
                <div class="entity-title">${escapeHtml(item.name)}</div>
                <div class="entity-subtext">${escapeHtml(item.materialKey)} · ${escapeHtml(item.textureFile?.name || item.styles?.[0]?.file || item.color || "未上传贴图")}</div>
              </div>
            </div>
            <div><span class="badge ${item.mode}">${escapeHtml(item.mode)}</span></div>
            <div>${escapeHtml(item.groups.join(" / "))}</div>
            <div>${fabricPreview(item)}</div>
            <div class="row-actions">
              <button class="row-button" type="button" data-action="edit">${icons.edit}<span>编辑</span></button>
              <button class="danger-button" type="button" data-action="delete">删除</button>
            </div>
          </div>`
      )
      .join("")}`;
}

function summaryItem(label, value, meta = "") {
  return `
    <div class="summary-item">
      <span class="release-meta">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <span class="release-meta">${escapeHtml(meta)}</span>
    </div>`;
}

function renderRelease() {
  const testing = state.release.testing;
  els.testSummary.innerHTML = [
    summaryItem("版本号", testing?.version || "--", testing ? "测试进行中" : "暂无测试"),
    summaryItem("创建时间", testing?.createdAt || "--"),
    summaryItem("灰度比例", `${testing?.ratio ?? 0}%`)
  ].join("");
  els.onlineSummary.innerHTML = [
    summaryItem("版本号", state.release.online.version),
    summaryItem("发布时间", state.release.online.publishedAt),
    summaryItem("状态", state.release.online.status)
  ].join("");
  els.ratioSlider.value = testing?.ratio ?? 0;
  els.ratioText.textContent = `${els.ratioSlider.value}%`;
  els.stopTestButton.disabled = !testing;
  els.promoteButton.disabled = !testing;
  renderDiff();
  renderHistory();
}

function renderDiff() {
  const testing = state.release.testing;
  const items = testing
    ? [
        ["鞋款草稿", `${state.shoes.filter((item) => item.status !== "archived").length} 个可用鞋款`],
        ["布料库", `${state.fabrics.length} 个 materialKey`],
        ["素材校验", `${state.shoes.reduce((sum, item) => sum + item.angles.filter((angle) => angle.active).length, 0)} 个角度视图`],
        ["说明", testing.notes || "未填写"]
      ]
    : [["待生成", "当前没有测试版本"]];
  els.publishDiff.innerHTML = items
    .map(([title, text]) => `<div class="diff-item"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`)
    .join("");
}

function renderHistory() {
  els.releaseHistory.innerHTML = state.release.history
    .map(
      (item) => `
        <div class="history-item" data-version="${escapeHtml(item.version)}">
          <div>
            <strong>${escapeHtml(item.version)}</strong>
            <div class="release-meta">${escapeHtml(item.publishedAt)} · ${escapeHtml(item.operator || "System")}</div>
          </div>
          <button class="secondary-button" type="button" data-action="rollback">${icons.rollback}<span>回滚</span></button>
        </div>`
    )
    .join("");
}

function modal({ title, body, submitText = "保存", wide = false, onOpen, onSubmit }) {
  els.modalRoot.innerHTML = `
    <div class="modal-backdrop" data-close-modal></div>
    <section class="modal-panel ${wide ? "is-wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <header class="modal-header">
        <div class="modal-title" id="modalTitle">${escapeHtml(title)}</div>
        <button class="icon-button" type="button" data-close-modal title="关闭">${icons.close}</button>
      </header>
      <form class="modal-body" id="modalForm">${body}</form>
      <footer class="modal-actions">
        <button class="secondary-button" type="button" data-close-modal>取消</button>
        <button class="primary-button" type="submit" form="modalForm">${escapeHtml(submitText)}</button>
      </footer>
    </section>`;
  els.modalRoot.classList.add("is-open");
  document.body.classList.add("is-modal-open");
  const form = els.modalRoot.querySelector("#modalForm");
  const close = closeModal;
  els.modalRoot.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", close));
  if (onOpen) onOpen(form);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (onSubmit) onSubmit(form, close);
  });
}

function confirmModal({ title = "确认操作", message, confirmText = "确认", tone = "danger", onConfirm }) {
  modal({
    title,
    submitText: confirmText,
    body: `<div class="confirm-message">${message}</div>`,
    async onSubmit(_form, close) {
      await onConfirm();
      close();
    }
  });
  const submit = els.modalRoot.querySelector(".primary-button");
  if (tone === "danger") {
    submit.className = "danger-button";
  }
}

function closeModal() {
  els.modalRoot.classList.remove("is-open");
  document.body.classList.remove("is-modal-open");
  els.modalRoot.innerHTML = "";
}

function bindUpload(zone, input, onFile, { readAsDataUrl = false } = {}) {
  const handle = (file) => {
    if (!file) return;
    if (!readAsDataUrl) {
      onFile(file, null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFile(file, reader.result);
    reader.readAsDataURL(file);
  };
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("is-dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("is-dragover");
    handle(event.dataTransfer.files[0]);
  });
  input.addEventListener("change", () => handle(input.files[0]));
}

function openShoeModal(item = null) {
  const draft = clone(
    item || {
      id: `shoe-${Date.now()}`,
      shoeId: "",
      name: "",
      code: "",
      version: 1,
      status: "draft",
      defaultAngle: "side",
      coverData: null,
      updatedAt: nowString(),
      parts: schemaParts(),
      angles: normalizeAngles(schemaAngles(), schemaParts()),
      notes: ""
    }
  );
  modal({
    title: item ? "编辑鞋款草稿" : "新增鞋款草稿",
    submitText: item ? "保存草稿" : "创建草稿",
    wide: true,
    body: shoeFormHtml(draft),
    onOpen(form) {
      hydrateShoeForm(form, draft);
    },
    onSubmit(form, close) {
      const name = form.querySelector("#shoeName").value.trim();
      if (!name) return;
      draft.name = name;
      draft.code = form.querySelector("#shoeCode").value.trim() || name.toUpperCase().slice(0, 8);
      draft.shoeId = form.querySelector("#shoeId").value.trim() || slugify(name);
      draft.version = Number(form.querySelector("#shoeVersion").value || 1);
      draft.status = form.querySelector("#shoeStatus").value;
      draft.defaultAngle = form.querySelector("#shoeDefaultAngle").value;
      draft.notes = form.querySelector("#shoeNotes").value.trim();
      draft.updatedAt = nowString();
      draft.angles = draft.angles.map((angle) => ({
        ...angle,
        active: form.querySelector(`[data-angle-active="${angle.key}"]`)?.checked || false,
        baseFile: form.querySelector(`[data-angle-base="${angle.key}"]`)?.value.trim() || `${angle.key}/base.png`
      }));
      syncDraftPartsFromForm(form, draft);
      draft.parts.forEach((part) => ensureLayerAssetSlot(draft, part.key));

      if (item) {
        Object.assign(item, draft);
      } else {
        state.shoes.unshift(draft);
      }
      persist();
      renderShoes();
      close();
      toast(item ? "鞋款草稿已更新" : "鞋款草稿已创建");
    }
  });
}

function shoeFormHtml(item) {
  return `
    <div class="form-grid">
      <div class="inline-grid">
        <label class="field">
          <span>鞋款名称</span>
          <input class="input" id="shoeName" value="${escapeHtml(item.name)}" placeholder="YJS-pro CIM" required />
        </label>
        <label class="field">
          <span>业务 code</span>
          <input class="input" id="shoeCode" value="${escapeHtml(item.code)}" placeholder="YJS-PRO" />
        </label>
      </div>
      <div class="inline-grid">
        <label class="field">
          <span>shoeId</span>
          <input class="input" id="shoeId" value="${escapeHtml(item.shoeId)}" placeholder="yjs-pro-cim-upper" />
        </label>
        <label class="field">
          <span>版本号</span>
          <input class="input" id="shoeVersion" type="number" min="1" value="${escapeHtml(item.version)}" />
        </label>
      </div>
      <div class="inline-grid">
        <label class="field">
          <span>状态</span>
          <select class="select" id="shoeStatus">
            ${Object.entries(shoeStatus).map(([key, label]) => `<option value="${key}" ${item.status === key ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>默认角度</span>
          <select class="select" id="shoeDefaultAngle">
            ${item.angles.map((angle) => `<option value="${angle.key}" ${item.defaultAngle === angle.key ? "selected" : ""}>${angle.name}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="field">
        <span>封面图</span>
        <div class="cover-row">
          <div class="upload-zone" id="shoeCoverZone">
            <input id="shoeCoverInput" type="file" accept="image/*" hidden />
            <div class="upload-title">上传封面</div>
            <div class="upload-meta" id="shoeCoverMeta">${item.coverData || item.coverImage ? "已有封面图" : "点击选择或拖拽图片"}</div>
          </div>
          <div class="cover-preview" id="shoeCoverPreview"></div>
        </div>
      </div>
      <div class="field">
        <span>角度视图</span>
        <div class="angle-grid">
          ${item.angles.map((angle) => `
            <label class="angle-row" data-angle-row="${escapeHtml(angle.key)}">
              <input type="checkbox" data-angle-active="${angle.key}" ${angle.active ? "checked" : ""} />
              <strong>${escapeHtml(angle.name)}</strong>
              <input class="input" data-angle-base="${angle.key}" value="${escapeHtml(angle.baseFile)}" aria-label="${escapeHtml(angle.name)}base 图路径" />
              <span class="field-hint" data-angle-asset-count="${escapeHtml(angle.key)}">${countLayerAssets(angle)} 个裁片有素材</span>
            </label>`).join("")}
        </div>
      </div>
      <div class="field">
        <span>裁片定义</span>
        <div class="add-part-grid">
          <input class="input" id="newPartKey" placeholder="裁片 key，如 D1" />
          <input class="input" id="newPartName" placeholder="裁片名称，如侧翼片" />
          <select class="select" id="newPartGroup">
            ${partGroups.map((group) => `<option value="${group}">${group} · ${groupLabel(group)}</option>`).join("")}
          </select>
          <button class="secondary-button" id="addPartButton" type="button">新增裁片</button>
        </div>
        <div class="part-grid" id="partDefinitionList"></div>
      </div>
      <div class="field">
        <span>角度裁片素材</span>
        <div class="field-hint">按角度分别维护裁片的蒙层、顶部走线、阴影高亮图，上传后会写入当前鞋款素材清单。</div>
        <div class="layer-editor" id="angleLayerEditor"></div>
      </div>
      <label class="field">
        <span>备注</span>
        <textarea class="textarea" id="shoeNotes" placeholder="素材差异、校验备注、发布说明">${escapeHtml(item.notes || "")}</textarea>
      </label>
    </div>`;
}

function hydrateShoeForm(form, draft) {
  const preview = form.querySelector("#shoeCoverPreview");
  const coverMeta = form.querySelector("#shoeCoverMeta");
  const renderCover = () => {
    if (draft.coverData || draft.coverImage) {
      preview.innerHTML = `<img src="${escapeHtml(draft.coverData || draft.coverImage)}" alt="封面预览" />`;
      return;
    }
    preview.innerHTML = `<div class="thumb" style="width:100%;height:100%;background:${gradientFor(draft.name || "CIM")};"><span>${escapeHtml(initials(draft.name))}</span></div>`;
  };
  bindUpload(
    form.querySelector("#shoeCoverZone"),
    form.querySelector("#shoeCoverInput"),
    (file, dataUrl) => {
      draft.coverData = dataUrl;
      draft.coverImage = "";
      coverMeta.textContent = file.name;
      renderCover();
    },
    { readAsDataUrl: true }
  );
  form.querySelector("#shoeName").addEventListener("input", (event) => {
    draft.name = event.target.value;
    renderCover();
  });
  form.querySelector("#addPartButton").addEventListener("click", () => addPartFromForm(form, draft));
  renderPartDefinitionList(form, draft);
  renderAngleLayerEditor(form, draft);
  renderCover();
}

function syncDraftPartsFromForm(form, draft) {
  const rows = [...form.querySelectorAll("[data-part-row]")];
  if (!rows.length) return;

  const seenKeys = new Set();
  const nextParts = [];
  const keyPairs = [];
  rows.forEach((row) => {
    const originalKey = row.dataset.partKey;
    const key = normalizePartKey(row.querySelector("[data-part-key-input]")?.value || originalKey);
    if (!key || seenKeys.has(key)) return;
    seenKeys.add(key);
    nextParts.push({
      key,
      name: row.querySelector("[data-part-name-input]")?.value.trim() || key,
      group: row.querySelector("[data-part-group-select]")?.value || "upper",
      selectable: row.querySelector("[data-part-selectable]")?.checked !== false,
      materialRule: row.querySelector("[data-part-rule-input]")?.value.trim() || ""
    });
    keyPairs.push([originalKey, key]);
  });
  if (!nextParts.length) return;

  draft.parts = nextParts;
  draft.angles.forEach((angle) => {
    const previousAssets = angle.layerAssets || {};
    const renamedAssets = new Map(
      keyPairs
        .filter(([originalKey, key]) => originalKey !== key && previousAssets[originalKey])
        .map(([originalKey, key]) => [key, previousAssets[originalKey]])
    );
    angle.layerAssets = Object.fromEntries(
      Object.keys(previousAssets).map((assetKey) => {
        if (nextParts.some((part) => part.key === assetKey)) return [assetKey, emptyLayerAsset(previousAssets[assetKey] || {})];
        const renamedEntry = [...renamedAssets.entries()].find(([, assets]) => assets === previousAssets[assetKey]);
        if (renamedEntry) return [renamedEntry[0], emptyLayerAsset(renamedEntry[1])];
        return [assetKey, emptyLayerAsset(previousAssets[assetKey] || {})];
      })
    );
  });
}

function renderPartDefinitionList(form, draft) {
  const target = form.querySelector("#partDefinitionList");
  if (!target) return;
  if (!draft.parts.length) {
    target.innerHTML = '<div class="empty-state compact">暂无裁片定义</div>';
    return;
  }

  target.innerHTML = draft.parts
    .map(
      (part) => `
        <div class="part-row part-definition-row" data-part-row data-part-key="${escapeHtml(part.key)}">
          <input type="checkbox" data-part-selectable aria-label="${escapeHtml(part.name)}是否可选" ${part.selectable !== false ? "checked" : ""} />
          <input class="input part-key-input" data-part-key-input value="${escapeHtml(part.key)}" aria-label="裁片 key" readonly />
          <input class="input" data-part-name-input value="${escapeHtml(part.name)}" aria-label="裁片名称" />
          <select class="select" data-part-group-select aria-label="裁片分组">
            ${partGroups.map((group) => `<option value="${group}" ${part.group === group ? "selected" : ""}>${group} · ${groupLabel(group)}</option>`).join("")}
          </select>
          <input class="input" data-part-rule-input value="${escapeHtml(part.materialRule || "")}" placeholder="材质规则" aria-label="材质规则" />
          <button class="danger-button part-remove-button" type="button" data-part-remove="${escapeHtml(part.key)}">删除</button>
        </div>`
    )
    .join("");

  target.querySelectorAll("[data-part-name-input], [data-part-rule-input]").forEach((input) => {
    input.addEventListener("input", () => {
      syncDraftPartsFromForm(form, draft);
      renderAngleLayerEditor(form, draft);
    });
  });
  target.querySelectorAll("[data-part-group-select], [data-part-selectable]").forEach((input) => {
    input.addEventListener("change", () => {
      syncDraftPartsFromForm(form, draft);
      renderAngleLayerEditor(form, draft);
    });
  });
  target.querySelectorAll("[data-part-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      syncDraftPartsFromForm(form, draft);
      const partKey = button.dataset.partRemove;
      if (draft.parts.length <= 1) {
        toast("至少保留一个裁片");
        return;
      }
      draft.parts = draft.parts.filter((part) => part.key !== partKey);
      draft.angles.forEach((angle) => {
        if (angle.layerAssets) delete angle.layerAssets[partKey];
      });
      renderPartDefinitionList(form, draft);
      renderAngleLayerEditor(form, draft);
      updateAngleAssetHints(form, draft);
      toast("裁片已删除");
    });
  });
}

function addPartFromForm(form, draft) {
  syncDraftPartsFromForm(form, draft);
  const keyInput = form.querySelector("#newPartKey");
  const nameInput = form.querySelector("#newPartName");
  const groupInput = form.querySelector("#newPartGroup");
  const key = normalizePartKey(keyInput.value);
  const name = nameInput.value.trim();

  if (!key || !name) {
    toast("请填写裁片 key 和名称");
    return;
  }
  if (draft.parts.some((part) => part.key === key)) {
    toast(`裁片 ${key} 已存在`);
    return;
  }

  draft.parts.push({
    key,
    name,
    group: groupInput.value || "upper",
    selectable: true
  });
  ensureLayerAssetSlot(draft, key);
  keyInput.value = "";
  nameInput.value = "";
  renderPartDefinitionList(form, draft);
  renderAngleLayerEditor(form, draft);
  updateAngleAssetHints(form, draft);
  keyInput.focus();
  toast("裁片已新增");
}

function renderAngleLayerEditor(form, draft) {
  const target = form.querySelector("#angleLayerEditor");
  if (!target) return;
  if (!draft.angles.length) {
    target.innerHTML = '<div class="empty-state compact">暂无角度视图</div>';
    return;
  }

  target.innerHTML = draft.angles
    .map(
      (angle) => `
        <section class="angle-layer-card" data-angle-layer-card="${escapeHtml(angle.key)}">
          <div class="card-title-row">
            <div class="layer-card-title">
              <strong>${escapeHtml(angle.name)}</strong>
              <span>${escapeHtml(angle.baseFile)} · ${countLayerAssets(angle)} 个裁片有素材</span>
            </div>
            <span class="badge ${angle.active ? "published" : "archived"}">${angle.active ? "启用" : "未启用"}</span>
          </div>
          <div class="layer-table">
            <div class="layer-row layer-head">
              <div>裁片</div>
              ${layerAssetFields.map((field) => `<div>${escapeHtml(field.label)}</div>`).join("")}
            </div>
            ${draft.parts.filter((part) => angle.layerAssets?.[part.key]).map((part) => renderLayerAssetRow(angle, part)).join("")}
          </div>
        </section>`
    )
    .join("");

  target.querySelectorAll("[data-layer-upload]").forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const angle = draft.angles.find((item) => item.key === input.dataset.angleKey);
      if (!angle) return;
      const partKey = input.dataset.partKey;
      const fieldKey = input.dataset.assetField;
      if (!angle.layerAssets) angle.layerAssets = {};
      if (!angle.layerAssets[partKey]) angle.layerAssets[partKey] = emptyLayerAsset();
      angle.layerAssets[partKey][fieldKey] = buildLayerAssetPath(angle.key, partKey, fieldKey, file.name);
      renderAngleLayerEditor(form, draft);
      updateAngleAssetHints(form, draft);
      toast("裁片素材已记录");
    });
  });

  target.querySelectorAll("[data-layer-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      const angle = draft.angles.find((item) => item.key === button.dataset.angleKey);
      if (!angle?.layerAssets?.[button.dataset.partKey]) return;
      angle.layerAssets[button.dataset.partKey][button.dataset.assetField] = "";
      renderAngleLayerEditor(form, draft);
      updateAngleAssetHints(form, draft);
      toast("裁片素材已清除");
    });
  });
}

function renderLayerAssetRow(angle, part) {
  return `
    <div class="layer-row ${part.selectable === false ? "is-muted" : ""}" data-layer-row>
      <div class="layer-part-cell">
        <strong>${escapeHtml(part.key)}</strong>
        <span>${escapeHtml(part.name)} · ${escapeHtml(groupLabel(part.group))}</span>
      </div>
      ${layerAssetFields.map((field) => renderLayerAssetCell(angle, part, field)).join("")}
    </div>`;
}

function renderLayerAssetCell(angle, part, field) {
  const value = angle.layerAssets?.[part.key]?.[field.key] || "";
  return `
    <div class="layer-upload-cell ${value ? "has-file" : ""}">
      <label class="mini-upload" title="上传${escapeHtml(part.key)} ${escapeHtml(field.label)}">
        <input type="file" accept="image/*" hidden data-layer-upload data-angle-key="${escapeHtml(angle.key)}" data-part-key="${escapeHtml(part.key)}" data-asset-field="${escapeHtml(field.key)}" />
        <span class="mini-upload-title">${escapeHtml(field.label)}</span>
        <span class="mini-upload-meta">${escapeHtml(value ? fileNameFromPath(value) : "上传图片")}</span>
      </label>
      ${value ? `<button class="row-button layer-clear-button" type="button" data-layer-clear data-angle-key="${escapeHtml(angle.key)}" data-part-key="${escapeHtml(part.key)}" data-asset-field="${escapeHtml(field.key)}">清除</button>` : ""}
    </div>`;
}

function updateAngleAssetHints(form, draft) {
  draft.angles.forEach((angle) => {
    const hint = form.querySelector(`[data-angle-asset-count="${angle.key}"]`);
    if (hint) hint.textContent = `${countLayerAssets(angle)} 个裁片有素材`;
  });
}

function openFabricModal(item = null) {
  const draft = clone(
    item || {
      id: `fabric-${Date.now()}`,
      materialKey: "",
      name: "",
      mode: "solid_mask",
      color: "#f6f3ec",
      textureFile: null,
      styles: [],
      groups: ["upper"],
      status: "draft",
      updatedAt: nowString()
    }
  );
  modal({
    title: item ? "编辑布料" : "新增布料",
    submitText: "保存布料",
    body: fabricFormHtml(draft),
    onOpen(form) {
      hydrateFabricForm(form, draft);
    },
    onSubmit(form, close) {
      const name = form.querySelector("#fabricName").value.trim();
      if (!name) return;
      draft.name = name;
      draft.materialKey = form.querySelector("#materialKey").value.trim() || slugify(name);
      draft.mode = form.querySelector("#fabricMode").value;
      draft.color = form.querySelector(`[data-color-for="${draft.mode}"]`)?.value || draft.color;
      draft.styles = draft.mode === "fixed_style_set" ? collectFabricStyles(form) : [];
      draft.groups = [...form.querySelectorAll("[data-fabric-group]:checked")].map((checkbox) => checkbox.value);
      draft.status = form.querySelector("#fabricStatus").value;
      draft.updatedAt = nowString();
      if (item) {
        Object.assign(item, draft);
      } else {
        state.fabrics.unshift(draft);
      }
      persist();
      renderFabrics();
      close();
      toast(item ? "布料已更新" : "布料已新增");
    }
  });
}

function fabricFormHtml(item) {
  return `
    <div class="form-grid">
      <label class="field">
        <span>布料名称</span>
        <input class="input" id="fabricName" value="${escapeHtml(item.name)}" placeholder="樱花粉珍珠皮" required />
      </label>
      <label class="field">
        <span>materialKey</span>
        <input class="input" id="materialKey" value="${escapeHtml(item.materialKey)}" placeholder="leather_pearl_pink" />
      </label>
      <div class="inline-grid">
        <label class="field">
          <span>渲染模式</span>
          <select class="select" id="fabricMode">
            ${Object.entries(renderModes).map(([key, label]) => `<option value="${key}" ${item.mode === key ? "selected" : ""}>${key} · ${label}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>状态</span>
          <select class="select" id="fabricStatus">
            ${["draft", "published", "archived"].map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${shoeStatus[status]}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="mode-panel" data-mode-panel="solid_mask">
        <label class="field">
          <span>固定色值</span>
          <input class="color-input" data-color-for="solid_mask" type="color" value="${escapeHtml(item.mode === "solid_mask" ? item.color : "#f6f3ec")}" />
        </label>
      </div>
      <div class="mode-panel" data-mode-panel="texture_tint">
        <div class="inline-grid">
          <label class="field">
            <span>叠加色值</span>
            <input class="color-input" data-color-for="texture_tint" type="color" value="${escapeHtml(item.mode === "texture_tint" ? item.color : "#f0b7c8")}" />
          </label>
          <div class="field">
            <span>纹理图</span>
            <div class="upload-zone" id="tintUploadZone">
              <input id="tintUploadInput" type="file" accept="image/*" hidden />
              <div class="upload-title">上传纹理</div>
              <div class="upload-meta" id="tintUploadMeta">${escapeHtml(item.mode === "texture_tint" && item.textureFile ? `${item.textureFile.name} · ${item.textureFile.size}` : "点击选择或拖拽图片")}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="mode-panel" data-mode-panel="image_tile">
        <div class="field">
          <span>平铺图</span>
          <div class="upload-zone" id="tileUploadZone">
            <input id="tileUploadInput" type="file" accept="image/*" hidden />
            <div class="upload-title">上传平铺图片</div>
            <div class="upload-meta" id="tileUploadMeta">${escapeHtml(item.mode === "image_tile" && item.textureFile ? `${item.textureFile.name} · ${item.textureFile.size}` : "点击选择或拖拽图片")}</div>
          </div>
        </div>
      </div>
      <div class="mode-panel" data-mode-panel="fixed_style_set">
        <div class="field">
          <span>固定样式</span>
          <div class="field-hint">用于草席等完整固定贴图：C 端会读取 styles 并展开为子样式。</div>
          <div class="fabric-style-list" id="fabricStyleList">
            ${fabricStylesForForm(item).map((style) => fabricStyleRow(style)).join("")}
          </div>
          <button class="secondary-button" id="addFabricStyleButton" type="button">新增样式</button>
        </div>
      </div>
      <div class="field">
        <span>适用范围</span>
        <div class="part-grid">
          ${["upper", "strap", "hardware", "sole"].map((group) => `
            <label class="part-row">
              <input type="checkbox" data-fabric-group value="${group}" ${item.groups.includes(group) ? "checked" : ""} />
              <strong>${group}</strong>
              <span>${groupLabel(group)}</span>
              <span class="field-hint">compatibleGroups</span>
            </label>`).join("")}
        </div>
      </div>
    </div>`;
}

function fabricStylesForForm(item) {
  if (item.styles?.length) return item.styles;
  if (item.materialKey === "fixed_straw" || item.mode === "fixed_style_set") return fixedStrawStyleSeeds;
  return [];
}

function fabricStyleRow(style = {}) {
  return `
    <div class="fabric-style-row" data-fabric-style-row>
      <input class="input" data-style-id value="${escapeHtml(style.id || "")}" placeholder="style id" />
      <input class="input" data-style-name value="${escapeHtml(style.name || "")}" placeholder="样式名称" />
      <input class="input" data-style-file value="${escapeHtml(style.file || "")}" placeholder="贴图路径，如 草席/1336.webp" />
      <button class="danger-button" type="button" data-style-remove>删除</button>
    </div>`;
}

function collectFabricStyles(form) {
  return [...form.querySelectorAll("[data-fabric-style-row]")]
    .map((row) => ({
      id: row.querySelector("[data-style-id]")?.value.trim() || "",
      name: row.querySelector("[data-style-name]")?.value.trim() || "",
      file: row.querySelector("[data-style-file]")?.value.trim() || ""
    }))
    .filter((style) => style.id && style.name && style.file);
}

function hydrateFabricForm(form, draft) {
  const modeSelect = form.querySelector("#fabricMode");
  const styleList = form.querySelector("#fabricStyleList");
  const syncPanels = () => {
    form.querySelectorAll("[data-mode-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.modePanel === modeSelect.value);
    });
    if (modeSelect.value === "fixed_style_set" && styleList && !styleList.querySelector("[data-fabric-style-row]")) {
      styleList.innerHTML = officialStyleSeeds.map((style) => fabricStyleRow(style)).join("");
    }
  };
  bindUpload(form.querySelector("#tintUploadZone"), form.querySelector("#tintUploadInput"), (file) => {
    draft.textureFile = { name: file.name, size: formatBytes(file.size) };
    form.querySelector("#tintUploadMeta").textContent = `${draft.textureFile.name} · ${draft.textureFile.size}`;
  });
  bindUpload(form.querySelector("#tileUploadZone"), form.querySelector("#tileUploadInput"), (file) => {
    draft.textureFile = { name: file.name, size: formatBytes(file.size) };
    form.querySelector("#tileUploadMeta").textContent = `${draft.textureFile.name} · ${draft.textureFile.size}`;
  });
  form.querySelector("#addFabricStyleButton")?.addEventListener("click", () => {
    styleList.insertAdjacentHTML("beforeend", fabricStyleRow());
  });
  styleList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-style-remove]");
    if (!button) return;
    button.closest("[data-fabric-style-row]")?.remove();
  });
  modeSelect.addEventListener("change", syncPanels);
  syncPanels();
}

function groupLabel(group) {
  return {
    upper: "鞋面/裁片",
    strap: "织带",
    hardware: "五金件",
    sole: "鞋底"
  }[group] || group;
}

function duplicateShoe(item) {
  const copy = clone(item);
  copy.id = `shoe-${Date.now()}`;
  copy.name = `${item.name} 副本`;
  copy.shoeId = `${item.shoeId}-copy`;
  copy.status = "draft";
  copy.version = Number(item.version || 1) + 1;
  copy.updatedAt = nowString();
  state.shoes.unshift(copy);
  persist();
  renderShoes();
  toast("已复制为新草稿");
}

function archiveShoe(item) {
  const nextStatus = item.status === "archived" ? "draft" : "archived";
  const message = nextStatus === "archived" ? `确认归档「${escapeHtml(item.name)}」？` : `确认恢复「${escapeHtml(item.name)}」为草稿？`;
  confirmModal({
    title: nextStatus === "archived" ? "归档鞋款" : "恢复鞋款",
    message,
    confirmText: nextStatus === "archived" ? "确认归档" : "确认恢复",
    onConfirm() {
      item.status = nextStatus;
      item.updatedAt = nowString();
      persist();
      renderShoes();
      toast(nextStatus === "archived" ? "鞋款已归档" : "鞋款已恢复");
    }
  });
}

function deleteFabric(item) {
  const inUse = state.shoes.some((shoe) => shoe.parts.some((part) => item.groups.includes(part.group)));
  const hint = inUse ? "该布料适用范围仍被鞋款引用，当前操作会转为归档。" : "删除后不会出现在布料库。";
  confirmModal({
    title: inUse ? "归档布料" : "删除布料",
    message: `确认处理「${escapeHtml(item.name)}」？${hint}`,
    confirmText: inUse ? "确认归档" : "确认删除",
    onConfirm() {
      if (inUse) {
        item.status = "archived";
      } else {
        state.fabrics = state.fabrics.filter((entry) => entry.id !== item.id);
      }
      persist();
      renderFabrics();
      toast(inUse ? "布料已归档" : "布料已删除");
    }
  });
}

function openTestModal() {
  modal({
    title: "生成测试版本",
    submitText: "生成测试版本",
    body: `
      <div class="form-grid">
        <label class="field">
          <span>版本号</span>
          <input class="input" id="testVersion" value="${escapeHtml(nextRcVersion())}" required />
        </label>
        <label class="field">
          <span>更新说明</span>
          <textarea class="textarea" id="testNotes" placeholder="输入本次测试范围"></textarea>
        </label>
      </div>`,
    onSubmit(form, close) {
      const version = form.querySelector("#testVersion").value.trim();
      if (!version) return;
      state.release.testing = {
        version,
        createdAt: nowString(),
        ratio: Number(els.ratioSlider.value || 0),
        notes: form.querySelector("#testNotes").value.trim()
      };
      state.shoes.forEach((shoe) => {
        if (shoe.status === "draft") shoe.status = "testing";
      });
      persist();
      render();
      close();
      toast("测试版本已生成");
    }
  });
}

function nextRcVersion() {
  const current = state.release.testing?.version || state.release.online.version || "v1.0.0";
  const rcMatch = current.match(/-rc(\d+)/);
  if (rcMatch) return current.replace(/-rc\d+/, `-rc${Number(rcMatch[1]) + 1}`);
  return `${current}-rc1`;
}

function stopTest() {
  if (!state.release.testing) return;
  confirmModal({
    title: "终止测试",
    message: `确认终止 ${escapeHtml(state.release.testing.version)}？`,
    confirmText: "确认终止",
    onConfirm() {
      state.release.testing = null;
      state.shoes.forEach((shoe) => {
        if (shoe.status === "testing") shoe.status = "draft";
      });
      persist();
      render();
      toast("测试已终止");
    }
  });
}

function promoteRelease() {
  if (!state.release.testing) return;
  confirmModal({
    title: "发布正式版本",
    message: `确认将 ${escapeHtml(state.release.testing.version)} 切换为正式 Published 指针？`,
    confirmText: "确认发布",
    tone: "primary",
    async onConfirm() {
      const publishNote = state.release.testing?.notes || "B 端正式发布";
      if (bootedFromApi) await saveDraftToServer();
      state.release.history.unshift({
        version: state.release.online.version,
        publishedAt: state.release.online.publishedAt,
        operator: currentAdmin?.email || "Admin"
      });
      state.release.history = state.release.history.slice(0, 6);
      state.release.online = {
        version: state.release.testing.version,
        publishedAt: nowString(),
        status: "正常"
      };
      state.release.testing = null;
      state.shoes.forEach((shoe) => {
        if (shoe.status === "testing" || shoe.status === "draft") shoe.status = "published";
      });
      publishConfigToLocalPreview();
      persist();
      if (bootedFromApi) {
        await saveDraftToServer();
        const result = await apiJson("/admin/publish", {
          method: "POST",
          body: JSON.stringify({ note: publishNote })
        });
        state.release.online.version = result.version;
        state.release.online.publishedAt = result.publishedAt;
        persist();
      }
      render();
      toast("正式版本已发布");
    }
  });
}

function rollback(version) {
  const targetIndex = state.release.history.findIndex((item) => item.version === version);
  if (targetIndex < 0) return;
  confirmModal({
    title: "版本回滚",
    message: `确认回滚到 ${escapeHtml(version)}？当前正式版本会进入历史记录。`,
    confirmText: "确认回滚",
    onConfirm() {
      const target = state.release.history.splice(targetIndex, 1)[0];
      state.release.history.unshift({
        version: state.release.online.version,
        publishedAt: state.release.online.publishedAt,
        operator: "Admin"
      });
      state.release.online = {
        version: target.version,
        publishedAt: nowString(),
        status: "已回滚"
      };
      persist();
      renderRelease();
      toast("已回滚");
    }
  });
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  els.toastStack.appendChild(node);
  window.setTimeout(() => node.remove(), 2400);
}

function render() {
  applyTheme();
  applyShell();
  renderNav();
  renderShoes();
  renderFabrics();
  renderRelease();
}

function bindEvents() {
  els.nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-module]");
    if (button) setModule(button.dataset.module);
  });
  els.collapseButton.addEventListener("click", () => {
    state.collapsed = !state.collapsed;
    persist();
    render();
  });
  els.themeButton.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    persist();
    render();
  });
  els.resetDemoButton.addEventListener("click", resetDemo);
  els.shoeSearch.addEventListener("input", (event) => {
    state.filters.shoeSearch = event.target.value;
    persist();
    renderShoes();
  });
  els.shoeStatusFilter.addEventListener("change", (event) => {
    state.filters.shoeStatus = event.target.value;
    persist();
    renderShoes();
  });
  els.fabricSearch.addEventListener("input", (event) => {
    state.filters.fabricSearch = event.target.value;
    persist();
    renderFabrics();
  });
  els.fabricModeFilter.addEventListener("change", (event) => {
    state.filters.fabricMode = event.target.value;
    persist();
    renderFabrics();
  });
  els.addShoeButton.addEventListener("click", () => openShoeModal());
  els.addFabricButton.addEventListener("click", () => openFabricModal());
  els.shoeList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-shoe-id]");
    const action = event.target.closest("[data-action]");
    if (!row || !action) return;
    const item = state.shoes.find((entry) => entry.id === row.dataset.shoeId);
    if (!item) return;
    if (action.dataset.action === "edit") openShoeModal(item);
    if (action.dataset.action === "duplicate") duplicateShoe(item);
    if (action.dataset.action === "archive" || action.dataset.action === "restore") archiveShoe(item);
  });
  els.fabricList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-fabric-id]");
    const action = event.target.closest("[data-action]");
    if (!row || !action) return;
    const item = state.fabrics.find((entry) => entry.id === row.dataset.fabricId);
    if (!item) return;
    if (action.dataset.action === "edit") openFabricModal(item);
    if (action.dataset.action === "delete") deleteFabric(item);
  });
  els.createTestButton.addEventListener("click", openTestModal);
  els.stopTestButton.addEventListener("click", stopTest);
  els.promoteButton.addEventListener("click", promoteRelease);
  els.exportConfigButton.addEventListener("click", exportPublishedConfig);
  els.ratioSlider.addEventListener("input", () => {
    els.ratioText.textContent = `${els.ratioSlider.value}%`;
    if (state.release.testing) {
      state.release.testing.ratio = Number(els.ratioSlider.value);
      persist();
      renderRelease();
    }
  });
  els.releaseHistory.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="rollback"]');
    const row = event.target.closest("[data-version]");
    if (button && row) rollback(row.dataset.version);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.modalRoot.classList.contains("is-open")) closeModal();
  });
}

async function init() {
  const authenticated = await bootstrapFromServer();
  if (!authenticated) {
    renderLogin();
    return;
  }
  els.shoeSearch.value = state.filters.shoeSearch;
  els.shoeStatusFilter.value = state.filters.shoeStatus;
  els.fabricSearch.value = state.filters.fabricSearch;
  els.fabricModeFilter.value = state.filters.fabricMode;
  bindEvents();
  render();
}

init();
