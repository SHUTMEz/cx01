import assert from "node:assert/strict";
import test from "node:test";
import { addStartImage } from "./startImageDrop.ts";
import { getDefaultStartImages } from "./startImageDrop.ts";

test("adds a dropped image to the start image pool and selects it", () => {
  const result = addStartImage(["settings-image"], ["settings-image"], "dropped-image");

  assert.deepEqual(result.images, ["settings-image", "dropped-image"]);
  assert.deepEqual(result.selected, ["settings-image", "dropped-image"]);
});

test("does not duplicate an image already in the start pool", () => {
  const result = addStartImage(["image"], ["image"], "image");

  assert.deepEqual(result.images, ["image"]);
  assert.deepEqual(result.selected, ["image"]);
});

test("uses saved start images when present and settings images otherwise", () => {
  assert.deepEqual(getDefaultStartImages(["settings"], ["saved"]), ["saved"]);
  assert.deepEqual(getDefaultStartImages(["settings"], []), ["settings"]);
});
