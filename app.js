const MVP_ACTIVE_PART_ID = "G";
const FIXED_MATERIAL_ID = "fixed-image";
const LAYER_ASSET_DIR = "./assets/mvp/layers/";
const FULL_ANGLE_ASSET_DIR = "./assets/skates/yjs-pro-cim/";
const FULL_ANGLE_ASSET_VERSION = "20260523-annotated-v1";
const REAL_PRODUCT_ASSET_DIR = "./assets/skates/yjs-pro-cim/real-products/";
const MATERIAL_ASSET_DIR = "./assets/mvp/materials/";
const MATERIAL_ASSET_VERSION = "20260524-ue-fabric-v1";
const HIT_ALPHA_THRESHOLD = 18;
const SELECTION_RING_RADIUS = 14;
const SELECTION_RING_STEP = 3;
const SELECTION_RING_BLUR = 8;
const SHOE_ART_ASPECT_RATIO = 2401 / 1601;
const SHOE_SNAPSHOT_MAX_WIDTH = 1200;
const APP_VERSION = window.SKATE_CIM_VERSION || "0.0.0";
const LANGUAGE_STORAGE_KEY = "SKATE_CIM_LANGUAGE";
const SUPPORTED_LANGUAGES = ["zh", "en"];
const I18N = window.SKATE_CIM_I18N || {};
const PRODUCT_COPY = window.SKATE_CIM_PRODUCT_COPY || { fixedItems: [], embroiderySlots: [], productDefaults: {} };

function i18nValue(value, language = "zh", fallback = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[language] || value.zh || value.cn || value.en || fallback;
  }
  const text = value || fallback;
  if (language === "en" && PRODUCT_COPY.terms?.[text]) return PRODUCT_COPY.terms[text];
  return text;
}

function localizeTerm(value) {
  return i18nValue(value, state.language, value);
}


const SHARED_MVP_ASSETS = {
  base: "./assets/mvp/base-ui.png",
  stitch: `${LAYER_ASSET_DIR}stitch.png`
};

const SHOE_SCHEMA = window.SKATE_CIM_SCHEMA;
const SCHEMA_UTILS = window.SKATE_CIM_SCHEMA_UTILS;

function materialAsset(fileName) {
  return `${MATERIAL_ASSET_DIR}${fileName}?v=${MATERIAL_ASSET_VERSION}`;
}

function activeShoeSchema() {
  const publishedShoe = (CIM_SHARED_CONFIG.shoes || []).find((item) => item.shoeId === SHOE_SCHEMA.shoeId || item.id === SHOE_SCHEMA.shoeId);
  return SCHEMA_UTILS.mergePublishedShoe(SHOE_SCHEMA, publishedShoe);
}

function realProductAsset(fileName) {
  const schema = activeShoeSchema();
  return `${schema.assets.root}${schema.assets.realProductDir || "real-products/"}${fileName}`;
}

function angleAssets(angleId) {
  return SCHEMA_UTILS.resolveAngleAssets(activeShoeSchema(), angleId || activeShoeSchema().defaultAngleKey);
}

function buildComponentsFromSchema(schema) {
  return (schema.parts || []).map((part) => ({
    id: part.key,
    code: part.key,
    label: part.label || part.i18n || { zh: part.name, en: part.en || part.name },
    en: part.en || part.name,
    cn: part.name,
    group: part.group,
    palette: part.group,
    editable: part.selectable !== false,
    renderMode: part.renderMode,
    renderOrder: part.renderOrder,
    materialRule: part.materialRule,
    materialIds: part.materialIds || [],
    fixedOptions: part.fixedVariants || part.fixedStyleSet?.variants || null,
    fixedColorOptions: part.fixedStyleSet?.colorOptions || null,
    fixedStyleSet: part.fixedStyleSet || null,
    color: part.defaultStyle?.color || "#f6f3ec",
    material: part.defaultStyle?.material || "smooth",
    defaultVariant: part.defaultStyle?.variant || part.defaultStyle?.material || part.fixedStyleSet?.defaultVariant || part.fixedVariants?.[0]?.id || ""
  }));
}

const SHARED_PRODUCT_DETAILS = {
  fixedItems: PRODUCT_COPY.fixedItems,
  padStyles: [],
  embroiderySlots: PRODUCT_COPY.embroiderySlots
};

const CIM_SHARED_CONFIG = (() => {
  try {
    const localConfig = JSON.parse(localStorage.getItem("SKATE_CIM_PUBLISHED_CONFIG") || "null");
    if (localConfig?.schemaVersion && Array.isArray(localConfig.shoes)) return localConfig;
  } catch {
    localStorage.removeItem("SKATE_CIM_PUBLISHED_CONFIG");
  }
  return window.SKATE_CIM_CONFIG || {};
})();

function publishedShoeForSchema(schema = SHOE_SCHEMA) {
  return (CIM_SHARED_CONFIG.shoes || []).find((item) => item.shoeId === schema.shoeId || item.id === schema.shoeId || item.id === `shoe-${schema.shoeId}`);
}

function productFromSchema(schema) {
  const productSchema = SCHEMA_UTILS.mergePublishedShoe(schema, publishedShoeForSchema(schema));
  return {
    id: productSchema.shoeId,
    shoeId: productSchema.shoeId,
    name: productSchema.name,
    label: productSchema.label || productSchema.i18n || { zh: productSchema.name, en: productSchema.en || productSchema.name },
    code: productSchema.code,
    price: PRODUCT_COPY.productDefaults.price,
    homeTag: "Pro Custom",
    homeLabel: productSchema.homeLabel || PRODUCT_COPY.productDefaults.homeLabel,
    description: productSchema.description || PRODUCT_COPY.productDefaults.description,
    note: productSchema.notes || PRODUCT_COPY.productDefaults.note,
    homeFeatures: productSchema.homeFeatures || PRODUCT_COPY.productDefaults.homeFeatures,
    realProductImages: productSchema.assets?.realProducts || [],
    accentA: "#f0b7c8",
    accentB: "#ad94ff",
    angles: (productSchema.angles || [])
      .filter((angle) => angle.active !== false)
      .map((angle) => ({ id: angle.key, key: angle.key, label: angle.label || angle.i18n || { zh: angle.name, en: angle.en || angle.name }, meta: angle.meta || angle.label || angle.i18n || { zh: angle.name, en: angle.en || angle.name } })),
    defaultAngle: productSchema.defaultAngleKey || "side",
    editablePartId: productSchema.defaultPartKey || MVP_ACTIVE_PART_ID,
    assets: SHARED_MVP_ASSETS,
    schema: productSchema,
    components: buildComponentsFromSchema(productSchema),
    ...SHARED_PRODUCT_DETAILS
  };
}

const PRODUCT_CATALOG = [productFromSchema(SHOE_SCHEMA)].filter((item) => {
  const publishedShoes = (CIM_SHARED_CONFIG.shoes || []).filter((shoe) => shoe.status === "published");
  if (!publishedShoes.length) return true;
  return publishedShoes.some((shoe) => shoe.shoeId === item.id || shoe.id === item.id || shoe.id === `shoe-${item.id}`);
});

const STATIC_FABRIC_STYLE_SETS = {
  "fixed-straw": [
    { id: "fixed-straw-1336", name: "1336号皮料", parentId: "fixed-straw", file: "草席/1336.webp" },
    { id: "fixed-straw-1437", name: "1437号皮料", parentId: "fixed-straw", file: "草席/1437.webp" },
    { id: "fixed-straw-1518", name: "1518号皮料", parentId: "fixed-straw", file: "草席/1518.webp" },
    { id: "fixed-straw-1635", name: "1635号皮料", parentId: "fixed-straw", file: "草席/1635.webp" },
    { id: "fixed-straw-1741", name: "1741号皮料", parentId: "fixed-straw", file: "草席/1741.webp" },
    { id: "fixed-straw-2932", name: "2932号皮料", parentId: "fixed-straw", file: "草席/2932.webp" }
  ]
};

function materialIdFromFabric(fabric) {
  if (fabric.materialKey === "fixed_straw") return "fixed-straw";
  return fabric.materialKey;
}

function fabricStyleSetsFromSharedConfig() {
  const sets = {};
  (CIM_SHARED_CONFIG.fabrics || [])
    .filter((fabric) => fabric.mode === "fixed_style_set" && Array.isArray(fabric.styles) && fabric.styles.length)
    .forEach((fabric) => {
      const parentId = materialIdFromFabric(fabric);
      sets[parentId] = fabric.styles.map((style) => ({
        id: style.id,
        name: style.name,
        parentId,
        parentName: fabric.name,
        file: style.file
      }));
    });
  return sets;
}

const SHARED_FABRIC_STYLE_SETS = fabricStyleSetsFromSharedConfig();
const FABRIC_STYLE_SETS = { ...STATIC_FABRIC_STYLE_SETS, ...SHARED_FABRIC_STYLE_SETS };

PRODUCT_CATALOG.forEach((item) => {
  item.components.forEach((component) => {
    const hasAnyLayer = item.angles.some((angle) => {
      const assets = angleAssets(angle.id);
      return Boolean(assets?.parts?.[component.id] || assets?.fixed?.[component.id]);
    });
    component.editable = component.editable !== false && hasAnyLayer;
    if (!component.editable) component.lockReason = "暂未配置切图";
  });
});

let DEFAULT_PRODUCT_ID = PRODUCT_CATALOG.find((item) => item.id === "yjs-pro-cim-upper")?.id || PRODUCT_CATALOG[0].id;
let DEFAULT_PRODUCT = PRODUCT_CATALOG.find((item) => item.id === DEFAULT_PRODUCT_ID);
const hitCanvasCache = new Map();
const snapshotImageCache = new Map();
const selectionRingCache = new Map();
let shoeHitRequestId = 0;
let shoeFitObserver = null;
let effectSnapshotRecord = null;
let effectSnapshotRequestId = 0;
let confirmationSheetRequestId = 0;
let isConfirmationSheetGenerating = false;
let confirmationEmailState = "idle";
let confirmationEmailTransport = "outbox";
let confirmationEmailMessage = "";

const state = {
  view: "home",
  language: SUPPORTED_LANGUAGES.includes(localStorage.getItem(LANGUAGE_STORAGE_KEY)) ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : "zh",
  productId: DEFAULT_PRODUCT_ID,
  selectedPartId: activePartId(DEFAULT_PRODUCT),
  angle: "side",
  selectedEffectAngle: "side",
  isCustomizerOpen: false,
  customer: {
    name: "",
    phone: "",
    email: "",
    date: new Date().toISOString().slice(0, 10),
    footLength: "",
    size: ""
  },
  config: {}
};

function t(key, params = {}) {
  const template = I18N[state.language]?.[key] || I18N.zh?.[key] || key;
  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), template);
}

function localized(value, fallback = "") {
  return i18nValue(value, state.language, fallback);
}

function productName(item = product()) {
  return localized(item.label, item.name);
}

function angleLabel(angle) {
  return localized(angle.label, localizeTerm(angle.name || angle.key || angle.id));
}

function angleMeta(angle) {
  return localized(angle.meta, angleLabel(angle));
}

function componentName(component) {
  return localized(component.label, state.language === "en" ? component.en || component.cn : component.cn || component.en);
}

function slotName(slot) {
  return localized(slot.label, state.language === "en" ? slot.en || slot.cn : slot.cn || slot.en);
}

function fixedItemName(item) {
  return localized(item.label, state.language === "en" ? item.en || item.cn : item.cn || item.en);
}

function fixedItemValue(item) {
  return localized(item.value, item.value);
}

function translateFeature(feature) {
  if (feature && typeof feature === "object") return localized(feature);
  return localizeTerm(feature);
}

function applyPublishedConfig(config) {
  const publishedShoes = Array.isArray(config?.shoes) ? config.shoes.filter((item) => item.status === "published") : [];
  if (!publishedShoes.length) return;
  PRODUCT_CATALOG = PRODUCT_CATALOG
    .map((productItem) => {
      const adminItem = publishedShoes.find((item) => item.shoeId === productItem.id);
      if (!adminItem) return productItem;
      return {
        ...productItem,
        name: adminItem.name || productItem.name,
        label: adminItem.label || adminItem.i18n || productItem.label,
        code: adminItem.code || productItem.code,
        homeLabel: adminItem.homeLabel || productItem.homeLabel,
        description: adminItem.description || adminItem.notes || productItem.description,
        homeFeatures: adminItem.homeFeatures || productItem.homeFeatures,
        defaultAngle: adminItem.defaultAngleKey || adminItem.defaultAngle || productItem.defaultAngle,
        editablePartId: adminItem.defaultPartKey || productItem.editablePartId
      };
    })
    .filter((productItem) => publishedShoes.some((item) => item.shoeId === productItem.id));
  DEFAULT_PRODUCT_ID = PRODUCT_CATALOG.find((item) => item.id === state.productId)?.id || PRODUCT_CATALOG[0]?.id || DEFAULT_PRODUCT_ID;
  DEFAULT_PRODUCT = PRODUCT_CATALOG.find((item) => item.id === DEFAULT_PRODUCT_ID) || PRODUCT_CATALOG[0];
  state.productId = DEFAULT_PRODUCT_ID;
  state.selectedPartId = activePartId(DEFAULT_PRODUCT);
}

