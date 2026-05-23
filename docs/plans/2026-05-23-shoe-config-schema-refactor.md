# Shoe Config Schema Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move shoe part definitions, view-layer bindings, material definitions, and part-material support rules into one shared data structure consumed by both B-side and C-side.

**Architecture:** Introduce a shared browser-friendly schema module as the single source of truth. B-side editor reads and publishes that schema shape; C-side renderer consumes the published config first and falls back to shared defaults. `app.js` and `b-side/app.js` stop owning duplicate business definitions and become render/editor shells.

**Tech Stack:** Static HTML/JS, global browser scripts, `window.SKATE_CIM_CONFIG`, local PNG/JPG assets, Node-based regression tests.

---

## Current Problem

The current code has aligned key names, but the data source is still split:

- C-side owns render/business data in `app.js`:
  - `ANGLE_CONFIG`
  - `COMPONENT_TEMPLATE`
  - `MATERIALS`
  - `PALETTES`
  - `materialsFor()`
  - product defaults in `PRODUCT_CATALOG`
- B-side owns editor defaults in `b-side/app.js`:
  - `partSeeds`
  - `angleSeeds`
  - `fixedStrawStyleSeeds`
  - `renderModes`
- Published config lives in `b-side/data/cim-config.js`, but it is not the only source of truth.

This means a part can be renamed or moved in one side without automatically changing the other side. It also makes click bugs likely, because C-side availability, render order, hit masks, and material support are not fully data-driven.

## Target Principle

For one shoe, there must be one canonical configuration shape:

```js
{
  schemaVersion: 2,
  assets: {
    root: "./assets/skates/yjs-pro-cim/",
    version: "20260523-annotated-v1",
    realProducts: [
      { file: "brown-1.jpg", alt: "YJS-pro CIM 咖色真实鞋款" }
    ]
  },
  materials: [
    { id: "smooth", name: "光面皮", kind: "tint", groups: ["upper", "strap"] },
    { id: "fixed-image", name: "固定切图", kind: "fixed", groups: ["fixed"] }
  ],
  parts: [
    {
      key: "C2",
      name: "皮垫套下片",
      en: "Lower pad cover",
      group: "upper",
      renderOrder: 62,
      selectable: true,
      renderMode: "mask_tint",
      defaultStyle: { color: "#f0b7c8", material: "pearl" },
      materialIds: ["smooth", "mesh", "pearl", "matte"]
    }
  ],
  angles: [
    {
      key: "side",
      name: "侧面",
      active: true,
      baseFile: "side/base.png",
      stitchFile: "side/stitch.png",
      layers: {
        C2: { type: "part", file: "side/parts/C2.png" },
        E: {
          type: "fixed",
          variants: {
            "sole-silver": "side/fixed/E/sole-silver.png"
          }
        }
      }
    }
  ]
}
```

C-side must not infer business meaning from file names outside this schema. B-side must not maintain another set of seeds.

---

## Files and Responsibilities

### Create

- `shared/yjs-pro-cim-schema.js`
  - Defines canonical schema for YJS-pro CIM.
  - Exposes `window.SKATE_CIM_SCHEMA`.
  - Contains part definitions, angle layer bindings, material definitions, material groups, default product config, asset root/version, fixed variants, and real product images.

- `shared/schema-utils.js`
  - Exposes `window.SKATE_CIM_SCHEMA_UTILS`.
  - Provides pure helpers used by both sides:
    - `clone(value)`
    - `materialMap(schema)`
    - `partMap(schema)`
    - `angleMap(schema)`
    - `resolveAsset(schema, path)`
    - `resolveAngleAssets(schema, angleKey)`
    - `availablePartsForAngle(schema, angleKey)`
    - `materialsForPart(schema, partKey)`
    - `mergePublishedShoe(schema, publishedShoe)`

### Modify

- `index.html`
  - Load `shared/yjs-pro-cim-schema.js` and `shared/schema-utils.js` before `b-side/data/cim-config.js`, `version.js`, and `app.js`.

- `b-side/index.html` if present, or the B-side HTML entry used by the app
  - Load the same shared schema and utilities before `b-side/data/cim-config.js` and `b-side/app.js`.

