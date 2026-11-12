import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const MATERIAL_ROOT = path.join(ROOT_DIR, "assets", "skates", "yjs-pro-cim", "materials");
const REAL_PRODUCT_ROOT = path.join(ROOT_DIR, "assets", "skates", "yjs-pro-cim", "real-products");
const DEFAULT_BASE_COLOR = "#f7f7f8";
// 来源：Base YH27bJJSJafbd3s2ff6cFlGLnQh 的「皮料图片」映射表。
const MAPPED_RESOURCE_IDS = [
  "13", "11", "43", "46", "48", "47", "44", "45", "39", "31", "32", "36", "37", "18", "35", "41",
  "8", "7", "16", "33", "3", "9", "4", "1", "5", "2", "23", "29", "40", "25", "26", "19",
  "42", "28", "21", "20", "30", "27", "14", "15", "6", "10", "12", "38", "24", "22", "34",
  "17", "49", "50", "51", "52", "53", "60", "61", "62", "63", "64", "65", "66", "67",
  "54", "55", "56", "57", "58", "59"
];
const SOURCE_RELATION_IDS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "17", "18", "22", "23",
  "24", "25", "26", "29", "31", "32", "34", "35", "36", "37", "38", "39", "40", "41", "43", "44",
  "45", "46", "47", "48", "49", "50", "51", "52", "53", "60", "61", "62", "63", "64", "65", "66",
  "67", "55", "57", "54", "56", "58", "59"
];
// 映射表保留无图记录；C 端不生成虚假资源，只把这些编号从可渲染 texture 列表中排除。
const MISSING_SOURCE_ASSET_IDS = ["4", "10", "11", "13", "21", "54", "55", "56", "57", "58", "59"];
const EXPECTED_CATEGORIES = {
  PU: ["1", "2", "3", "5", "9"],
  OTHERS: ["6", "12", "14", "15", "49", "50", "51", "60", "61", "62", "63", "64", "65", "66", "67"],
  "小熊": ["7", "8"],
  "斜纹点子布": ["16", "33"],
  "中国风": ["17", "34", "52", "53"],
  "草席": ["18", "31", "32", "35", "36", "37", "39", "41"],
  "皮革": ["19", "20", "27", "28", "30", "42"],
  "丝状肌理": ["22", "24", "38"],
  TPU: ["23", "25", "26", "29", "40"],
  "鳞片": ["43", "44", "45", "46", "47", "48"]
};
const ALL_TEXTURE_IDS = Object.values(EXPECTED_CATEGORIES).flat().sort((a, b) => Number(a) - Number(b));
const EXPECTED_TOE_IDS = ["32", "36", "37", "18", "35", "41", "38", "24", "22", "15", "59", "53", "34", "52", "17", "16", "14", "49", "50", "11", "10", "61", "62", "63", "64", "65", "66", "67", "6"];
const EXPECTED_REAL_PRODUCT_ORDER = [
  "white-pink-1.jpg",
  "brown-1.jpg",
  "white-red-1.jpg",
  "pink-purple-1.jpg",
  "black-gold-1.jpg",
  "silver-white-1.jpg",
  "black-purple-2.jpg"
];
const EXPECTED_DEFAULT_COLORS = {
  A: DEFAULT_BASE_COLOR,
  B: DEFAULT_BASE_COLOR,
  C: DEFAULT_BASE_COLOR,
  C1: DEFAULT_BASE_COLOR,
  C2: DEFAULT_BASE_COLOR,
  C3: DEFAULT_BASE_COLOR,
  F: DEFAULT_BASE_COLOR,
  F1: DEFAULT_BASE_COLOR,
  G: DEFAULT_BASE_COLOR,
  H: DEFAULT_BASE_COLOR,
  I: DEFAULT_BASE_COLOR,
  J: "#380059",
  K: DEFAULT_BASE_COLOR
};
const EXPECTED_DEFAULT_MATERIALS = {
  A: "51",
  B: "50",
  C: "50",
  C1: "49",
  C2: "50",
  C3: "50",
  F: "50",
  F1: "50",
  G: "49",
  H: "50",
  I: "50",
  J: "fixed-image",
  K: "50"
};
const EXPECTED_FIXED_DEFAULTS = {
  D: "cuff-black-purple",
  D1: "mushroom-nail-black",
  E: "sole-black-purple",
  L: "pad-new-black",
  M: "upper-strap-black",
  N: "lower-strap-black"
};
const EXPECTED_LACE_COLORS = [
  { name: "黑色", value: "#000000" },
  { name: "白色", value: "#ffffff" },
  { name: "红色", value: "#e41c16" },
  { name: "土黄色", value: "#e2bc00" },
  { name: "紫色", value: "#380059" }
];
const OLD_TEST_TOKENS = [
  "smooth",
  "matte",
  "fixed-straw",
  "ue_pu",
  "ue_tpu",
  "ue_pu_tpu",
  "ue_鳞片",
  "fabric-fixed-straw",
  "fabric-ue-pu",
  "fabric-ue-tpu",
  "fabric-ue-pu-tpu",
  "fabric-ue-scale"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadSchema() {
  const sandbox = { window: {} };
  const source = vm.runInNewContext;
  return Promise.all([
    readFile(path.join(ROOT_DIR, "shared", "yjs-pro-cim-schema.js"), "utf8"),
    readFile(path.join(ROOT_DIR, "shared", "schema-utils.js"), "utf8")
  ]).then(([schemaSource, schemaUtilsSource]) => {
    source(schemaSource, sandbox, { filename: "shared/yjs-pro-cim-schema.js" });
    source(schemaUtilsSource, sandbox, { filename: "shared/schema-utils.js" });
    return { schema: sandbox.window.SKATE_CIM_SCHEMA, schemaSource, schemaUtils: sandbox.window.SKATE_CIM_SCHEMA_UTILS };
  });
}

function sorted(values) {
  return [...values].sort((a, b) => Number(a) - Number(b));
}

const { schema, schemaSource, schemaUtils } = await loadSchema();
const configSource = await readFile(path.join(ROOT_DIR, "b-side", "data", "cim-config.js"), "utf8");
const appSource = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");

assert(schema, "schema should expose SKATE_CIM_SCHEMA");
assert(schema.materialCategories, "schema should expose materialCategories");
assert(schema.materialTextures, "schema should expose materialTextures");
assert(schema.materialAvailability, "schema should expose materialAvailability");
assert(JSON.stringify(schema.assets.realProducts.map((item) => item.file)) === JSON.stringify(EXPECTED_REAL_PRODUCT_ORDER), "real product order should feature white-pink first");

for (const fileName of EXPECTED_REAL_PRODUCT_ORDER) {
  await access(path.join(REAL_PRODUCT_ROOT, fileName));
}

const leatherWhite = schema.palettes.leather.find((item) => item.id === "white");
const chinoiserieDefault = schema.materialTextures.find((item) => item.id === "34");
assert(leatherWhite?.value === DEFAULT_BASE_COLOR, "leather white palette should match the neutral default base");
assert(chinoiserieDefault?.file === "中国风/34.jpg", "former pink visual panels should default to China-style 34 texture");

const partsByKey = Object.fromEntries(schema.parts.map((part) => [part.key, part]));
const lace = partsByKey.J;
assert(JSON.stringify(lace?.fixedStyleSet?.colorOptions?.map(({ name, value }) => ({ name, value }))) === JSON.stringify(EXPECTED_LACE_COLORS), "J should expose only the five approved fixed lace colors in order");
assert(lace?.defaultStyle?.color === "#380059", "J should use purple as the side-view default fixed lace color");
assert(lace?.materialIds?.length === 1 && lace.materialIds[0] === "fixed-image", "J should use the fixed-image material entry");
assert(!schema.materialAvailabilityByAngle.side.J && !schema.materialAvailabilityByAngle.forty_five.J && !schema.materialAvailabilityByAngle.front.J, "fixed-color J should not carry official leather relations");
assert(JSON.stringify(schemaUtils.materialsForPart(schema, "J").map((material) => material.id)) === JSON.stringify(["fixed-image"]), "J should expose only the fixed-image material entry");
for (const [partKey, expectedColor] of Object.entries(EXPECTED_DEFAULT_COLORS)) {
  assert(partsByKey[partKey]?.defaultStyle?.color === expectedColor, `${partKey} should default to the white-pink color palette`);
  assert(partsByKey[partKey]?.defaultStyle?.material === EXPECTED_DEFAULT_MATERIALS[partKey], `${partKey} should default to the white-pink material mapping`);
}
for (const [partKey, expectedVariant] of Object.entries(EXPECTED_FIXED_DEFAULTS)) {
  assert(partsByKey[partKey]?.defaultStyle?.variant === expectedVariant, `${partKey} should default to the white-pink fixed variant`);
}
// CUFF 和蘑菇钉是外露五金，需要压在下鞋身片之上，避免预览时被 F 层遮住。
for (const partKey of ["D", "D1"]) {
  assert(partsByKey[partKey]?.renderOrder > partsByKey.F?.renderOrder, `${partKey} should render above lower body F`);
}

for (const token of OLD_TEST_TOKENS) {
  assert(!schemaSource.includes(token), `shared schema should remove old test material token ${token}`);
  assert(!configSource.includes(token), `B-side config should remove old test material token ${token}`);
}

assert(JSON.stringify(schema.materialCategories.map((item) => item.name)) === JSON.stringify(Object.keys(EXPECTED_CATEGORIES)), "category order should follow source folders");
assert(
  JSON.stringify(MAPPED_RESOURCE_IDS.filter((id) => !MISSING_SOURCE_ASSET_IDS.includes(id)).sort((a, b) => Number(a) - Number(b))) === JSON.stringify(ALL_TEXTURE_IDS),
  "texture assets should follow the current Base mapping, excluding only missing attachments"
);
assert(JSON.stringify(schema.materialAvailability.A) === JSON.stringify(SOURCE_RELATION_IDS), "A should follow the current CIM material relation order");
assert(JSON.stringify(sorted(schema.materialTextures.map((item) => item.id))) === JSON.stringify(ALL_TEXTURE_IDS), "all available official texture ids should be present exactly once");

for (const [categoryName, ids] of Object.entries(EXPECTED_CATEGORIES)) {
  const category = schema.materialCategories.find((item) => item.name === categoryName);
  assert(category, `${categoryName} category should exist`);
  const textureIds = schema.materialTextures.filter((item) => item.categoryId === category.id).map((item) => item.id);
  assert(JSON.stringify(sorted(textureIds)) === JSON.stringify(ids), `${categoryName} should contain official ids`);
  for (const id of ids) {
    const texture = schema.materialTextures.find((item) => item.id === id);
    assert(texture.file === `${categoryName}/${id}.jpg`, `${id} should point to compressed JPG asset`);
    await access(path.join(MATERIAL_ROOT, categoryName, `${id}.jpg`));
    const fileStat = await stat(path.join(MATERIAL_ROOT, categoryName, `${id}.jpg`));
    assert(fileStat.size < 550 * 1024, `${categoryName}/${id}.jpg should stay below 550KB`);
  }
}

for (const part of ["A", "B", "C", "C1", "C2", "C3", "F", "F1", "G", "I", "K"]) {
  assert(JSON.stringify(schema.materialAvailability[part]) === JSON.stringify(SOURCE_RELATION_IDS), `${part} should follow the current CIM material relation order`);
}

assert(JSON.stringify(schema.materialAvailability.H) === JSON.stringify(EXPECTED_TOE_IDS), "H toe part should follow the narrowed Base relation");
assert(schema.defaultMaterialsByAngle.side.A === "51", "side A should use the latest Base default material");
assert(schema.defaultMaterialsByAngle.side.G === "49", "side G should use the latest Base default material");
assert(schema.defaultMaterialsByAngle.front.G === "50", "front G should use the latest Base default material");
assert(schema.defaultFixedColorsByAngle.side.J === "#380059", "side J should use purple as the latest Base default fixed color");
assert(schema.defaultFixedColorsByAngle.front.J === "#000000", "front J should use black as the latest Base default fixed color");
assert(JSON.stringify(schema.materialAvailabilityByAngle.side.F) === JSON.stringify(SOURCE_RELATION_IDS), "side F should preserve the latest Base relation order");
assert(JSON.stringify(schema.materialAvailabilityByAngle.side.H) === JSON.stringify(EXPECTED_TOE_IDS), "side H should follow the narrowed Base relation");
assert(JSON.stringify(schema.materialAvailabilityByAngle.forty_five.H) === JSON.stringify(EXPECTED_TOE_IDS), "45-degree H should follow the narrowed Base relation");
assert(JSON.stringify(schema.materialAvailabilityByAngle.front.H) === JSON.stringify(EXPECTED_TOE_IDS), "front H should follow the narrowed Base relation");

const generatedFiles = [];
for (const categoryName of await readdir(MATERIAL_ROOT)) {
  for (const fileName of await readdir(path.join(MATERIAL_ROOT, categoryName))) {
    generatedFiles.push(`${categoryName}/${fileName}`);
    assert(fileName.endsWith(".jpg"), `${categoryName}/${fileName} should be the only generated format`);
  }
}
assert(generatedFiles.length === ALL_TEXTURE_IDS.length, "asset folder should contain one generated file per texture id");
assert(appSource.includes("officialTextureById"), "C-side should resolve selected texture id through official material schema");
assert(appSource.includes("renderOfficialTextureStyles"), "C-side should render category child texture buttons");
assert(!appSource.includes("officialTextureBackground"), "official texture rendering should use the material's own image color, not a default part-color overlay");
assert(!appSource.includes("colorToRgba"), "official texture snapshots should not tint materials with a default base color");

console.log("official material library contract is valid");
