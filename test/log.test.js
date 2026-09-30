// @vitest-environment jsdom
import { it, expect } from "vitest";
const { logItem } = require("../noloc.js");

it("renders filenames as text, not HTML", () => {
  const li = logItem(document, '<img src=x onerror="alert(1)">.jpg', "x_noloc.jpg", { gps: true, exif: true });
  expect(li.querySelector("img")).toBeNull();
  expect(li.textContent).toContain('<img src=x onerror="alert(1)">.jpg');
  expect(li.querySelector(".pill").textContent).toBe("GPS found");
});

it("labels clean files", () => {
  const li = logItem(document, "a.png", "a_noloc.jpg", { gps: false, exif: false });
  expect(li.querySelector(".pill.ok").textContent).toBe("no GPS IFD");
});
