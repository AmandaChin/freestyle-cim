const MVP_ACTIVE_PART_ID = "G";
const FIXED_MATERIAL_ID = "fixed-image";
const LAYER_ASSET_DIR = "./assets/mvp/layers/";
const FULL_ANGLE_ASSET_DIR = "./assets/skates/yjs-pro-cim/";
const FULL_ANGLE_ASSET_VERSION = "20260523-annotated-v1";
const REAL_PRODUCT_ASSET_DIR = "./assets/skates/yjs-pro-cim/real-products/";
const MATERIAL_ASSET_DIR = "./assets/mvp/materials/";
const MATERIAL_ASSET_VERSION = "20260523-bear-test-v1";
const HIT_ALPHA_THRESHOLD = 18;
const SELECTION_RING_RADIUS = 14;
const SELECTION_RING_STEP = 3;
const SELECTION_RING_BLUR = 8;
const SHOE_ART_ASPECT_RATIO = 2401 / 1601;
const SHOE_SNAPSHOT_MAX_WIDTH = 1200;
const APP_VERSION = window.SKATE_CIM_VERSION || "0.0.0";

const SHARED_MVP_ASSETS = {
  base: "./assets/mvp/base-ui.png",
  stitch: `${LAYER_ASSET_DIR}stitch.png`
};

const YJS_PRO_REAL_PRODUCT_IMAGES = [
  { file: "brown-1.jpg", alt: "YJS-pro CIM 咖色真实鞋款" },
  { file: "white-pink-1.jpg", alt: "YJS-pro CIM 白粉真实鞋款" },
  { file: "white-red-1.jpg", alt: "YJS-pro CIM 白红真实鞋款" },
  { file: "pink-purple-1.jpg", alt: "YJS-pro CIM 粉紫真实鞋款" },
  { file: "black-gold-1.jpg", alt: "YJS-pro CIM 黑金真实鞋款" },
  { file: "silver-white-1.jpg", alt: "YJS-pro CIM 银白真实鞋款" },
  { file: "black-purple-2.jpg", alt: "YJS-pro CIM 黑紫真实鞋款" }
];

const FULL_ANGLE_PARTS = ["A", "A1", "F", "G", "H", "C", "C2", "I", "B", "J", "K1", "K2"];

const ANGLE_CONFIG = [
  { id: "side", label: "侧面", meta: "侧面全角度 UI", parts: FULL_ANGLE_PARTS, fixed: { D: ["cuff-black-gold-1", "cuff-black-gold-2", "cuff-silver", "cuff-red-black", "cuff-black-purple", "cuff-black"], M1: ["upper-strap-white", "upper-strap-black"], M2: ["lower-strap-white", "lower-strap-black"], L: { "pad-style-1": ["pad-new-white", "pad-new-black"], "pad-style-2": ["pad-old-white", "pad-old-black"] }, O: ["mushroom-nail-white", "mushroom-nail-black"], N: ["sole-silver", "sole-black-red", "sole-black-purple", "sole-black"] } },
  { id: "forty_five", label: "45度", meta: "45度全角度 UI", parts: FULL_ANGLE_PARTS, fixed: { D: ["cuff-black-gold-1", "cuff-black-gold-2", "cuff-silver", "cuff-red-black", "cuff-black-purple", "cuff-black"], M1: ["upper-strap-white", "upper-strap-black"], M2: ["lower-strap-white", "lower-strap-black"], L: { "pad-style-1": ["pad-new-white", "pad-new-black"], "pad-style-2": ["pad-old-white", "pad-old-black"] }, O: ["mushroom-nail-white", "mushroom-nail-black"], N: ["sole-silver", "sole-black-red", "sole-black-purple", "sole-black", "sole-black-gold"] } },
  { id: "front", label: "正面", meta: "正面全角度 UI", parts: ["F", "G", "H", "C", "C2", "I", "J", "K1", "K2"], fixed: { M1: ["upper-strap-white", "upper-strap-black"], M2: ["lower-strap-white", "lower-strap-black"], L: { "pad-style-1": ["pad-new-white", "pad-new-black"], "pad-style-2": ["pad-old-white", "pad-old-black"] } } }
];

function fullAngleAsset(path) {
  return `${FULL_ANGLE_ASSET_DIR}${path}?v=${FULL_ANGLE_ASSET_VERSION}`;
}

function materialAsset(fileName) {
  return `${MATERIAL_ASSET_DIR}${fileName}?v=${MATERIAL_ASSET_VERSION}`;
}

function realProductAsset(fileName) {
  return `${REAL_PRODUCT_ASSET_DIR}${fileName}`;
}

function angleAssets(angleId) {
  const angle = ANGLE_CONFIG.find((item) => item.id === angleId) || ANGLE_CONFIG[0];
  const fixed = Object.fromEntries(
    Object.entries(angle.fixed || {}).map(([componentId, variants]) => [
      componentId,
      Array.isArray(variants)
        ? Object.fromEntries(variants.map((variant) => [variant, fullAngleAsset(`${angle.id}/fixed/${componentId}/${variant}.png`)]))
        : Object.fromEntries(Object.values(variants).flatMap((styleVariants) => styleVariants.map((variant) => [variant, fullAngleAsset(`${angle.id}/fixed/${componentId}/${variant}.png`)])))
    ])
  );
  return {
    ...angle,
    base: fullAngleAsset(`${angle.id}/base.png`),
    stitch: fullAngleAsset(`${angle.id}/stitch.png`),
    parts: Object.fromEntries(angle.parts.map((partId) => [partId, fullAngleAsset(`${angle.id}/parts/${partId}.png`)])),
    fixed
  };
}

