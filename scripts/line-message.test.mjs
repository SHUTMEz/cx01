import assert from "node:assert/strict";
import test from "node:test";
import { classifyLineMessage } from "./line-message.mjs";

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
