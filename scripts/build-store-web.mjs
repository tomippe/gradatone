import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "native", "store-web");
const assetsDir = path.join(outDir, "assets");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function readVersion() {
  const versionFile = path.join(root, "version.txt");
  if (fs.existsSync(versionFile)) {
    return fs.readFileSync(versionFile, "utf8").trim();
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  return manifest.version || "1.0.0";
}

function generateIcons() {
  const svg = path.join(root, "icon.svg");
  if (!fs.existsSync(svg)) return;
  const sizes = [
    ["favicon.png", 32],
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["assets/icon-1024.png", 1024],
  ];
  for (const [name, size] of sizes) {
    const dest = path.join(outDir, name);
    try {
      execSync(
        `magick -background none "${svg}" -resize ${size}x${size} "${dest}"`,
        { stdio: "pipe" }
      );
      if (size >= 180) {
        execSync(
          `magick "${dest}" -background white -alpha remove -alpha off "${dest}"`,
          { stdio: "pipe" }
        );
      }
    } catch (e) {
      console.warn(`  ⚠️ icon ${name}: ${e.message}`);
    }
  }
}

console.log("🔨 store-web をビルド中...");
execSync("npm run sass:build", { cwd: root, stdio: "inherit" });

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
ensureDir(assetsDir);

const version = readVersion();
generateIcons();

copyFile(path.join(root, "style.css"), path.join(outDir, "style.css"));
copyFile(path.join(root, "app.js"), path.join(outDir, "app.js"));
copyFile(path.join(root, "gearGreen.svg"), path.join(outDir, "gearGreen.svg"));

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
manifest.version = version;
fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

try {
  execSync(
    `curl -fsSL "https://tomippe.jp/img/apps-logo.svg" -o "${path.join(assetsDir, "apps-logo.svg")}"`,
    { stdio: "pipe" }
  );
} catch {
  console.warn("  ⚠️ apps-logo.svg の取得をスキップ");
}

let indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
indexHtml = indexHtml.replace(
  'src="https://tomippe.jp/img/apps-logo.svg"',
  'src="./assets/apps-logo.svg"'
);
indexHtml = indexHtml.replace("<html lang=\"ja\">", "<html lang=\"en\">");
if (!/viewport-fit=cover/.test(indexHtml)) {
  indexHtml = indexHtml.replace(
    /content="width=device-width, initial-scale=1\.0([^"]*)"/,
    'content="width=device-width, initial-scale=1.0, viewport-fit=cover$1"'
  );
}
if (!/apple-mobile-web-app-status-bar-style/.test(indexHtml)) {
  indexHtml = indexHtml.replace(
    '<meta name="mobile-web-app-capable"',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n    <meta name="mobile-web-app-capable"'
  );
}
indexHtml = indexHtml.replace(
  "<title>Gradatone</title>",
  `<title>Gradatone ${version}</title>\n    <meta name="version" content="${version}">`
);

fs.writeFileSync(path.join(outDir, "index.html"), indexHtml);

// PWA / FTP 用（manifest が参照する icon-192 / icon-512）
for (const name of ["icon-192.png", "icon-512.png", "favicon.png", "apple-touch-icon.png"]) {
  const generated = path.join(outDir, name);
  const rootDest = path.join(root, name);
  if (fs.existsSync(generated)) {
    copyFile(generated, rootDest);
  }
}

console.log(`  ✓ native/store-web (v${version})`);
