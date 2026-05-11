const MVP_ACTIVE_PART_ID = "G";
const FIXED_MATERIAL_ID = "fixed-image";
const LAYER_ASSET_DIR = "./assets/mvp/layers/";

const SHARED_MVP_ASSETS = {
  base: "./assets/mvp/base-ui.png",
  stitch: `${LAYER_ASSET_DIR}stitch.png`
};

const COMPONENT_TEMPLATE = [
  { id: "A", code: "A", en: "Shoe collar", cn: "鞋帮", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}collar.png`], renderOrder: 30 },
  { id: "A1", code: "A1", en: "Lower edge", cn: "鞋身下摆", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}lower-edge.png`], renderOrder: 35 },
  { id: "F", code: "F", en: "Lower body", cn: "下身鞋片", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}lower-body.png`], renderOrder: 40 },
  { id: "G", code: "G", en: "Main upper", cn: "上身鞋片", palette: "leather", color: "#f0b7c8", material: "pearl", masks: [`${LAYER_ASSET_DIR}upper-body.png`], renderOrder: 45 },
  { id: "H", code: "H", en: "Toe", cn: "鞋头", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}toe.png`], renderOrder: 50 },
  { id: "C", code: "C", en: "Tongue", cn: "鞋舌", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}tongue.png`], renderOrder: 55 },
  { id: "C2", code: "C2", en: "Tongue panel", cn: "鞋舌裁片", palette: "leather", color: "#f0b7c8", material: "pearl", masks: [`${LAYER_ASSET_DIR}tongue-panel.png`], renderOrder: 60 },
  { id: "I", code: "I", en: "Eyelet panel", cn: "鞋眼片", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}eyelet-panel.png`], renderOrder: 65 },
  { id: "I1", code: "I1", en: "Eyelets", cn: "鞋眼", palette: "hardware", color: "#f7f7f8", material: "hardware", masks: [`${LAYER_ASSET_DIR}eyelets.png`], renderOrder: 70 },
  { id: "B", code: "B", en: "Back handle strap", cn: "后提带", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}back-strap.png`], renderOrder: 75 },
  { id: "J", code: "J", en: "Lace", cn: "鞋带", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}lace.png`], renderOrder: 80 },
  { id: "K1", code: "K1", en: "Toe strap 1", cn: "扣带1", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}toe-strap-1.png`], renderOrder: 85 },
  { id: "K2", code: "K2", en: "Toe strap 2", cn: "扣带2", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}toe-strap-2.png`], renderOrder: 90 },
  { id: "L", code: "L", en: "Abrasive pad", cn: "防磨片", palette: "rubber", color: "#17171a", material: "matte", masks: [`${LAYER_ASSET_DIR}abrasive-pad.png`], renderOrder: 95 },
  {
    id: "D",
    code: "D",
    en: "Cuff",
    cn: "CUFF",
    palette: "fixed",
    material: FIXED_MATERIAL_ID,
    defaultVariant: "cuff-silver",
    renderOrder: 110,
    fixedOptions: [
      { id: "cuff-black-gold-1", name: "黑金色 CUFF 1", swatch: "linear-gradient(135deg, #151517 0 46%, #c49a44 47% 100%)", image: `${LAYER_ASSET_DIR}cuff-black-gold-1.png` },
      { id: "cuff-silver", name: "银色 CUFF", swatch: "linear-gradient(135deg, #f4f5f7, #9ea3aa)", image: `${LAYER_ASSET_DIR}cuff-silver.png` },
      { id: "cuff-red-black", name: "红黑色 CUFF", swatch: "linear-gradient(135deg, #151517 0 52%, #c72b35 53% 100%)", image: `${LAYER_ASSET_DIR}cuff-red-black.png` },
      { id: "cuff-black-gold-2", name: "黑金色 CUFF 2", swatch: "linear-gradient(135deg, #050506 0 44%, #d3a53b 45% 100%)", image: `${LAYER_ASSET_DIR}cuff-black-gold-2.png` },
      { id: "cuff-black-purple", name: "黑紫色 CUFF", swatch: "linear-gradient(135deg, #111114 0 52%, #6f42c1 53% 100%)", image: `${LAYER_ASSET_DIR}cuff-black-purple.png` },
      { id: "cuff-black", name: "黑色 CUFF", swatch: "#17171a", image: `${LAYER_ASSET_DIR}cuff-black.png` }
    ]
  },
  {
    id: "M",
    code: "M",
    en: "Buckle",
    cn: "巴扣 / 芭扣",
    palette: "fixed",
    material: FIXED_MATERIAL_ID,
    defaultVariant: "buckle-black",
    renderOrder: 120,
    fixedOptions: [
      { id: "buckle-white", name: "白色巴扣", swatch: "#f7f7f8", image: `${LAYER_ASSET_DIR}buckle-white.png` },
      { id: "buckle-black", name: "黑色巴扣", swatch: "#17171a", image: `${LAYER_ASSET_DIR}buckle-black.png` }
    ]
  },
  {
    id: "N",
    code: "N",
    en: "Sole",
    cn: "鞋底",
    palette: "fixed",
    material: FIXED_MATERIAL_ID,
    defaultVariant: "sole-silver",
    renderOrder: 20,
    fixedOptions: [
      { id: "sole-silver", name: "银色鞋底", swatch: "linear-gradient(135deg, #f4f5f7, #9ea3aa)", image: `${LAYER_ASSET_DIR}sole-silver.png` },
      { id: "sole-black-red", name: "黑红色鞋底", swatch: "linear-gradient(135deg, #111114 0 56%, #d8313b 57% 100%)", image: `${LAYER_ASSET_DIR}sole-black-red.png` },
      { id: "sole-black-purple", name: "黑紫色鞋底", swatch: "linear-gradient(135deg, #111114 0 56%, #6f42c1 57% 100%)", image: `${LAYER_ASSET_DIR}sole-black-purple.png` },
      { id: "sole-black", name: "黑色鞋底", swatch: "#17171a", image: `${LAYER_ASSET_DIR}sole-black.png` }
    ]
  }
];

