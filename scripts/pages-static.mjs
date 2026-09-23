#!/usr/bin/env node
/**
 * Finish a GitHub Pages build in dist/client:
 * - the SPA shell becomes index.html and 404.html (Pages has no app server)
 * - woff2 faces are inlined so the publish step can stay text-only
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = "dist/client";
const shell = join(root, "_shell.html");
const index = join(root, "index.html");

if (!existsSync(shell) && !existsSync(index)) {
  console.error("pages-static: missing dist/client/_shell.html");
  process.exit(1);
}

if (!existsSync(index)) copyFileSync(shell, index);
copyFileSync(index, join(root, "404.html"));
writeFileSync(join(root, ".nojekyll"), "\n");

const assets = join(root, "assets");
for (const name of readdirSync(assets)) {
  if (!name.endsWith(".css")) continue;
  const file = join(assets, name);
  let css = readFileSync(file, "utf8");
  css = css.replace(/url\(([^)]+\.woff2)\)/g, (_match, raw) => {
    const rel = String(raw).replace(/["']/g, "").split("/").pop();
    const fontPath = join(assets, rel);
    if (!existsSync(fontPath)) return _match;
    const b64 = readFileSync(fontPath).toString("base64");
    return `url("data:font/woff2;base64,${b64}")`;
  });
  writeFileSync(file, css);
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

const files = walk(root).filter(
  (file) => !file.endsWith(".woff") && !file.endsWith(".woff2") && !file.includes("/__grok/") && !file.endsWith("_shell.html"),
);

const publish = "dist/pages";
rmSync(publish, { recursive: true, force: true });
for (const file of files) {
  const dest = join(publish, relative(root, file));
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(file, dest);
}

console.log(`pages-static: ${files.length} publishable files in ${publish}`);
for (const file of files) console.log(`${statSync(file).size}\t${file}`);
