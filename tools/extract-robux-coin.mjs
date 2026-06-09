import fs from "node:fs/promises";
import zlib from "node:zlib";
import { promisify } from "node:util";

const inflate = promisify(zlib.inflate);
const deflate = promisify(zlib.deflate);
const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  throw new Error("Usage: node tools/extract-robux-coin.mjs <input.png> <output.png>");
}

function crc32(buf) {
  const table =
    crc32.table ||
    (crc32.table = (() => {
      const values = new Uint32Array(256);
      for (let i = 0; i < 256; i += 1) {
        let current = i;
        for (let k = 0; k < 8; k += 1) {
          current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
        }
        values[i] = current >>> 0;
      }
      return values;
    })());

  let current = 0xffffffff;
  for (const byte of buf) {
    current = table[(current ^ byte) & 0xff] ^ (current >>> 8);
  }
  return (current ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuffer.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return out;
}

async function decode(file) {
  const buffer = await fs.readFile(file);
  let position = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idats = [];

  while (position < buffer.length) {
    const length = buffer.readUInt32BE(position);
    position += 4;
    const type = buffer.toString("ascii", position, position + 4);
    position += 4;
    const data = buffer.subarray(position, position + length);
    position += length + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const raw = await inflate(Buffer.concat(idats));
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(height * stride);
  let rawPosition = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawPosition];
    rawPosition += 1;
    const rowStart = y * stride;

    for (let x = 0; x < stride; x += 1) {
      const value = raw[rawPosition];
      rawPosition += 1;
      const left = x >= bytesPerPixel ? pixels[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[rowStart - stride + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[rowStart - stride + x - bytesPerPixel] : 0;
      let predictor = 0;

      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter: ${filter}`);
      }

      pixels[rowStart + x] = (value + predictor) & 255;
    }
  }

  return { width, height, bytesPerPixel, pixels };
}

async function encode(width, height, rgba, file) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let rawPosition = 0;
  let rgbaPosition = 0;

  for (let y = 0; y < height; y += 1) {
    raw[rawPosition] = 0;
    rawPosition += 1;
    rgba.copy(raw, rawPosition, rgbaPosition, rgbaPosition + width * 4);
    rawPosition += width * 4;
    rgbaPosition += width * 4;
  }

  await fs.writeFile(
    file,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", ihdr),
      chunk("IDAT", await deflate(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

function isCoinPixel(r, g, b) {
  const green = g > r + 18 && g > b + 6;
  const darkGreen = g >= r && g >= b && g > 22 && r < 95 && b < 95;
  return green || darkGreen;
}

const decoded = await decode(input);
const { width, height, bytesPerPixel, pixels } = decoded;
const rgba = Buffer.alloc(width * height * 4);
let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;

for (let pixel = 0, source = 0; pixel < width * height; pixel += 1, source += bytesPerPixel) {
  const r = pixels[source];
  const g = pixels[source + 1];
  const b = pixels[source + 2];
  const keep = isCoinPixel(r, g, b);
  const target = pixel * 4;

  rgba[target] = r;
  rgba[target + 1] = g;
  rgba[target + 2] = b;
  rgba[target + 3] = keep ? 255 : 0;

  if (keep) {
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
}

const padding = 32;
minX = Math.max(0, minX - padding);
minY = Math.max(0, minY - padding);
maxX = Math.min(width - 1, maxX + padding);
maxY = Math.min(height - 1, maxY + padding);

const trimmedWidth = maxX - minX + 1;
const trimmedHeight = maxY - minY + 1;
const trimmed = Buffer.alloc(trimmedWidth * trimmedHeight * 4);

for (let y = 0; y < trimmedHeight; y += 1) {
  const sourceStart = ((minY + y) * width + minX) * 4;
  const sourceEnd = sourceStart + trimmedWidth * 4;
  rgba.copy(trimmed, y * trimmedWidth * 4, sourceStart, sourceEnd);
}

await encode(trimmedWidth, trimmedHeight, trimmed, output);
