import assert from "node:assert/strict";
import test from "node:test";
import { getCardImagePaths, getCardTextWithoutEndText, getCardImagesForDrag } from "./cardContextActions.ts";

test("drag without start photo uses only the card image paths", () => {
  assert.deepEqual(
    getCardImagePaths(["start-1.png", "main-1.png", "main-2.png"], undefined),
    ["start-1.png", "main-1.png", "main-2.png"]
  );
});

test("copy without end text returns only the card text", () => {
  assert.equal(getCardTextWithoutEndText("Product details"), "Product details");
});

test("normal drag includes start images before card images", () => {
  assert.deepEqual(
    getCardImagesForDrag(["start-1.png", "start-2.png"], ["main-1.png", "main-2.png"]),
    ["start-1.png", "start-2.png", "main-1.png", "main-2.png"]
  );
});
