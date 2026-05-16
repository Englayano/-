import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const requiredPaths = [
  "out",
  "out/index.html",
  "out/404.html",
  "out/manifest.json",
  "out/sw.js",
  "out/icon-192.png",
  "out/icon-512.png",
  "out/_next/static",
];

const missing = requiredPaths.filter((path) => !existsSync(join(process.cwd(), path)));

if (missing.length > 0) {
  console.error("Static export failed. Missing required output paths:");
  for (const path of missing) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

if (!statSync(join(process.cwd(), "out")).isDirectory()) {
  console.error('Static export failed. "out" exists but is not a directory.');
  process.exit(1);
}

console.log('Static export verified: "out" is ready for Cloudflare Pages.');