async function loadPublishedConfig() {
  try {
    const response = await fetch("/api/public/config", { cache: "no-store" });
    if (!response.ok) return;
    applyPublishedConfig(await response.json());
  } catch {
    // 静态预览时没有本地 API，继续使用内置配置，保证 C 端仍可离线打开。
  }
}

const els = {
  homeView: document.querySelector("#homeView"),
  workspace: document.querySelector("#workspace"),
  pageEyebrow: document.querySelector("#pageEyebrow"),
  pageTitle: document.querySelector("#pageTitle"),
  homeProductTag: document.querySelector("#homeProductTag"),
  homeProductName: document.querySelector("#homeProductName"),
  homeProductDescription: document.querySelector("#homeProductDescription"),
  homeProductMeta: document.querySelector("#homeProductMeta"),
  homeShoeArt: document.querySelector("#homeShoeArt"),
  homeProductGrid: document.querySelector("#homeProductGrid"),
  languageToggleButton: document.querySelector("#languageToggleButton"),
  homeButton: document.querySelector("#homeButton"),
  modelStrip: document.querySelector("#modelStrip"),
  angleTabs: document.querySelector("#angleTabs"),
  shoeScene: document.querySelector("#shoeScene"),
  shoeArt: document.querySelector("#shoeArt"),
  angleMeta: document.querySelector("#angleMeta"),
  modelMeta: document.querySelector("#modelMeta"),
  modelName: document.querySelector("#modelName"),
  modelDescription: document.querySelector("#modelDescription"),
  customizerPanel: document.querySelector("#customizerPanel"),
  customizerScroll: document.querySelector(".customizer-scroll"),
  customizerToggleButton: document.querySelector("#customizerToggleButton"),
  drawerBackdrop: document.querySelector("#drawerBackdrop"),
  drawerCloseButton: document.querySelector("#drawerCloseButton"),
  partRail: document.querySelector("#partRail"),
  selectedPartLabel: document.querySelector("#selectedPartLabel"),
  selectedPartTitle: document.querySelector("#selectedPartTitle"),
  selectedColorName: document.querySelector("#selectedColorName"),
  selectedTextureName: document.querySelector("#selectedTextureName"),
  swatchGrid: document.querySelector("#swatchGrid"),
  textureList: document.querySelector("#textureList"),
  configPreview: document.querySelector("#configPreview"),
  copyConfigButton: document.querySelector("#copyConfigButton"),
  saveButton: document.querySelector("#saveButton"),
  resetButton: document.querySelector("#resetButton"),
  toast: document.querySelector("#toast")
};

function activePartId(item = product()) {
  return item?.editablePartId || MVP_ACTIVE_PART_ID;
}

function product() {
  return PRODUCT_CATALOG.find((item) => item.id === state.productId);
}

function selectedComponent() {
  return product().components.find((item) => item.id === state.selectedPartId);
}

function productAngles(item = product()) {
  return item?.angles?.length ? item.angles : (activeShoeSchema().angles || []).map((angle) => ({ id: angle.key, key: angle.key, label: { zh: angle.name, en: angle.en || angle.name }, meta: { zh: angle.name, en: angle.en || angle.name } }));
}

function currentAngleConfig(item = product(), angleId = state.angle) {
  return productAngles(item).find((angle) => angle.id === angleId || angle.key === angleId) || productAngles(item)[0] || { id: activeShoeSchema().defaultAngleKey || "side", label: { zh: "侧面", en: "Side" } };
}

function effectAngleConfig(item = product()) {
  return currentAngleConfig(item, state.selectedEffectAngle || state.angle);
}

function normalizeAngleForProduct(item = product()) {
  if (!productAngles(item).some((angle) => angle.id === state.angle)) {
    state.angle = item.defaultAngle || productAngles(item)[0]?.id || "side";
  }
}

function cloneProductConfig(item) {
  return {
    components: Object.fromEntries(
      item.components.map((component) => {
        const fixedOption = defaultFixedOption(component);
        const fixedColor = component.fixedColorOptions?.[0];
        return [
          component.id,
          {
            color: fixedColor?.value || fixedOption?.id || component.color,
            variant: fixedOption?.id || "",
            material: fixedColor ? fixedOption?.id : (fixedOption ? FIXED_MATERIAL_ID : component.material)
          }
        ];
      })
    ),
    padStyle: item.padStyles[0]?.id || "",
    embroidery: Object.fromEntries(
      item.embroiderySlots.map((slot) => [
        slot.id,
        {
          enabled: slot.enabled,
          text: "",
          image: null
        }
      ])
    )
  };
}

function componentConfig(id = state.selectedPartId) {
  return state.config[state.productId].components[id];
}

function componentConfigFor(item, id) {
  return state.config[item.id]?.components[id] || item.components.find((component) => component.id === id);
}

function colorOptions(component) {
  if (component.fixedColorOptions) return component.fixedColorOptions;
  if (component.fixedOptions) {
    return component.fixedOptions.map((option) => ({
      ...option,
      value: option.id
    }));
  }
  return activeShoeSchema().palettes?.[component.palette] || activeShoeSchema().palettes?.leather || [];
}

function isColorControlVisible(component = selectedComponent(), config = componentConfig(component.id)) {
  return !fabricStyleByMaterial(config.material);
}

function materialsFor(component) {
  return SCHEMA_UTILS.materialsForPart(activeShoeSchema(), component.id);
}

function materialById(id) {
  return fabricStyleByMaterial(id) || activeShoeSchema().materials.find((item) => item.id === id) || activeShoeSchema().materials[0];
}

function fabricStyleSetByMaterial(id) {
  return FABRIC_STYLE_SETS[id] || [];
}

function fabricStyleByMaterial(id) {
  return Object.values(FABRIC_STYLE_SETS).flat().find((item) => item.id === id) || null;
}

function fabricStyleSetPatch(parentId, styleId = "") {
  const styles = fabricStyleSetByMaterial(parentId);
  const style = styles.find((item) => item.id === styleId) || styles[0];
  return { material: style.id, variant: style.id };
}

function colorName(value, component = selectedComponent()) {
  if (component?.fixedColorOptions) return localizeTerm(component.fixedColorOptions.find((color) => color.value.toLowerCase() === value.toLowerCase())?.name || value);
  if (component?.fixedOptions) return localizeTerm(fixedOption(component, { color: value, variant: value })?.name || value);
  return localizeTerm(colorOptions(component).find((color) => color.value.toLowerCase() === value.toLowerCase())?.name || value);
}

function defaultFixedOption(component) {
  if (!component.fixedOptions) return null;
  return component.fixedOptions.find((option) => option.id === component.defaultVariant) || component.fixedOptions[0];
}

function fixedOption(component, config = componentConfig(component.id)) {
  if (!component.fixedOptions) return null;
  const fixedId = component.fixedColorOptions ? (config?.material || config?.variant || component.defaultVariant) : (config?.variant || config?.color || component.defaultVariant);
  return component.fixedOptions.find((option) => option.id === fixedId) || defaultFixedOption(component);
}

function fixedImageId(component, option, config = componentConfig(component.id)) {
  if (!component.fixedColorOptions) return option?.id || "";
  const color = component.fixedColorOptions.find((item) => item.value.toLowerCase() === (config?.color || component.color || "").toLowerCase()) || component.fixedColorOptions[0];
  return `${option.sourcePrefix}-${color.suffix}`;
}

function componentPreview(component, config = componentConfig(component.id)) {
  if (component.fixedColorOptions) return config.color || component.color;
  const option = fixedOption(component, config);
  if (option) return option.swatch;
  return cssTexture(config.color, config.material);
}

function texturePreview(component, config, material) {
  if (component.fixedColorOptions) return material.swatch || componentPreview(component, config);
  return component.fixedOptions ? componentPreview(component, config) : cssTexture(config.color, material.id);
}

function isSelectedMaterial(component, config, material) {
  if (fabricStyleSetByMaterial(material.id).length) return fabricStyleSetByMaterial(material.id).some((style) => style.id === config.material);
  return material.id === config.material;
}

function shouldExpandMaterial(component, config, material) {
  if (!isSelectedMaterial(component, config, material)) return false;
  if (fabricStyleSetByMaterial(material.id).length) return true;
  if (component.fixedOptions) return true;
  return true;
}

function componentColorValue(component, config = componentConfig(component.id)) {
  if (component.fixedColorOptions) return config.color || component.color;
  const option = fixedOption(component, config);
  return option?.swatch || config.color;
}

function materialName(id, component = selectedComponent()) {
  if (component?.fixedColorOptions) return localizeTerm(fixedOption(component, { material: id, variant: id })?.name || id);
  return localizeTerm(materialById(id).name);
}

function cssTexture(color, material) {
  const fabricStyle = fabricStyleByMaterial(material);
  if (fabricStyle) {
    // 固定贴图子款式本身已经包含颜色和纹理，不再叠加色值。
    return `url('${materialAsset(fabricStyle.file)}') center / cover no-repeat`;
  }

  switch (material) {
    case "webbing":
      return `repeating-linear-gradient(90deg, rgba(255,255,255,.36) 0 2px, rgba(0,0,0,.08) 2px 4px), ${color}`;
    case "hardware":
      return `linear-gradient(145deg, rgba(255,255,255,.9), ${color} 46%, rgba(0,0,0,.14))`;
    case "matte":
      return `linear-gradient(145deg, ${color}, rgba(0,0,0,.16))`;
    case "smooth":
    default:
      return `linear-gradient(145deg, rgba(255,255,255,.42), transparent 40%), ${color}`;
  }
}

function svgPattern(id) {
  const { color, material } = componentConfig(id);
  const base = `<rect width="12" height="12" fill="${color}"/>`;

  switch (material) {
    case "webbing":
      return `${base}<path d="M0 3 H12 M0 9 H12" stroke="#fff" stroke-opacity=".28" stroke-width="1.6"/><path d="M3 0 V12 M9 0 V12" stroke="#000" stroke-opacity=".12" stroke-width="1"/>`;
    case "hardware":
      return `${base}<path d="M0 0 H12" stroke="#fff" stroke-opacity=".5" stroke-width="5"/><path d="M0 12 H12" stroke="#000" stroke-opacity=".13" stroke-width="4"/>`;
    case "matte":
      return `${base}<path d="M0 12 H12" stroke="#000" stroke-opacity=".12" stroke-width="4"/>`;
    case "smooth":
    default:
      return `${base}<path d="M0 0 H12" stroke="#fff" stroke-opacity=".28" stroke-width="4"/><path d="M0 12 H12" stroke="#000" stroke-opacity=".05" stroke-width="3"/>`;
  }
}

function svgDefs() {
  return `
    <defs>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".16"/>
      </filter>
      <linearGradient id="metalEdge" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".88"/>
        <stop offset=".48" stop-color="#b9bcc2"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity=".72"/>
      </linearGradient>
      <linearGradient id="wheelGloss" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".62"/>
        <stop offset=".42" stop-color="#ffffff" stop-opacity=".08"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".12"/>
      </linearGradient>
      ${product().components
        .map((component) => `<pattern id="p-${component.id}" patternUnits="userSpaceOnUse" width="12" height="12">${svgPattern(component.id)}</pattern>`)
        .join("")}
    </defs>`;
}

function selectedClass(id) {
  return isPartSelectionVisible() && state.selectedPartId === id ? "is-selected" : "";
}

