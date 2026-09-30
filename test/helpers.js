// Build a minimal JPEG: SOI + APP1 Exif (TIFF with IFD0 entries) + SOS.
function jpegWithExif(tags, le = true) {
  const n = tags.length;
  const tiff = [];
  const w16 = (v) => le ? [v & 255, v >> 8 & 255] : [v >> 8 & 255, v & 255];
  const w32 = (v) => le ? [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24] : [v >>> 24, v >> 16 & 255, v >> 8 & 255, v & 255];
  tiff.push(...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...w16(42), ...w32(8), ...w16(n));
  for (const t of tags) tiff.push(...w16(t), ...w16(4), ...w32(1), ...w32(0));
  tiff.push(...w32(0));
  const body = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const len = body.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255, ...body, 0xff, 0xda, 0, 2, 0xff, 0xd9]).buffer;
}
module.exports = { jpegWithExif };