const SHARED_PRODUCT_DETAILS = {
  fixedItems: [
    { en: "Double strap", cn: "能量带", value: "黑色" },
    { en: "Spider buckle", cn: "蜘蛛扣", value: "参考黑色公款" },
    { en: "Boot stitch", cn: "主绣线", value: "参考黑色公款" }
  ],
  padStyles: [
    { id: "new", name: "新" },
    { id: "old", name: "旧" },
    { id: "brake", name: "刹车防磨片" }
  ],
  embroiderySlots: [
    { id: "B1", code: "B1", en: "Back handle strap", cn: "后提带电绣", enabled: true },
    { id: "tongue", code: "C", en: "Tongue", cn: "鞋舌电绣片", enabled: true },
    { id: "toe-left", code: "K-L", en: "Left toe strap", cn: "左脚前魔术贴电绣片", enabled: true },
    { id: "toe-right", code: "K-R", en: "Right toe strap", cn: "右脚前魔术贴电绣片", enabled: true }
  ]
};

function buildComponents(overrides = {}) {
  return COMPONENT_TEMPLATE.map((component) => ({
    ...component,
    ...(overrides[component.id] || {})
  }));
}

const PRODUCT_CATALOG = [
  {
    id: "yjs-cim",
    name: "YJS CIM",
    code: "YJS",
    price: "基础鞋定制",
    homeTag: "Daily Training",
    homeLabel: "轻量训练款",
    description: "轻量训练轮滑鞋定制，支持侧面标注裁片、巴扣、鞋底与 CUFF 贴图配置。",
    note: "YJS 当前接入单视角透明蒙版 MVP；侧面标注裁片已按切图拆层。",
    homeFeatures: ["轻量鞋身", "日常训练", "可扩展裁片"],
    accentA: "#8ed8ff",
    accentB: "#86d9bd",
    editablePartId: MVP_ACTIVE_PART_ID,
    assets: SHARED_MVP_ASSETS,
    components: buildComponents({
      G: { color: "#8ed8ff", material: "mesh" },
      C2: { color: "#8ed8ff", material: "smooth" },
      D: { defaultVariant: "cuff-black" },
      M: { defaultVariant: "buckle-white" },
      N: { defaultVariant: "sole-silver" }
    }),
    ...SHARED_PRODUCT_DETAILS
  },
  {
    id: "yjs-pro-cim-upper",
    name: "YJS-pro CIM",
    code: "YJS-PRO",
    price: "专业上鞋定制",
    homeTag: "Pro Custom",
    homeLabel: "专业支撑款",
    description: "高帮轮滑鞋上鞋定制，面向进阶训练与比赛配置，支持按标注裁片扩展颜色和皮料。",
    note: "巴扣、鞋底、CUFF 使用切图指定固定色值；其余标注裁片支持颜色与皮料选择。",
    homeFeatures: ["高帮支撑", "碳纤鞋壳", "CIM 表格导出"],
    accentA: "#f0b7c8",
    accentB: "#ad94ff",
    editablePartId: MVP_ACTIVE_PART_ID,
    assets: SHARED_MVP_ASSETS,
    components: buildComponents({
      G: { color: "#f0b7c8", material: "pearl" },
      C2: { color: "#f0b7c8", material: "pearl" },
      D: { defaultVariant: "cuff-silver" },
      M: { defaultVariant: "buckle-black" },
      N: { defaultVariant: "sole-silver" }
    }),
    ...SHARED_PRODUCT_DETAILS
  }
];