function sideSvg() {
  return `
    <svg viewBox="0 0 900 520" aria-hidden="true">
      ${svgDefs()}
      <g filter="url(#softShadow)" transform="translate(10 0)">
        <g>
          ${[226, 348, 470, 592, 714]
            .map(
              (cx) => `
              <circle cx="${cx}" cy="403" r="58" fill="#ad94ff" opacity=".45"/>
              <circle cx="${cx}" cy="403" r="58" fill="url(#wheelGloss)"/>
              <circle cx="${cx}" cy="403" r="10" fill="#f9f9fb" stroke="#b4b5bb" stroke-width="4"/>
            `
            )
            .join("")}
        </g>

        <g>
          <path d="M160 354 C250 334 316 332 392 344 C472 357 552 357 760 340 L790 365 C628 384 470 391 318 382 C250 378 190 381 142 392 Z" fill="#f7f4ec" stroke="#d5d6da" stroke-width="4"/>
          <path d="M246 355 L330 386 L390 350 M420 354 L496 388 L560 348 M590 350 L662 382 L736 345" fill="none" stroke="url(#metalEdge)" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
        </g>

        <g data-part="F" class="hotspot ${selectedClass("F")}">
          <path d="M211 262 C246 209 299 178 358 172 C431 164 507 208 597 235 C665 256 715 267 762 286 C798 302 819 326 817 350 C814 387 775 403 703 403 L304 403 C235 403 182 383 170 347 C162 321 181 291 211 262 Z" fill="url(#p-F)" stroke="#dddde1" stroke-width="4"/>
        </g>

        <g data-part="H" class="hotspot ${selectedClass("H")}">
          <path d="M650 318 C719 318 789 326 809 350 C796 369 761 373 710 368 C648 364 611 354 574 342 C590 326 616 319 650 318 Z" fill="url(#p-H)" stroke="rgba(0,0,0,.1)" stroke-width="3"/>
        </g>

        <g data-part="G" class="hotspot ${selectedClass("G")}">
          <path d="M306 278 C353 246 424 251 484 273 C450 288 396 304 322 308 C298 307 292 295 306 278 Z" fill="url(#p-G)" stroke="rgba(0,0,0,.1)" stroke-width="3"/>
          <path d="M503 238 C536 247 574 260 612 272 C604 291 584 304 548 307 C519 296 496 281 478 264 C478 249 486 240 503 238 Z" fill="url(#p-G)" stroke="rgba(0,0,0,.1)" stroke-width="3"/>
        </g>

        <g data-part="A" class="hotspot ${selectedClass("A")}">
          <path d="M314 151 C359 120 433 115 474 148 C461 188 438 213 391 219 C357 211 328 189 314 151 Z" fill="url(#p-A)" stroke="rgba(0,0,0,.12)" stroke-width="4"/>
        </g>

        <g data-part="C" class="hotspot ${selectedClass("C")}">
          <path d="M446 142 C490 150 531 183 561 226 C530 238 494 231 465 210 C438 190 428 162 446 142 Z" fill="url(#p-C)" stroke="rgba(0,0,0,.12)" stroke-width="4"/>
        </g>

        <g data-part="C1" class="hotspot ${selectedClass("C1")}">
          <path d="M634 214 C677 228 714 246 752 268 C714 276 674 269 626 252 C624 236 626 224 634 214 Z" fill="url(#p-C1)" opacity=".94"/>
        </g>

        <g data-part="E" class="hotspot ${selectedClass("E")}">
          <path d="M210 227 C258 206 302 220 342 263 C316 301 268 322 207 282 C210 261 210 243 210 227 Z" fill="url(#p-E)" stroke="#c7c8cc" stroke-width="4"/>
        </g>

        <g data-part="D" class="hotspot ${selectedClass("D")}">
          <path d="M217 109 C270 50 363 45 428 89 C407 126 377 165 349 222 C320 214 286 210 250 218 C230 178 201 150 217 109 Z" fill="url(#p-D)" stroke="#c7c8cc" stroke-width="4"/>
        </g>

        <g data-part="D1" class="hotspot ${selectedClass("D1")}">
          <circle cx="292" cy="224" r="20" fill="url(#p-D1)" stroke="#bfc0c5" stroke-width="4"/>
        </g>

        <g data-part="B" class="hotspot ${selectedClass("B")}">
          <path d="M128 112 L250 160" stroke="url(#p-B)" stroke-width="32" stroke-linecap="round"/>
        </g>

        <g data-part="J" class="hotspot ${selectedClass("J")}">
          <path d="M361 237 C431 224 514 237 584 277" fill="none" stroke="url(#p-J)" stroke-width="19" stroke-linecap="round"/>
          <path d="M364 255 C434 242 494 252 558 291" fill="none" stroke="url(#p-J)" stroke-width="13" stroke-linecap="round"/>
        </g>

        <g data-part="K" class="hotspot ${selectedClass("K")}">
          <path d="M250 117 C352 116 473 139 581 183" fill="none" stroke="url(#p-K)" stroke-width="31" stroke-linecap="round"/>
          <rect x="512" y="174" width="52" height="37" rx="11" fill="url(#p-K)" stroke="#d5d6dc" stroke-width="4"/>
        </g>

        <g data-part="I" class="hotspot ${selectedClass("I")}">
          <path d="M448 172 C477 169 509 178 538 198 L520 232 C486 216 455 209 428 211 Z" fill="url(#p-I)" stroke="#d6d7dc" stroke-width="4"/>
        </g>

        <g data-part="L" class="hotspot ${selectedClass("L")}">
          <path d="M708 364 C755 368 786 365 806 352 C800 385 764 403 703 403 L617 403 C635 382 664 369 708 364 Z" fill="url(#p-L)" opacity=".9"/>
        </g>

        <path d="M198 93 C244 30 352 26 430 75" fill="none" stroke="#17171a" stroke-width="13" stroke-linecap="round"/>
        <circle cx="594" cy="288" r="21" fill="#fafafa" stroke="#c8c8ce" stroke-width="3"/>
        <text x="584" y="295" font-size="17" font-weight="800" fill="#4a4a4f">S</text>
      </g>
    </svg>`;
}

function frontSvg() {
  return `
    <div class="front-preview">
      ${sideSvg()}
    </div>`;
}

function isEditablePart(id) {
  return Boolean(product().components.find((component) => component.id === id)?.editable);
}

function productAssets(item = product()) {
  return item.assets || SHARED_MVP_ASSETS;
}

function renderableComponents(item = product()) {
  return item.components
    .filter((component) => component.editable)
    .slice()
    .sort((left, right) => (left.renderOrder || 0) - (right.renderOrder || 0));
}

function fixedImageForAngle(component, config, angle) {
  const option = fixedOption(component, config);
  if (!option) return "";
  if (component.fixedColorOptions) return "";
  if (angle?.fixed && !angle.fixed[component.id]) return "";
  const imageId = fixedImageId(component, option, config);
  return angle?.fixed?.[component.id]?.[imageId] || option.image;
}

function hitSourcesForComponent(component, item = product(), angle = angleAssets(currentAngleConfig(item).id)) {
  const config = componentConfigFor(item, component.id);
  const fixedImage = fixedImageForAngle(component, config, angle);
  if (fixedImage) return [fixedImage];
  if (angle.parts && !angle.parts[component.id]) return [];
  return angle.parts?.[component.id] ? [angle.parts[component.id]] : (component.masks || []);
}

function componentHasLayerInAngle(component, item = product(), angle = angleAssets(currentAngleConfig(item).id)) {
  return component.editable && hitSourcesForComponent(component, item, angle).length > 0;
}

function loadSnapshotImage(src) {
  if (snapshotImageCache.has(src)) return snapshotImageCache.get(src);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

  snapshotImageCache.set(src, promise);
  return promise;
}

function drawRepeatingLines(context, width, height, step, color, alpha, direction = 1) {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  for (let x = -height; x < width + height; x += step) {
    context.moveTo(x, direction > 0 ? height : 0);
    context.lineTo(x + height, direction > 0 ? 0 : height);
  }
  context.stroke();
  context.restore();
}

async function paintSnapshotMaterial(context, width, height, color, material) {
  const fabricStyle = fabricStyleByMaterial(material);
  if (fabricStyle) {
    // 确认页快照使用 Canvas 重新合成，固定贴图布料必须在这里重画，不能依赖 CSS background。
    const image = await loadSnapshotImage(materialAsset(fabricStyle.file));
    if (image) {
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    }
    return;
  }

  context.fillStyle = color;
  context.fillRect(0, 0, width, height);

  switch (material) {
    case "webbing":
      context.fillStyle = "rgba(255,255,255,.22)";
      for (let x = 0; x < width; x += 8) context.fillRect(x, 0, 3, height);
      context.fillStyle = "rgba(0,0,0,.08)";
      for (let x = 4; x < width; x += 8) context.fillRect(x, 0, 2, height);
      break;
    case "hardware": {
      const metal = context.createLinearGradient(0, 0, width, height);
      metal.addColorStop(0, "rgba(255,255,255,.9)");
      metal.addColorStop(0.46, "rgba(255,255,255,0)");
      metal.addColorStop(1, "rgba(0,0,0,.14)");
      context.fillStyle = metal;
      context.fillRect(0, 0, width, height);
      break;
    }
    case "matte": {
      const matte = context.createLinearGradient(0, 0, width, height);
      matte.addColorStop(0, "rgba(255,255,255,.04)");
      matte.addColorStop(1, "rgba(0,0,0,.16)");
      context.fillStyle = matte;
      context.fillRect(0, 0, width, height);
      break;
    }
    case "smooth":
    default: {
      const smooth = context.createLinearGradient(0, 0, width, height * 0.8);
      smooth.addColorStop(0, "rgba(255,255,255,.42)");
      smooth.addColorStop(0.42, "rgba(255,255,255,0)");
      context.fillStyle = smooth;
      context.fillRect(0, 0, width, height);
      break;
    }
  }
}

async function drawSnapshotMaskedMaterial(context, width, height, maskSrc, config) {
  const mask = await loadSnapshotImage(maskSrc);
  if (!mask) return;
  const layerCanvas = document.createElement("canvas");
  layerCanvas.width = width;
  layerCanvas.height = height;
  const layerContext = layerCanvas.getContext("2d");
  if (!layerContext) return;

  await paintSnapshotMaterial(layerContext, width, height, config.color, config.material);
  layerContext.globalCompositeOperation = "destination-in";
  layerContext.drawImage(mask, 0, 0, width, height);

  context.save();
  context.globalAlpha = 0.9;
  context.globalCompositeOperation = "multiply";
  context.drawImage(layerCanvas, 0, 0);
  context.restore();
}

async function renderShoeSnapshot(item = product(), angleId = currentAngleConfig(item).id) {
  const angle = angleAssets(angleId);
  const base = await loadSnapshotImage(angle.base);
  if (!base) return "";
  const width = Math.min(SHOE_SNAPSHOT_MAX_WIDTH, base.naturalWidth || SHOE_SNAPSHOT_MAX_WIDTH);
  const height = Math.round(width / SHOE_ART_ASPECT_RATIO);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return "";

  context.drawImage(base, 0, 0, width, height);
  for (const component of renderableComponents(item)) {
    const config = componentConfigFor(item, component.id);
    const fixedImage = fixedImageForAngle(component, config, angle);
    if (fixedImage) {
      const image = await loadSnapshotImage(fixedImage);
      if (image) context.drawImage(image, 0, 0, width, height);
      continue;
    }
    if (angle.parts && !angle.parts[component.id]) continue;
    const masks = angle.parts?.[component.id] ? [angle.parts[component.id]] : (component.masks || []);
    for (const mask of masks) {
      await drawSnapshotMaskedMaterial(context, width, height, mask, config);
    }
  }
  const stitch = await loadSnapshotImage(angle.stitch);
  if (stitch) {
    context.save();
    context.globalCompositeOperation = "multiply";
    context.drawImage(stitch, 0, 0, width, height);
    context.restore();
  }
  return canvas.toDataURL("image/png");
}

async function buildEffectSnapshotRecord(item = product()) {
  window.__shoeSnapshotBuildCount = (window.__shoeSnapshotBuildCount || 0) + 1;
  const previews = await Promise.all(
    productAngles(item).map(async (angle) => ({
      id: angle.id,
      label: angleLabel(angle),
      dataUrl: await renderShoeSnapshot(item, angle.id)
    }))
  );
  return {
    productId: item.id,
    createdAt: Date.now(),
    previews
  };
}

function clearEffectSnapshots() {
  effectSnapshotRecord = null;
  effectSnapshotRequestId += 1;
}

function cancelConfirmationSheetGeneration() {
  confirmationSheetRequestId += 1;
  isConfirmationSheetGenerating = false;
}

function effectSnapshotsReady(item = product()) {
  return effectSnapshotRecord?.productId === item.id && effectSnapshotRecord.previews?.some((preview) => preview.dataUrl);
}

function effectSnapshotForAngle(angleId, item = product()) {
  if (!effectSnapshotsReady(item)) return null;
  return effectSnapshotRecord.previews.find((preview) => preview.id === angleId) || null;
}

function isPartAvailableInCurrentAngle(partId) {
  const item = product();
  const angle = angleAssets(currentAngleConfig(item).id);
  const component = item.components.find((part) => part.id === partId);
  return Boolean(component && componentHasLayerInAngle(component, item, angle));
}

function invalidatePendingShoeHit() {
  shoeHitRequestId += 1;
  return shoeHitRequestId;
}

function loadHitCanvas(src) {
  if (hitCanvasCache.has(src)) return hitCanvasCache.get(src);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve({ canvas, context });
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });

  hitCanvasCache.set(src, promise);
  return promise;
}

async function isHitOnImage(src, normalizedX, normalizedY) {
  const hitCanvas = await loadHitCanvas(src);
  if (!hitCanvas) return false;
  const { canvas, context } = hitCanvas;
  const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(normalizedX * canvas.width)));
  const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(normalizedY * canvas.height)));
  try {
    return context.getImageData(x, y, 1, 1).data[3] > HIT_ALPHA_THRESHOLD;
  } catch {
    return false;
  }
}

async function hitTestShoePart(event) {
  const frame = event.target.closest(".mvp-shoe-frame") || els.shoeArt.querySelector(".mvp-shoe-frame");
  if (!frame) return "";

  const rect = frame.getBoundingClientRect();
  const normalizedX = (event.clientX - rect.left) / rect.width;
  const normalizedY = (event.clientY - rect.top) / rect.height;
  if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) return "";

  const item = product();
  const angle = angleAssets(currentAngleConfig(item).id);
  const components = renderableComponents(item)
    .slice()
    .sort((left, right) => (right.renderOrder || 0) - (left.renderOrder || 0));

  for (const component of components) {
    for (const source of hitSourcesForComponent(component, item, angle)) {
      if (await isHitOnImage(source, normalizedX, normalizedY)) return component.id;
    }
  }
  return "";
}

function isMobileCustomizer() {
  return window.matchMedia("(max-width: 760px), (max-width: 900px) and (max-height: 520px)").matches;
}