- `app.js`
  - Remove shoe business constants from C-side:
    - `YJS_PRO_REAL_PRODUCT_IMAGES`
    - `SIDE_ANGLE_PART_FILES`
    - `FORTY_FIVE_ANGLE_PART_FILES`
    - `FRONT_ANGLE_PART_FILES`
    - `ANGLE_CONFIG`
    - `COMPONENT_TEMPLATE`
    - `PALETTES`
    - `MATERIALS`
    - `materialsFor()` hardcoded rules
  - Keep only C-side rendering state and UI behavior.
  - Build product catalog from `window.SKATE_CIM_SCHEMA` plus `window.SKATE_CIM_CONFIG`.

- `b-side/app.js`
  - Remove B-side duplicate defaults:
    - `partSeeds`
    - `angleSeeds`
    - `fixedStrawStyleSeeds`
    - duplicated material/render-mode defaults where they belong to schema
  - Initialize drafts from `window.SKATE_CIM_SCHEMA`.
  - Publish config in the same schema shape.

- `b-side/data/cim-config.js`
  - Make it a schema-shaped published override/snapshot.
  - It should contain only data that B-side has published, not extra hidden defaults.

- `tests/selection-state.test.mjs`
  - Add tests for schema-driven rendering and clickability.
  - Keep current visual/click regression tests.

### Assets

- `assets/skates/yjs-pro-cim/{front,forty_five,side}/parts/{partKey}.png`
  - Mask/tint render layers.

- `assets/skates/yjs-pro-cim/{front,forty_five,side}/fixed/{partKey}/{variant}.png`
  - Fixed-image render layers.

- `assets/skates/yjs-pro-cim/{front,forty_five,side}/base.png`
  - View base image.

- `assets/skates/yjs-pro-cim/{front,forty_five,side}/stitch.png`
  - View stitch overlay.

- `assets/skates/yjs-pro-cim/real-products/*.jpg`
  - Home/detail real-product gallery.

---

## Task 1: Add Shared Schema Contract Tests

**Files:**
- Modify: `tests/selection-state.test.mjs`

- [ ] **Step 1: Add a test helper that loads browser global scripts in Node**

Add this helper near the existing imports:

```js
import vm from "node:vm";

async function loadGlobalScript(relativePath, sandbox = { window: {} }) {
  const source = await readFile(path.join(ROOT_DIR, relativePath), "utf8");
  vm.runInNewContext(source, sandbox, { filename: relativePath });
  return sandbox;
}
```

- [ ] **Step 2: Add a failing schema existence assertion**

Add this before `assertCanonicalShoePartSchema()` is called:

```js
async function assertSharedSchemaContract() {
  const sandbox = await loadGlobalScript("shared/yjs-pro-cim-schema.js");
  const schema = sandbox.window.SKATE_CIM_SCHEMA;
  assert(schema, "shared schema should expose window.SKATE_CIM_SCHEMA");
  assert(Array.isArray(schema.parts) && schema.parts.length > 0, "schema.parts should be non-empty");
  assert(Array.isArray(schema.angles) && schema.angles.length > 0, "schema.angles should be non-empty");
  assert(Array.isArray(schema.materials) && schema.materials.length > 0, "schema.materials should be non-empty");
}
```

Call it at the top of `main()`:

```js
await assertSharedSchemaContract();
await assertCanonicalShoePartSchema();
```

- [ ] **Step 3: Run test and verify it fails**

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: FAIL with `ENOENT` or `shared schema should expose window.SKATE_CIM_SCHEMA` because `shared/yjs-pro-cim-schema.js` does not exist yet.

---

## Task 2: Create Canonical Shared Schema

**Files:**
- Create: `shared/yjs-pro-cim-schema.js`
- Create: `shared/schema-utils.js`

- [ ] **Step 1: Create shared schema file**

Create `shared/yjs-pro-cim-schema.js` with this structure:

