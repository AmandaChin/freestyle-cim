import { access, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const appSource = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");
const styleIds = ["1336", "1437", "1518", "1635", "1741", "2932"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(appSource.includes('id: "fixed-straw"'), "straw fixed fabric parent material should be registered");
assert(appSource.includes('name: "草席"'), "straw fixed fabric parent should be named 草席");
assert(appSource.includes("FIXED_STRAW_STYLES"), "straw fixed fabric should define expandable styles");
assert(appSource.includes("fixedStrawStylePatch"), "selecting a straw style should patch material and style id together");
assert(appSource.includes("renderFixedStrawStyles"), "texture UI should render straw sub-style buttons");
assert(appSource.includes("fixedStrawStyleByMaterial"), "rendering should resolve fixed straw style by selected material");
assert(appSource.includes("return `url('${materialAsset(fixedStrawStyle.file)}') center / cover no-repeat`"), "fixed straw style should render as a fixed top image texture");
assert(appSource.includes("isColorControlVisible"), "fixed straw styles should hide explicit color selection");
assert(!appSource.includes("TEST_FABRICS"), "other texture tint test fabrics should be removed after straw interaction is confirmed");
assert(!appSource.includes("fabric-test-bear"), "bear test fabric should be removed");
assert(!appSource.includes("fabric-test-straw-mat-microfiber"), "old straw texture tint test fabric should be removed");
assert(!appSource.includes("fabric-test-scale"), "scale test fabric should be removed");

for (const styleId of styleIds) {
  assert(appSource.includes(`id: "fixed-straw-${styleId}"`), `草席 style ${styleId} should be registered`);
  assert(appSource.includes(`草席/${styleId}.png`), `草席 style ${styleId} should use folder-local fixed texture`);
  await access(path.join(ROOT_DIR, "assets", "mvp", "materials", "草席", `${styleId}.png`));
}

console.log("fixed straw fabric styles are registered");