function defaultCustomizerOpen() {
  return !isMobileCustomizer();
}

function syncCustomizerState() {
  const isBuilder = state.view !== "home";
  const isOpen = isBuilder && state.isCustomizerOpen;
  const collapsedSidebar = isBuilder && !isOpen;
  els.workspace.classList.toggle("is-drawer-open", false);
  els.workspace.classList.toggle("is-customizer-collapsed", collapsedSidebar);
  document.body.classList.toggle("drawer-open", false);
  els.customizerPanel.setAttribute("aria-hidden", isOpen ? "false" : "true");
  els.customizerToggleButton.hidden = !isBuilder;
  els.customizerToggleButton.setAttribute("aria-expanded", String(isOpen));
  els.customizerToggleButton.textContent = isOpen ? t("collapsePanel") : t("materialOptions");
  els.customizerToggleButton.title = isOpen ? t("collapsePanel") : t("expandPanel");
}

function isPartSelectionVisible() {
  return state.view !== "home" && state.isCustomizerOpen;
}

function setCustomizerOpen(open) {
  state.isCustomizerOpen = open;
  render();
}

function parseCssNumber(value, fallback) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

function syncShoeFit() {
  const scene = els.shoeScene;
  const art = els.shoeArt;
  if (!scene || !art || state.view === "home") return;

  const sceneRect = scene.getBoundingClientRect();
  if (!sceneRect.width || !sceneRect.height) return;

  const style = window.getComputedStyle(scene);
  const paddingX = parseCssNumber(style.paddingLeft, 0) + parseCssNumber(style.paddingRight, 0);
  const paddingY = parseCssNumber(style.paddingTop, 0) + parseCssNumber(style.paddingBottom, 0);
  const availableWidth = Math.max(0, scene.clientWidth - paddingX);
  const availableHeight = Math.max(0, scene.clientHeight - paddingY);
  const scale = Math.max(0.1, Math.min(1, parseCssNumber(style.getPropertyValue("--shoe-fit-scale"), 0.96)));
  const maxWidth = parseCssNumber(style.getPropertyValue("--shoe-max-width"), Number.POSITIVE_INFINITY);

  // 同时受宽度和高度约束，避免小窗时只按宽度放大导致鞋图被预览容器裁掉。
  const fitWidth = Math.max(0, Math.min(
    availableWidth * scale,
    availableHeight * scale * SHOE_ART_ASPECT_RATIO,
    maxWidth
  ));
  art.style.setProperty("--shoe-fit-width", `${fitWidth}px`);
}

function selectPart(partId, shouldOpenPanel = false) {
  if (!isEditablePart(partId)) {
    toast(t("noLayerConfigured"));
    return false;
  }
  if (!isPartAvailableInCurrentAngle(partId)) {
    toast(t("noLayerCurrentAngle"));
    return false;
  }
  state.selectedPartId = partId;
  if (shouldOpenPanel) state.isCustomizerOpen = true;
  render();
  return true;
}

function focusColorPanel(shouldRender = true) {
  state.isCustomizerOpen = true;
  if (shouldRender) render();
  window.requestAnimationFrame(() => {
    els.swatchGrid.closest(".control-block")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function normalizeSelectedPartForAngle() {
  if (isPartAvailableInCurrentAngle(state.selectedPartId)) return;
  const item = product();
  const angle = angleAssets(currentAngleConfig(item).id);
  const nextPart = item.components.find((component) => componentHasLayerInAngle(component, item, angle));
  state.selectedPartId = nextPart?.id || activePartId(item);
}

function selectionRingOffsets(radius = SELECTION_RING_RADIUS, step = SELECTION_RING_STEP) {
  const offsets = [];
  for (let y = -radius; y <= radius; y += step) {
    for (let x = -radius; x <= radius; x += step) {
      const distance = Math.hypot(x, y);
      if (!distance || distance > radius) continue;
      offsets.push({
        dx: x,
        dy: y,
        alpha: Math.max(0.36, 0.9 - distance / radius * 0.46)
      });
    }
  }
  return offsets.sort((left, right) => right.alpha - left.alpha);
}

function alphaBounds(sourceCanvas, threshold = HIT_ALPHA_THRESHOLD) {
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const imageData = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const bounds = {
    minX: sourceCanvas.width,
    minY: sourceCanvas.height,
    maxX: 0,
    maxY: 0
  };
  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      const alpha = imageData.data[(y * sourceCanvas.width + x) * 4 + 3];
      if (alpha <= threshold) continue;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }
  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) return null;
  return bounds;
}

function colorizeAlphaCanvas(sourceCanvas) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(sourceCanvas, 0, 0);
  context.globalCompositeOperation = "source-in";
  const bounds = alphaBounds(sourceCanvas);
  const startX = bounds ? bounds.minX : 0;
  const endX = bounds ? bounds.maxX : canvas.width;
  const startY = bounds ? bounds.minY : 0;
  const endY = bounds ? bounds.maxY : canvas.height;
  const gradient = context.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, "rgba(84, 224, 255, 0.88)");
  gradient.addColorStop(0.48, "rgba(0, 113, 227, 0.94)");
  gradient.addColorStop(1, "rgba(126, 91, 255, 0.9)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function thresholdAlphaCanvas(sourceCanvas, threshold = HIT_ALPHA_THRESHOLD) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(sourceCanvas, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3] > threshold ? 255 : 0;
    imageData.data[index] = 0;
    imageData.data[index + 1] = 0;
    imageData.data[index + 2] = 0;
    imageData.data[index + 3] = alpha;
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function createSelectionRingDataUrl(source) {
  const hitCanvas = await loadHitCanvas(source);
  if (!hitCanvas?.canvas) return "";

  const sourceCanvas = hitCanvas.canvas;
  const blueCanvas = colorizeAlphaCanvas(sourceCanvas);
  const cutoutCanvas = thresholdAlphaCanvas(sourceCanvas);
  if (!blueCanvas || !cutoutCanvas) return "";

  const coreCanvas = document.createElement("canvas");
  coreCanvas.width = sourceCanvas.width;
  coreCanvas.height = sourceCanvas.height;
  const coreContext = coreCanvas.getContext("2d");
  if (!coreContext) return "";

  selectionRingOffsets().forEach((offset) => {
    coreContext.globalAlpha = offset.alpha;
    coreContext.drawImage(blueCanvas, offset.dx, offset.dy);
  });

  const ringCanvas = document.createElement("canvas");
  ringCanvas.width = sourceCanvas.width;
  ringCanvas.height = sourceCanvas.height;
  const ringContext = ringCanvas.getContext("2d");
  if (!ringContext) return "";

  ringContext.filter = `blur(${SELECTION_RING_BLUR}px)`;
  ringContext.globalAlpha = 0.68;
  ringContext.drawImage(coreCanvas, 0, 0);
  ringContext.filter = "none";
  ringContext.globalAlpha = 0.92;
  ringContext.drawImage(coreCanvas, 0, 0);

  // 删除原裁片 alpha，只保留外侧 3-6px 的提示圈，避免改变裁片自身颜色和材质。
  ringContext.globalAlpha = 1;
  ringContext.globalCompositeOperation = "destination-out";
  ringContext.drawImage(cutoutCanvas, 0, 0);
  return ringCanvas.toDataURL("image/png");
}

function scheduleSelectionRingRender() {
  if (scheduleSelectionRingRender.pending) return;
  scheduleSelectionRingRender.pending = true;
  window.requestAnimationFrame(() => {
    scheduleSelectionRingRender.pending = false;
    render();
  });
}

function selectionRingForSource(source) {
  const cached = selectionRingCache.get(source);
  if (cached?.status === "ready") return cached.url;
  if (cached?.status === "pending" || cached?.status === "error") return "";

  const record = { status: "pending", url: "" };
  record.promise = createSelectionRingDataUrl(source)
    .then((url) => {
      record.status = url ? "ready" : "error";
      record.url = url;
      scheduleSelectionRingRender();
      return url;
    })
    .catch(() => {
      record.status = "error";
      return "";
    });
  selectionRingCache.set(source, record);
  return "";
}

function selectionRingMarkup(component, sources, layerIndex, isSelected) {
  if (!isSelected) return "";
  return sources
    .map((source) => {
      const ringSource = selectionRingForSource(source);
      if (!ringSource) return "";
      return `<img class="mvp-selection-ring is-selected" src="${escapeHtml(ringSource)}" alt="" aria-hidden="true" draggable="false" style="--layer-index:${layerIndex};" data-part="${component.id}" data-source="${escapeHtml(source)}" />`;
    })
    .join("");
}

function componentLayerMarkup(component, item = product(), angle = angleAssets(currentAngleConfig(item).id), options = {}) {
  const config = componentConfigFor(item, component.id);
  const isSelected = options.showSelection !== false && isPartSelectionVisible() && item.id === state.productId && component.id === state.selectedPartId;
  const selected = isSelected ? "is-selected" : "";
  const layerIndex = component.renderOrder || 1;
  const option = fixedOption(component, config);

  if (option && !component.fixedColorOptions) {
    const fixedImage = fixedImageForAngle(component, config, angle);
    if (!fixedImage) return "";
    return `
      ${selectionRingMarkup(component, [fixedImage], layerIndex, isSelected)}
      <img class="mvp-fixed-image ${selected}" src="${escapeHtml(fixedImage)}" alt="" aria-hidden="true" draggable="false" style="--layer-index:${layerIndex};" data-part="${component.id}" />`;
  }

  const material = cssTexture(config.color, config.material);
  if (angle.parts && !angle.parts[component.id]) return "";
  const masks = angle.parts?.[component.id] ? [angle.parts[component.id]] : (component.masks || []);
  return masks
    .map((mask) => {
      const layerStyle = `--layer-index:${layerIndex};--part-material:${escapeHtml(material)};mask-image:url('${escapeHtml(mask)}');-webkit-mask-image:url('${escapeHtml(mask)}');`;
      return `
        ${selectionRingMarkup(component, [mask], layerIndex, isSelected)}
        <div class="mvp-upper-fill mvp-part-layer ${selected}" style="${layerStyle}" data-part="${component.id}" aria-hidden="true"></div>`;
    })
    .join("");
}

function shoeMarkup(item = product(), alt = `${productName(product())} ${t("preview")}`, angleOverrideId = "", options = {}) {
  const selectedAngle = angleOverrideId
    ? currentAngleConfig(item, angleOverrideId)
    : currentAngleConfig(item, item.id === state.productId ? state.angle : (item.defaultAngle || productAngles(item)[0]?.id || "side"));
  const angle = angleAssets(selectedAngle.id);
  const assets = { ...productAssets(item), base: angle.base, stitch: angle.stitch };
  return `
    <div class="mvp-shoe-frame">
      <img class="mvp-base-image" src="${escapeHtml(assets.base)}" alt="${escapeHtml(alt)}" draggable="false" />
      ${renderableComponents(item).map((component) => componentLayerMarkup(component, item, angle, options)).join("")}
      <img class="mvp-stitch-image" src="${escapeHtml(assets.stitch)}" alt="" aria-hidden="true" draggable="false" />
    </div>`;
}

function mvpShoeMarkup() {
  const item = product();
  return shoeMarkup(item, `${productName(item)} ${t("preview")}`);
}

function homeShoeMarkup(item = product()) {
  return shoeMarkup(item, `${productName(item)} ${t("preview")}`);
}

function realProductCarouselMarkup(item = product()) {
  const images = item.realProductImages || [];
  if (!images.length) return homeShoeMarkup(item);

  const secondsPerImage = 3;
  const carouselDuration = `${images.length * secondsPerImage}s`;
  const slides = images
    .map((image, index) => {
      const eagerAttrs = index === 0 ? ` loading="eager" fetchpriority="high"` : ` loading="lazy"`;
      return `<img class="real-product-slide" src="${escapeHtml(realProductAsset(image.file))}" alt="" draggable="false"${eagerAttrs} style="--carousel-delay:${index * secondsPerImage}s;" />`;
    })
    .join("");
  const dots = images
    .map((_, index) => `<span style="--carousel-delay:${index * secondsPerImage}s;"></span>`)
    .join("");

  return `
    <span class="real-product-carousel" aria-hidden="true" style="--carousel-duration:${carouselDuration};">
      ${slides}
      <span class="real-product-dots">${dots}</span>
    </span>`;
}

function renderHome() {
  const item = product();
  const assets = angleAssets(item.defaultAngle || productAngles(item)[0]?.id || "side");
  const productCount = Math.max(PRODUCT_CATALOG.length, 1);
  const productColumns = Math.min(productCount, 4);
  const productCardWidth = productColumns === 1 ? 420 : productColumns === 2 ? 360 : 320;
  const productGap = 18;

  els.homeProductTag.textContent = "Skate Studio";
  els.homeProductName.textContent = "Create your own skates";
  els.homeProductDescription.textContent = t("homeDescription");
  els.homeProductMeta.innerHTML = (item.homeFeatures || [item.code, "Layered 2.5D MVP"]).map((feature) => `<span>${escapeHtml(translateFeature(feature))}</span>`).join("");
  els.homeShoeArt.innerHTML = homeShoeMarkup();
  els.homeProductGrid.style.setProperty("--product-columns", productColumns);
  els.homeProductGrid.style.setProperty("--product-grid-width", `${productColumns * productCardWidth + (productColumns - 1) * productGap}px`);
  els.homeProductGrid.innerHTML = PRODUCT_CATALOG.map((catalogItem) => {
    const selected = catalogItem.id === state.productId;
    return `
      <button class="home-model-card" type="button" data-home-product="${catalogItem.id}" aria-pressed="${selected}" style="--accent-a:${catalogItem.accentA};--accent-b:${catalogItem.accentB};">
        <span class="home-card-title">${catalogItem.code}</span>
        <span class="home-card-thumb home-card-thumb--real">
          ${realProductCarouselMarkup(catalogItem)}
        </span>
        <span class="home-card-dot" aria-hidden="true"></span>
        <span class="home-card-body">
          <span class="home-card-kicker">${escapeHtml(translateFeature(catalogItem.homeLabel))}</span>
          <strong>${escapeHtml(productName(catalogItem))}</strong>
          <span>${escapeHtml(localized(catalogItem.description, catalogItem.description))}</span>
        </span>
        <span class="home-card-meta">${selected ? t("selected") : t("select")}</span>
      </button>`;
  }).join("");
  els.homeView.style.setProperty("--home-accent-a", item.accentA);
  els.homeView.style.setProperty("--home-accent-b", item.accentB);
  els.homeView.style.setProperty("--home-base-image", `url('${assets.base}')`);
}

function renderModelStrip() {
  els.modelStrip.innerHTML = PRODUCT_CATALOG.map(
    (item) => `
      <button class="model-pill" type="button" data-product="${item.id}" aria-pressed="${item.id === state.productId}" style="--thumb-a:${item.accentA};--thumb-b:${item.accentB};">
        <span>
          <strong>${productName(item)}</strong>
          <span>${t("proCustom")}</span>
        </span>
      </button>`
  ).join("");
}

function renderAngleTabs() {
  const tabs = productAngles();

  els.angleTabs.innerHTML = tabs
    .map(
      (tab) => `
      <button class="segment-button" type="button" role="tab" data-angle="${tab.id}" aria-selected="${tab.id === state.angle}">
        ${angleLabel(tab)}
      </button>`
    )
    .join("");
}

function renderParts() {
  const item = product();
  const currentAngle = currentAngleConfig(item);
  const angle = angleAssets(currentAngle.id);
  els.partRail.innerHTML = item.components
    .map((component) => {
      const config = componentConfig(component.id);
      const angleAvailable = componentHasLayerInAngle(component, item, angle);
      const disabled = !component.editable || !angleAvailable;
      const disabledReason = !component.editable ? t("noLayerConfigured") : t("noLayerCurrentAngle");
      return `
        <button class="part-button component-button rail-part-button ${disabled ? "is-disabled" : ""}" type="button" data-part="${component.id}" aria-pressed="${isPartSelectionVisible() && component.id === state.selectedPartId}" title="${component.code} · ${componentName(component)}" ${disabled ? "disabled aria-disabled=\"true\"" : ""}>
          <span>
            <strong>${componentName(component)}</strong>
            <span>${disabled ? disabledReason : component.en}</span>
          </span>
          <i style="--component-color:${componentPreview(component, config)}"></i>
        </button>`;
    })
    .join("");
}

function renderSwatches() {
  const colorBlock = els.swatchGrid.closest(".color-block");
  if (colorBlock) colorBlock.hidden = true;
  els.swatchGrid.innerHTML = "";
}

function renderMaterialSubChoices(component, config, material) {
  if (!shouldExpandMaterial(component, config, material)) return "";
  if (fabricStyleSetByMaterial(material.id).length) return renderFabricSetStyles(component, config, material);
  const title = component.fixedColorOptions ? t("color") : (component.fixedOptions ? t("materialOptions") : t("color"));
  return renderInlineSwatches(component, config, title);
}

function renderInlineSwatches(component, config, title) {
  const swatches = colorOptions(component)
    .map(
      (color) => `
        <button class="swatch-button" type="button" title="${color.name}" aria-label="${color.name}" aria-pressed="${color.value.toLowerCase() === (component.fixedColorOptions ? config.color : (config.variant || config.color)).toLowerCase()}" data-part-id="${component.id}" data-color="${color.value}" style="--swatch:${color.swatch || color.value};"></button>`
    )
    .join("");
  return `
    <div class="texture-subpanel" role="group" aria-label="${title}">
      <div class="texture-subtitle">${title}</div>
      <div class="swatch-grid swatch-grid--inline">${swatches}</div>
    </div>`;
}

function renderTextures() {
  const component = selectedComponent();
  const config = componentConfig();
  els.textureList.innerHTML = materialsFor(component)
    .map((material) => {
      const isSelected = isSelectedMaterial(component, config, material);
      return `
      <button class="texture-button" type="button" data-part-id="${component.id}" data-material="${material.id}" aria-pressed="${isSelected}">
        <span class="texture-preview" style="--texture:${texturePreview(component, config, material)};"></span>
        <span>
          <strong>${localizeTerm(material.name)}</strong>
          <span>${localizeTerm(material.note)}</span>
        </span>
        <span class="texture-check">${isSelected ? "✓" : ""}</span>
      </button>
      ${renderMaterialSubChoices(component, config, material)}`;
    })
    .join("");
}

function renderFabricSetStyles(component, config, material) {
  return fabricStyleSetByMaterial(material.id).map((style) => `
    <button class="texture-button texture-button--sub" type="button" data-part-id="${component.id}" data-fabric-style-parent="${material.id}" data-fabric-style="${style.id}" aria-pressed="${style.id === config.material}">
      <span class="texture-preview" style="--texture:${cssTexture(config.color, style.id)};"></span>
      <span>
        <strong>${localizeTerm(style.name)}</strong>
        <span>${localizeTerm(material.name)}${t("fixedTexture")}</span>
      </span>
      <span class="texture-check">${style.id === config.material ? "✓" : ""}</span>
    </button>`).join("");
}

function renderShoe() {
  els.shoeArt.innerHTML = mvpShoeMarkup();
  window.requestAnimationFrame(syncShoeFit);
}

function buildExportData(options = {}) {
  const item = product();
  const selectedEffect = effectAngleConfig(item);
  const currentAngle = currentAngleConfig(item);
  const includeImageData = options.includeImageData === true;
  const includeEffectSnapshots = options.includeEffectSnapshots === true && effectSnapshotsReady(item);
  return {
    version: APP_VERSION,
    product: productName(item),
    customer: { ...state.customer },
    effectPreview: {
      angle: angleLabel(selectedEffect),
      angleId: selectedEffect.id
    },
    components: item.components.map((component) => {
      const config = componentConfig(component.id);
      return {
        code: component.code,
        component: component.en,
        name: componentName(component),
        color: colorName(config.color, component),
        colorValue: componentColorValue(component, config),
        material: materialName(config.material, component)
      };
    }),
    fixedItems: item.fixedItems.map((entry) => ({ ...entry, code: entry.code || "", name: fixedItemName(entry), value: fixedItemValue(entry) })),
    padStyle: item.padStyles.find((style) => style.id === state.config[state.productId].padStyle)?.name || "",
    embroidery: item.embroiderySlots.map((slot) => {
      const image = state.config[state.productId].embroidery[slot.id].image;
      return {
        code: slot.code,
        name: slotName(slot),
        enabled: state.config[state.productId].embroidery[slot.id].enabled,
        text: state.config[state.productId].embroidery[slot.id].text,
        image: image
          ? {
              name: image.name,
              size: image.size,
              type: image.type,
              ...(includeImageData ? { dataUrl: image.dataUrl } : {})
            }
          : null
      };
    }),
    ...(includeEffectSnapshots
      ? {
          effectSnapshots: {
            createdAt: effectSnapshotRecord.createdAt,
            previews: effectSnapshotRecord.previews.map((preview) => ({
              id: preview.id,
              label: angleLabel(preview),
              dataUrl: preview.dataUrl
            }))
          }
        }
      : {}),
    note: localized(item.note, item.note)
  };
}

const REQUIRED_CUSTOMER_FIELDS = [
  ["name", "name"],
  ["phone", "phone"],
  ["email", "email"],
  ["footLength", "footLength"],
  ["size", "size"]
];

function isValidEmail(value) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(value || "").trim());
}

