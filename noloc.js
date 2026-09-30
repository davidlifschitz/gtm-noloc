function ascii(buf, i, n) {
  return String.fromCharCode(...buf.subarray(i, i + n));
}

function peekJpeg(buf) {
  const u = new Uint8Array(buf);
  if (u[0] !== 0xff || u[1] !== 0xd8) return { jpeg: false, gps: false, exif: false };
  let i = 2;
  let exif = false;
  let gps = false;
  while (i + 4 < u.length) {
    if (u[i] !== 0xff) break;
    const m = u[i + 1];
    const len = (u[i + 2] << 8) | u[i + 3];
    if (m === 0xda) break;
    if (m === 0xe1 && ascii(u, i + 4, 4) === "Exif") {
      exif = true;
      const tiff = i + 10;
      const le = ascii(u, tiff, 2) === "II";
      const rd16 = (p) => le ? u[p] | (u[p + 1] << 8) : (u[p] << 8) | u[p + 1];
      const rd32 = (p) =>
        le
          ? u[p] | (u[p + 1] << 8) | (u[p + 2] << 16) | (u[p + 3] << 24)
          : (u[p] << 24) | (u[p + 1] << 16) | (u[p + 2] << 8) | u[p + 3];
      try {
        const ifd0 = tiff + rd32(tiff + 4);
        const n = rd16(ifd0);
        for (let e = 0; e < n && e < 64; e++) {
          const p = ifd0 + 2 + e * 12;
          if (rd16(p) === 0x8825) gps = true;
        }
      } catch (_) {}
    }
    i += 2 + len;
  }
  return { jpeg: true, gps, exif };
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
const u16 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255]);
const u32 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const enc = (s) => new TextEncoder().encode(s);
function concat(arrs) {
  const n = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
function zipStore(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc(f.name);
    const data = f.data;
    const crc = crc32(data);
    const local = new Uint8Array([
      ...enc("PK\x03\x04"), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(name.length), ...u16(0), ...name, ...data,
    ]);
    parts.push(local);
    central.push(new Uint8Array([
      ...enc("PK\x01\x02"), ...u16(20), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(offset), ...name,
    ]));
    offset += local.length;
  }
  const cdir = concat(central);
  return concat([...parts, cdir, new Uint8Array([
    ...enc("PK\x05\x06"), ...u16(0), ...u16(0),
    ...u16(files.length), ...u16(files.length),
    ...u32(cdir.length), ...u32(offset), ...u16(0),
  ])]);
}

function outName(name) {
  return (name.replace(/\.[^.]+$/, "") || "photo") + "_noloc.jpg";
}

function uniqueNames(names) {
  const seen = new Set();
  return names.map((n) => {
    let out = n;
    for (let k = 2; seen.has(out); k++) out = n.replace(/(\.[^.]+)?$/, "-" + k + "$1");
    seen.add(out);
    return out;
  });
}

function logItem(doc, name, out, peek) {
  const li = doc.createElement("li");
  li.textContent = name + " → " + out + " ";
  const pill = doc.createElement("span");
  pill.className = peek.gps || peek.exif ? "pill" : "pill ok";
  pill.textContent = peek.gps ? "GPS found" : peek.exif ? "EXIF found" : "no GPS IFD";
  li.appendChild(pill);
  return li;
}

if (typeof module !== "undefined") {
  module.exports = { peekJpeg, crc32, zipStore, outName, logItem, uniqueNames };
}
