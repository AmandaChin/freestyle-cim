import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasRule(css, selector, requiredSnippets) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  if (!match) return false;
  return requiredSnippets.every((snippet) => match[1].includes(snippet));
}

function sectionBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = text.indexOf(end, startIndex + start.length);
  return endIndex === -1 ? text.slice(startIndex) : text.slice(startIndex, endIndex);
}

async function main() {
  const html = await readFile(path.join(ROOT_DIR, "index.html"), "utf8");
  const app = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");
  const css = await readFile(path.join(ROOT_DIR, "styles.css"), "utf8");
  const schema = await readFile(path.join(ROOT_DIR, "shared/yjs-pro-cim-schema.js"), "utf8");
  const publishedConfig = await readFile(path.join(ROOT_DIR, "b-side/data/cim-config.js"), "utf8");
  const prototypePath = path.join(ROOT_DIR, "prototypes/home-immersive-prototype.html");
  const activeCarouselImage = html.match(/<img class="carousel-slide active" src="([^"]+)"/)?.[1] || "";
  const pageAssetVersions = {
    "shared/yjs-pro-cim-schema.js": "20260711-patch-assets-v1",
    "shared/schema-utils.js": "20260707-ui-polish-v7",
    "version.js": "20260707-ui-polish-v7",
    "i18n/c-side-copy.js": "20260707-ui-polish-v7",
    "app.js": "20260707-ui-polish-v7"
  };

  assert(!existsSync(prototypePath), "prototype redesign file should be rolled back; root index is the UI target");
  assert(html.includes('class="home-view"'), "root index should keep the production home view");
  assert(html.includes('id="customizerPanel"'), "root index should keep the production material panel logic");
  Object.entries(pageAssetVersions).forEach(([assetPath, assetVersion]) => {
    assert(html.includes(`${assetPath}?v=${assetVersion}`) || html.includes(`./${assetPath}?v=${assetVersion}`), `${assetPath} should use the latest cache-busting query`);
  });
  assert(!html.includes("b-side/data/cim-config.js"), "C-side entry must not load the unfinished B-side config");
  assert(!html.includes("20260627-official-materials-v2"), "entry html should not keep stale June cache-busting references");
  assert(activeCarouselImage.includes("white-pink-1.jpg"), "home hero should feature the white-pink real product first");
  assert(!css.includes("--blue: #0071e3"), "redesigned root UI should not keep the old Apple-blue selected state token");
  assert(css.includes("--selection: #111111"), "redesigned root UI should expose a black selection token");
  assert(css.includes("--paper: #ffffff"), "home background should use a clean white base");
  assert(css.includes("--paper-warm: #eef2f7"), "home background should use cool gallery gray instead of warm beige");
  assert(hasRule(css, ".app-shell", ["background: #ffffff"]), "home page shell should not leave a gray band around the product entry");
  assert(!css.includes("#eee8dc"), "home background should not keep the old yellow-beige endpoint");
  assert(!css.includes("248, 246, 241"), "home background overlays should not keep the old warm paper tint");
  assert(
    hasRule(css, ".home-hero::before", ["rgba(255, 255, 255, 0.66) 0%", "rgba(255, 255, 255, 0.4) 36%"]),
    "desktop home hero overlay should protect text without washing out the skate body"
  );
  assert(
    hasRule(css, ".carousel-container", ["rgba(0, 0, 0, 0.72) 5%", "#000 14%"]),
    "desktop home hero photo should avoid a long top fade that turns the skate body white"
  );
  const mobileHomeHeroCss = sectionBetween(css, "  .home-hero {\n    min-height: min(64dvh, 560px);", "  /* 移动端 app-shell");
  assert(
      !mobileHomeHeroCss.includes(".home-showcase::before") &&
      !mobileHomeHeroCss.includes("backdrop-filter: blur(18px)") &&
      mobileHomeHeroCss.includes("object-fit: cover") &&
      mobileHomeHeroCss.includes("object-position: center top") &&
      mobileHomeHeroCss.includes("filter: none"),
    "mobile home image should use top-centered cover framing with side cropping instead of overlay blending"
  );
  assert(html.includes("styles.css?v=20260708-beian-v1") || html.includes("./styles.css?v=20260708-beian-v1"), "home CSS cache key should include the latest production update");
  assert(
    hasRule(css, ".home-view", ["min-height: calc(100dvh", "grid-template-rows"]),
    "home view should become a first-screen immersive layout"
  );
  assert(
    hasRule(css, ".topbar", ["padding-bottom: 8px", "margin: 0 auto 16px"]),
    "top navigation should have more bottom breathing room before the divider/content below"
  );
  assert(
    sectionBetween(css, "/* Responsive customizer workspace", "@media (max-width: 760px)").includes("padding: 0 18px 12px"),
    "desktop customizer angle/material row should have bottom breathing room before the divider"
  );
  assert(
    hasRule(css, ".preview-stage", ["border: 0", "background:"]),
    "production preview stage should use the borderless museum display treatment"
  );
  assert(
    hasRule(css, ".customizer", ["background: transparent", "box-shadow: none"]),
    "production material panel should become a light material book, not a heavy card"
  );
  assert(
    hasRule(css, ".shoe-scene::before", ["display: none"]),
    "preview scene should not render the decorative ambient shadow"
  );
  assert(
    css.includes(".brand-lockup .eyebrow") && css.includes("display: none"),
    "mobile header should hide the brand eyebrow/subtitle"
  );
  assert(
    css.includes(".brand-lockup h1") && css.includes("font-size: 18px"),
    "mobile header title should use a smaller fixed size"
  );
  assert(
    !app.includes('t("proCustom")'),
    "model strip should not render the professional customization subtitle"
  );
  assert(
    !app.includes('class="home-card-meta"'),
    "home product cards should not render the selected/select status pill"
  );
  assert(
    app.includes("homeCardAction") && app.includes("开启定制") && app.includes("Start custom"),
    "home product card subtitle should become a direct customization action"
  );
  assert(
    hasRule(css, ".home-card-action::after", ["border-top", "border-right", "rotate(45deg)"]),
    "home product card action should render a compact arrow after the customization label"
  );
  assert(
    app.includes("els.homeProductDescription.textContent = item.code") &&
      app.includes("els.homeProductMeta.hidden = true") &&
      !app.includes("els.homeProductMeta.innerHTML = [item.code"),
    "home hero should show YJS-PRO as the supporting model text and remove the redundant meta chips"
  );
  assert(
    app.includes('els.pageTitle.textContent = isHome ? "Freestyle CIM" : product().code || productName(product())'),
    "customizer header should use YJS-PRO instead of repeating the full YJS-pro CIM label"
  );
  assert(
    !css.includes(".home-card-body > span:last-child"),
    "home product card action should not be hidden by the old last-child description rule"
  );
  assert(
    !app.includes("translateFeature(catalogItem.homeLabel)") && !app.includes("<strong>${escapeHtml(productName(catalogItem))}</strong>"),
    "home product card should not repeat the product name or generic support subtitle"
  );
  assert(
    css.includes("--home-mobile-inset: clamp(16px, 4.2vw, 22px)") &&
      css.includes("padding: 16px var(--home-mobile-inset) 20px"),
    "mobile home picker should own its horizontal inset instead of relying on app-shell padding"
  );
  assert(
    hasRule(css, ".home-view .home-picker", ["background: #ffffff"]) &&
      css.includes("padding: 0 2px 10px") &&
      !css.includes("0 14px 30px rgba(86, 82, 76, 0.14)"),
    "mobile home picker should be white while using the same restrained card shadow as desktop"
  );
  assert(
    css.includes("scroll-snap-type: x proximity") && css.includes("scroll-padding-inline: var(--home-mobile-inset)"),
    "mobile product grid should feel like a touch-friendly product rail"
  );
  assert(
    hasRule(css, ".home-model-card", ["border: 0"]) &&
      css.includes("animation: home-card-rise 420ms ease both") &&
      css.includes(".home-card-action") &&
      hasRule(css, ".home-card-body", ["grid-row: 2"]),
    "home product cards should remove gray chrome and use restrained product-entry styling"
  );
  assert(!css.includes(".home-model-card::after"), "home product cards should not use an overlay that washes out product content");
  assert(!css.includes("2.5%,\n  12.5%"), "real product carousel should show the first product image immediately after reload");
  assert(
    css.includes("grid-row: 1 / span 2") && !css.includes("grid-row: 1 / span 3"),
    "mobile product thumbnail should not create an implicit empty third row under the card"
  );
  assert(
    css.includes("0 1px 0 rgba(17, 17, 17, 0.04), 0 6px 18px rgba(20, 18, 14, 0.035)"),
    "mobile product card shadow should stay subtle"
  );
  const mobileCss = sectionBetween(css, "@media (max-width: 760px)", "@media (max-width: 480px)");
  assert(
    mobileCss.includes("padding: 8px 10px 10px"),
    "mobile customizer angle/material row should have vertical breathing room"
  );
  assert(
    mobileCss.includes(".model-strip,\n  .scene-footer") && mobileCss.includes("display: none"),
    "portrait mobile customizer should remove the duplicated model strip and footer meta"
  );
  [
    ["正面", "Front"],
    ["45度", "45°"],
    ["侧面", "Side"]
  ].forEach(([zhLabel, enLabel]) => {
    const labelPattern = new RegExp(`name: "${zhLabel}"[\\s\\S]*?en: "${enLabel}"`);
    assert(labelPattern.test(schema), `schema angle ${zhLabel} should include English label`);
    assert(labelPattern.test(publishedConfig), `published angle ${zhLabel} should include English label`);
  });
  assert(
    css.includes(".home-view .carousel-slide") &&
      css.includes("object-fit: cover") &&
      css.includes("object-position: center top"),
    "mobile hero real product image should try top-centered cover framing with side cropping"
  );

  console.log("home-redesign-contract: ok");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