function missingCustomerFields() {
  const missing = REQUIRED_CUSTOMER_FIELDS
    .filter(([key]) => !String(state.customer[key] || "").trim())
    .map(([, labelKey]) => t(labelKey));
  if (state.customer.email && !isValidEmail(state.customer.email)) missing.push(t("emailInvalid"));
  return missing;
}

function customerInfoComplete() {
  return missingCustomerFields().length === 0;
}

function renderSummary() {
  const item = product();
  const component = selectedComponent();
  const config = componentConfig();
  const output = {
    version: APP_VERSION,
    product: item.id,
    selectedPart: component.code,
    color: colorName(config.color),
    colorValue: componentColorValue(component, config),
    material: materialName(config.material, component)
  };

  els.modelName.textContent = productName(item);
  els.modelDescription.textContent = localized(item.description, item.description);
  els.angleMeta.textContent = angleMeta(currentAngleConfig(item)) || t("effectImage", { angle: angleLabel(currentAngleConfig(item)) });
  els.modelMeta.textContent = `${item.code} · ${t("partCount", { count: item.components.filter((part) => part.editable).length })}`;
  els.selectedPartLabel.textContent = isPartSelectionVisible() ? `${component.code} · ${componentName(component)}` : "";
  els.selectedPartTitle.textContent = t("editingPart", { part: componentName(component) });
  els.selectedColorName.textContent = colorName(config.color);
  els.selectedTextureName.textContent = materialName(config.material, component);
  els.configPreview.textContent = JSON.stringify(output, null, 2);
}

function render() {
  normalizeAngleForProduct();
  normalizeSelectedPartForAngle();
  const isHome = state.view === "home";
  document.body.dataset.view = state.view;
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  els.homeView.classList.toggle("is-hidden", !isHome);
  els.workspace.classList.toggle("is-hidden", isHome);
  els.homeButton.hidden = isHome;
  els.resetButton.hidden = isHome;
  els.saveButton.hidden = isHome;
  els.languageToggleButton.textContent = state.language === "zh" ? "EN" : t("languageChineseShort");
  els.languageToggleButton.setAttribute("aria-label", state.language === "zh" ? t("switchToEnglish") : t("switchToChinese"));
  els.homeButton.textContent = t("home");
  els.resetButton.title = t("resetTitle");
  els.saveButton.textContent = t("savePlan");
  els.customizerToggleButton.textContent = state.isCustomizerOpen ? t("collapsePanel") : t("expandPanel");
  els.drawerCloseButton.title = t("close");
  document.querySelector('.home-picker .section-title h3').textContent = t("chooseProduct");
  document.querySelector('.home-picker .section-title span').textContent = t("publishedFromB");
  document.querySelector('.selected-part-card .eyebrow').textContent = t("selectedPart");
  document.querySelector('.color-block .section-title h3').textContent = t("color");
  document.querySelector('.texture-block .section-title h3').textContent = t("materialOptions");
  document.querySelector('.summary-block .section-title h3').textContent = t("config");
  els.copyConfigButton.textContent = t("copyJson");
  document.querySelector('.part-rail-block .section-title h3').textContent = t("parts");
  els.pageEyebrow.textContent = isHome ? "Skate Studio" : t("customizer");
  els.pageTitle.textContent = isHome ? "Freestyle CIM" : productName(product());
  renderHome();
  renderModelStrip();
  renderAngleTabs();
  renderParts();
  renderSwatches();
  renderTextures();
  renderShoe();
  renderSummary();
  syncCustomizerState();
  window.requestAnimationFrame(syncShoeFit);
}

function setProduct(id) {
  state.productId = id;
  normalizeAngleForProduct(product());
  state.selectedPartId = activePartId(product());
  state.selectedEffectAngle = currentAngleConfig(product()).id;
  state.isCustomizerOpen = defaultCustomizerOpen();
  if (!state.config[id]) state.config[id] = cloneProductConfig(product());
  render();
}

function updateSelectedPart(patch) {
  updatePartConfig(state.selectedPartId, patch);
}

function updatePartConfig(partId, patch) {
  if (!state.config[state.productId]?.components?.[partId]) return;
  state.config[state.productId].components[partId] = {
    ...state.config[state.productId].components[partId],
    ...patch
  };
  render();
}

function updatePartConfigPreservingCustomizerScroll(partId, patch) {
  const scroller = els.customizerScroll;
  const scrollTop = scroller?.scrollTop ?? 0;
  updatePartConfig(partId, patch);
  if (!scroller) return;
  scroller.scrollTop = scrollTop;
  window.requestAnimationFrame(() => {
    scroller.scrollTop = scrollTop;
  });
}

function resetProduct() {
  state.config[state.productId] = cloneProductConfig(product());
  state.selectedPartId = activePartId();
  state.selectedEffectAngle = currentAngleConfig(product()).id;
  state.isCustomizerOpen = defaultCustomizerOpen();
  render();
  toast(t("resetDone"));
}

