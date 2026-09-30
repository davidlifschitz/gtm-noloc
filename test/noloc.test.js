import { describe, it, expect } from "vitest";
const { peekJpeg, crc32, zipStore, outName } = require("../noloc.js");
const { jpegWithExif } = require("./helpers.js");

describe("peekJpeg", () => {
  it("rejects non-JPEG", () => {
    expect(peekJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer).jpeg).toBe(false);
  });
  it("finds GPS IFD (little endian)", () => {
    expect(peekJpeg(jpegWithExif([0x010f, 0x8825]))).toEqual({ jpeg: true, exif: true, gps: true });
  });
  it("finds GPS IFD (big endian, as written by iPhones)", () => {
    expect(peekJpeg(jpegWithExif([0x010f, 0x8825], false)).gps).toBe(true);
  });
  it("EXIF without GPS", () => {
    expect(peekJpeg(jpegWithExif([0x010f]))).toEqual({ jpeg: true, exif: true, gps: false });
  });
});

describe("crc32", () => {
  it("matches known value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("zipStore", () => {
  it("writes local headers and end record", () => {
    const z = zipStore([{ name: "a.jpg", data: new Uint8Array([1, 2, 3]) }]);
    expect([...z.subarray(0, 4)]).toEqual([0x50, 0x4b, 3, 4]);
    const end = z.subarray(z.length - 22);
    expect([...end.subarray(0, 4)]).toEqual([0x50, 0x4b, 5, 6]);
    expect(end[10]).toBe(1);
  });
});

describe("outName", () => {
  it("swaps extension", () => expect(outName("IMG_1.HEIC.png")).toBe("IMG_1.HEIC_noloc.jpg"));
  it("falls back to photo", () => expect(outName(".png")).toBe("photo_noloc.jpg"));
});

describe("uniqueNames", () => {
  const { uniqueNames } = require("../noloc.js");
  it("keeps distinct names", () => expect(uniqueNames(["a_noloc.jpg", "b_noloc.jpg"])).toEqual(["a_noloc.jpg", "b_noloc.jpg"]));
  it("suffixes collisions", () =>
    expect(uniqueNames(["IMG_noloc.jpg", "IMG_noloc.jpg", "IMG_noloc.jpg"])).toEqual(["IMG_noloc.jpg", "IMG_noloc-2.jpg", "IMG_noloc-3.jpg"]));
  it("avoids clashing with an existing suffixed name", () =>
    expect(uniqueNames(["a-2.jpg", "a.jpg", "a.jpg"])).toEqual(["a-2.jpg", "a.jpg", "a-3.jpg"]));
});
