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

function createIcoFromPng(pngBuffer, width = 256, height = 256) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry[0] = width === 256 ? 0 : width;  // Width 0 = 256
  dirEntry[1] = height === 256 ? 0 : height; // Height 0 = 256
  dirEntry[2] = 0; // Color count
  dirEntry[3] = 0; // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel (32 RGBA)
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Image size
  dirEntry.writeUInt32LE(22, 12); // Offset = 6 + 16 = 22

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

// Generate crisp 256x256 PNG icon with Indigo Background & bold white "E"
const png256Buffer = createPngBuffer(256, 256, (x, y) => {
  const cx = 127.5, cy = 127.5;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  // Rounded corners radius
  const r = 40;
  const boxW = 120;
  const boxH = 120;
  if (dx > boxW - r && dy > boxH - r) {
    const distSq = Math.pow(dx - (boxW - r), 2) + Math.pow(dy - (boxH - r), 2);
    if (distSq > r * r) {
      return [0, 0, 0, 0]; // Transparent
    }
  }

  // Draw bold white letter "E"
  const isSpine = (x >= 64 && x <= 100 && y >= 56 && y <= 200);
  const isTopBar = (x >= 64 && x <= 184 && y >= 56 && y <= 84);
  const isMidBar = (x >= 64 && x <= 160 && y >= 114 && y <= 142);
  const isBotBar = (x >= 64 && x <= 184 && y >= 172 && y <= 200);

  if (isSpine || isTopBar || isMidBar || isBotBar) {
    return [255, 255, 255, 255]; // White E
  }

  // Vibrant Indigo Gradient (#6366F1 to #4F46E5)
  const grad = Math.floor((y / 256) * 35);
  return [99 - grad, 102 - grad, 241, 255];
});

// Generate 32x32 PNG for small tray icon
const png32Buffer = createPngBuffer(32, 32, (x, y) => {
  const cx = 15.5, cy = 15.5;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  const r = 5;
  const boxW = 15;
  const boxH = 15;
  if (dx > boxW - r && dy > boxH - r) {
    const distSq = Math.pow(dx - (boxW - r), 2) + Math.pow(dy - (boxH - r), 2);
    if (distSq > r * r) {
      return [0, 0, 0, 0];
    }
  }

  const isSpine = (x >= 8 && x <= 12 && y >= 7 && y <= 24);
  const isTopBar = (x >= 8 && x <= 23 && y >= 7 && y <= 10);
  const isMidBar = (x >= 8 && x <= 20 && y >= 14 && y <= 17);
  const isBotBar = (x >= 8 && x <= 23 && y >= 21 && y <= 24);

  if (isSpine || isTopBar || isMidBar || isBotBar) {
    return [255, 255, 255, 255];
  }

  const grad = Math.floor((y / 32) * 35);
  return [99 - grad, 102 - grad, 241, 255];
});

const icoBuffer = createIcoFromPng(png256Buffer, 256, 256);

const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

// Write ICO & PNG to build/ directory for electron-builder
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(buildDir, 'icon.png'), png256Buffer);

// Write to root, public, electron, dist-electron
fs.writeFileSync(path.join(rootDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(rootDir, 'icon.png'), png256Buffer);

const targetDirs = [
  path.join(rootDir, 'public'),
  path.join(rootDir, 'electron'),
  path.join(rootDir, 'dist-electron')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'icon.png'), png32Buffer);
  fs.writeFileSync(path.join(dir, 'icon.ico'), icoBuffer);
});

console.log('Successfully generated vibrant 256x256 ICO and PNG icons with letter E!');
