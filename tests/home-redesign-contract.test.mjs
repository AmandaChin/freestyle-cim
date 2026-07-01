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

async function main() {
  const html = await readFile(path.join(ROOT_DIR, "index.html"), "utf8");
  const app = await readFile(path.join(ROOT_DIR, "app.js"), "utf8");
  const css = await readFile(path.join(ROOT_DIR, "styles.css"), "utf8");
  const prototypePath = path.join(ROOT_DIR, "prototypes/home-immersive-prototype.html");

  assert(!existsSync(prototypePath), "prototype redesign file should be rolled back; root index is the UI target");
  assert(html.includes('class="home-view"'), "root index should keep the production home view");
  assert(html.includes('id="customizerPanel"'), "root index should keep the production material panel logic");
  assert(!css.includes("--blue: #0071e3"), "redesigned root UI should not keep the old Apple-blue selected state token");
  assert(css.includes("--selection: #111111"), "redesigned root UI should expose a black selection token");
  assert(
    hasRule(css, ".home-view", ["min-height: calc(100dvh", "grid-template-rows"]),
    "home view should become a first-screen immersive layout"
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

  console.log("home-redesign-contract: ok");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