const COMPONENT_TEMPLATE = [
  { id: "A", code: "A", en: "Shoe collar", cn: "鞋帮", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}collar.png`], renderOrder: 30 },
  { id: "A1", code: "A1", en: "Lower edge", cn: "鞋身下摆", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}lower-edge.png`], renderOrder: 35 },
  { id: "F", code: "F", en: "Lower body", cn: "下身鞋片", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}lower-body.png`], renderOrder: 40 },
  { id: "G", code: "G", en: "Main upper", cn: "上身鞋片", palette: "leather", color: "#f0b7c8", material: "pearl", masks: [`${LAYER_ASSET_DIR}upper-body.png`], renderOrder: 45 },
  { id: "H", code: "H", en: "Toe", cn: "鞋头", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}toe.png`], renderOrder: 50 },
  { id: "C", code: "C", en: "Tongue", cn: "鞋舌", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}tongue.png`], renderOrder: 55 },
  { id: "C2", code: "C2", en: "Tongue panel", cn: "鞋舌裁片", palette: "leather", color: "#f0b7c8", material: "pearl", masks: [`${LAYER_ASSET_DIR}tongue-panel.png`], renderOrder: 60 },
  { id: "I", code: "I", en: "Eyelet panel", cn: "鞋眼片", palette: "leather", color: "#f6f3ec", material: "smooth", masks: [`${LAYER_ASSET_DIR}eyelet-panel.png`], renderOrder: 65 },
  { id: "B", code: "B", en: "Back handle strap", cn: "后提带", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}back-strap.png`], renderOrder: 75 },
  { id: "J", code: "J", en: "Lace", cn: "鞋带", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}lace.png`], renderOrder: 80 },
  { id: "K1", code: "K1", en: "Toe strap 1", cn: "扣带1", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}toe-strap-1.png`], renderOrder: 85 },
  { id: "K2", code: "K2", en: "Toe strap 2", cn: "扣带2", palette: "strap", color: "#ffffff", material: "webbing", masks: [`${LAYER_ASSET_DIR}toe-strap-2.png`], renderOrder: 90 },
  {
    id: "L",
    code: "L",
    en: "Abrasive pad",
    cn: "防磨片",
    palette: "fixed",
    material: "pad-style-1",
    color: "#f6f3ec",
    defaultVariant: "pad-style-1",
    renderOrder: 95,
    fixedColorOptions: [
      { id: "pad-white", name: "白色", value: "#f6f3ec", swatch: "#f6f3ec", suffix: "white" },
      { id: "pad-black", name: "黑色", value: "#17171a", swatch: "#17171a", suffix: "black" }
    ],
    fixedOptions: [
      { id: "pad-style-1", name: "防磨片样式1", note: "新防磨片", sourcePrefix: "pad-new", swatch: "#f6f3ec", image: `${LAYER_ASSET_DIR}abrasive-pad.png` },
      { id: "pad-style-2", name: "防磨片样式2", note: "旧防磨片", sourcePrefix: "pad-old", swatch: "#f2eee7", image: `${LAYER_ASSET_DIR}abrasive-pad.png` }
    ]
  },
  {
    id: "M1",
    code: "M1",
    en: "Upper energy strap",
    cn: "上能量带",
    palette: "fixed",
    material: FIXED_MATERIAL_ID,
    defaultVariant: "upper-strap-black",
    renderOrder: 100,
    fixedOptions: [
      { id: "upper-strap-white", name: "白色上能量带", swatch: "#f7f7f8", image: `${LAYER_ASSET_DIR}buckle-white.png` },
      { id: "upper-strap-black", name: "黑色上能量带", swatch: "#17171a", image: `${LAYER_ASSET_DIR}buckle-black.png` }
    ]
  },
  {
    id: "M2",
    code: "M2",
    en: "Lower energy strap",
    cn: "下能量带",
    palette: "fixed",
    material: FIXED_MATERIAL_ID,
    defaultVariant: "lower-strap-black",
    renderOrder: 105,
    fixedOptions: [
      { id: "lower-strap-white", name: "白色下能量带", swatch: "#f7f7f8", image: `${LAYER_ASSET_DIR}buckle-white.png` },
      { id: "lower-strap-black", name: "黑色下能量带", swatch: "#17171a", image: `${LAYER_ASSET_DIR}buckle-black.png` }
    ]
  },
  {
    id: "O",
    code: "O",
    en: "Mushroom nail",
    cn: "蘑菇钉",
    palette: "fixed",
    material: FIXED_MATERIAL_ID,
    defaultVariant: "mushroom-nail-black",
    renderOrder: 130,
    fixedOptions: [
      { id: "mushroom-nail-white", name: "白色蘑菇钉", swatch: "#f7f7f8", image: `${LAYER_ASSET_DIR}eyelets.png` },
      { id: "mushroom-nail-black", name: "黑色蘑菇钉", swatch: "#17171a", image: `${LAYER_ASSET_DIR}eyelets.png` }
    ]
  },
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
      { id: "cuff-black-gold-1", name: "黑金色 CUFF 1", swatch: "linear-gradient(135deg, #302010 0 72%, #403020 100%)", image: `${LAYER_ASSET_DIR}cuff-black-gold-1.png` },
      { id: "cuff-silver", name: "银色 CUFF", swatch: "linear-gradient(135deg, #b0b0b0 0 72%, #d8d8d8 100%)", image: `${LAYER_ASSET_DIR}cuff-silver.png` },
      { id: "cuff-red-black", name: "红黑色 CUFF", swatch: "linear-gradient(135deg, #301010 0 72%, #401818 100%)", image: `${LAYER_ASSET_DIR}cuff-red-black.png` },
      { id: "cuff-black-gold-2", name: "黑金色 CUFF 2", swatch: "linear-gradient(135deg, #302010 0 72%, #403020 100%)", image: `${LAYER_ASSET_DIR}cuff-black-gold-2.png` },
      { id: "cuff-black-purple", name: "黑紫色 CUFF", swatch: "linear-gradient(135deg, #281830 0 72%, #302038 100%)", image: `${LAYER_ASSET_DIR}cuff-black-purple.png` },
      { id: "cuff-black", name: "黑色 CUFF", swatch: "linear-gradient(135deg, #202020 0 72%, #303030 100%)", image: `${LAYER_ASSET_DIR}cuff-black.png` }
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
      { id: "sole-silver", name: "银色鞋底", swatch: "linear-gradient(135deg, #d8d0d0 0 72%, #e0e0e0 100%)", image: `${LAYER_ASSET_DIR}sole-silver.png` },
      { id: "sole-black-red", name: "黑红色鞋底", swatch: "linear-gradient(135deg, #301010 0 72%, #401818 100%)", image: `${LAYER_ASSET_DIR}sole-black-red.png` },
      { id: "sole-black-purple", name: "黑紫色鞋底", swatch: "linear-gradient(135deg, #281830 0 72%, #302038 100%)", image: `${LAYER_ASSET_DIR}sole-black-purple.png` },
      { id: "sole-black", name: "黑色鞋底", swatch: "linear-gradient(135deg, #202020 0 72%, #282828 100%)", image: `${LAYER_ASSET_DIR}sole-black.png` }
    ]
  }
];

