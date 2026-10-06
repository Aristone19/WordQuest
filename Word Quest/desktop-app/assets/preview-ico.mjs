// Renders each icon size to a PNG so the artwork can be eyeballed.
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const ICO = process.argv[2];
const OUTDIR = process.argv[3];
fs.mkdirSync(OUTDIR, { recursive: true });

const buf = fs.readFileSync(ICO);
const count = buf.readUInt16LE(4);
const entries = [];
for (let i = 0; i < count; i++) {
  const o = 6 + i * 16;
  entries.push({
    w: buf[o] || 256, h: buf[o + 1] || 256,
    len: buf.readUInt32LE(o + 8), off: buf.readUInt32LE(o + 12)
  });
}
console.log(entries.map(e => `${e.w}x${e.h} (${e.len}b)`).join(", "));

let T = null;
function crc32(b) {
  if (!T) { T = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c; } }
  let c = -1; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 0xff] ^ (c >>> 8); return c ^ -1;
}
function chunk(t, d) {
  const l = Buffer.alloc(4); l.writeUInt32BE(d.length);
  const body = Buffer.concat([Buffer.from(t, "ascii"), d]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([l, body, c]);
}

for (const e of entries) {
  const data = buf.subarray(e.off, e.off + e.len);
  if (data.readUInt32BE(0) !== 0x89504e47) { console.log(`${e.w}: not a PNG`); continue; }
  // Re-emit with a light checkerboard behind it so transparency is visible.
  const w = e.w, h = e.h;
  // Walk the PNG chunks properly instead of assuming a fixed IDAT position.
  let p = 8, raw = null;
  while (p + 8 <= data.length) {
    const len = data.readUInt32BE(p);
    const type = data.toString("ascii", p + 4, p + 8);
    const body = data.subarray(p + 8, p + 8 + len);
    if (type === "IDAT") {
      if (!raw) raw = Buffer.concat([zlib.inflateSync(body)]);
      else {
        const more = zlib.inflateSync(body);
        raw = Buffer.concat([raw, more]);
      }
    }
    p += 12 + len;
  }
  if (!raw) { console.log(`${w}: no IDAT data`); continue; }
  const stride = w * 4 + 1;
  const out = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    out[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const si = y * stride + 1 + x * 4, di = y * (w * 4 + 1) + 1 + x * 4;
      const a = raw[si + 3] / 255;
      const checker = ((Math.floor(x / 4) + Math.floor(y / 4)) % 2) ? 70 : 45;
      out[di] = Math.round(raw[si] * a + checker * (1 - a));
      out[di + 1] = Math.round(raw[si + 1] * a + checker * (1 - a));
      out[di + 2] = Math.round(raw[si + 2] * a + checker * (1 - a));
      out[di + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(out)), chunk("IEND", Buffer.alloc(0))
  ]);
  const f = path.join(OUTDIR, `icon-${w}.png`);
  fs.writeFileSync(f, png);
  console.log(`wrote ${f}`);
}
