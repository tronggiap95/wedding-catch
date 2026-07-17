/**
 * Chroma-key #00FF00 (and near-green) to alpha, then trim.
 * Usage: node scripts/chroma-key-ui.mjs <in.png> <out.png>
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('Usage: node scripts/chroma-key-ui.mjs <in.png> <out.png>');
  process.exit(1);
}

function isGreenScreen(r, g, b) {
  // Strong green dominance (chroma key #00FF00 and nearby).
  return g > 140 && g > r + 40 && g > b + 40;
}

const png = PNG.sync.read(fs.readFileSync(path.resolve(inPath)));
const { width, height, data } = png;

for (let i = 0; i < width * height; i += 1) {
  const o = i * 4;
  if (isGreenScreen(data[o], data[o + 1], data[o + 2])) {
    data[o + 3] = 0;
  }
}

let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (data[(y * width + x) * 4 + 3] < 12) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}

if (maxX < 0) {
  console.error('No opaque pixels after chroma key');
  process.exit(1);
}

const pad = 2;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);
const tw = maxX - minX + 1;
const th = maxY - minY + 1;
const out = new PNG({ width: tw, height: th, colorType: 6 });

for (let y = 0; y < th; y += 1) {
  for (let x = 0; x < tw; x += 1) {
    const si = ((minY + y) * width + (minX + x)) * 4;
    const di = (y * tw + x) * 4;
    out.data[di] = data[si];
    out.data[di + 1] = data[si + 1];
    out.data[di + 2] = data[si + 2];
    out.data[di + 3] = data[si + 3];
  }
}

fs.writeFileSync(path.resolve(outPath), PNG.sync.write(out));
console.log(`wrote ${outPath} ${tw}x${th}`);