const SHARED_PRODUCT_DETAILS = {
  fixedItems: [
    { en: "Upper energy strap", cn: "上能量带", value: "黑色" },
    { en: "Lower energy strap", cn: "下能量带", value: "黑色" },
    { en: "Mushroom nail", cn: "蘑菇钉", value: "黑色" },
    { en: "Spider buckle", cn: "蜘蛛扣", value: "参考黑色公款" }
  ],
  padStyles: [],
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

const CIM_SHARED_CONFIG = (() => {
  try {
    const localConfig = JSON.parse(localStorage.getItem("SKATE_CIM_PUBLISHED_CONFIG") || "null");
    if (localConfig?.schemaVersion && Array.isArray(localConfig.shoes)) return localConfig;
  } catch {
    localStorage.removeItem("SKATE_CIM_PUBLISHED_CONFIG");
  }
  return window.SKATE_CIM_CONFIG || {};
})();
const SHARED_SHOE_BY_ID = new Map(
  (CIM_SHARED_CONFIG.shoes || []).flatMap((item) => [
    [item.shoeId, item],
    [item.id, item]
  ])
);
const PUBLISHED_SHOE_IDS = new Set(
  (CIM_SHARED_CONFIG.shoes || [])
    .filter((item) => item.status === "published")
    .map((item) => item.shoeId)
);

function sharedShoeFor(item) {
  return SHARED_SHOE_BY_ID.get(item.id) || SHARED_SHOE_BY_ID.get(item.shoeId);
}

function mergeSharedComponents(components, sharedShoe) {
  if (!sharedShoe?.parts?.length) return components;
  const sharedParts = new Map(sharedShoe.parts.map((part) => [part.key, part]));
  return components.map((component) => {
    const part = sharedParts.get(component.id);
    if (!part) return component;
    return {
      ...component,
      code: part.key || component.code,
      cn: part.name || component.cn,
      group: part.group || component.group,
      editable: part.selectable === false ? false : component.editable,
      materialRule: part.materialRule || component.materialRule,
      sourceKey: part.sourceKey || component.sourceKey
    };
  });
}

function mergeSharedAngles(angles, sharedShoe) {
  if (!sharedShoe?.angles?.length) return angles;
  const angleById = new Map(angles.map((angle) => [angle.id, angle]));
  const merged = sharedShoe.angles
    .filter((angle) => angle.active !== false)
    .map((angle) => {
      const base = angleById.get(angle.key) || angleById.get(angle.id);
      if (!base) return null;
      return {
        ...base,
        label: angle.name || base.label,
        meta: angle.notes || base.meta
      };
    })
    .filter(Boolean);
  return merged.length ? merged : angles;
}

function enrichProductFromShared(item) {
  const sharedShoe = sharedShoeFor(item);
  if (!sharedShoe) return item;
  return {
    ...item,
    name: sharedShoe.name || item.name,
    code: sharedShoe.code || item.code,
    description: sharedShoe.description || item.description,
    note: sharedShoe.notes || item.note,
    homeLabel: sharedShoe.homeLabel || item.homeLabel,
    homeFeatures: sharedShoe.homeFeatures || item.homeFeatures,
    defaultAngle: sharedShoe.defaultAngleKey || item.defaultAngle,
    editablePartId: sharedShoe.defaultPartKey || item.editablePartId,
    angles: mergeSharedAngles(item.angles, sharedShoe),
    components: mergeSharedComponents(item.components, sharedShoe)
  };
}

const PRODUCT_CATALOG = [
  {
    id: "yjs-pro-cim-upper",
    name: "YJS-pro CIM",
    code: "YJS-PRO",
    price: "专业上鞋定制",
    homeTag: "Pro Custom",
    homeLabel: "专业支撑款",
    description: "高帮轮滑鞋上鞋定制，面向进阶训练与比赛配置，支持按标注裁片扩展颜色和皮料。",
    note: "上/下能量带、防磨片、蘑菇钉、鞋底、CUFF 使用切图指定固定样式；其余标注裁片支持颜色与皮料选择。",
    homeFeatures: ["高帮支撑", "碳纤鞋壳", "确认单导出"],
    realProductImages: YJS_PRO_REAL_PRODUCT_IMAGES,
    accentA: "#f0b7c8",
    accentB: "#ad94ff",
    angles: ANGLE_CONFIG,
    defaultAngle: "side",
    editablePartId: MVP_ACTIVE_PART_ID,
    assets: SHARED_MVP_ASSETS,
    components: buildComponents({
      G: { color: "#f0b7c8", material: "pearl" },
      C2: { color: "#f0b7c8", material: "pearl" },
      D: { defaultVariant: "cuff-silver" },
      M1: { defaultVariant: "upper-strap-black" },
      M2: { defaultVariant: "lower-strap-black" },
      O: { defaultVariant: "mushroom-nail-black" },
      L: { color: "#f6f3ec", material: "pad-style-1", defaultVariant: "pad-style-1" },
      N: { defaultVariant: "sole-silver" }
    }),
    ...SHARED_PRODUCT_DETAILS
  }
]
  .map(enrichProductFromShared)
  .filter((item) => PUBLISHED_SHOE_IDS.size === 0 || PUBLISHED_SHOE_IDS.has(item.id));

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
  { id: "chinoiserie-pink", name: "中国风粉色", note: "固定花纹布料" },
  { id: "chinoiserie-white", name: "中国风白色", note: "固定花纹布料" },
  { id: "fixed-straw", name: "草席", note: "固定贴图 · 点开选择样式" },
  { id: "carbon", name: "碳纤皮", note: "碳纤纹理" },
  { id: "webbing", name: "织带", note: "绑带质感" },
  { id: "hardware", name: "五金", note: "扣件质感" },
  { id: FIXED_MATERIAL_ID, name: "固定贴图", note: "按切图色值" }
];