const PALETTES = {
  leather: [
    { id: "white", name: "奶油白", value: "#f6f3ec" },
    { id: "pink", name: "樱花粉", value: "#f0b7c8" },
    { id: "silver", name: "银灰", value: "#cfd2d5" },
    { id: "black", name: "黑色", value: "#17171a" },
    { id: "mint", name: "薄荷绿", value: "#86d9bd" },
    { id: "blue", name: "冰蓝", value: "#8ed8ff" },
    { id: "violet", name: "雾紫", value: "#b9a7ff" },
    { id: "scarlet", name: "红莓", value: "#e95a67" }
  ],
  strap: [
    { id: "white", name: "白色织带", value: "#ffffff" },
    { id: "black", name: "黑色织带", value: "#17171a" },
    { id: "pink", name: "粉色织带", value: "#f0b7c8" },
    { id: "grey", name: "浅灰织带", value: "#d8d9de" }
  ],
  carbon: [
    { id: "black-carbon", name: "黑碳纤", value: "#2d2e32" },
    { id: "silver-carbon", name: "银碳纤", value: "#aeb3b8" },
    { id: "smoke-carbon", name: "烟灰碳纤", value: "#5d6068" }
  ],
  hardware: [
    { id: "white", name: "白色", value: "#f7f7f8" },
    { id: "silver", name: "银色", value: "#cfd2d5" },
    { id: "black", name: "黑色", value: "#17171a" }
  ],
  rubber: [
    { id: "black", name: "黑色", value: "#17171a" },
    { id: "white", name: "白色", value: "#f6f3ec" },
    { id: "grey", name: "灰色", value: "#8f9298" }
  ]
};

const MATERIALS = [
  { id: "smooth", name: "光面皮", note: "细腻皮革" },
  { id: "mesh", name: "网布纹理", note: "细密织纹" },
  { id: "pearl", name: "珍珠皮", note: "柔亮渐变" },
  { id: "matte", name: "哑光皮", note: "低反光" },
  { id: "carbon", name: "碳纤皮", note: "碳纤纹理" },
  { id: "webbing", name: "织带", note: "绑带质感" },
  { id: "hardware", name: "五金", note: "扣件质感" },
  { id: FIXED_MATERIAL_ID, name: "固定贴图", note: "按切图色值" }
];

PRODUCT_CATALOG.forEach((item) => {
  item.components.forEach((component) => {
    component.editable = component.editable !== false && (Boolean(component.masks?.length) || Boolean(component.fixedOptions?.length));
    if (!component.editable) component.lockReason = "暂未配置切图";
  });
});

const DEFAULT_PRODUCT_ID = PRODUCT_CATALOG.find((item) => item.id === "yjs-pro-cim-upper")?.id || PRODUCT_CATALOG[0].id;
const DEFAULT_PRODUCT = PRODUCT_CATALOG.find((item) => item.id === DEFAULT_PRODUCT_ID);

const state = {
  view: "home",
  productId: DEFAULT_PRODUCT_ID,
  selectedPartId: activePartId(DEFAULT_PRODUCT),
  angle: "side",
  spinning: false,
  customer: {
    name: "",
    date: new Date().toISOString().slice(0, 10),
    footLength: "",
    size: ""
  },
  config: {}
};

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
  startCustomizeButton: document.querySelector("#startCustomizeButton"),
  previewCustomizeButton: document.querySelector("#previewCustomizeButton"),
  homeButton: document.querySelector("#homeButton"),
  modelStrip: document.querySelector("#modelStrip"),
  angleTabs: document.querySelector("#angleTabs"),
  spinButton: document.querySelector("#spinButton"),
  shoeScene: document.querySelector("#shoeScene"),
  shoeArt: document.querySelector("#shoeArt"),
  angleMeta: document.querySelector("#angleMeta"),
  modelMeta: document.querySelector("#modelMeta"),
  modelName: document.querySelector("#modelName"),
  modelDescription: document.querySelector("#modelDescription"),
  partGrid: document.querySelector("#partGrid"),
  selectedPartLabel: document.querySelector("#selectedPartLabel"),
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