async function openEffectPickerModal() {
  // 表单信息先完成，再进入最终效果图确认，确保下载表格使用的是最终选择视角。
  state.selectedEffectAngle = currentAngleConfig(product(), state.angle).id;
  let modal = document.querySelector("#effectPickerModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "effectPickerModal";
    modal.className = "confirm-modal effect-picker-modal";
    document.body.appendChild(modal);
  }
  effectSnapshotRecord = null;
  const requestId = effectSnapshotRequestId + 1;
  effectSnapshotRequestId = requestId;
  modal.innerHTML = renderEffectPickerModal();
  modal.classList.add("is-visible");

  const snapshots = await buildEffectSnapshotRecord(product());
  if (requestId !== effectSnapshotRequestId || !modal.classList.contains("is-visible")) return;
  effectSnapshotRecord = snapshots;
  modal.innerHTML = renderEffectPickerModal();
}

function closeEffectPickerModal() {
  document.querySelector("#effectPickerModal")?.classList.remove("is-visible");
  cancelConfirmationSheetGeneration();
  clearEffectSnapshots();
}

function returnToConfirmModal() {
  // 返回表单属于确认流程内的上一步；即使外部导航让页面状态漂回首页，也要先恢复到定制器再展示表单。
  closeEffectPickerModal();
  if (state.view === "home") {
    state.view = "builder";
    state.isCustomizerOpen = defaultCustomizerOpen();
    render();
  }
  openConfirmModal();
}

function refreshEffectPickerModal() {
  const modal = document.querySelector("#effectPickerModal");
  if (!modal?.classList.contains("is-visible")) return;
  modal.innerHTML = renderEffectPickerModal();
}

function effectOptionThumbMarkup(item, angle) {
  const snapshot = effectSnapshotForAngle(angle.id, item);
  if (snapshot?.dataUrl) {
    return `<img class="effect-option-thumb-image" src="${escapeHtml(snapshot.dataUrl)}" alt="${escapeHtml(`${productName(item)} ${t("effectImage", { angle: angleLabel(angle) })}`)}" draggable="false" />`;
  }
  const assets = angleAssets(angle.id);
  return `<img class="effect-option-thumb-image" src="${escapeHtml(assets.base)}" alt="${escapeHtml(`${productName(item)} ${t("effectImage", { angle: angleLabel(angle) })}`)}" loading="lazy" draggable="false" />`;
}

function renderEffectPickerModal() {
  const item = product();
  const selectedEffect = effectAngleConfig(item);
  const selectedSnapshot = effectSnapshotForAngle(selectedEffect.id, item);
  const angles = productAngles(item);

  return `
    <div class="confirm-backdrop" data-close-effect></div>
    <section class="effect-dialog" role="dialog" aria-modal="true" aria-labelledby="effectPickerTitle">
      <header class="confirm-header effect-header">
        <div>
          <p class="eyebrow">Preview</p>
          <h2 id="effectPickerTitle">${t("confirmEffect")}</h2>
        </div>
        <button class="icon-button" type="button" data-close-effect title="${t("close")}">×</button>
      </header>

      <div class="effect-body">
        <section class="effect-preview-panel">
          <div class="section-title">
            <h3>${t("effectImage", { angle: angleLabel(selectedEffect) })}</h3>
            <span>${productName(item)}</span>
          </div>
          <div class="effect-preview-frame">
            ${
              selectedSnapshot?.dataUrl
                ? `<img class="effect-preview-snapshot" src="${escapeHtml(selectedSnapshot.dataUrl)}" alt="${escapeHtml(`${productName(item)} ${t("effectImage", { angle: angleLabel(selectedEffect) })}`)}" draggable="false" />`
                : `<div class="effect-preview-loading">${t("generatingEffect")}</div>`
            }
          </div>
        </section>

        <section class="effect-choice-panel">
          <div class="section-title">
            <h3>${t("effectAngle")}</h3>
            <span>${t("effectHint")}</span>
          </div>
          <div class="effect-option-grid">
            ${angles
              .map(
                (angle) => `
                  <button class="effect-option-card" type="button" data-effect-angle="${angle.id}" aria-pressed="${angle.id === selectedEffect.id}">
                    <span class="effect-option-thumb">
                      ${effectOptionThumbMarkup(item, angle)}
                    </span>
                    <span>
                      <strong>${t("effectImage", { angle: angleLabel(angle) })}</strong>
                      <span>${angleMeta(angle) || t("effectImage", { angle: angleLabel(angle) })}</span>
                    </span>
                  </button>`
              )
              .join("")}
          </div>
        </section>
      </div>

      <footer class="confirm-actions">
        ${isConfirmationSheetGenerating ? `<span class="confirm-action-status">${t("generatingSheetStatus")}</span>` : ""}
        <button class="glass-button" type="button" data-back-confirm>${t("backToForm")}</button>
        <button class="primary-button" type="button" data-download-sheet ${isConfirmationSheetGenerating ? "disabled aria-busy=\"true\"" : ""}>${isConfirmationSheetGenerating ? t("generating") : t("generateConfirmation")}</button>
      </footer>
    </section>
  `;
}

function openConfirmModal() {
  let modal = document.querySelector("#confirmModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "confirmModal";
    modal.className = "confirm-modal";
    document.body.appendChild(modal);
  }
  modal.innerHTML = renderConfirmModal();
  modal.classList.add("is-visible");
}

function closeConfirmModal() {
  document.querySelector("#confirmModal")?.classList.remove("is-visible");
}

function refreshConfirmModal() {
  const modal = document.querySelector("#confirmModal");
  if (!modal?.classList.contains("is-visible")) return;
  modal.innerHTML = renderConfirmModal();
}

function refreshConfirmCustomerValidation() {
  const modal = document.querySelector("#confirmModal");
  if (!modal?.classList.contains("is-visible")) return;
  const missingFields = missingCustomerFields();
  const canReviewEffect = missingFields.length === 0;
  let hint = modal.querySelector("[data-customer-required-hint]");
  if (!canReviewEffect) {
    if (!hint) {
      hint = document.createElement("p");
      hint.className = "confirm-required-hint";
      hint.dataset.customerRequiredHint = "";
      modal.querySelector(".confirm-info-section .section-title")?.insertAdjacentElement("afterend", hint);
    }
    hint.textContent = t("fillFirst", { fields: missingFields.join(state.language === "en" ? ", " : "、") });
  } else {
    hint?.remove();
  }
  const nextButton = modal.querySelector("[data-review-effect]");
  if (!nextButton) return;
  nextButton.disabled = !canReviewEffect;
  nextButton.setAttribute("aria-disabled", String(!canReviewEffect));
}

function renderConfirmModal() {
  const data = buildExportData();
  const missingFields = missingCustomerFields();
  const canReviewEffect = missingFields.length === 0;
  return `
    <div class="confirm-backdrop" data-close-confirm></div>
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <header class="confirm-header">
        <div>
          <p class="eyebrow">Form</p>
          <h2 id="confirmTitle">${t("fillCustomInfo")}</h2>
        </div>
        <button class="icon-button" type="button" data-close-confirm title="${t("close")}">×</button>
      </header>

      <div class="confirm-body">
        <section class="confirm-section confirm-info-section">
          <div class="section-title">
            <h3>${t("personalInfo")}</h3>
            <span>${t("formHint")}</span>
          </div>
          ${canReviewEffect ? "" : `<p class="confirm-required-hint" data-customer-required-hint>${escapeHtml(t("fillFirst", { fields: missingFields.join(state.language === "en" ? ", " : "、") }))}</p>`}
          <div class="field-grid">
            <label>${t("name")}<input data-customer="name" required value="${escapeHtml(state.customer.name)}" placeholder="name" /></label>
            <label>${t("phone")}<input data-customer="phone" required type="tel" inputmode="tel" value="${escapeHtml(state.customer.phone)}" placeholder="phone" /></label>
            <label>${t("email")}<input data-customer="email" required type="email" inputmode="email" value="${escapeHtml(state.customer.email)}" placeholder="email" /></label>
            <label>${t("date")}<input data-customer="date" type="date" value="${escapeHtml(state.customer.date)}" /></label>
            <label>${t("footLength")}<input data-customer="footLength" required value="${escapeHtml(state.customer.footLength)}" placeholder="foot length" /></label>
            <label>${t("size")}<input data-customer="size" required value="${escapeHtml(state.customer.size)}" placeholder="size" /></label>
          </div>
        </section>

        <section class="confirm-section confirm-color-section">
          <div class="section-title">
            <h3>${t("colorSelection")}</h3>
            <span>${t("partCount", { count: data.components.length })}</span>
          </div>
          <div class="confirm-table">
            <div class="confirm-row confirm-row-head">
              <span>${t("no")}</span><span>${t("part")}</span><span>${t("color")}</span><span>${t("leather")}</span>
            </div>
            ${data.components
              .map(
                (part) => `
                  <button class="confirm-row" type="button" data-confirm-part="${part.code}">
                    <span>${part.code}</span><span>${part.name}</span><span>${part.color}</span><span>${part.material}</span>
                  </button>`
              )
              .join("")}
          </div>
        </section>

        <section class="confirm-section confirm-special-section">
          <div class="section-title">
            <h3>${t("specialCustom")}</h3>
            <span>${t("embroideryFixed")}</span>
          </div>
          <div class="embroidery-list">
            ${product().embroiderySlots
              .map((slot) => {
                const slotConfig = state.config[state.productId].embroidery[slot.id];
                return `
                  <div class="embroidery-card">
                    <label class="embroidery-row">
                      <input type="checkbox" data-embroidery-toggle="${slot.id}" ${slotConfig.enabled ? "checked" : ""} />
                      <span class="component-code">${slot.code}</span>
                      <span>${slotName(slot)}</span>
                      <input type="text" data-embroidery-text="${slot.id}" value="${escapeHtml(slotConfig.text)}" placeholder="${t("textLogoNote")}" />
                    </label>
                    <div class="embroidery-upload-row">
                      <label class="embroidery-upload ${slotConfig.image ? "has-image" : ""}">
                        <input type="file" accept="image/*" hidden data-embroidery-image="${slot.id}" />
                        ${
                          slotConfig.image?.dataUrl
                            ? `<img src="${escapeHtml(slotConfig.image.dataUrl)}" alt="${escapeHtml(`${slotName(slot)} ${t("referenceImage")}`)}" />`
                            : `<span class="embroidery-thumb-placeholder">${t("image")}</span>`
                        }
                        <span>
                          <strong>${escapeHtml(slotConfig.image?.name || t("uploadImage"))}</strong>
                          <em>${escapeHtml(slotConfig.image?.size || t("logoReference"))}</em>
                        </span>
                      </label>
                      ${slotConfig.image ? `<button class="text-button embroidery-remove" type="button" data-remove-embroidery-image="${slot.id}">${t("remove")}</button>` : ""}
                    </div>
                  </div>`;
              })
              .join("")}
          </div>
          <div class="fixed-list">
            ${product().fixedItems
              .map(
                (item) => `
                  <div>
                    <strong>${fixedItemName(item)}</strong>
                    <span>${state.language === "en" ? item.cn : item.en}</span>
                    <em>${item.value}</em>
                  </div>`
              )
              .join("")}
          </div>
        </section>
      </div>

      <footer class="confirm-actions">
        <button class="glass-button" type="button" data-close-confirm>${t("keepEditing")}</button>
        <button class="primary-button" type="button" data-review-effect ${canReviewEffect ? "" : "disabled aria-disabled=\"true\""}>${t("nextConfirmEffect")}</button>
      </footer>
    </section>
  `;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handleEmbroideryImageInput(input) {
  const slotId = input.dataset.embroideryImage;
  const file = input.files?.[0];
  input.value = "";
  if (!slotId || !file) return;
  if (!file.type.startsWith("image/")) {
    toast(t("uploadImageFile"));
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast(t("imageTooLarge"));
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const slotConfig = state.config[state.productId].embroidery[slotId];
    if (!slotConfig) return;
    slotConfig.enabled = true;
    slotConfig.image = {
      name: file.name,
      size: formatBytes(file.size),
      type: file.type,
      dataUrl
    };
    refreshConfirmModal();
    toast(t("imageAdded"));
  } catch {
    toast(t("imageReadFailed"));
  }
}

function confirmationSheetStyles() {
  return `
    :root {
      color-scheme: light;
      --ink: #1d1d1f;
      --muted: #6e6e73;
      --line: #d8dce2;
      --paper: #ffffff;
      --soft: #f5f7fa;
      --blue: #0071e3;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef1f5;
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.5;
    }
    .sheet-shell {
      width: min(1080px, calc(100vw - 24px));
      margin: 18px auto 40px;
      padding: 28px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--paper);
      box-shadow: 0 20px 60px rgba(16, 24, 40, 0.12);
    }
    .sheet-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin: -28px -28px 22px;
      padding: 12px 18px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
    }
    .sheet-toolbar button {
      min-height: 36px;
      padding: 0 14px;
      border: 0;
      border-radius: 8px;
      background: var(--blue);
      color: #fff;
      font-weight: 750;
      cursor: pointer;
    }
    .sheet-header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 18px;
      align-items: end;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--ink);
    }
    .sheet-kicker {
      margin: 0 0 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 {
      margin-bottom: 4px;
      font-size: clamp(28px, 5vw, 44px);
      line-height: 1.05;
      letter-spacing: 0;
    }
    h2 {
      margin-bottom: 12px;
      font-size: 22px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    .sheet-meta {
      display: grid;
      gap: 5px;
      min-width: 190px;
      color: var(--muted);
      font-size: 13px;
      text-align: right;
    }
    .sheet-section {
      margin-top: 24px;
      break-inside: avoid;
    }
    .sheet-preview-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .sheet-preview-label {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 700;
      color: var(--muted);
      text-align: center;
    }
    .sheet-preview-card {
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: linear-gradient(180deg, #fbfcff, #f4f7fb);
    }
    .sheet-shoe-art {
      width: min(100%, 860px);
      aspect-ratio: 2401 / 1601;
      margin: 0 auto;
    }
    .sheet-preview-image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    }
    .sheet-preview-empty {
      display: grid;
      min-height: 180px;
      place-items: center;
      color: var(--muted);
      font-weight: 700;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .info-item,
    .fixed-card,
    .image-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--soft);
      padding: 12px;
    }
    .info-item span,
    .fixed-card span,
    .image-card span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }
    .info-item strong,
    .fixed-card strong,
    .image-card strong {
      display: block;
      margin-top: 4px;
      font-size: 15px;
      overflow-wrap: anywhere;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 10px;
      font-size: 13px;
    }
    th, td {
      padding: 10px 9px;
      border-bottom: 1px solid var(--line);
      border-right: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    th {
      background: #eaf2ff;
      font-size: 12px;
      font-weight: 800;
    }
    tr:last-child td { border-bottom: 0; }
    th:last-child, td:last-child { border-right: 0; }
    .fixed-grid,
    .image-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .image-card img {
      display: block;
      width: 100%;
      max-height: 220px;
      margin-top: 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      object-fit: contain;
      background: #fff;
    }
    .sheet-note {
      padding: 14px;
      border-left: 4px solid var(--blue);
      background: #f3f8ff;
      color: #303034;
    }
    @media (max-width: 720px) {
      .sheet-shell {
        width: 100%;
        margin: 0;
        padding: 18px;
        border: 0;
        border-radius: 0;
      }
      .sheet-toolbar { margin: -18px -18px 18px; }
      .sheet-header {
        grid-template-columns: 1fr;
        align-items: start;
      }
      .sheet-meta { text-align: left; }
      .info-grid,
      .fixed-grid,
      .image-grid,
      .sheet-preview-grid {
        grid-template-columns: 1fr;
      }
      table { font-size: 12px; }
      th, td { padding: 8px 6px; }
    }
    @media print {
      body { background: #fff; }
      .sheet-shell {
        width: 100%;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
      .sheet-toolbar { display: none; }
      .sheet-section { break-inside: avoid; }
      .sheet-preview-card,
      .info-item,
      .fixed-card,
      .image-card {
        background: #fff;
      }
    }
  `;
}

function tableRows(rows) {
  return rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell || "-")}</td>`).join("")}</tr>`)
    .join("");
}

