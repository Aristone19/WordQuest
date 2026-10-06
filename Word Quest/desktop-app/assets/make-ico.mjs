// Generates WordQuest.ico: a dark rounded tile with a gold "W" wordmark and a
// gold rim. Run with:  node make-ico.mjs
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const OUT = process.argv[2] || path.join(process.cwd(), "assets", "WordQuest.ico");

const SIZES = [16, 24, 32, 48, 64, 128, 256];

const BG = [26, 20, 14];        // tile
const BG2 = [44, 33, 22];       // tile gradient bottom
const GOLD = [242, 196, 92];
const GOLD_D = [176, 132, 44];

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function makeTile(size) {
  const px = Buffer.alloc(size * size * 4, 0);
  const r = Math.max(2, Math.round(size * 0.22));  // corner radius
  const rim = Math.max(1, Math.round(size * 0.055));

  // Layout the W inside the tile.
  const drawW = Math.round(size * 0.50);
  const drawH = Math.round(size * 0.42);
  const ox = Math.floor((size - drawW) / 2);
  const oy = Math.floor((size - drawH) / 2) - Math.round(size * 0.04);

  const put = (x, y, rgb, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = a;
  };

  // Signed distance to a rounded rect, for antialiasing.
  const roundRectSdf = (x, y, w, h, rad) => {
    const cx = Math.abs(x - w / 2) - (w / 2 - rad);
    const cy = Math.abs(y - h / 2) - (h / 2 - rad);
    const ax = Math.max(cx, 0), ay = Math.max(cy, 0);
    return Math.hypot(ax, ay) + Math.min(Math.max(cx, cy), 0) - rad;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sample with a bit of supersampling for smooth edges.
      let cov = 0;
      const SS = 3;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS - 0.5;
          const fy = y + (sy + 0.5) / SS - 0.5;
          if (roundRectSdf(fx, fy, size, size, r) <= 0) cov++;
        }
      }
      cov /= SS * SS;
      if (cov <= 0) continue;

      const t = y / Math.max(1, size - 1);
      const base = [lerp(BG[0], BG2[0], t), lerp(BG[1], BG2[1], t), lerp(BG[2], BG2[2], t)];

      // Gold rim that hugs the edge and fades out toward the centre.
      // d is 0 on the outline and increasingly negative as we move inward.
      const d = roundRectSdf(x, y, size, size, r);
      const inward = Math.max(0, -d);                 // distance inside the edge
      const rimA = inward >= rim ? 0 : 1 - inward / rim;
      const rgb = [
        lerp(base[0], GOLD[0], rimA),
        lerp(base[1], GOLD[1], rimA),
        lerp(base[2], GOLD[2], rimA)
      ];
      put(x, y, rgb, Math.round(cov * 255));
    }
  }

  // A W is a stroked polyline, not a filled bitmap. Draw it as five points with
  // round joins, which stays crisp at 16px and smooth at 256px.
  const stroke = Math.max(1.6, drawH * 0.17);
  const half = stroke / 2;
  const pts = [
    [ox, oy],
    [ox + drawW * 0.25, oy + drawH],
    [ox + drawW * 0.5, oy + drawH * 0.38],
    [ox + drawW * 0.75, oy + drawH],
    [ox + drawW, oy]
  ];

  // Distance from a point to a line segment, for a clean round-capped stroke.
  const segDist = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };

  // Supersample the stroke so the letter has smooth edges at every size.
  // A hard in/out test is what makes a 32px W look like a staircase.
  const SS = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (px[i + 3] === 0) continue;                   // stay inside the tile
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS;
          const fy = y + (sy + 0.5) / SS;
          let best = Infinity;
          for (let s = 0; s < pts.length - 1; s++) {
            const d = segDist(fx, fy, pts[s][0], pts[s][1], pts[s + 1][0], pts[s + 1][1]);
            if (d < best) best = d;
          }
          if (best <= half) hits++;
        }
      }
      if (!hits) continue;
      const a = hits / (SS * SS);
      const s = 0.84 + 0.16 * (1 - (y - oy) / drawH);
      const g = [lerp(GOLD_D[0], GOLD[0], s), lerp(GOLD_D[1], GOLD[1], s), lerp(GOLD_D[2], GOLD[2], s)];
      // Blend the stroke over whatever is already there (tile or rim).
      px[i] = lerp(px[i], g[0], a);
      px[i + 1] = lerp(px[i + 1], g[1], a);
      px[i + 2] = lerp(px[i + 2], g[2], a);
    }
  }

  // A search-bar underline, only where there is room for it.
  if (size >= 32) {
    const barY = oy + drawH + Math.max(2, Math.round(size * 0.07));
    const barX = ox - Math.round(size * 0.08);
    const barW = drawW + Math.round(size * 0.16);
    const barH = Math.max(1, Math.round(size * 0.05));
    if (barY + barH < size - rim - 1) {
      for (let y = barY; y < barY + barH; y++) {
        for (let x = barX; x < barX + barW; x++) {
          const i = (y * size + x) * 4;
          if (x < 0 || y < 0 || x >= size || y >= size || px[i + 3] === 0) continue;
          px[i] = GOLD[0]; px[i + 1] = GOLD[1]; px[i + 2] = GOLD[2];
        }
      }
    }
  }

  return px;
}

function png(px, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;                       // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

// --- assemble the ICO (PNG-compressed entries; Vista and newer read these).
const images = SIZES.map(size => {
  const px = makeTile(size);
  return { size, data: png(px, size) };
});

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);       // reserved
header.writeUInt16LE(1, 2);       // type: icon
header.writeUInt16LE(images.length, 4);

const dir = Buffer.alloc(16 * images.length);
let offset = header.length + dir.length;
images.forEach((img, i) => {
  const o = i * 16;
  dir[o] = img.size >= 256 ? 0 : img.size;      // 0 means 256
  dir[o + 1] = img.size >= 256 ? 0 : img.size;
  dir[o + 2] = 0;                                 // palette
  dir[o + 3] = 0;                                 // reserved
  dir.writeUInt16LE(1, o + 4);                    // colour planes
  dir.writeUInt16LE(32, o + 6);                   // bits per pixel
  dir.writeUInt32LE(img.data.length, o + 8);
  dir.writeUInt32LE(offset, o + 12);
  offset += img.data.length;
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.concat([header, dir, ...images.map(i => i.data)]));
console.log(`wrote ${OUT}  (${SIZES.join(", ")} px, ${fs.statSync(OUT).size} bytes)`);
