import { it, expect } from "vitest";
const { drawOpaque } = require("../noloc.js");

it("paints white under the image so transparency doesn't turn black in JPEG", () => {
  const calls = [];
  const ctx = {
    set fillStyle(v) { calls.push(["fillStyle", v]); },
    fillRect: (...a) => calls.push(["fillRect", ...a]),
    drawImage: (...a) => calls.push(["drawImage", ...a]),
  };
  const bmp = { width: 3, height: 2 };
  drawOpaque(ctx, bmp);
  expect(calls).toEqual([["fillStyle", "#fff"], ["fillRect", 0, 0, 3, 2], ["drawImage", bmp, 0, 0]]);
});
