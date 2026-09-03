import assert from "node:assert/strict";
import test from "node:test";
import { classifyLineMessage, isImageMimeType } from "./line-message.mjs";

test("classifies LINE text and image content types", () => {
  assert.equal(classifyLineMessage("NONE"), "text");
  assert.equal(classifyLineMessage("TEXT"), "text");
  assert.equal(classifyLineMessage(0), "text");
  assert.equal(classifyLineMessage("0"), "text");
  assert.equal(classifyLineMessage("IMAGE"), "image");
  assert.equal(classifyLineMessage(1), "image");
  assert.equal(classifyLineMessage("1"), "image");
  assert.equal(classifyLineMessage(21), "image");
  assert.equal(classifyLineMessage("EXTIMAGE"), "image");
});

test("recognizes image MIME types for unknown LINE content types", () => {
  assert.equal(isImageMimeType("image/jpeg"), true);
  assert.equal(isImageMimeType("IMAGE/PNG"), true);
  assert.equal(isImageMimeType("text/plain"), false);
  assert.equal(isImageMimeType(undefined), false);
});