```js
(function () {
  const ASSET_ROOT = "./assets/skates/yjs-pro-cim/";
  const ASSET_VERSION = "20260523-annotated-v1";

  const materials = [
    { id: "smooth", name: "光面皮", kind: "tint", groups: ["upper", "strap"] },
    { id: "mesh", name: "网布纹理", kind: "tint", groups: ["upper"] },
    { id: "pearl", name: "珍珠皮", kind: "tint", groups: ["upper"] },
    { id: "matte", name: "哑光皮", kind: "tint", groups: ["upper", "strap", "sole", "hardware"] },
    { id: "chinoiserie-pink", name: "中国风粉色", kind: "pattern", groups: ["upper"] },
    { id: "chinoiserie-white", name: "中国风白色", kind: "pattern", groups: ["upper"] },
    { id: "fixed-straw", name: "草席", kind: "style_set", groups: ["upper"] },
    { id: "webbing", name: "织带", kind: "tint", groups: ["strap"] },
    { id: "fixed-image", name: "固定切图", kind: "fixed", groups: ["fixed"] }
  ];

  const fixedStyleSets = {
    L: {
      defaultVariant: "pad-style-1",
      colorOptions: [
        { id: "pad-white", name: "白色", value: "#f6f3ec", suffix: "white" },
        { id: "pad-black", name: "黑色", value: "#17171a", suffix: "black" }
      ],
      variants: [
        { id: "pad-style-1", name: "防磨片样式1", sourcePrefix: "pad-new" },
        { id: "pad-style-2", name: "防磨片样式2", sourcePrefix: "pad-old" }
      ]
    }
  };

  const parts = [
    { key: "A", name: "鞋帮", en: "Shoe collar", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 30, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "B", name: "后提带", en: "Back handle strap", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 34, defaultStyle: { color: "#ffffff", material: "webbing" }, materialIds: ["webbing", "smooth"] },
    { key: "C", name: "鞋舌", en: "Tongue", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 55, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "C1", name: "鞋舌三角片", en: "Tongue triangle panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 60, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "C2", name: "皮垫套下片", en: "Lower pad cover", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 62, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "C3", name: "皮垫套上片", en: "Upper pad cover", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 64, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "D", name: "CUFF", en: "Cuff", group: "hardware", selectable: true, renderMode: "fixed_variant", renderOrder: 110, defaultStyle: { material: "fixed-image", variant: "cuff-silver" }, materialIds: ["fixed-image"] },
    { key: "D1", name: "蘑菇钉", en: "Mushroom nail", group: "hardware", selectable: true, renderMode: "fixed_variant", renderOrder: 130, defaultStyle: { material: "fixed-image", variant: "mushroom-nail-black" }, materialIds: ["fixed-image"] },
    { key: "E", name: "碳纤鞋壳", en: "Carbon shell", group: "sole", selectable: true, renderMode: "fixed_variant", renderOrder: 20, defaultStyle: { material: "fixed-image", variant: "sole-silver" }, materialIds: ["fixed-image"] },
    { key: "F", name: "下鞋身片", en: "Lower body", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 35, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "F1", name: "下鞋身片2", en: "Lower body 2", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 40, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "G", name: "上鞋身片", en: "Main upper", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 45, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "H", name: "鞋头下片", en: "Toe lower panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 50, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte"], materialRule: "部分可用（PU/TPU 不可用于鞋头）" },
    { key: "I", name: "鞋眼片", en: "Eyelet panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 65, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "J", name: "鞋带", en: "Lace", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 80, defaultStyle: { color: "#ffffff", material: "webbing" }, materialIds: ["webbing", "smooth"] },
    { key: "K", name: "前魔术贴绑带", en: "Front velcro strap", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 90, defaultStyle: { color: "#ffffff", material: "webbing" }, materialIds: ["webbing", "smooth"] },
    { key: "L", name: "防磨片", en: "Abrasive pad", group: "sole", selectable: true, renderMode: "fixed_style_color", renderOrder: 95, defaultStyle: { color: "#f6f3ec", material: "pad-style-1", variant: "pad-style-1" }, materialIds: ["pad-style-1", "pad-style-2"], materialRule: "黑色/白色，样式：新/旧" },
    { key: "M", name: "上能量带", en: "Upper energy strap", group: "strap", selectable: true, renderMode: "fixed_variant", renderOrder: 100, defaultStyle: { material: "fixed-image", variant: "upper-strap-black" }, materialIds: ["fixed-image"] },
    { key: "N", name: "下能量带", en: "Lower energy strap", group: "strap", selectable: true, renderMode: "fixed_variant", renderOrder: 105, defaultStyle: { material: "fixed-image", variant: "lower-strap-black" }, materialIds: ["fixed-image"] }
  ];

  const angles = [
    { key: "side", name: "侧面", active: true, baseFile: "side/base.png", stitchFile: "side/stitch.png", layerPartKeys: ["A", "B", "C", "C1", "C2", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] },
    { key: "forty_five", name: "45度", active: true, baseFile: "forty_five/base.png", stitchFile: "forty_five/stitch.png", layerPartKeys: ["A", "C", "C1", "C2", "C3", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] },
    { key: "front", name: "正面", active: true, baseFile: "front/base.png", stitchFile: "front/stitch.png", layerPartKeys: ["C", "C1", "C2", "C3", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] }
  ];

  window.SKATE_CIM_SCHEMA = {
    schemaVersion: 2,
    shoeId: "yjs-pro-cim-upper",
    name: "YJS-pro CIM",
    code: "YJS-PRO",
    defaultAngleKey: "side",
    defaultPartKey: "G",
    assets: {
      root: ASSET_ROOT,
      version: ASSET_VERSION,
      realProductDir: "real-products/",
      realProducts: [
        { file: "brown-1.jpg", alt: "YJS-pro CIM 咖色真实鞋款" },
        { file: "white-pink-1.jpg", alt: "YJS-pro CIM 白粉真实鞋款" },
        { file: "white-red-1.jpg", alt: "YJS-pro CIM 白红真实鞋款" },
        { file: "pink-purple-1.jpg", alt: "YJS-pro CIM 粉紫真实鞋款" },
        { file: "black-gold-1.jpg", alt: "YJS-pro CIM 黑金真实鞋款" },
        { file: "silver-white-1.jpg", alt: "YJS-pro CIM 银白真实鞋款" },
        { file: "black-purple-2.jpg", alt: "YJS-pro CIM 黑紫真实鞋款" }
      ]
    },
    materials,
    fixedStyleSets,
    parts,
    angles
  };
}());
```