const FIXED_STRAW_STYLES = [
  { id: "fixed-straw-1336", name: "1336号皮料", parentId: "fixed-straw", file: "草席/1336.png" },
  { id: "fixed-straw-1437", name: "1437号皮料", parentId: "fixed-straw", file: "草席/1437.png" },
  { id: "fixed-straw-1518", name: "1518号皮料", parentId: "fixed-straw", file: "草席/1518.png" },
  { id: "fixed-straw-1635", name: "1635号皮料", parentId: "fixed-straw", file: "草席/1635.png" },
  { id: "fixed-straw-1741", name: "1741号皮料", parentId: "fixed-straw", file: "草席/1741.png" },
  { id: "fixed-straw-2932", name: "2932号皮料", parentId: "fixed-straw", file: "草席/2932.png" }
];

PRODUCT_CATALOG.forEach((item) => {
  item.components.forEach((component) => {
    component.editable = component.editable !== false && (Boolean(component.masks?.length) || Boolean(component.fixedOptions?.length));
    if (!component.editable) component.lockReason = "暂未配置切图";
  });
});

const DEFAULT_PRODUCT_ID = PRODUCT_CATALOG.find((item) => item.id === "yjs-pro-cim-upper")?.id || PRODUCT_CATALOG[0].id;
const DEFAULT_PRODUCT = PRODUCT_CATALOG.find((item) => item.id === DEFAULT_PRODUCT_ID);
const hitCanvasCache = new Map();
const snapshotImageCache = new Map();
const selectionRingCache = new Map();
let shoeHitRequestId = 0;
let shoeFitObserver = null;
let effectSnapshotRecord = null;
let effectSnapshotRequestId = 0;

const state = {
  view: "home",
  productId: DEFAULT_PRODUCT_ID,
  selectedPartId: activePartId(DEFAULT_PRODUCT),
  angle: "side",
  selectedEffectAngle: "side",
  isCustomizerOpen: false,
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
  return item?.angles?.length ? item.angles : ANGLE_CONFIG;
}

function currentAngleConfig(item = product(), angleId = state.angle) {
  return productAngles(item).find((angle) => angle.id === angleId) || productAngles(item)[0] || ANGLE_CONFIG[0];
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
  return PALETTES[component.palette] || PALETTES.leather;
}

function isColorControlVisible(component = selectedComponent(), config = componentConfig(component.id)) {
  return !fixedStrawStyleByMaterial(config.material);
}

function materialsFor(component) {
  if (component.fixedColorOptions) return component.fixedOptions;
  if (component.fixedOptions) return MATERIALS.filter((item) => item.id === FIXED_MATERIAL_ID);
  if (["A", "A1", "G"].includes(component.id)) return MATERIALS.filter((item) => item.id === "smooth" || item.id === "mesh" || item.id === "pearl" || item.id === "matte" || item.id === "chinoiserie-pink" || item.id === "chinoiserie-white" || item.id === "fixed-straw");
  if (component.editable) return MATERIALS.filter((item) => item.id === "smooth" || item.id === "mesh" || item.id === "pearl" || item.id === "matte");
  if (component.palette === "carbon") return MATERIALS.filter((item) => item.id === "carbon" || item.id === "matte");
  if (component.palette === "strap") return MATERIALS.filter((item) => item.id === "webbing" || item.id === "smooth");
  if (component.palette === "hardware") return MATERIALS.filter((item) => item.id === "hardware" || item.id === "matte");
  if (component.palette === "rubber") return MATERIALS.filter((item) => item.id === "matte" || item.id === "smooth");
  return MATERIALS.filter((item) => item.id === "smooth" || item.id === "pearl" || item.id === "matte");
}

function materialById(id) {
  return fixedStrawStyleByMaterial(id) || MATERIALS.find((item) => item.id === id) || MATERIALS[0];
}

function fixedStrawStyleByMaterial(id) {
  return FIXED_STRAW_STYLES.find((item) => item.id === id) || null;
}

