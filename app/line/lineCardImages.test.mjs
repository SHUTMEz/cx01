import assert from "node:assert/strict";
import test from "node:test";
import { splitLineCardImagePaths } from "./lineCardImages.ts";

test("LINE card keeps configured start images separate from received images", () => {
  assert.deepEqual(
    splitLineCardImagePaths(["start-1.png"], ["start-1.png", "main-1.png", "main-2.png"]),
    { startImages: ["start-1.png"], images: ["main-1.png", "main-2.png"] },
  );
});