- [ ] **Step 2: Create schema utilities**

Create `shared/schema-utils.js`:

```js
(function () {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function byKey(items = []) {
    return new Map(items.map((item) => [item.key || item.id, item]));
  }

  function withVersion(schema, path) {
    const root = schema.assets?.root || "";
    const version = schema.assets?.version;
    return `${root}${path}${version ? `?v=${version}` : ""}`;
  }

  function variantPath(angleKey, partKey, variantId) {
    return `${angleKey}/fixed/${partKey}/${variantId}.png`;
  }

  function partPath(angleKey, partKey) {
    return `${angleKey}/parts/${partKey}.png`;
  }

  function resolveAngleAssets(schema, angleKey) {
    const angle = schema.angles.find((item) => item.key === angleKey);
    if (!angle) return null;
    const partsByKey = byKey(schema.parts);
    const parts = {};
    const fixed = {};

    angle.layerPartKeys.forEach((partKey) => {
      const part = partsByKey.get(partKey);
      if (!part) return;
      if (part.renderMode === "mask_tint" || part.renderMode === "fixed_style_color") {
        parts[partKey] = withVersion(schema, partPath(angle.key, partKey));
      }
      if (part.renderMode === "fixed_variant") {
        fixed[partKey] = Object.fromEntries(
          part.fixedVariants.map((variant) => [variant.id, withVersion(schema, variantPath(angle.key, partKey, variant.id))])
        );
      }
      if (part.renderMode === "fixed_style_color") {
        const styleSet = schema.fixedStyleSets?.[partKey];
        fixed[partKey] = Object.fromEntries(
          styleSet.variants.flatMap((style) => styleSet.colorOptions.map((color) => {
            const variantId = `${style.sourcePrefix}-${color.suffix}`;
            return [variantId, withVersion(schema, variantPath(angle.key, partKey, variantId))];
          }))
        );
      }
    });

    return {
      id: angle.key,
      key: angle.key,
      label: angle.name,
      base: withVersion(schema, angle.baseFile),
      stitch: withVersion(schema, angle.stitchFile),
      parts,
      fixed
    };
  }

  function availablePartsForAngle(schema, angleKey) {
    const angle = schema.angles.find((item) => item.key === angleKey);
    return angle?.layerPartKeys || [];
  }

  function materialsForPart(schema, partKey) {
    const part = schema.parts.find((item) => item.key === partKey);
    if (!part) return [];
    return part.materialIds.map((id) => schema.materials.find((material) => material.id === id)).filter(Boolean);
  }

  function mergePublishedShoe(schema, publishedShoe) {
    if (!publishedShoe) return clone(schema);
    return {
      ...clone(schema),
      ...clone(publishedShoe),
      assets: { ...clone(schema.assets), ...clone(publishedShoe.assets || {}) },
      materials: publishedShoe.materials?.length ? clone(publishedShoe.materials) : clone(schema.materials),
      parts: publishedShoe.parts?.length ? clone(publishedShoe.parts) : clone(schema.parts),
      angles: publishedShoe.angles?.length ? clone(publishedShoe.angles) : clone(schema.angles)
    };
  }

  window.SKATE_CIM_SCHEMA_UTILS = {
    clone,
    byKey,
    withVersion,
    resolveAngleAssets,
    availablePartsForAngle,
    materialsForPart,
    mergePublishedShoe
  };
}());
```