function cloneProductConfig(item) {
  return {
    components: Object.fromEntries(
      item.components.map((component) => {
        const fixedOption = defaultFixedOption(component);
        return [
          component.id,
          {
            color: fixedOption?.id || component.color,
            variant: fixedOption?.id || "",
            material: fixedOption ? FIXED_MATERIAL_ID : component.material
          }
        ];
      })
    ),
    padStyle: item.padStyles[0].id,
    embroidery: Object.fromEntries(
      item.embroiderySlots.map((slot) => [
        slot.id,
        {
          enabled: slot.enabled,
          text: ""
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
  if (component.fixedOptions) {
    return component.fixedOptions.map((option) => ({
      ...option,
      value: option.id
    }));
  }
  return PALETTES[component.palette] || PALETTES.leather;
}

function materialsFor(component) {
  if (component.fixedOptions) return MATERIALS.filter((item) => item.id === FIXED_MATERIAL_ID);
  if (component.editable) return MATERIALS.filter((item) => item.id === "smooth" || item.id === "mesh" || item.id === "pearl" || item.id === "matte");
  if (component.palette === "carbon") return MATERIALS.filter((item) => item.id === "carbon" || item.id === "matte");
  if (component.palette === "strap") return MATERIALS.filter((item) => item.id === "webbing" || item.id === "smooth");
  if (component.palette === "hardware") return MATERIALS.filter((item) => item.id === "hardware" || item.id === "matte");
  if (component.palette === "rubber") return MATERIALS.filter((item) => item.id === "matte" || item.id === "smooth");
  return MATERIALS.filter((item) => item.id === "smooth" || item.id === "pearl" || item.id === "matte");
}

function materialById(id) {
  return MATERIALS.find((item) => item.id === id) || MATERIALS[0];
}

function colorName(value, component = selectedComponent()) {
  if (component?.fixedOptions) return fixedOption(component, { color: value, variant: value })?.name || value;
  return colorOptions(component).find((color) => color.value.toLowerCase() === value.toLowerCase())?.name || value;
}

function defaultFixedOption(component) {
  if (!component.fixedOptions) return null;
  return component.fixedOptions.find((option) => option.id === component.defaultVariant) || component.fixedOptions[0];
}

function fixedOption(component, config = componentConfig(component.id)) {
  if (!component.fixedOptions) return null;
  const fixedId = config?.variant || config?.color || component.defaultVariant;
  return component.fixedOptions.find((option) => option.id === fixedId) || defaultFixedOption(component);
}

function componentPreview(component, config = componentConfig(component.id)) {
  const option = fixedOption(component, config);
  if (option) return option.swatch;
  return cssTexture(config.color, config.material);
}

function componentColorValue(component, config = componentConfig(component.id)) {
  const option = fixedOption(component, config);
  return option?.swatch || config.color;
}

function materialName(id) {
  return materialById(id).name;
}

function cssTexture(color, material) {
  switch (material) {
    case "carbon":
      return `repeating-linear-gradient(45deg, rgba(255,255,255,.34) 0 3px, rgba(0,0,0,.22) 3px 6px), ${color}`;
    case "pearl":
      return `radial-gradient(circle at 20% 18%, rgba(255,255,255,.82), transparent 34%), linear-gradient(145deg, ${color}, rgba(255,255,255,.5))`;
    case "mesh":
      return `repeating-linear-gradient(45deg, rgba(255,255,255,.26) 0 2px, rgba(0,0,0,.08) 2px 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,.18) 0 2px, rgba(0,0,0,.06) 2px 4px), ${color}`;
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
    case "carbon":
      return `${base}<path d="M-2 4 L4 -2 M2 12 L14 0 M8 14 L14 8" stroke="#fff" stroke-opacity=".34" stroke-width="2"/><path d="M-2 8 L8 -2 M4 14 L14 4" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`;
    case "pearl":
      return `${base}<circle cx="2" cy="2" r="6" fill="#fff" opacity=".48"/><path d="M0 12 C4 5 8 4 12 0" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>`;
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
  return state.selectedPartId === id ? "is-selected" : "";
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

function componentLayerMarkup(component, item = product()) {
  const config = componentConfigFor(item, component.id);
  const selected = item.id === state.productId && component.id === state.selectedPartId ? "is-selected" : "";
  const layerIndex = component.renderOrder || 1;
  const option = fixedOption(component, config);

  if (option) {
    return `<img class="mvp-fixed-image ${selected}" src="${escapeHtml(option.image)}" alt="" aria-hidden="true" draggable="false" style="--layer-index:${layerIndex};" />`;
  }

  const material = cssTexture(config.color, config.material);
  return (component.masks || [])
    .map((mask) => {
      const layerStyle = `--layer-index:${layerIndex};--part-material:${escapeHtml(material)};mask-image:url('${escapeHtml(mask)}');-webkit-mask-image:url('${escapeHtml(mask)}');`;
      return `<div class="mvp-upper-fill mvp-part-layer ${selected}" style="${layerStyle}" data-part="${component.id}" aria-hidden="true"></div>`;
    })
    .join("");
}

function shoeMarkup(item = product(), alt = `${product().name} 侧面预览`) {
  const assets = productAssets(item);
  return `
    <div class="mvp-shoe-frame">
      <img class="mvp-base-image" src="${escapeHtml(assets.base)}" alt="${escapeHtml(alt)}" draggable="false" />
      ${renderableComponents(item).map((component) => componentLayerMarkup(component, item)).join("")}
      <img class="mvp-stitch-image" src="${escapeHtml(assets.stitch)}" alt="" aria-hidden="true" draggable="false" />
    </div>`;
}

function mvpShoeMarkup() {
  const item = product();
  return shoeMarkup(item, `${item.name} 侧面基础图`);
}

function homeShoeMarkup(item = product()) {
  return shoeMarkup(item, `${item.name} 预览图`);
}

function renderHome() {
  const item = product();
  const editable = item.components.find((component) => component.id === activePartId(item));
  const assets = productAssets(item);

  els.homeProductTag.textContent = "Skate Studio";
  els.homeProductName.textContent = "Create your own skates";
  els.homeProductDescription.textContent = "选择鞋款后进入定制器，继续配置颜色、皮料和特殊定制。";
  els.homeProductMeta.innerHTML = ["YJS", "YJS-PRO", "Layered 2.5D MVP"].map((feature) => `<span>${feature}</span>`).join("");
  els.homeShoeArt.innerHTML = homeShoeMarkup();
  els.homeProductGrid.innerHTML = PRODUCT_CATALOG.map((catalogItem) => {
    const selected = catalogItem.id === state.productId;
    return `
      <button class="home-model-card" type="button" data-home-product="${catalogItem.id}" aria-pressed="${selected}" style="--accent-a:${catalogItem.accentA};--accent-b:${catalogItem.accentB};">
        <span class="home-card-title">${catalogItem.code}</span>
        <span class="home-card-thumb">
          ${homeShoeMarkup(catalogItem)}
        </span>
        <span class="home-card-dot" aria-hidden="true"></span>
        <span class="home-card-body">
          <span class="home-card-kicker">${catalogItem.homeLabel}</span>
          <strong>${catalogItem.name}</strong>
          <span>${catalogItem.description}</span>
        </span>
        <span class="home-card-meta">${selected ? "已选择" : "选择"}</span>
      </button>`;
  }).join("");
  els.startCustomizeButton.textContent = `定制 ${item.code}`;
  els.previewCustomizeButton.textContent = `${editable?.cn || "鞋面"} MVP`;
  els.homeView.style.setProperty("--home-accent-a", item.accentA);
  els.homeView.style.setProperty("--home-accent-b", item.accentB);
  els.homeView.style.setProperty("--home-base-image", `url('${assets.base}')`);
}

function renderModelStrip() {
  els.modelStrip.innerHTML = PRODUCT_CATALOG.map(
    (item) => `
      <button class="model-pill" type="button" data-product="${item.id}" aria-pressed="${item.id === state.productId}" style="--thumb-a:${item.accentA};--thumb-b:${item.accentB};">
        <span class="model-thumb" aria-hidden="true">${item.code}</span>
        <span>
          <strong>${item.name}</strong>
          <span>${item.price}</span>
        </span>
      </button>`
  ).join("");
}

function renderAngleTabs() {
  const tabs = [
    { id: "side", label: "侧面 MVP" }
  ];

  els.angleTabs.innerHTML = tabs
    .map(
      (tab) => `
      <button class="segment-button" type="button" role="tab" data-angle="${tab.id}" aria-selected="${tab.id === state.angle}">
        ${tab.label}
      </button>`
    )
    .join("");
}

function renderParts() {
  const item = product();
  els.partGrid.innerHTML = item.components
    .map((component) => {
      const config = componentConfig(component.id);
      const disabled = !component.editable;
      return `
        <button class="part-button component-button ${disabled ? "is-disabled" : ""}" type="button" data-part="${component.id}" aria-pressed="${component.id === state.selectedPartId}" ${disabled ? "disabled aria-disabled=\"true\"" : ""}>
          <span class="component-code">${component.code}</span>
          <span>
            <strong>${component.cn}</strong>
            <span>${disabled ? component.lockReason : component.en}</span>
          </span>
          <i style="--component-color:${componentPreview(component, config)}"></i>
        </button>`;
    })
    .join("");
}

function renderSwatches() {
  const component = selectedComponent();
  const config = componentConfig();
  els.swatchGrid.innerHTML = colorOptions(component)
    .map(
      (color) => `
        <button class="swatch-button" type="button" title="${color.name}" aria-label="${color.name}" aria-pressed="${color.value.toLowerCase() === (config.variant || config.color).toLowerCase()}" data-color="${color.value}" style="--swatch:${color.swatch || color.value};"></button>`
    )
    .join("");
}

function renderTextures() {
  const component = selectedComponent();
  const config = componentConfig();
  els.textureList.innerHTML = materialsFor(component)
    .map(
      (material) => `
      <button class="texture-button" type="button" data-material="${material.id}" aria-pressed="${material.id === config.material}">
        <span class="texture-preview" style="--texture:${component.fixedOptions ? componentPreview(component, config) : cssTexture(config.color, material.id)};"></span>
        <span>
          <strong>${material.name}</strong>
          <span>${material.note}</span>
        </span>
        <span class="texture-check">${material.id === config.material ? "✓" : ""}</span>
      </button>`
    )
    .join("");
}

function renderShoe() {
  els.shoeArt.innerHTML = mvpShoeMarkup();
  els.shoeArt.classList.toggle("is-spinning", state.spinning);
}

function buildExportData() {
  const item = product();
  return {
    product: item.name,
    customer: { ...state.customer },
    components: item.components.map((component) => {
      const config = componentConfig(component.id);
      return {
        code: component.code,
        component: component.en,
        name: component.cn,
        color: colorName(config.color, component),
        colorValue: componentColorValue(component, config),
        material: materialName(config.material)
      };
    }),
    fixedItems: item.fixedItems,
    padStyle: item.padStyles.find((style) => style.id === state.config[state.productId].padStyle)?.name || "",
    embroidery: item.embroiderySlots.map((slot) => ({
      code: slot.code,
      name: slot.cn,
      enabled: state.config[state.productId].embroidery[slot.id].enabled,
      text: state.config[state.productId].embroidery[slot.id].text
    })),
    note: item.note
  };
}

function renderSummary() {
  const item = product();
  const component = selectedComponent();
  const config = componentConfig();
  const output = {
    product: item.id,
    selectedPart: component.code,
    color: colorName(config.color),
    colorValue: componentColorValue(component, config),
    material: materialName(config.material)
  };

  els.modelName.textContent = item.name;
  els.modelDescription.textContent = item.description;
  els.angleMeta.textContent = state.angle === "side" ? "侧面预览" : "斜前方预览";
  els.modelMeta.textContent = `${item.code} · 已开放 ${item.components.filter((part) => part.editable).length} 个标注区域`;
  els.selectedPartLabel.textContent = `${component.code} · ${component.cn}`;
  els.selectedColorName.textContent = colorName(config.color);
  els.selectedTextureName.textContent = materialName(config.material);
  els.configPreview.textContent = JSON.stringify(output, null, 2);
  els.spinButton.textContent = state.spinning ? "停止旋转" : "自动旋转";
}

function render() {
  const isHome = state.view === "home";
  document.body.dataset.view = state.view;
  els.homeView.classList.toggle("is-hidden", !isHome);
  els.workspace.classList.toggle("is-hidden", isHome);
  els.homeButton.hidden = isHome;
  els.resetButton.hidden = isHome;
  els.saveButton.hidden = isHome;
  els.pageEyebrow.textContent = isHome ? "Skate Studio" : "Customizer";
  els.pageTitle.textContent = isHome ? "轮滑鞋定制" : product().name;
  renderHome();
  renderModelStrip();
  renderAngleTabs();
  renderParts();
  renderSwatches();
  renderTextures();
  renderShoe();
  renderSummary();
}

function setProduct(id) {
  state.productId = id;
  state.selectedPartId = activePartId(product());
  if (!state.config[id]) state.config[id] = cloneProductConfig(product());
  render();
}

function updateSelectedPart(patch) {
  state.config[state.productId].components[state.selectedPartId] = {
    ...state.config[state.productId].components[state.selectedPartId],
    ...patch
  };
  render();
}

function resetProduct() {
  state.config[state.productId] = cloneProductConfig(product());
  state.selectedPartId = activePartId();
  render();
  toast("已重置当前鞋款");
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

function renderConfirmModal() {
  const data = buildExportData();
  return `
    <div class="confirm-backdrop" data-close-confirm></div>
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <header class="confirm-header">
        <div>
          <p class="eyebrow">Confirm</p>
          <h2 id="confirmTitle">确认定制方案</h2>
        </div>
        <button class="icon-button" type="button" data-close-confirm title="关闭">×</button>
      </header>

      <div class="confirm-body">
        <section class="confirm-section">
          <div class="section-title">
            <h3>个人信息</h3>
            <span>生成表格前确认</span>
          </div>
          <div class="field-grid">
            <label>姓名<input data-customer="name" value="${escapeHtml(state.customer.name)}" placeholder="name" /></label>
            <label>日期<input data-customer="date" type="date" value="${escapeHtml(state.customer.date)}" /></label>
            <label>脚长<input data-customer="footLength" value="${escapeHtml(state.customer.footLength)}" placeholder="foot length" /></label>
            <label>尺码<input data-customer="size" value="${escapeHtml(state.customer.size)}" placeholder="size" /></label>
          </div>
        </section>

        <section class="confirm-section">
          <div class="section-title">
            <h3>配色选型</h3>
            <span>${data.components.length} 个裁片</span>
          </div>
          <div class="confirm-table">
            <div class="confirm-row confirm-row-head">
              <span>No.</span><span>裁片</span><span>颜色</span><span>皮料</span>
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

        <section class="confirm-section">
          <div class="section-title">
            <h3>特殊定制</h3>
            <span>电绣 / 防磨片 / 固定件</span>
          </div>
          <label class="select-row">
            <span>L1 防磨片款式</span>
            <select data-pad-style>
              ${product().padStyles
                .map((style) => `<option value="${style.id}" ${style.name === data.padStyle ? "selected" : ""}>${style.name}</option>`)
                .join("")}
            </select>
          </label>
          <div class="embroidery-list">
            ${product().embroiderySlots
              .map((slot) => {
                const slotConfig = state.config[state.productId].embroidery[slot.id];
                return `
                  <label class="embroidery-row">
                    <input type="checkbox" data-embroidery-toggle="${slot.id}" ${slotConfig.enabled ? "checked" : ""} />
                    <span class="component-code">${slot.code}</span>
                    <span>${slot.cn}</span>
                    <input data-embroidery-text="${slot.id}" value="${escapeHtml(slotConfig.text)}" placeholder="文字/Logo 备注" />
                  </label>`;
              })
              .join("")}
          </div>
          <div class="fixed-list">
            ${product().fixedItems
              .map(
                (item) => `
                  <div>
                    <strong>${item.cn}</strong>
                    <span>${item.en}</span>
                    <em>${item.value}</em>
                  </div>`
              )
              .join("")}
          </div>
        </section>
      </div>

      <footer class="confirm-actions">
        <button class="glass-button" type="button" data-close-confirm>继续修改</button>
        <button class="primary-button" type="button" data-download-sheet>确认并下载表格</button>
      </footer>
    </section>
  `;
}

function downloadSheet() {
  const data = buildExportData();
  const xml = buildExcelXml(data);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const customer = data.customer.name || "customer";
  link.href = url;
  link.download = `${data.product}-${customer}-custom.xls`;
  link.click();
  URL.revokeObjectURL(url);
  closeConfirmModal();
  toast("确认表格已生成");
}

function buildExcelXml(data) {
  const rows = [
    [`${data.product} 定制确认表`, "", "", "", ""],
    ["个人信息", "", "", "", ""],
    ["姓名", data.customer.name, "日期", data.customer.date, ""],
    ["脚长", data.customer.footLength, "尺码", data.customer.size, ""],
    ["", "", "", "", ""],
    ["配色选型", "", "", "", ""],
    ["No.", "Component", "裁片名称", "颜色", "皮料"],
    ...data.components.map((part) => [part.code, part.component, part.name, `${part.color} ${part.colorValue}`, part.material]),
    ["", "", "", "", ""],
    ["特殊定制", "", "", "", ""],
    ["L1 防磨片款式", data.padStyle, "", "", ""],
    ["电绣位置", "是否启用", "内容", "", ""],
    ...data.embroidery.map((item) => [item.name, item.enabled ? "是" : "否", item.text, "", ""]),
    ["", "", "", "", ""],
    ["固定件", "", "", "", ""],
    ...data.fixedItems.map((item) => [item.cn, item.en, item.value, "", ""]),
    ["", "", "", "", ""],
    ["备注", data.note, "", "", ""]
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16"/><Interior ss:Color="#F5F5F7" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#E8F1FF" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Text"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial"/></Style>
 </Styles>
 <Worksheet ss:Name="定制确认">
  <Table>
   <Column ss:Width="120"/><Column ss:Width="180"/><Column ss:Width="160"/><Column ss:Width="140"/><Column ss:Width="120"/>
   ${rows
     .map((row, index) => {
       const style = index === 0 ? "Title" : row[0] && row.slice(1).every((cell) => !cell) ? "Header" : "Text";
       return `<Row>${row.map((cell) => `<Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join("")}</Row>`;
     })
     .join("")}
  </Table>
 </Worksheet>
</Workbook>`;
}

function copyConfig() {
  navigator.clipboard
    ?.writeText(JSON.stringify(buildExportData(), null, 2))
    .then(() => toast("配置 JSON 已复制"))
    .catch(() => toast("当前浏览器不允许复制，请手动选中 JSON"));
}

function showHome() {
  state.view = "home";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showBuilder() {
  state.view = "builder";
  state.selectedPartId = activePartId();
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

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function bindEvents() {
  els.homeProductGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-product]");
    if (!button) return;
    setProduct(button.dataset.homeProduct);
  });

  els.startCustomizeButton.addEventListener("click", showBuilder);
  els.previewCustomizeButton.addEventListener("click", showBuilder);
  els.homeButton.addEventListener("click", showHome);

  els.modelStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product]");
    if (!button) return;
    setProduct(button.dataset.product);
  });

  els.angleTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-angle]");
    if (!button) return;
    state.angle = button.dataset.angle;
    render();
  });

  els.partGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-part]");
    if (!button) return;
    if (!isEditablePart(button.dataset.part)) {
      toast("该区域暂未配置切图");
      return;
    }
    state.selectedPartId = button.dataset.part;
    render();
  });

  els.shoeArt.addEventListener("click", (event) => {
    const part = event.target.closest("[data-part]");
    if (!part) return;
    if (!isEditablePart(part.dataset.part)) return;
    state.selectedPartId = part.dataset.part;
    render();
  });

  els.swatchGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-color]");
    if (!button) return;
    const component = selectedComponent();
    if (component.fixedOptions) {
      updateSelectedPart({ color: button.dataset.color, variant: button.dataset.color, material: FIXED_MATERIAL_ID });
      return;
    }
    updateSelectedPart({ color: button.dataset.color, variant: "" });
  });

  els.textureList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-material]");
    if (!button) return;
    updateSelectedPart({ material: button.dataset.material });
  });

  els.spinButton.addEventListener("click", () => {
    state.spinning = !state.spinning;
    render();
  });

  els.copyConfigButton?.addEventListener("click", copyConfig);
  els.saveButton.addEventListener("click", openConfirmModal);
  els.resetButton.addEventListener("click", resetProduct);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-confirm]")) {
      closeConfirmModal();
      return;
    }

    const partButton = event.target.closest("[data-confirm-part]");
    if (partButton) {
      if (!isEditablePart(partButton.dataset.confirmPart)) {
        toast("该区域暂未配置切图");
        return;
      }
      state.selectedPartId = partButton.dataset.confirmPart;
      render();
      closeConfirmModal();
      return;
    }

    if (event.target.closest("[data-download-sheet]")) {
      downloadSheet();
    }
  });

  document.addEventListener("input", (event) => {
    const customerKey = event.target.dataset.customer;
    if (customerKey) {
      state.customer[customerKey] = event.target.value;
      return;
    }

    const embroideryKey = event.target.dataset.embroideryText;
    if (embroideryKey) {
      state.config[state.productId].embroidery[embroideryKey].text = event.target.value;
    }
  });

  document.addEventListener("change", (event) => {
    const embroideryKey = event.target.dataset.embroideryToggle;
    if (embroideryKey) {
      state.config[state.productId].embroidery[embroideryKey].enabled = event.target.checked;
      return;
    }

    if (event.target.dataset.padStyle !== undefined) {
      state.config[state.productId].padStyle = event.target.value;
    }
  });

  let dragStartX = 0;
  els.shoeScene.addEventListener("pointerdown", (event) => {
    dragStartX = event.clientX;
    els.shoeScene.setPointerCapture(event.pointerId);
  });

  els.shoeScene.addEventListener("pointerup", (event) => {
    const distance = event.clientX - dragStartX;
    if (Math.abs(distance) > 36) {
      state.angle = distance > 0 ? "side" : "front";
      render();
    }
  });
}

function init() {
  PRODUCT_CATALOG.forEach((item) => {
    state.config[item.id] = cloneProductConfig(item);
  });
  bindEvents();
  render();
}

init();