function fixedStrawStylePatch(styleId = FIXED_STRAW_STYLES[0].id) {
  const style = fixedStrawStyleByMaterial(styleId) || FIXED_STRAW_STYLES[0];
  return { material: style.id, variant: style.id };
}

function colorName(value, component = selectedComponent()) {
  if (component?.fixedColorOptions) return component.fixedColorOptions.find((color) => color.value.toLowerCase() === value.toLowerCase())?.name || value;
  if (component?.fixedOptions) return fixedOption(component, { color: value, variant: value })?.name || value;
  return colorOptions(component).find((color) => color.value.toLowerCase() === value.toLowerCase())?.name || value;
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

function componentColorValue(component, config = componentConfig(component.id)) {
  if (component.fixedColorOptions) return config.color || component.color;
  const option = fixedOption(component, config);
  return option?.swatch || config.color;
}

function materialName(id, component = selectedComponent()) {
  if (component?.fixedColorOptions) return fixedOption(component, { material: id, variant: id })?.name || id;
  return materialById(id).name;
}

function cssTexture(color, material) {
  const fixedStrawStyle = fixedStrawStyleByMaterial(material);
  if (fixedStrawStyle) {
    // 草席新增资源是完整固定贴图，不再叠加色值，直接作为裁片纹理渲染。
    return `url('${materialAsset(fixedStrawStyle.file)}') center / cover no-repeat`;
  }

  switch (material) {
    case "chinoiserie-pink":
      return `linear-gradient(rgba(255,255,255,.08), rgba(255,255,255,.08)), url('${materialAsset("chinoiserie-pink.jpg")}') center / cover no-repeat`;
    case "chinoiserie-white":
      return `linear-gradient(rgba(255,255,255,.04), rgba(255,255,255,.04)), url('${materialAsset("chinoiserie-white.jpg")}') center / cover no-repeat`;
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
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);

  switch (material) {
    case "chinoiserie-pink":
    case "chinoiserie-white": {
      const fileName = material === "chinoiserie-pink" ? "chinoiserie-pink.jpg" : "chinoiserie-white.jpg";
      const image = await loadSnapshotImage(materialAsset(fileName));
      if (image) {
        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      }
      context.fillStyle = material === "chinoiserie-pink" ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)";
      context.fillRect(0, 0, width, height);
      break;
    }
    case "carbon":
      drawRepeatingLines(context, width, height, 12, "#fff", 0.24, 1);
      drawRepeatingLines(context, width, height, 12, "#000", 0.18, -1);
      break;
    case "pearl": {
      const pearl = context.createRadialGradient(width * 0.2, height * 0.18, 0, width * 0.2, height * 0.18, width * 0.36);
      pearl.addColorStop(0, "rgba(255,255,255,.82)");
      pearl.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = pearl;
      context.fillRect(0, 0, width, height);
      const shine = context.createLinearGradient(0, 0, width, height);
      shine.addColorStop(0, "rgba(255,255,255,.28)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = shine;
      context.fillRect(0, 0, width, height);
      break;
    }
    case "mesh":
      drawRepeatingLines(context, width, height, 8, "#fff", 0.2, 1);
      drawRepeatingLines(context, width, height, 8, "#000", 0.08, -1);
      break;
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
      label: angle.label,
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
  els.customizerToggleButton.textContent = isOpen ? "收起侧栏" : "颜色/布料";
  els.customizerToggleButton.title = isOpen ? "收起颜色和布料侧边栏" : "打开颜色和布料侧边栏";
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
    toast("该区域暂未配置切图");
    return false;
  }
  if (!isPartAvailableInCurrentAngle(partId)) {
    toast("当前角度暂未配置该裁片切图");
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

  if (option) {
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

function shoeMarkup(item = product(), alt = `${product().name} 侧面预览`, angleOverrideId = "", options = {}) {
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
  return shoeMarkup(item, `${item.name} 侧面基础图`);
}

function homeShoeMarkup(item = product()) {
  return shoeMarkup(item, `${item.name} 预览图`);
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
  els.homeProductDescription.textContent = "选择鞋款后进入定制器，继续配置颜色、皮料和特殊定制。";
  els.homeProductMeta.innerHTML = (item.homeFeatures || [item.code, "Layered 2.5D MVP"]).map((feature) => `<span>${feature}</span>`).join("");
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
          <span class="home-card-kicker">${catalogItem.homeLabel}</span>
          <strong>${catalogItem.name}</strong>
          <span>${catalogItem.description}</span>
        </span>
        <span class="home-card-meta">${selected ? "已选择" : "选择"}</span>
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
          <strong>${item.name}</strong>
          <span>${item.price}</span>
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
        ${tab.label}
      </button>`
    )
    .join("");
}

function renderParts() {
  const item = product();
  const angle = angleAssets(currentAngleConfig(item).id);
  els.partRail.innerHTML = item.components
    .map((component) => {
      const config = componentConfig(component.id);
      const angleAvailable = componentHasLayerInAngle(component, item, angle);
      const disabled = !component.editable || !angleAvailable;
      const disabledReason = !component.editable ? component.lockReason : "当前角度无切图";
      return `
        <button class="part-button component-button rail-part-button ${disabled ? "is-disabled" : ""}" type="button" data-part="${component.id}" aria-pressed="${isPartSelectionVisible() && component.id === state.selectedPartId}" title="${component.code} · ${component.cn}" ${disabled ? "disabled aria-disabled=\"true\"" : ""}>
          <span>
            <strong>${component.cn}</strong>
            <span>${disabled ? disabledReason : component.en}</span>
          </span>
          <i style="--component-color:${componentPreview(component, config)}"></i>
        </button>`;
    })
    .join("");
}

function renderSwatches() {
  const component = selectedComponent();
  const config = componentConfig();
  const colorBlock = els.swatchGrid.closest(".color-block");
  const isVisible = isColorControlVisible(component, config);
  if (colorBlock) colorBlock.hidden = !isVisible;
  if (!isVisible) {
    els.swatchGrid.innerHTML = "";
    return;
  }
  els.swatchGrid.innerHTML = colorOptions(component)
    .map(
      (color) => `
        <button class="swatch-button" type="button" title="${color.name}" aria-label="${color.name}" aria-pressed="${color.value.toLowerCase() === (component.fixedColorOptions ? config.color : (config.variant || config.color)).toLowerCase()}" data-part-id="${component.id}" data-color="${color.value}" style="--swatch:${color.swatch || color.value};"></button>`
    )
    .join("");
}

function renderTextures() {
  const component = selectedComponent();
  const config = componentConfig();
  els.textureList.innerHTML = materialsFor(component)
    .map((material) => {
      const isFixedStraw = material.id === "fixed-straw";
      const isFixedStrawSelected = isFixedStraw && Boolean(fixedStrawStyleByMaterial(config.material));
      return `
      <button class="texture-button" type="button" data-part-id="${component.id}" data-material="${material.id}" aria-pressed="${material.id === config.material}">
        <span class="texture-preview" style="--texture:${texturePreview(component, config, material)};"></span>
        <span>
          <strong>${material.name}</strong>
          <span>${material.note}</span>
        </span>
        <span class="texture-check">${material.id === config.material || isFixedStrawSelected ? "✓" : ""}</span>
      </button>
      ${isFixedStraw && isFixedStrawSelected ? renderFixedStrawStyles(component, config) : ""}`;
    })
    .join("");
}

function renderFixedStrawStyles(component, config) {
  return FIXED_STRAW_STYLES.map((style) => `
    <button class="texture-button texture-button--sub" type="button" data-part-id="${component.id}" data-straw-style="${style.id}" aria-pressed="${style.id === config.material}">
      <span class="texture-preview" style="--texture:${cssTexture(config.color, style.id)};"></span>
      <span>
        <strong>${style.name}</strong>
        <span>草席固定贴图</span>
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
  const includeImageData = options.includeImageData === true;
  const includeEffectSnapshots = options.includeEffectSnapshots === true && effectSnapshotsReady(item);
  return {
    version: APP_VERSION,
    product: item.name,
    customer: { ...state.customer },
    effectPreview: {
      angle: selectedEffect.label,
      angleId: selectedEffect.id
    },
    components: item.components.map((component) => {
      const config = componentConfig(component.id);
      return {
        code: component.code,
        component: component.en,
        name: component.cn,
        color: colorName(config.color, component),
        colorValue: componentColorValue(component, config),
        material: materialName(config.material, component)
      };
    }),
    fixedItems: item.fixedItems,
    padStyle: item.padStyles.find((style) => style.id === state.config[state.productId].padStyle)?.name || "",
    embroidery: item.embroiderySlots.map((slot) => {
      const image = state.config[state.productId].embroidery[slot.id].image;
      return {
        code: slot.code,
        name: slot.cn,
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
              label: preview.label,
              dataUrl: preview.dataUrl
            }))
          }
        }
      : {}),
    note: item.note
  };
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

  els.modelName.textContent = item.name;
  els.modelDescription.textContent = item.description;
  els.angleMeta.textContent = currentAngleConfig(item).meta || `${currentAngleConfig(item).label}预览`;
  els.modelMeta.textContent = `${item.code} · 已开放 ${item.components.filter((part) => part.editable).length} 个标注区域`;
  els.selectedPartLabel.textContent = isPartSelectionVisible() ? `${component.code} · ${component.cn}` : "";
  els.selectedPartTitle.textContent = `正在编辑：${component.cn}`;
  els.selectedColorName.textContent = colorName(config.color);
  els.selectedTextureName.textContent = materialName(config.material, component);
  els.configPreview.textContent = JSON.stringify(output, null, 2);
}

function render() {
  normalizeAngleForProduct();
  normalizeSelectedPartForAngle();
  const isHome = state.view === "home";
  document.body.dataset.view = state.view;
  els.homeView.classList.toggle("is-hidden", !isHome);
  els.workspace.classList.toggle("is-hidden", isHome);
  els.homeButton.hidden = isHome;
  els.resetButton.hidden = isHome;
  els.saveButton.hidden = isHome;
  els.pageEyebrow.textContent = isHome ? "Skate Studio" : "Customizer";
  els.pageTitle.textContent = isHome ? "Freestyle CIM" : product().name;
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

function resetProduct() {
  state.config[state.productId] = cloneProductConfig(product());
  state.selectedPartId = activePartId();
  state.selectedEffectAngle = currentAngleConfig(product()).id;
  state.isCustomizerOpen = defaultCustomizerOpen();
  render();
  toast("已重置当前鞋款");
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
    return `<img class="effect-option-thumb-image" src="${escapeHtml(snapshot.dataUrl)}" alt="${escapeHtml(`${item.name} ${angle.label}视角缩略图`)}" draggable="false" />`;
  }
  const assets = angleAssets(angle.id);
  return `<img class="effect-option-thumb-image" src="${escapeHtml(assets.base)}" alt="${escapeHtml(`${item.name} ${angle.label}视角缩略图`)}" loading="lazy" draggable="false" />`;
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
          <h2 id="effectPickerTitle">确认鞋子效果</h2>
        </div>
        <button class="icon-button" type="button" data-close-effect title="关闭">×</button>
      </header>

      <div class="effect-body">
        <section class="effect-preview-panel">
          <div class="section-title">
            <h3>${selectedEffect.label}效果图</h3>
            <span>${item.name}</span>
          </div>
          <div class="effect-preview-frame">
            ${
              selectedSnapshot?.dataUrl
                ? `<img class="effect-preview-snapshot" src="${escapeHtml(selectedSnapshot.dataUrl)}" alt="${escapeHtml(`${item.name} ${selectedEffect.label}效果图`)}" draggable="false" />`
                : `<div class="effect-preview-loading">正在生成效果图...</div>`
            }
          </div>
        </section>

        <section class="effect-choice-panel">
          <div class="section-title">
            <h3>效果图视角</h3>
            <span>生成确认单前确认最终鞋子效果 UI</span>
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
                      <strong>${angle.label}效果图</strong>
                      <span>${angle.meta || `${angle.label}预览`}</span>
                    </span>
                  </button>`
              )
              .join("")}
          </div>
        </section>
      </div>

      <footer class="confirm-actions">
        <button class="glass-button" type="button" data-back-confirm>返回表单</button>
        <button class="primary-button" type="button" data-download-sheet>生成确认单</button>
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

function renderConfirmModal() {
  const data = buildExportData();
  return `
    <div class="confirm-backdrop" data-close-confirm></div>
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <header class="confirm-header">
        <div>
          <p class="eyebrow">Form</p>
          <h2 id="confirmTitle">填写定制信息</h2>
        </div>
        <button class="icon-button" type="button" data-close-confirm title="关闭">×</button>
      </header>

      <div class="confirm-body">
        <section class="confirm-section confirm-info-section">
          <div class="section-title">
            <h3>个人信息</h3>
            <span>先填写表单，再确认鞋子效果</span>
          </div>
          <div class="field-grid">
            <label>姓名<input data-customer="name" value="${escapeHtml(state.customer.name)}" placeholder="name" /></label>
            <label>日期<input data-customer="date" type="date" value="${escapeHtml(state.customer.date)}" /></label>
            <label>脚长<input data-customer="footLength" value="${escapeHtml(state.customer.footLength)}" placeholder="foot length" /></label>
            <label>尺码<input data-customer="size" value="${escapeHtml(state.customer.size)}" placeholder="size" /></label>
          </div>
        </section>

        <section class="confirm-section confirm-color-section">
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

        <section class="confirm-section confirm-special-section">
          <div class="section-title">
            <h3>特殊定制</h3>
            <span>电绣 / 固定件</span>
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
                      <span>${slot.cn}</span>
                      <input type="text" data-embroidery-text="${slot.id}" value="${escapeHtml(slotConfig.text)}" placeholder="文字/Logo 备注" />
                    </label>
                    <div class="embroidery-upload-row">
                      <label class="embroidery-upload ${slotConfig.image ? "has-image" : ""}">
                        <input type="file" accept="image/*" hidden data-embroidery-image="${slot.id}" />
                        ${
                          slotConfig.image?.dataUrl
                            ? `<img src="${escapeHtml(slotConfig.image.dataUrl)}" alt="${escapeHtml(slot.cn)}参考图" />`
                            : `<span class="embroidery-thumb-placeholder">图片</span>`
                        }
                        <span>
                          <strong>${escapeHtml(slotConfig.image?.name || "上传图片")}</strong>
                          <em>${escapeHtml(slotConfig.image?.size || "支持 Logo / 参考图")}</em>
                        </span>
                      </label>
                      ${slotConfig.image ? `<button class="text-button embroidery-remove" type="button" data-remove-embroidery-image="${slot.id}">移除</button>` : ""}
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
        <button class="primary-button" type="button" data-review-effect>下一步确认鞋子效果</button>
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
    toast("请上传图片文件");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast("图片过大，请控制在 10MB 内");
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
    toast("图片已添加");
  } catch {
    toast("图片读取失败，请重试");
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
  const generatedAt = new Date().toLocaleString("zh-CN", { hour12: false });
  const baseHref = document.baseURI || window.location.href;
  const allAnglePreviews = data.effectSnapshots?.previews?.length
    ? data.effectSnapshots.previews
    : productAngles(item).map((angle) => ({ id: angle.id, label: angle.label, dataUrl: "" }));
  const embroideryImages = data.embroidery.filter((entry) => entry.image?.dataUrl);
  const customerRows = [
    ["姓名", data.customer.name || "-"],
    ["日期", data.customer.date || "-"],
    ["脚长", data.customer.footLength || "-"],
    ["尺码", data.customer.size || "-"]
  ];
  const componentRows = data.components.map((part) => [part.code, part.component, part.name, `${part.color} ${part.colorValue}`, part.material]);
  const embroideryRows = data.embroidery.map((entry) => [
    entry.code,
    entry.name,
    entry.enabled ? "是" : "否",
    entry.text || "-",
    entry.image ? `${entry.image.name} (${entry.image.size})` : "-"
  ]);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="${escapeHtml(baseHref)}" />
    <title>${escapeHtml(data.product)} 定制确认单</title>
    <style>${confirmationSheetStyles()}</style>
  </head>
  <body>
    <main class="sheet-shell">
      <div class="sheet-toolbar">
        <button type="button" onclick="window.print()">打印 / 另存 PDF</button>
      </div>
      <header class="sheet-header">
        <div>
          <p class="sheet-kicker">Skate Studio</p>
          <h1>定制确认单</h1>
          <p>${escapeHtml(data.product)} · 三视角最终效果图</p>
        </div>
        <div class="sheet-meta">
          <span>版本：${escapeHtml(data.version)}</span>
          <span>生成时间：${escapeHtml(generatedAt)}</span>
          <span>客户：${escapeHtml(data.customer.name || "-")}</span>
        </div>
      </header>

      <section class="sheet-section">
        <h2>最终效果图</h2>
        <div class="sheet-preview-grid">
          ${allAnglePreviews.map((preview) => `
            <div class="sheet-preview-card">
              <p class="sheet-preview-label">${escapeHtml(preview.label)}效果图</p>
              <div class="sheet-shoe-art">
                ${
                  preview.dataUrl
                    ? `<img class="sheet-preview-image" src="${escapeHtml(preview.dataUrl)}" alt="${escapeHtml(`${data.product} ${preview.label}最终效果图`)}" />`
                    : `<div class="sheet-preview-empty">效果图生成失败，请返回重新生成</div>`
                }
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="sheet-section">
        <h2>个人信息</h2>
        <div class="info-grid">
          ${customerRows.map(([label, value]) => `<div class="info-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
        </div>
      </section>

      <section class="sheet-section">
        <h2>配色选型</h2>
        <table aria-label="配色选型">
          <thead>
            <tr><th>No.</th><th>Component</th><th>裁片名称</th><th>颜色</th><th>皮料</th></tr>
          </thead>
          <tbody>${tableRows(componentRows)}</tbody>
        </table>
      </section>

      <section class="sheet-section">
        <h2>特殊定制</h2>
        <div class="info-grid">
          ${data.padStyle ? `<div class="info-item"><span>L1 防磨片款式</span><strong>${escapeHtml(data.padStyle)}</strong></div>` : ""}
        </div>
        <table aria-label="电绣定制">
          <thead>
            <tr><th>位置</th><th>名称</th><th>启用</th><th>内容</th><th>图片</th></tr>
          </thead>
          <tbody>${tableRows(embroideryRows)}</tbody>
        </table>
      </section>

      ${
        embroideryImages.length
          ? `<section class="sheet-section">
              <h2>上传图片</h2>
              <div class="image-grid">
                ${embroideryImages
                  .map(
                    (entry) => `<div class="image-card">
                      <span>${escapeHtml(entry.code)} · ${escapeHtml(entry.name)}</span>
                      <strong>${escapeHtml(entry.image.name)} (${escapeHtml(entry.image.size)})</strong>
                      <img src="${escapeHtml(entry.image.dataUrl)}" alt="${escapeHtml(entry.name)}参考图" />
                    </div>`
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }

      <section class="sheet-section">
        <h2>固定件</h2>
        <div class="fixed-grid">
          ${data.fixedItems.map((entry) => `<div class="fixed-card"><span>${escapeHtml(entry.en)}</span><strong>${escapeHtml(entry.cn)}：${escapeHtml(entry.value)}</strong></div>`).join("")}
        </div>
      </section>

      <section class="sheet-section">
        <h2>备注</h2>
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

async function downloadSheet() {
  const sheetWindow = window.open("", "_blank");
  if (sheetWindow && !sheetWindow.closed) {
    sheetWindow.document.open();
    sheetWindow.document.write("<!doctype html><title>正在生成确认单</title><p>正在生成确认单...</p>");
    sheetWindow.document.close();
  }
  if (!effectSnapshotsReady(product())) {
    effectSnapshotRecord = await buildEffectSnapshotRecord(product());
  }
  const data = buildExportData({ includeImageData: true, includeEffectSnapshots: true });
  const html = buildConfirmationSheetHtml(data);
  if (sheetWindow && !sheetWindow.closed) {
    sheetWindow.document.open();
    sheetWindow.document.write(html);
    sheetWindow.document.close();
    sheetWindow.focus();
  } else {
    downloadConfirmationSheetFallback(html, confirmationSheetFileName(data));
    toast("浏览器拦截新窗口，已下载 HTML 确认单");
  }
  closeConfirmModal();
  closeEffectPickerModal();
  toast("确认单已生成");
}

function copyConfig() {
  navigator.clipboard
    ?.writeText(JSON.stringify(buildExportData(), null, 2))
    .then(() => toast("配置 JSON 已复制"))
    .catch(() => toast("当前浏览器不允许复制，请手动选中 JSON"));
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

  els.swatchGrid.addEventListener("click", (event) => {
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
  });

  els.textureList.addEventListener("click", (event) => {
    const strawStyleButton = event.target.closest("[data-straw-style]");
    if (strawStyleButton) {
      const partId = strawStyleButton.dataset.partId || state.selectedPartId;
      invalidatePendingShoeHit();
      if (state.config[state.productId]?.components?.[partId]) {
        state.selectedPartId = partId;
      }
      updatePartConfig(state.selectedPartId, fixedStrawStylePatch(strawStyleButton.dataset.strawStyle));
      return;
    }

    const button = event.target.closest("[data-material]");
    if (!button) return;
    const partId = button.dataset.partId || state.selectedPartId;
    invalidatePendingShoeHit();
    if (state.config[state.productId]?.components?.[partId]) {
      state.selectedPartId = partId;
    }
    if (button.dataset.material === "fixed-straw") {
      updatePartConfig(state.selectedPartId, fixedStrawStylePatch());
      return;
    }
    updatePartConfig(state.selectedPartId, { material: button.dataset.material, variant: "" });
  });

  els.copyConfigButton?.addEventListener("click", copyConfig);
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
      returnToConfirmModal();
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
      toast("图片已移除");
      return;
    }

    if (event.target.closest("[data-review-effect]")) {
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

function init() {
  PRODUCT_CATALOG.forEach((item) => {
    state.config[item.id] = cloneProductConfig(item);
  });
  bindEvents();
  render();
}

init();
