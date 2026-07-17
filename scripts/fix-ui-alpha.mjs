/**
 * Remove baked-in checkerboard “fake transparency” and trim empty margins.
 * Usage: node scripts/fix-ui-alpha.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const FILES = [
  'public/assets/images/ui/ui_btn_play_large.png',
  'public/assets/images/ui/ui_btn_menu.png',
  'public/assets/images/ui/ui_menu_banner.png',
  'public/assets/images/ui/ui_btn_rank.png',
];

function isCheckerPixel(r, g, b) {
  // Checkerboard cells are near-neutral gray / white.
  if (Math.abs(r - g) > 14 || Math.abs(g - b) > 14 || Math.abs(r - b) > 14) {
    return false;
  }
  const lum = (r + g + b) / 3;
  return lum >= 95 && lum <= 255;
}

function fixFile(relPath) {
  const abs = path.resolve(relPath);
  const png = PNG.sync.read(fs.readFileSync(abs));
  const { width, height, data } = png;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isCheckerPixel(data[o], data[o + 1], data[o + 2])) return;
    visited[i] = 1;
    queue.push(i);
  };

  // Flood from every border pixel so enclosed checker areas clear.
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop();
    const x = i % width;
    const y = (i / width) | 0;
    const o = i * 4;
    data[o + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Also clear remaining isolated checker pixels (anti-alias pockets).
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    if (data[o + 3] === 0) continue;
    if (isCheckerPixel(data[o], data[o + 1], data[o + 2])) {
      data[o + 3] = 0;
    }
  }

  // Trim to opaque bounds.
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3];
      if (a < 12) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) {
    console.error('No opaque pixels left:', relPath);
    return;
  }

  const pad = 4;
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

  fs.writeFileSync(abs, PNG.sync.write(out));
  console.log(`fixed ${relPath} -> ${tw}x${th} RGBA`);
}

for (const file of FILES) {
  fixFile(file);
}
