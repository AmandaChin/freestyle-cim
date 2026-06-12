import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const MATERIAL_ROOT = path.join(ROOT_DIR, "assets", "skates", "yjs-pro-cim", "materials");
const EXPECTED_CATEGORIES = {
  "鳞片": ["43", "44", "45", "46", "47", "48"],
  "小熊": ["7", "8"],
  OTHERS: ["6", "12", "14", "15", "49", "50", "51", "52", "53"],
  "草席": ["18", "31", "32", "35", "36", "37", "39", "41"],
  "斜纹点子布": ["16", "33"],
  PU: ["1", "2", "3", "5", "9"],
  "丝状肌理": ["22", "24", "38"],
  "中国风": ["17", "34"],
  "皮革": ["19", "20", "27", "28", "30", "42"],
  TPU: ["23", "25", "26", "29", "40"]
};
const ALL_TEXTURE_IDS = Object.values(EXPECTED_CATEGORIES).flat().sort((a, b) => Number(a) - Number(b));
const TOE_EXCLUDED_IDS = new Set(["1", "2", "3", "5", "9", "23", "25", "26", "29", "40"]);
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

for (const token of OLD_TEST_TOKENS) {
  assert(!schemaSource.includes(token), `shared schema should remove old test material token ${token}`);
  assert(!configSource.includes(token), `B-side config should remove old test material token ${token}`);
}

assert(JSON.stringify(schema.materialCategories.map((item) => item.name)) === JSON.stringify(Object.keys(EXPECTED_CATEGORIES)), "category order should follow source folders");
assert(JSON.stringify(sorted(schema.materialTextures.map((item) => item.id))) === JSON.stringify(ALL_TEXTURE_IDS), "all official texture ids should be present exactly once");

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
const expectedToeIds = ALL_TEXTURE_IDS.filter((id) => !TOE_EXCLUDED_IDS.has(id));
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

console.log("official material library contract is valid");