function buildConfirmationSheetHtml(data) {
  const item = product();
  const locale = state.language === "en" ? "en-US" : "zh-CN";
  const generatedAt = new Date().toLocaleString(locale, { hour12: false });
  const baseHref = document.baseURI || window.location.href;
  const allAnglePreviews = data.effectSnapshots?.previews?.length
    ? data.effectSnapshots.previews
    : productAngles(item).map((angle) => ({ id: angle.id, label: angleLabel(angle), dataUrl: "" }));
  const embroideryImages = data.embroidery.filter((entry) => entry.image?.dataUrl);
  const customerRows = [
    [t("name"), data.customer.name || "-"],
    [t("phone"), data.customer.phone || "-"],
    [t("email"), data.customer.email || "-"],
    [t("date"), data.customer.date || "-"],
    [t("footLength"), data.customer.footLength || "-"],
    [t("size"), data.customer.size || "-"]
  ];
  const componentRows = data.components.map((part) => [part.code, part.component, part.name, `${part.color} ${part.colorValue}`, part.material]);
  const embroideryRows = data.embroidery.map((entry) => [
    entry.code,
    entry.name,
    entry.enabled ? t("enabled") : t("disabled"),
    entry.text || "-",
    entry.image ? `${entry.image.name} (${entry.image.size})` : "-"
  ]);

  return `<!doctype html>
<html lang="${state.language === "en" ? "en" : "zh-CN"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="${escapeHtml(baseHref)}" />
    <title>${escapeHtml(data.product)} ${t("customConfirmationSheet")}</title>
    <style>${confirmationSheetStyles()}</style>
  </head>
  <body>
    <main class="sheet-shell">
      <div class="sheet-toolbar">
        <button type="button" onclick="window.print()">${t("printPdf")}</button>
      </div>
      <header class="sheet-header">
        <div>
          <p class="sheet-kicker">Skate Studio</p>
          <h1>${t("customConfirmationSheet")}</h1>
          <p>${escapeHtml(data.product)} · ${t("threeViewFinal")}</p>
        </div>
        <div class="sheet-meta">
          <span>${t("version")}：${escapeHtml(data.version)}</span>
          <span>${t("generatedAt")}：${escapeHtml(generatedAt)}</span>
          <span>${t("customer")}：${escapeHtml(data.customer.name || "-")}</span>
        </div>
      </header>

      <section class="sheet-section">
        <h2>${t("finalEffect")}</h2>
        <div class="sheet-preview-grid">
          ${allAnglePreviews.map((preview) => `
            <div class="sheet-preview-card">
              <p class="sheet-preview-label">${escapeHtml(t("effectImage", { angle: preview.label }))}</p>
              <div class="sheet-shoe-art">
                ${
                  preview.dataUrl
                    ? `<img class="sheet-preview-image" src="${escapeHtml(preview.dataUrl)}" alt="${escapeHtml(`${data.product} ${t("effectImage", { angle: preview.label })}`)}" />`
                    : `<div class="sheet-preview-empty">${t("effectFailed")}</div>`
                }
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="sheet-section">
        <h2>${t("personalInfo")}</h2>
        <div class="info-grid">
          ${customerRows.map(([label, value]) => `<div class="info-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
        </div>
      </section>

      <section class="sheet-section">
        <h2>${t("colorSelection")}</h2>
        <table aria-label="${t("colorSelection")}">
          <thead>
            <tr><th>${t("no")}</th><th>Component</th><th>${t("part")}</th><th>${t("color")}</th><th>${t("leather")}</th></tr>
          </thead>
          <tbody>${tableRows(componentRows)}</tbody>
        </table>
      </section>

      <section class="sheet-section">
        <h2>${t("specialCustom")}</h2>
        <div class="info-grid">
          ${data.padStyle ? `<div class="info-item"><span>L1</span><strong>${escapeHtml(data.padStyle)}</strong></div>` : ""}
        </div>
        <table aria-label="${t("embroideryFixed")}">
          <thead>
            <tr><th>${t("part")}</th><th>${t("name")}</th><th>${t("enabled")}</th><th>${t("textLogoNote")}</th><th>${t("image")}</th></tr>
          </thead>
          <tbody>${tableRows(embroideryRows)}</tbody>
        </table>
      </section>

      ${
        embroideryImages.length
          ? `<section class="sheet-section">
              <h2>${t("uploadImage")}</h2>
              <div class="image-grid">
                ${embroideryImages
                  .map(
                    (entry) => `<div class="image-card">
                      <span>${escapeHtml(entry.code)} · ${escapeHtml(entry.name)}</span>
                      <strong>${escapeHtml(entry.image.name)} (${escapeHtml(entry.image.size)})</strong>
                      <img src="${escapeHtml(entry.image.dataUrl)}" alt="${escapeHtml(`${entry.name} ${t("referenceImage")}`)}" />
                    </div>`
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }

      <section class="sheet-section">
        <h2>${t("fixedItems")}</h2>
        <div class="fixed-grid">
          ${data.fixedItems.map((entry) => `<div class="fixed-card"><span>${escapeHtml(entry.code || "")}</span><strong>${escapeHtml(entry.name || fixedItemName(entry))}：${escapeHtml(entry.value || fixedItemValue(entry))}</strong></div>`).join("")}
        </div>
      </section>

      <section class="sheet-section">
        <h2>Note</h2>
        <div class="sheet-note">${escapeHtml(data.note || "-")}</div>
      </section>
    </main>
  </body>
</html>`;
}

function confirmationSheetFileName(data) {
  const customer = data.customer.name || "customer";
  return `${data.product}-${customer}-confirmation.html`.replace(/[\\/:*?"<>|]/g, "-");
}

function downloadConfirmationSheetFallback(html, fileName) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function selectedEffectSnapshotData(item = product()) {
  return effectSnapshotForAngle(effectAngleConfig(item).id, item)?.dataUrl || "";
}

function quickColorSummary(data) {
  return data.components
    .filter((entry) => entry.color && entry.color !== "-" && entry.material && entry.material !== t("materialFixedImage"))
    .slice(0, 6);
}

function quickCustomSummary(data) {
  const embroidery = data.embroidery
    .filter((entry) => entry.enabled && (entry.text || entry.image))
    .map((entry) => `${entry.code} ${entry.text || entry.image?.name || t("uploadImage")}`);
  return [data.padStyle ? `L1: ${data.padStyle}` : "", ...embroidery].filter(Boolean);
}

function renderQuickConfirmationCard(data, imageDataUrl) {
  const colorRows = quickColorSummary(data);
  const customRows = quickCustomSummary(data);
  const isLocalOutboxSent = confirmationEmailState === "sent" && confirmationEmailTransport === "local-outbox";
  const sendLabel = confirmationEmailState === "sending" ? t("sending") : confirmationEmailState === "sent" ? (isLocalOutboxSent ? t("saved") : t("sent")) : t("confirmAndSend");
  const statusText = confirmationEmailState === "sending"
    ? t("sendingStatus")
    : confirmationEmailState === "sent"
      ? (isLocalOutboxSent ? t("savedOutbox") : t("sentDone"))
      : (confirmationEmailMessage || t("sendIntro"));
  return `
    <div class="confirm-backdrop" data-close-preview></div>
    <div class="confirm-dialog quick-confirm-dialog">
      <header class="quick-confirm-header">
        <div>
          <p class="eyebrow">${t("quickCheck")}</p>
          <h3>${t("quickConfirm")}</h3>
        </div>
        <button class="icon-button" type="button" data-close-preview title="${t("close")}">×</button>
      </header>

      <div class="quick-confirm-body">
        <section class="quick-confirm-card">
          <div class="quick-confirm-hero">
            ${imageDataUrl
              ? `<img class="quick-confirm-image" src="${escapeHtml(imageDataUrl)}" alt="${escapeHtml(`${data.product} ${t("finalEffect")}`)}" draggable="false" />`
              : `<div class="sheet-preview-empty">${t("effectFailed")}</div>`
            }
          </div>
          <div class="quick-confirm-copy">
            <span class="quick-confirm-pill">${escapeHtml(t("effectImage", { angle: data.effectPreview.angle }))}</span>
            <h4>${escapeHtml(data.product)}</h4>
            <div class="quick-info-grid">
              <div><span>${t("name")}</span><strong>${escapeHtml(data.customer.name || "-")}</strong></div>
              <div><span>${t("phone")}</span><strong>${escapeHtml(data.customer.phone || "-")}</strong></div>
              <div><span>${t("email")}</span><strong>${escapeHtml(data.customer.email || "-")}</strong></div>
              <div><span>${t("size")}</span><strong>${escapeHtml(data.customer.size || "-")}</strong></div>
              <div><span>${t("footLength")}</span><strong>${escapeHtml(data.customer.footLength || "-")}</strong></div>
            </div>
          </div>
        </section>

        <section class="quick-confirm-section">
          <h4>${t("colorSummary")}</h4>
          <div class="quick-summary-list">
            ${colorRows.length
              ? colorRows.map((entry) => `<div><span>${escapeHtml(entry.code)} · ${escapeHtml(entry.name)}</span><strong>${escapeHtml(entry.color)} / ${escapeHtml(entry.material)}</strong></div>`).join("")
              : `<div><span>${t("noColorSummary")}</span><strong>-</strong></div>`
            }
          </div>
        </section>

        <section class="quick-confirm-section">
          <h4>${t("specialCustom")}</h4>
          <div class="quick-summary-list">
            ${customRows.length
              ? customRows.map((entry) => `<div><span>${escapeHtml(entry)}</span><strong>${t("recorded")}</strong></div>`).join("")
              : `<div><span>${t("noSpecialCustom")}</span><strong>-</strong></div>`
            }
          </div>
        </section>

        <div class="quick-send-status" data-send-status="${confirmationEmailState}">${statusText}</div>
      </div>

      <footer class="confirm-actions quick-confirm-actions">
        <button class="glass-button" type="button" data-back-confirm>${t("backEdit")}</button>
        <button class="glass-button" type="button" data-view-full-sheet>${t("viewFullSheet")}</button>
        <button class="primary-button" type="button" data-send-confirmation ${confirmationEmailState !== "idle" ? "disabled" : ""} ${confirmationEmailState === "sending" ? "aria-busy=\"true\"" : ""}>${sendLabel}</button>
      </footer>
    </div>
  `;
}

async function buildConfirmationSheetDocument() {
  if (!effectSnapshotsReady(product())) {
    effectSnapshotRecord = await buildEffectSnapshotRecord(product());
  }
  const data = buildExportData({ includeImageData: true, includeEffectSnapshots: true });
  return {
    data,
    html: await buildConfirmationSheetHtml(data)
  };
}

async function downloadSheet() {
  if (isConfirmationSheetGenerating) return;
  const requestId = confirmationSheetRequestId + 1;
  confirmationSheetRequestId = requestId;
  isConfirmationSheetGenerating = true;
  confirmationEmailState = "idle";
  confirmationEmailTransport = "outbox";
  confirmationEmailMessage = "";
  refreshEffectPickerModal();

  try {
    if (!effectSnapshotsReady(product())) {
      effectSnapshotRecord = await buildEffectSnapshotRecord(product());
    }
    const data = buildExportData({ includeImageData: false, includeEffectSnapshots: false });
    const imageDataUrl = selectedEffectSnapshotData(product());
    if (requestId !== confirmationSheetRequestId) return;

    let modal = document.querySelector("#confirmationPreviewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "confirmationPreviewModal";
      modal.className = "confirm-modal";
      document.body.appendChild(modal);
    }
    modal.innerHTML = renderQuickConfirmationCard(data, imageDataUrl);
    modal.classList.add("is-visible");

    closeConfirmModal();
    closeEffectPickerModal();
    toast(t("generatedQuickCard"));
  } catch (error) {
    console.error("Sheet generation failed:", error);
    if (requestId === confirmationSheetRequestId) {
      toast(t("generateFailed"));
    }
  } finally {
    if (requestId === confirmationSheetRequestId) {
      isConfirmationSheetGenerating = false;
      refreshEffectPickerModal();
    }
  }
}

async function openFullConfirmationSheet() {
  const { data, html } = await buildConfirmationSheetDocument();
  const sheetWindow = window.open("", "_blank");
  if (sheetWindow && !sheetWindow.closed) {
    sheetWindow.document.open();
    sheetWindow.document.write(html);
    sheetWindow.document.close();
    sheetWindow.focus();
    return;
  }
  downloadConfirmationSheetFallback(html, confirmationSheetFileName(data));
  toast(t("popupBlocked"));
}

function refreshQuickConfirmationCard() {
  const modal = document.querySelector("#confirmationPreviewModal");
  if (!modal?.classList.contains("is-visible")) return;
  const data = buildExportData({ includeImageData: false, includeEffectSnapshots: false });
  modal.innerHTML = renderQuickConfirmationCard(data, selectedEffectSnapshotData(product()));
}

async function sendConfirmationEmail() {
  if (confirmationEmailState !== "idle") return;
  confirmationEmailState = "sending";
  confirmationEmailMessage = "";
  refreshQuickConfirmationCard();
  toast(t("sendingToast"));
  try {
    const { data, html } = await buildConfirmationSheetDocument();
    const response = await fetch("/api/public/confirmation-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: data.product,
        customer: data.customer,
        embroidery: data.embroidery,
        html
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) throw new Error(result.message || t("sendFailed"));
    confirmationEmailState = "sent";
    confirmationEmailTransport = result.transport || "resend";
    refreshQuickConfirmationCard();
    const doneMessage = result.transport === "local-outbox"
      ? t("savedToOutbox", { email: result.to || t("specifiedEmail") })
      : t("sentTo", { email: result.to || t("specifiedEmail") });
    toast(doneMessage);
  } catch (error) {
    console.error("Confirmation email failed", {
      message: error.message || t("sendFailed"),
      customerEmail: buildExportData().customer.email || "",
      target: "confirmation-email"
    });
    confirmationEmailState = "idle";
    confirmationEmailMessage = t("sendFailed");
    refreshQuickConfirmationCard();
    toast(confirmationEmailMessage);
  }
}

function copyConfig() {
  navigator.clipboard
    ?.writeText(JSON.stringify(buildExportData(), null, 2))
    .then(() => toast(t("copiedJson")))
    .catch(() => toast(t("copyDenied")));
}

function showHome() {
  state.view = "home";
  state.isCustomizerOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showBuilder() {
  state.view = "builder";
  state.selectedPartId = activePartId();
  state.selectedEffectAngle = currentAngleConfig(product()).id;
  state.isCustomizerOpen = defaultCustomizerOpen();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bindEvents() {
  els.homeProductGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-product]");
    if (!button) return;
    invalidatePendingShoeHit();
    setProduct(button.dataset.homeProduct);
    showBuilder();
  });

  els.homeButton.addEventListener("click", () => {
    invalidatePendingShoeHit();
    showHome();
  });

  els.modelStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product]");
    if (!button) return;
    invalidatePendingShoeHit();
    setProduct(button.dataset.product);
  });

  els.angleTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-angle]");
    if (!button) return;
    invalidatePendingShoeHit();
    state.angle = button.dataset.angle;
    render();
  });

  els.partRail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-part]");
    if (!button) return;
    invalidatePendingShoeHit();
    selectPart(button.dataset.part, true);
  });

  const handleColorClick = (event) => {
    const button = event.target.closest("[data-color]");
    if (!button) return;
    const partId = button.dataset.partId || state.selectedPartId;
    const component = product().components.find((item) => item.id === partId) || selectedComponent();
    invalidatePendingShoeHit();
    state.selectedPartId = component.id;
    if (component.fixedColorOptions) {
      updatePartConfig(component.id, { color: button.dataset.color });
      return;
    }
    if (component.fixedOptions) {
      updatePartConfig(component.id, { color: button.dataset.color, variant: button.dataset.color, material: FIXED_MATERIAL_ID });
      return;
    }
    updatePartConfig(component.id, { color: button.dataset.color, variant: "" });
  };

  els.swatchGrid.addEventListener("click", handleColorClick);

  els.textureList.addEventListener("click", (event) => {
    if (event.target.closest("[data-color]")) {
      handleColorClick(event);
      return;
    }

    const fabricStyleButton = event.target.closest("[data-fabric-style]");
    if (fabricStyleButton) {
      const partId = fabricStyleButton.dataset.partId || state.selectedPartId;
      invalidatePendingShoeHit();
      if (state.config[state.productId]?.components?.[partId]) {
        state.selectedPartId = partId;
      }
      updatePartConfigPreservingCustomizerScroll(state.selectedPartId, fabricStyleSetPatch(fabricStyleButton.dataset.fabricStyleParent, fabricStyleButton.dataset.fabricStyle));
      return;
    }

    const button = event.target.closest("[data-material]");
    if (!button) return;
    const partId = button.dataset.partId || state.selectedPartId;
    invalidatePendingShoeHit();
    if (state.config[state.productId]?.components?.[partId]) {
      state.selectedPartId = partId;
    }
    if (fabricStyleSetByMaterial(button.dataset.material).length) {
      updatePartConfigPreservingCustomizerScroll(state.selectedPartId, fabricStyleSetPatch(button.dataset.material));
      return;
    }
    updatePartConfigPreservingCustomizerScroll(state.selectedPartId, { material: button.dataset.material, variant: "" });
  });

  els.copyConfigButton?.addEventListener("click", copyConfig);
  els.languageToggleButton?.addEventListener("click", () => {
    state.language = state.language === "zh" ? "en" : "zh";
    localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
    refreshConfirmModal();
    refreshEffectPickerModal();
    refreshQuickConfirmationCard();
    render();
  });
  els.saveButton.addEventListener("click", openConfirmModal);
  els.resetButton.addEventListener("click", resetProduct);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-effect]")) {
      closeEffectPickerModal();
      return;
    }

    const effectButton = event.target.closest("[data-effect-angle]");
    if (effectButton) {
      state.selectedEffectAngle = effectButton.dataset.effectAngle;
      refreshEffectPickerModal();
      return;
    }

    if (event.target.closest("[data-back-confirm]")) {
      document.querySelector("#confirmationPreviewModal")?.classList.remove("is-visible");
      returnToConfirmModal();
      return;
    }

    if (event.target.closest("[data-view-full-sheet]")) {
      void openFullConfirmationSheet();
      return;
    }

    if (event.target.closest("[data-send-confirmation]")) {
      void sendConfirmationEmail();
      return;
    }

    if (event.target.closest("[data-close-preview]")) {
      document.querySelector("#confirmationPreviewModal")?.classList.remove("is-visible");
      return;
    }

    if (event.target.closest("[data-close-confirm]")) {
      closeConfirmModal();
      return;
    }

    const partButton = event.target.closest("[data-confirm-part]");
    if (partButton) {
      if (!selectPart(partButton.dataset.confirmPart, true)) return;
      closeConfirmModal();
      return;
    }

    const removeEmbroideryImageButton = event.target.closest("[data-remove-embroidery-image]");
    if (removeEmbroideryImageButton) {
      const slotConfig = state.config[state.productId].embroidery[removeEmbroideryImageButton.dataset.removeEmbroideryImage];
      if (!slotConfig) return;
      slotConfig.image = null;
      refreshConfirmModal();
      toast(t("imageRemoved"));
      return;
    }

    if (event.target.closest("[data-review-effect]")) {
      if (!customerInfoComplete()) {
        refreshConfirmModal();
        toast(t("fillFirst", { fields: missingCustomerFields().join(state.language === "en" ? ", " : "、") }));
        return;
      }
      closeConfirmModal();
      void openEffectPickerModal();
      return;
    }

    if (event.target.closest("[data-download-sheet]")) {
      void downloadSheet();
    }
  });

  els.drawerBackdrop.addEventListener("click", () => setCustomizerOpen(false));
  els.drawerCloseButton.addEventListener("click", () => setCustomizerOpen(false));
  els.customizerToggleButton.addEventListener("click", () => setCustomizerOpen(!state.isCustomizerOpen));

  document.addEventListener("input", (event) => {
    const customerKey = event.target.dataset.customer;
    if (customerKey) {
      state.customer[customerKey] = event.target.value;
      refreshConfirmCustomerValidation();
      return;
    }

    const embroideryKey = event.target.dataset.embroideryText;
    if (embroideryKey) {
      state.config[state.productId].embroidery[embroideryKey].text = event.target.value;
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.dataset.embroideryImage) {
      void handleEmbroideryImageInput(event.target);
      return;
    }

    const embroideryKey = event.target.dataset.embroideryToggle;
    if (embroideryKey) {
      state.config[state.productId].embroidery[embroideryKey].enabled = event.target.checked;
      return;
    }

    if (event.target.dataset.padStyle !== undefined) {
      state.config[state.productId].padStyle = event.target.value;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.querySelector("#effectPickerModal.is-visible")) {
      closeEffectPickerModal();
      return;
    }
    if (event.key === "Escape" && state.isCustomizerOpen) setCustomizerOpen(false);
  });

  window.addEventListener("resize", () => {
    syncCustomizerState();
    syncShoeFit();
  });
  if ("ResizeObserver" in window && !shoeFitObserver) {
    shoeFitObserver = new ResizeObserver(() => syncShoeFit());
    shoeFitObserver.observe(els.shoeScene);
  }

  let dragStartX = 0;
  let isShoeDragging = false;
  els.shoeScene.addEventListener("click", async (event) => {
    if (isShoeDragging) return;
    const frame = els.shoeArt.querySelector(".mvp-shoe-frame");
    const rect = frame?.getBoundingClientRect();
    const isInsideShoeFrame = rect
      && event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (!isInsideShoeFrame) {
      if (state.isCustomizerOpen) setCustomizerOpen(false);
      return;
    }

    const requestId = invalidatePendingShoeHit();
    const directPart = event.target.closest("[data-part]")?.dataset.part;
    const partId = directPart || await hitTestShoePart(event);
    // 鞋图命中需要异步读取 alpha；如果期间用户又点了别处，丢弃旧命中结果，避免旧点击覆盖新状态。
    if (requestId !== shoeHitRequestId) return;
    if (!partId) {
      if (state.isCustomizerOpen) setCustomizerOpen(false);
      return;
    }
    if (!isEditablePart(partId)) return;
    selectPart(partId, true);
    // selectPart 已经刷新 DOM，这里只滚动颜色面板，避免移动端双重 repaint 闪屏。
    focusColorPanel(false);
  });

  els.shoeScene.addEventListener("pointerdown", (event) => {
    dragStartX = event.clientX;
    isShoeDragging = false;
    els.shoeScene.setPointerCapture(event.pointerId);
  });

  els.shoeScene.addEventListener("pointermove", (event) => {
    if (Math.abs(event.clientX - dragStartX) > 12) isShoeDragging = true;
  });

  els.shoeScene.addEventListener("pointerup", (event) => {
    const distance = event.clientX - dragStartX;
    if (Math.abs(distance) > 36) {
      const angles = productAngles();
      const index = angles.findIndex((angle) => angle.id === state.angle);
      const step = distance > 0 ? -1 : 1;
      state.angle = angles[(index + step + angles.length) % angles.length]?.id || state.angle;
      render();
    }
    window.setTimeout(() => {
      isShoeDragging = false;
    }, 0);
  });
}

async function init() {
  await loadPublishedConfig();
  PRODUCT_CATALOG.forEach((item) => {
    state.config[item.id] = cloneProductConfig(item);
  });
  bindEvents();
  render();
}

init();