- [ ] **Step 3: Move fixed variants into schema**

Add `fixedVariants` arrays to fixed parts in `shared/yjs-pro-cim-schema.js`:

```js
{ key: "D", ..., fixedVariants: [
  { id: "cuff-black-gold", name: "黑金色 CUFF" },
  { id: "cuff-silver", name: "银色 CUFF" },
  { id: "cuff-red-black", name: "红黑色 CUFF" },
  { id: "cuff-black-purple", name: "黑紫色 CUFF" },
  { id: "cuff-black", name: "黑色 CUFF" }
] }
```

Use equivalent variant arrays for `D1`, `E`, `M`, and `N`.

- [ ] **Step 4: Run test and verify schema existence passes**

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: It should get past the new shared-schema existence assertion. Later failures are acceptable until C-side is migrated.

---

## Task 3: Load Shared Schema in HTML Entrypoints

**Files:**
- Modify: `index.html`
- Modify: B-side HTML entrypoint, likely `b-side/index.html` if present

- [ ] **Step 1: Add shared scripts before app scripts in C-side**

In `index.html`, before `b-side/data/cim-config.js` and `app.js`, add:

```html
<script src="shared/yjs-pro-cim-schema.js"></script>
<script src="shared/schema-utils.js"></script>
```

Expected order:

```html
<script src="shared/yjs-pro-cim-schema.js"></script>
<script src="shared/schema-utils.js"></script>
<script src="b-side/data/cim-config.js"></script>
<script src="version.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 2: Add shared scripts before B-side app**

In the B-side HTML entrypoint, add:

```html
<script src="../shared/yjs-pro-cim-schema.js"></script>
<script src="../shared/schema-utils.js"></script>
<script src="data/cim-config.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 3: Verify scripts load**

Run the static site and in browser console verify:

```js
Boolean(window.SKATE_CIM_SCHEMA) && Boolean(window.SKATE_CIM_SCHEMA_UTILS)
```

Expected: `true` on both C-side and B-side pages.

---

## Task 4: Migrate C-side to Schema-Driven Product Model

**Files:**
- Modify: `app.js`
- Modify: `tests/selection-state.test.mjs`

- [ ] **Step 1: Add a failing C-side assertion that no business constants remain**

In `assertCanonicalShoePartSchema()`, add forbidden patterns for C-side duplicate definitions:

```js
/const\s+COMPONENT_TEMPLATE/,
/const\s+ANGLE_CONFIG/,
/const\s+MATERIALS\s*=\s*\[/,
/function\s+materialsFor\([^)]*\)\s*\{[\s\S]*?component\.id/
```

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: FAIL because `app.js` still owns these constants.

