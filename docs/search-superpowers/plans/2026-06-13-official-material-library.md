# Official Material Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use search-superpowers:subagent-driven-development (recommended) or search-superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace C-side test materials with the official material library, keep B/C data connected through shared schema, and ship only compressed web-ready assets.

**Architecture:** Official materials live in `shared/yjs-pro-cim-schema.js` as category, texture, and part-availability data. C-side renders categories and real textures from shared schema; B-side fabric list reads the same source instead of maintaining duplicated test fabric definitions. Web assets are generated from the PRD source directory into `assets/skates/yjs-pro-cim/materials` as a single compressed JPG per texture.

**Tech Stack:** Browser JavaScript, Node test runner, static asset pipeline via macOS `sips`.

---

### Task 1: Lock Official Material Contract

**Files:**
- Modify: `tests/official-material-library.test.mjs`
- Modify: `package.json`

- [ ] Add a test that loads `shared/yjs-pro-cim-schema.js` and verifies official categories, unique numeric texture ids, part availability, and no old test material ids.
- [ ] Add the test to `npm test` so future changes protect the contract.

### Task 2: Generate Web-Ready Assets

**Files:**
- Create: `assets/skates/yjs-pro-cim/materials/<category>/<id>.jpg`

- [ ] For each numeric source texture under `/Users/bytedance/Documents/hobby/prd/皮料2.0/20260608`, use one source file per id and generate a 1024px-long-edge JPG into the repo.
- [ ] Keep folder category names exactly matching source folders.
- [ ] Do not copy duplicate source `.png` and `.webp` files into the repo.

### Task 3: Replace Shared Material Data

**Files:**
- Modify: `shared/yjs-pro-cim-schema.js`
- Modify: `shared/schema-utils.js`

- [ ] Replace old test/style-set materials with official category materials.
- [ ] Add `materialCategories`, `materialTextures`, and `materialAvailability` to `window.SKATE_CIM_SCHEMA`.
- [ ] Keep fixed variants for `D/D1/E/L/M/N` unchanged.
- [ ] Make `materialsForPart` derive visible categories from part availability.

### Task 4: Update C-Side Rendering and Selection

**Files:**
- Modify: `app.js`

- [ ] Render category-level buttons in the side panel.
- [ ] Expand the selected category into texture buttons filtered by selected part.
- [ ] Store `config.material` as the texture id, e.g. `18`.
- [ ] Render selected textures via `assets/skates/yjs-pro-cim/materials/<category>/<id>.jpg`.

### Task 5: Update B-Side Fabric Source

**Files:**
- Modify: `b-side/data/cim-config.js`
- Modify: `b-side/app.js` if needed

- [ ] Remove duplicated old `fabrics` definitions.
- [ ] Build `fabrics` from shared official material categories/textures so B and C stay connected.

### Task 6: Check Errors Without Build

**Files:**
- No production changes expected.

- [ ] Run focused Node tests only.
- [ ] Try `aslocate-cli error` on changed code files as required by repo instructions.
- [ ] Do not run compile/build unless the user explicitly asks.
