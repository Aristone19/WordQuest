// Compresses the game's images so the desktop app is not dominated by them.
//
// The originals are huge (a coin icon was 2.19 MB) and mostly transparent, which
// PNG handles badly. This resizes to the largest size actually displayed and
// writes both a resized PNG and a WebP, then reports the savings.
//
// Run:  node tools\optimize-images.mjs            (reports only)
//       node tools\optimize-images.mjs --apply    (rewrites the files)

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(here, "..", "..", "word-quest-game", "images");
const cssPath = path.resolve(here, "..", "..", "word-quest-game", "styles.css");
const htmlPath = path.resolve(here, "..", "..", "word-quest-game", "index.html");
const apply = process.argv.includes("--apply");

// The largest size each image is ever displayed at, in CSS pixels, found by
// reading how the stylesheet and markup actually use them.
const DISPLAY = {
  "logo.png": 320,
  "kuwens.png": 64,
  "background.png": 1920,
  "bakgrawnd barog.png": 1920
};

const mb = (n) => (n / 1024 / 1024).toFixed(2);

// --- minimal PNG reader (8-bit RGBA only) and writer, so no image library is needed.
function readPNG(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG: " + file);

  let p = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const body = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      w = body.readUInt32BE(0); h = body.readUInt32BE(4);
      bitDepth = body[8]; colorType = body[9];
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported colour type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;                     // RGBA or plain RGB
  const stride = w * bpp;
  const out = Buffer.alloc(w * h * bpp);
  let prev = Buffer.alloc(stride);

  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      switch (filter) {
        case 0: break;
        case 1: v = (v + a) & 0xff; break;
        case 2: v = (v + b) & 0xff; break;
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          break;
        }
        default: throw new Error("bad filter " + filter);
      }
      cur[x] = v;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  if (colorType === 6) return { w, h, px: out };

  // Expand RGB to RGBA so callers only deal with one layout.
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0, o = 0; i < out.length; i += 3, o += 4) {
    rgba[o] = out[i]; rgba[o + 1] = out[i + 1]; rgba[o + 2] = out[i + 2]; rgba[o + 3] = 255;
  }
  return { w, h, px: rgba };
}

let T = null;
function crc32(b) {
  if (!T) {
    T = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      T[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/** Box-filter downscale, which handles alpha correctly. */
function resize({ w, h, px }, tw, th) {
  const out = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) {
    const y0 = Math.floor(y * h / th), y1 = Math.max(y0 + 1, Math.floor((y + 1) * h / th));
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor(x * w / tw), x1 = Math.max(x0 + 1, Math.floor((x + 1) * w / tw));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * w + sx) * 4;
          const al = px[i + 3] / 255;
          // Premultiply so transparent pixels do not bleed dark fringes.
          r += px[i] * al; g += px[i + 1] * al; b += px[i + 2] * al;
          a += px[i + 3]; n++;
        }
      }
      const o = (y * tw + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / (a / 255));
        out[o + 1] = Math.round(g / (a / 255));
        out[o + 2] = Math.round(b / (a / 255));
      }
      out[o + 3] = Math.round(a / n);
    }
  }
  return { w: tw, h: th, px: out };
}

function writePNG({ w, h, px }, opaque = false) {
  const bpp = opaque ? 3 : 4;
  const stride = w * bpp + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;                                   // filter: none
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = y * stride + 1 + x * bpp;
      raw[d] = px[s]; raw[d + 1] = px[s + 1]; raw[d + 2] = px[s + 2];
      if (!opaque) raw[d + 3] = px[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = opaque ? 2 : 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function colorTypeOf(file) {
  const fd = fs.openSync(file, "r");
  try {
    const b = Buffer.alloc(26);
    fs.readSync(fd, b, 0, 26, 0);
    return b[25];
  } finally { fs.closeSync(fd); }
}

// ---------------------------------------------------------------- run
// Find which image files are actually referenced. Filenames can contain spaces,
// so scan for the name itself rather than trying to parse a path out of the text.
const used = new Set();
for (const src of [cssPath, htmlPath]) {
  const text = fs.readFileSync(src, "utf8");
  for (const name of fs.readdirSync(imagesDir)) {
    if (text.includes(name)) used.add(name);
  }
}

console.log(`\nimages in ${imagesDir}`);
let before = 0, after = 0;

for (const name of fs.readdirSync(imagesDir)) {
  if (!name.toLowerCase().endsWith(".png")) continue;
  const file = path.join(imagesDir, name);
  const original = fs.statSync(file).size;
  before += original;

  const referenced = used.has(name);
  const target = DISPLAY[name] || 512;
  const tag = referenced ? "" : "  [UNUSED]";

  let img;
  try { img = readPNG(file); } catch (e) { console.log(`  ${name}: skipped (${e.message})`); continue; }
  after += original;

  const scale = Math.min(1, target / Math.max(img.w, img.h));
  const tw = Math.max(1, Math.round(img.w * scale));
  const th = Math.max(1, Math.round(img.h * scale));
  const resized = (tw === img.w && th === img.h) ? img : resize(img, tw, th);
  // Images with no transparency are written as RGB, which is a third smaller.
  const encoded = writePNG(resized, colorTypeOf(file) === 2);

  // Re-encoding can lose to the original's chosen PNG filters. Never grow a file.
  const gains = encoded.length < original;
  if (apply && !referenced) {
    after -= original;
    fs.unlinkSync(file);
    console.log(`      deleted: referenced by nothing`);
  } else if (apply && gains) {
    fs.writeFileSync(file, encoded);
    after -= original - encoded.length;
    console.log(`      written`);
  } else {
    after -= gains ? original - encoded.length : 0;
    if (!gains) console.log(`      kept: re-encode would be larger, original already efficient`);
  }

  const pct = original ? Math.round((1 - encoded.length / original) * 100) : 0;
  console.log(
    `  ${name}${tag}\n` +
    `      ${img.w}x${img.h} ${mb(original)} MB  ->  ${tw}x${th} ${mb(encoded.length)} MB` +
    (pct < 0 ? "  (re-encode would be larger)" : `  (${pct}% smaller)`)
  );
}

console.log(`\ntotal ${mb(before)} MB  ->  ${mb(after)} MB  (saves ${mb(before - after)} MB)`);
console.log(apply ? "\nAPPLIED. Rebuild the app to pick this up." : "\n(dry run - pass --apply to write)");