- [ ] **Step 2: Introduce schema accessors in `app.js`**

Add near the top:

```js
const SHOE_SCHEMA = window.SKATE_CIM_SCHEMA;
const SCHEMA_UTILS = window.SKATE_CIM_SCHEMA_UTILS;

function schemaProduct() {
  const publishedShoe = window.SKATE_CIM_CONFIG?.shoes?.find((item) => item.shoeId === SHOE_SCHEMA.shoeId || item.id === SHOE_SCHEMA.shoeId);
  return SCHEMA_UTILS.mergePublishedShoe(SHOE_SCHEMA, publishedShoe);
}
```

- [ ] **Step 3: Replace `angleAssets()` implementation**

Replace current `angleAssets(angleId)` with:

```js
function angleAssets(angleId) {
  return SCHEMA_UTILS.resolveAngleAssets(schemaProduct(), angleId || schemaProduct().defaultAngleKey);
}
```

- [ ] **Step 4: Replace product component construction**

Replace `buildComponents()` with schema-based conversion:

```js
function buildComponentsFromSchema(schema) {
  return schema.parts.map((part) => ({
    id: part.key,
    code: part.key,
    en: part.en,
    cn: part.name,
    group: part.group,
    palette: part.group,
    editable: part.selectable !== false,
    renderMode: part.renderMode,
    renderOrder: part.renderOrder,
    materialRule: part.materialRule,
    materialIds: part.materialIds || [],
    fixedOptions: part.fixedVariants || [],
    fixedStyleSet: schema.fixedStyleSets?.[part.key],
    color: part.defaultStyle?.color || "#f6f3ec",
    material: part.defaultStyle?.material || "smooth",
    defaultVariant: part.defaultStyle?.variant
  }));
}
```

- [ ] **Step 5: Replace `PRODUCT_CATALOG` with schema product**

Build `PRODUCT_CATALOG` from `schemaProduct()`:

```js
const PRODUCT_CATALOG = [schemaProduct()].map((schema) => ({
  id: schema.shoeId,
  name: schema.name,
  code: schema.code,
  price: "专业上鞋定制",
  homeTag: "Pro Custom",
  homeLabel: schema.homeLabel || "专业支撑款",
  description: schema.description || "高帮轮滑鞋上鞋定制，面向进阶训练与比赛配置。",
  note: schema.notes || "鞋款裁片、视角、布料和贴图由统一 schema 驱动。",
  homeFeatures: schema.homeFeatures || ["高帮支撑", "碳纤鞋壳", "确认单导出"],
  realProductImages: schema.assets.realProducts,
  accentA: "#f0b7c8",
  accentB: "#ad94ff",
  angles: schema.angles.map((angle) => ({ id: angle.key, label: angle.name, meta: angle.name })),
  defaultAngle: schema.defaultAngleKey,
  editablePartId: schema.defaultPartKey,
  assets: SHARED_MVP_ASSETS,
  components: buildComponentsFromSchema(schema),
  fixedItems: SHARED_PRODUCT_DETAILS.fixedItems,
  padStyles: SHARED_PRODUCT_DETAILS.padStyles,
  embroiderySlots: SHARED_PRODUCT_DETAILS.embroiderySlots
}));
```

- [ ] **Step 6: Replace `materialsFor(component)`**

Replace hardcoded material branching with:

```js
function materialsFor(component) {
  const schema = schemaProduct();
  return SCHEMA_UTILS.materialsForPart(schema, component.id).map((material) => ({
    id: material.id,
    name: material.name,
    note: material.note || material.kind,
    swatch: material.swatch
  }));
}
```

- [ ] **Step 7: Update fixed option helpers**

Ensure `fixedOption()`, `fixedImageId()`, `componentPreview()`, and `componentLayerMarkup()` use schema `renderMode`:

```js
function isFixedVariantPart(component) {
  return component.renderMode === "fixed_variant";
}

function isFixedStyleColorPart(component) {
  return component.renderMode === "fixed_style_color";
}
```

