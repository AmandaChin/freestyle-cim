import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const MATERIAL_ROOT = path.join(ROOT_DIR, "assets", "skates", "yjs-pro-cim", "materials");
const REAL_PRODUCT_ROOT = path.join(ROOT_DIR, "assets", "skates", "yjs-pro-cim", "real-products");
const DEFAULT_BASE_COLOR = "#f7f7f8";
// 来源：/Users/bytedance/Documents/hobby/prd/CIM三视图.xls，Sheet1「皮料材质」列。
const SOURCE_TABLE_TEXTURE_IDS = [
  "13", "11", "43", "46", "48", "47", "44", "45", "39", "31", "32", "36", "37", "18", "35", "41",
  "8", "7", "16", "33", "3", "9", "4", "1", "5", "2", "23", "29", "40", "25", "26", "19",
  "42", "28", "21", "20", "30", "27", "14", "15", "6", "10", "12", "38", "24", "22", "34",
  "17", "49", "50", "51", "52", "53"
];
// 表格包含这三个编号，但当前工程和 PRD 皮料包都没有对应官方素材文件；上线契约只能启用有资源的编号。
const MISSING_SOURCE_ASSET_IDS = ["4", "10", "21"];
const EXPECTED_CATEGORIES = {
  "鳞片": ["43", "44", "45", "46", "47", "48"],
  "小熊": ["7", "8"],
  OTHERS: ["6", "12", "14", "15", "49", "50", "51", "52", "53"],
  "反光大理石": ["11", "13"],
  "草席": ["18", "31", "32", "35", "36", "37", "39", "41"],
  "斜纹点子布": ["16", "33"],
  PU: ["1", "2", "3", "5", "9"],
  "丝状肌理": ["22", "24", "38"],
  "中国风": ["17", "34"],
  "皮革": ["19", "20", "27", "28", "30", "42"],
  TPU: ["23", "25", "26", "29", "40"]
};
const ALL_TEXTURE_IDS = Object.values(EXPECTED_CATEGORIES).flat().sort((a, b) => Number(a) - Number(b));
const TOE_EXCLUDED_IDS = new Set(["1", "2", "3", "4", "5", "9", "23", "25", "26", "29", "40"]);
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
  J: DEFAULT_BASE_COLOR,
  K: DEFAULT_BASE_COLOR
};
const EXPECTED_DEFAULT_MATERIALS = {
  A: "19",
  B: "19",
  C: "19",
  C1: "34",
  C2: "34",
  C3: "19",
  F: "19",
  F1: "34",
  G: "19",
  H: "19",
  I: "34",
  J: "19",
  K: "19"
};
const EXPECTED_FIXED_DEFAULTS = {
  D: "cuff-silver",
  D1: "mushroom-nail-white",
  E: "sole-silver",
  L: "pad-new-white",
  M: "upper-strap-white",
  N: "lower-strap-white"
};
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
  return readFile(path.join(ROOT_DIR, "shared", "yjs-pro-cim-schema.js"), "utf8").then((schemaSource) => {
    source(schemaSource, sandbox, { filename: "shared/yjs-pro-cim-schema.js" });
    return { schema: sandbox.window.SKATE_CIM_SCHEMA, schemaSource };
  });
}

function sorted(values) {
  return [...values].sort((a, b) => Number(a) - Number(b));
}

const { schema, schemaSource } = await loadSchema();
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
  JSON.stringify(SOURCE_TABLE_TEXTURE_IDS.filter((id) => !MISSING_SOURCE_ASSET_IDS.includes(id)).sort((a, b) => Number(a) - Number(b))) === JSON.stringify(ALL_TEXTURE_IDS),
  "enabled texture contract should follow CIM三视图.xls, excluding only source ids without assets"
);
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

for (const part of ["A", "B", "C", "C1", "C2", "C3", "F", "F1", "G", "I", "J", "K"]) {
  assert(JSON.stringify(sorted(schema.materialAvailability[part])) === JSON.stringify(ALL_TEXTURE_IDS), `${part} should allow all official textures`);
}

const toeIds = sorted(schema.materialAvailability.H);
const expectedToeIds = SOURCE_TABLE_TEXTURE_IDS
  .filter((id) => !MISSING_SOURCE_ASSET_IDS.includes(id) && !TOE_EXCLUDED_IDS.has(id))
  .sort((a, b) => Number(a) - Number(b));
assert(JSON.stringify(toeIds) === JSON.stringify(expectedToeIds), "H toe part should exclude PU and TPU textures");

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
