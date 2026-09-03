import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { initialCaptureState, lineCaptureReducer } from "./captureState.ts";

test("first image opens a capture and waits for text", () => {
  const state = lineCaptureReducer(initialCaptureState, { type: "image", dataUrl: "data:image/png;base64,a" });
  assert.deepEqual(state.images, ["data:image/png;base64,a"]);
  assert.equal(state.status, "waiting-text");
});

test("additional images stay in the same capture", () => {
  const state = lineCaptureReducer(
    lineCaptureReducer(initialCaptureState, { type: "image", dataUrl: "data:image/png;base64,a" }),
    { type: "image", dataUrl: "data:image/png;base64,b" },
  );
  assert.equal(state.images.length, 2);
  assert.equal(state.status, "waiting-text");
});

test("copying an image duplicates only the selected image", () => {
  const state = lineCaptureReducer(
    { ...initialCaptureState, images: ["image-a", "image-b"], status: "ready-to-save" },
    { type: "copy-image", index: 1 },
  );
  assert.deepEqual(state.images, ["image-a", "image-b", "image-b"]);
});

test("text completes a capture for review", () => {
  const withImage = lineCaptureReducer(initialCaptureState, { type: "image", dataUrl: "data:image/png;base64,a" });
  const state = lineCaptureReducer(withImage, { type: "text", text: "Product details" });
  assert.equal(state.text, "Product details");
  assert.equal(state.status, "ready-to-save");
});

test("save and discard clear the capture", () => {
  const ready = lineCaptureReducer(
    { ...initialCaptureState, images: ["image"], text: "text", status: "ready-to-save" },
    { type: "clear" },
  );
  assert.deepEqual(ready, initialCaptureState);
});
