// Wrap a real PNG image in a Windows ICO container for Electron's executable icon.
// Does not rename PNG bytes to .ico: an ICO header and directory entry are required.
// Windows Vista and newer support PNG-compressed icon images.
const fs = require("node:fs");

function pngDimensions(png) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!Buffer.isBuffer(png) || png.length < 33 || !png.subarray(0, 8).equals(signature) ||
      png.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("Tempo desktop icon must be a valid PNG with an IHDR header.");
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== height || width < 16 || width > 256) {
    throw new Error("Tempo desktop icon PNG must be square and 16-256 pixels.");
  }
  return { width, height };
}

function icoFromPng(png) {
  const { width, height } = pngDimensions(png);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(1, 4); // one PNG-compressed image
  header.writeUInt8(width === 256 ? 0 : width, 6);
  header.writeUInt8(height === 256 ? 0 : height, 7);
  header.writeUInt8(0, 8); // color count
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bit depth
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18); // PNG starts immediately after directory
  return Buffer.concat([header, png]);
}

function writeWindowsIcoFromPng(pngPath, icoPath) {
  const png = fs.readFileSync(pngPath);
  fs.writeFileSync(icoPath, icoFromPng(png));
  return icoPath;
}

module.exports = { pngDimensions, icoFromPng, writeWindowsIcoFromPng };
