import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(projectRoot, "dist");

// ESA Pages 只发布 C 端运行所需文件，避免把本地后端、测试和 B 端管理界面作为公开资源上传。
const publicFiles = ["index.html", "customer-intro.html", "app.js", "styles.css", "version.js"];
const publicDirectories = ["assets", "shared", "i18n"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(projectRoot, file), path.join(outputDir, file));
}

for (const directory of publicDirectories) {
  await cp(path.join(projectRoot, directory), path.join(outputDir, directory), { recursive: true });
}
