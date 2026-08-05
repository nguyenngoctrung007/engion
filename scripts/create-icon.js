import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPngBuffer(width, height, pixelFn) {
  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawLines = [];
  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(1 + width * 4);
    line[0] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const idx = 1 + x * 4;
      line[idx] = r;
      line[idx + 1] = g;
      line[idx + 2] = b;
      line[idx + 3] = a;
    }
    rawLines.push(line);
  }

  const uncompressedData = Buffer.concat(rawLines);
  const compressedData = zlib.deflateSync(uncompressedData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate crisp 32x32 PNG icon with Indigo Background & bold white "E"
const buffer = createPngBuffer(32, 32, (x, y) => {
  const cx = 15.5, cy = 15.5;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  // Rounded corners radius
  const r = 5;
  const boxW = 15;
  const boxH = 15;
  if (dx > boxW - r && dy > boxH - r) {
    const distSq = Math.pow(dx - (boxW - r), 2) + Math.pow(dy - (boxH - r), 2);
    if (distSq > r * r) {
      return [0, 0, 0, 0]; // Transparent
    }
  }

  // Draw bold white letter "E"
  const isSpine = (x >= 8 && x <= 12 && y >= 7 && y <= 24);
  const isTopBar = (x >= 8 && x <= 23 && y >= 7 && y <= 10);
  const isMidBar = (x >= 8 && x <= 20 && y >= 14 && y <= 17);
  const isBotBar = (x >= 8 && x <= 23 && y >= 21 && y <= 24);

  if (isSpine || isTopBar || isMidBar || isBotBar) {
    return [255, 255, 255, 255]; // White E
  }

  // Vibrant Indigo Gradient (#6366F1 to #4F46E5)
  const grad = Math.floor((y / 32) * 35);
  return [99 - grad, 102 - grad, 241, 255];
});

const targetDirs = [
  path.join(__dirname, '../public'),
  path.join(__dirname, '../electron'),
  path.join(__dirname, '../dist-electron')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'icon.png'), buffer);
});

console.log('Successfully generated vibrant 32x32 PNG icon with letter E!');
