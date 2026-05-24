import { access, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const appSource = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");
const schemaSource = await readFile(path.join(ROOT_DIR, "shared", "yjs-pro-cim-schema.js"), "utf8");
const configSource = await readFile(path.join(ROOT_DIR, "b-side", "data", "cim-config.js"), "utf8");

const expectedSets = {
  "PU": ["183", "199", "201", "215", "232"],
  "TPU": ["2623", "2840", "2925", "3029"],
  "PU TPU": ["1741", "201", "215", "232", "2623", "2840", "2925", "3029"],
  "鳞片": ["1046", "1148", "647", "744", "845", "943"]
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const removed of ["mesh", "pearl", "chinoiserie-pink", "chinoiserie-white", "leather_13", "fabric-leather-13"]) {
  assert(!schemaSource.includes(`"${removed}"`), `schema should not expose test material ${removed}`);
  assert(!configSource.includes(`"${removed}"`), `config should not expose test fabric ${removed}`);
}

for (const [name, codes] of Object.entries(expectedSets)) {
  const materialKey = `ue_${name.toLowerCase().replace(/\s+/g, "_")}`;
  assert(schemaSource.includes(`id: "${materialKey}"`), `${name} should be registered as a material`);
  assert(configSource.includes(`name: "${name}"`), `${name} should be registered as a fabric set`);
  assert(configSource.includes(`materialKey: "${materialKey}"`), `${name} should use material key ${materialKey}`);
  for (const code of codes) {
    assert(configSource.includes(`name: "${code}号皮料"`), `${name} should include ${code}号皮料 subitem`);
    assert(configSource.includes(`file: "${name}/${code}.png"`), `${name} should point ${code} to its extracted image`);
    await access(path.join(ROOT_DIR, "assets", "mvp", "materials", name, `${code}.png`));
  }
}

assert(appSource.includes("fabricStyleSetsFromSharedConfig"), "C-side should resolve all fixed image fabric sets from shared config");
assert(appSource.includes("renderFabricSetStyles"), "C-side should render subitems for fixed image fabric sets");
assert(appSource.includes("fabricStyleSetPatch"), "selecting a fabric subitem should patch material and variant together");

console.log("UE fabric sets are registered");
