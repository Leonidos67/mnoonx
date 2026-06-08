/** Writes a valid 180×180 PNG for TON Connect manifest (wallets require PNG/ICO, not SVG). */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 180;
const outPath = path.join(__dirname, '../public/tonconnect-icon-180.png');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const rows = [];
for (let y = 0; y < SIZE; y += 1) {
  const row = Buffer.alloc(1 + SIZE * 3);
  row[0] = 0;
  for (let x = 0; x < SIZE; x += 1) {
    const dx = x - SIZE / 2;
    const dy = y - SIZE / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inCircle = dist < SIZE * 0.46;
    const idx = 1 + x * 3;
    if (inCircle) {
      row[idx] = 17;
      row[idx + 1] = 24;
      row[idx + 2] = 39;
    } else {
      row[idx] = 10;
      row[idx + 1] = 10;
      row[idx + 2] = 10;
    }
  }
  rows.push(row);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, png);
console.log(`[tonconnect] icon: ${outPath} (${png.length} bytes)`);