Use these helpers instead of checking ad-hoc fields like `fixedColorOptions` where possible.

- [ ] **Step 8: Run tests and fix C-side regressions**

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: PASS. If a part is not clickable, fix schema `angles[].layerPartKeys` or asset path data, not `hitTestShoePart()` special cases.

---

## Task 5: Migrate B-side Editor to Shared Schema

**Files:**
- Modify: `b-side/app.js`
- Modify: `b-side/data/cim-config.js`
- Modify: `tests/selection-state.test.mjs`

- [ ] **Step 1: Add failing test that B-side does not define seeds**

In `assertCanonicalShoePartSchema()`, add:

```js
/const\s+partSeeds/,
/const\s+angleSeeds/,
/const\s+fixedStrawStyleSeeds/
```

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: FAIL because `b-side/app.js` still has duplicate seeds.

- [ ] **Step 2: Add B-side schema accessors**

At the top of `b-side/app.js`, add:

```js
const SHOE_SCHEMA = window.SKATE_CIM_SCHEMA;
const SCHEMA_UTILS = window.SKATE_CIM_SCHEMA_UTILS;

function baseShoeDraftFromSchema() {
  return {
    id: `shoe-${SHOE_SCHEMA.shoeId}`,
    shoeId: SHOE_SCHEMA.shoeId,
    name: SHOE_SCHEMA.name,
    code: SHOE_SCHEMA.code,
    version: 1,
    status: "draft",
    defaultAngleKey: SHOE_SCHEMA.defaultAngleKey,
    defaultPartKey: SHOE_SCHEMA.defaultPartKey,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    description: SHOE_SCHEMA.description || "",
    notes: SHOE_SCHEMA.notes || "",
    homeLabel: SHOE_SCHEMA.homeLabel || "专业支撑款",
    homeFeatures: SHOE_SCHEMA.homeFeatures || [],
    materials: SCHEMA_UTILS.clone(SHOE_SCHEMA.materials),
    parts: SCHEMA_UTILS.clone(SHOE_SCHEMA.parts),
    angles: SCHEMA_UTILS.clone(SHOE_SCHEMA.angles)
  };
}
```

- [ ] **Step 3: Replace `partSeeds` and `angleSeeds` usage**

Replace all fallback expressions like:

```js
item.parts?.length ? item.parts : partSeeds
```

with:

```js
item.parts?.length ? item.parts : SHOE_SCHEMA.parts
```

Replace:

```js
item.angles?.length ? item.angles : angleSeeds
```

with:

```js
item.angles?.length ? item.angles : SHOE_SCHEMA.angles
```

- [ ] **Step 4: Publish complete schema-shaped config**

When B-side publishes to `b-side/data/cim-config.js`, ensure each shoe includes:

```js
{
  schemaVersion: 2,
  shoeId,
  name,
  code,
  defaultAngleKey,
  defaultPartKey,
  assets,
  materials,
  fixedStyleSets,
  parts,
  angles
}
```

Do not publish old fields that are not part of the schema.

- [ ] **Step 5: Update B-side layer editor to edit schema layers**

The angle editor should show only `angle.layerPartKeys` for each angle. Uploading a layer should add the part key to `angle.layerPartKeys` if missing and write the path to a schema field:

```js
angle.layers[partKey] = { type: "part", file: `${angle.key}/parts/${partKey}.png` };
```

For fixed variants, write:

```js
angle.layers[partKey] = {
  type: "fixed",
  variants: {
    [variantId]: `${angle.key}/fixed/${partKey}/${variantId}.png`
  }
};
```

- [ ] **Step 6: Run tests**

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: PASS. The test should also fail if B-side reintroduces `partSeeds` or `angleSeeds`.

---

## Task 6: Make Published Config Drive C-side Behavior

**Files:**
- Modify: `shared/schema-utils.js`
- Modify: `app.js`
- Modify: `tests/selection-state.test.mjs`

- [ ] **Step 1: Add test for published override propagation**

Add a Node-level test helper that loads:

```js
shared/yjs-pro-cim-schema.js
shared/schema-utils.js
b-side/data/cim-config.js
```

