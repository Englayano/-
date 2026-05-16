import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");
const sourcePath = join(projectRoot, "logo-source.png");
const outputs = [
  { size: 192, path: join(projectRoot, "public", "icon-192.png") },
  { size: 512, path: join(projectRoot, "public", "icon-512.png") },
];

const WHITE_THRESHOLD = 235;
const EDGE_SOFT_START = 200;

const raw = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = raw.info;
const pixels = Uint8ClampedArray.from(raw.data);

const isWhiteish = (i) =>
  pixels[i] >= WHITE_THRESHOLD &&
  pixels[i + 1] >= WHITE_THRESHOLD &&
  pixels[i + 2] >= WHITE_THRESHOLD;

const mask = new Uint8Array(width * height);
mask.fill(1);

const queue = [];
const seed = (x, y) => {
  const mi = y * width + x;
  if (mask[mi] === 0) return;
  const pi = mi * 4;
  if (isWhiteish(pi)) {
    mask[mi] = 0;
    queue.push(mi);
  }
};

for (let x = 0; x < width; x++) {
  seed(x, 0);
  seed(x, height - 1);
}
for (let y = 0; y < height; y++) {
  seed(0, y);
  seed(width - 1, y);
}

while (queue.length) {
  const mi = queue.pop();
  const cy = Math.floor(mi / width);
  const cx = mi - cy * width;
  if (cx > 0) seed(cx - 1, cy);
  if (cx < width - 1) seed(cx + 1, cy);
  if (cy > 0) seed(cx, cy - 1);
  if (cy < height - 1) seed(cx, cy + 1);
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const mi = y * width + x;
    const pi = mi * 4;
    if (mask[mi] === 0) {
      pixels[pi + 3] = 0;
      continue;
    }
    let bordersTransparent = false;
    if (x > 0 && mask[mi - 1] === 0) bordersTransparent = true;
    else if (x < width - 1 && mask[mi + 1] === 0) bordersTransparent = true;
    else if (y > 0 && mask[mi - width] === 0) bordersTransparent = true;
    else if (y < height - 1 && mask[mi + width] === 0) bordersTransparent = true;
    if (!bordersTransparent) continue;
    const whiteness = (pixels[pi] + pixels[pi + 1] + pixels[pi + 2]) / 3;
    if (whiteness > EDGE_SOFT_START) {
      const alpha = Math.max(
        0,
        255 - Math.round(((whiteness - EDGE_SOFT_START) / (255 - EDGE_SOFT_START)) * 255),
      );
      pixels[pi + 3] = alpha;
    }
  }
}

let minX = width, maxX = -1, minY = height, maxY = -1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (pixels[(y * width + x) * 4 + 3] > 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const bw = maxX - minX + 1;
const bh = maxY - minY + 1;
const sq = Math.max(bw, bh);
const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
let cropX = Math.round(cx - sq / 2);
let cropY = Math.round(cy - sq / 2);
let cropSize = sq;
if (cropX < 0) cropX = 0;
if (cropY < 0) cropY = 0;
if (cropX + cropSize > width) cropSize = width - cropX;
if (cropY + cropSize > height) cropSize = height - cropY;
console.log(
  `bbox=${bw}x${bh} center=(${cx.toFixed(0)},${cy.toFixed(0)}) crop=${cropX},${cropY} ${cropSize}x${cropSize}`,
);

const processed = await sharp(Buffer.from(pixels.buffer), {
  raw: { width, height, channels: 4 },
})
  .extract({ left: cropX, top: cropY, width: cropSize, height: cropSize })
  .png()
  .toBuffer();

for (const { size, path } of outputs) {
  await sharp(processed)
    .resize(size, size, { fit: "contain", kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(path);
  console.log(`wrote ${path} (${size}x${size})`);
}