Then assert:

```js
const schema = sandbox.window.SKATE_CIM_SCHEMA;
const utils = sandbox.window.SKATE_CIM_SCHEMA_UTILS;
const published = sandbox.window.SKATE_CIM_CONFIG.shoes[0];
const merged = utils.mergePublishedShoe(schema, published);
assert(merged.parts.some((part) => part.key === "C2" && part.name === "皮垫套下片"), "published part names should flow into merged schema");
```

- [ ] **Step 2: Add test for material support propagation**

Assert:

```js
const c2Materials = utils.materialsForPart(merged, "C2").map((item) => item.id);
assert(c2Materials.includes("pearl"), "C2 material support should come from schema");
```

- [ ] **Step 3: Add test for view-specific part availability**

Assert:

```js
assert(!utils.availablePartsForAngle(merged, "side").includes("C3"), "side view should not expose C3");
assert(utils.availablePartsForAngle(merged, "front").includes("C3"), "front view should expose C3");
```

- [ ] **Step 4: Run tests**

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: PASS.

---

## Task 7: Remove Remaining Temporary Bridges and Dead Data

**Files:**
- Modify: `app.js`
- Modify: `b-side/app.js`
- Modify: `b-side/data/cim-config.js`
- Modify: `tests/selection-state.test.mjs`

- [ ] **Step 1: Add forbidden-pattern checks**

Ensure tests reject these patterns:

```js
/ANGLE_PART_OVERRIDES/,
/sourceKey/,
/fixedFileKeys/,
/const\s+COMPONENT_TEMPLATE/,
/const\s+ANGLE_CONFIG/,
/const\s+partSeeds/,
/const\s+angleSeeds/,
/\bA1\b/,
/\bK1\b/,
/\bK2\b/,
/\bM1\b/,
/\bM2\b/,
/\bO\b/
```

- [ ] **Step 2: Remove dead bridge code**

Delete any functions whose only job was to translate old keys to new keys:

```js
anglePartOverridesFor
normalizeDisplayOverride
fixedFileKeys fallback logic
sourceKey merge logic
```

- [ ] **Step 3: Keep only generic rendering code in C-side**

`app.js` may keep rendering helpers like:

```js
renderShoeArt
componentLayerMarkup
hitTestShoePart
buildExportData
```

But these helpers must read part behavior from schema fields, not local business constants.

- [ ] **Step 4: Run final test**

Run:

```bash
node tests/selection-state.test.mjs
```

Expected: PASS.

---

## Acceptance Checklist

- [ ] `app.js` does not define shoe-specific business data.
- [ ] `b-side/app.js` does not define duplicate shoe seeds.
- [ ] `shared/yjs-pro-cim-schema.js` is the only source for default parts, angles, materials, material support rules, and asset path rules.
- [ ] `b-side/data/cim-config.js` is schema-shaped published data.
- [ ] C-side uses published config first and shared schema as fallback.
- [ ] B-side edits and publishes the same data structure C-side consumes.
- [ ] Side view has no `C3`; front and 45-degree views keep `C3`.
- [ ] All visible parts in each active angle are clickable.
- [ ] Part material panel is generated from `part.materialIds`.
- [ ] No old business keys remain: `A1`, `I1`, `K1`, `K2`, `M1`, `M2`, `O`.

## Verification Commands

Run after each implementation task:

```bash
node --check shared/yjs-pro-cim-schema.js
node --check shared/schema-utils.js
node --check app.js
node --check b-side/app.js
node --check b-side/data/cim-config.js
node tests/selection-state.test.mjs
```

Expected final result:

```text
selection-state: ok (3 angles checked)
```

## Rollback Strategy

If the schema migration breaks visual behavior:

1. Do not add per-part bug fixes in `hitTestShoePart()` or `componentLayerMarkup()`.
2. Inspect `shared/yjs-pro-cim-schema.js`:
   - Is the part present in `parts`?
   - Is the part present in the active angle's `layerPartKeys`?
   - Does the asset exist at the path generated by the schema?
   - Does the part have valid `renderMode` and `materialIds`?
3. Fix the schema data, not renderer special cases.

