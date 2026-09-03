import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { initialCaptureState, lineCaptureReducer } from "./captureState.ts";

const imagePending = (messageId: string, chatId = "chat-a", sequence = 1, receivedAt = 1_000) => ({
  type: "image-pending" as const, messageId, chatId, sequence, receivedAt,
});
const imageLoaded = (messageId: string, dataUrl = `data:image/png;base64,${messageId}`, chatId = "chat-a", sequence = 1, receivedAt = 1_100) => ({
  type: "image-loaded" as const, messageId, chatId, sequence, receivedAt, dataUrl,
});
const textReceived = (messageId: string, text: string, chatId = "chat-a", sequence = 2, receivedAt = 1_200) => ({
  type: "text" as const, messageId, chatId, sequence, receivedAt, text,
});

test("buffers text that arrives before its image payload", () => {
  const withPendingText = lineCaptureReducer(initialCaptureState, textReceived("text-1", "Product details"));
  assert.equal(withPendingText.queue.length, 0);
  assert.equal(withPendingText.pendingTexts.length, 1);
  const loading = lineCaptureReducer(withPendingText, imagePending("image-1", "chat-a", 1, 1_300));
  const ready = lineCaptureReducer(loading, imageLoaded("image-1", undefined, "chat-a", 1, 1_400));
  assert.equal(ready.queue[0].text, "Product details");
  assert.equal(ready.queue[0].status, "ready-to-save");
});

test("keeps save disabled until every pending image settles", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1", "chat-a", 1));
  state = lineCaptureReducer(state, imagePending("image-2", "chat-a", 2));
  state = lineCaptureReducer(state, textReceived("text-1", "Details", "chat-a", 3));
  state = lineCaptureReducer(state, imageLoaded("image-1", undefined, "chat-a", 1));
  assert.equal(state.queue[0].status, "loading-images");
  state = lineCaptureReducer(state, imageLoaded("image-2", undefined, "chat-a", 2));
  assert.equal(state.queue[0].status, "ready-to-save");
});

test("locks the first text for a capture", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1"));
  state = lineCaptureReducer(state, imageLoaded("image-1"));
  state = lineCaptureReducer(state, textReceived("text-1", "First"));
  state = lineCaptureReducer(state, textReceived("text-2", "Second", "chat-a", 3));
  assert.equal(state.queue[0].text, "First");
});

test("queues different chats in first-seen order", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-a", "chat-a", 1));
  state = lineCaptureReducer(state, imagePending("image-b", "chat-b", 2));
  assert.deepEqual(state.queue.map((capture) => capture.chatId), ["chat-a", "chat-b"]);
  state = lineCaptureReducer(state, { type: "discard-active" });
  assert.equal(state.queue[0].chatId, "chat-b");
});

test("starts a new capture for an image sent after the first text", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1", "chat-a", 1));
  state = lineCaptureReducer(state, imageLoaded("image-1", undefined, "chat-a", 1));
  state = lineCaptureReducer(state, textReceived("text-1", "First card", "chat-a", 2));
  state = lineCaptureReducer(state, imagePending("image-2", "chat-a", 3));
  assert.equal(state.queue.length, 2);
  assert.equal(state.queue[0].text, "First card");
  assert.deepEqual(state.queue[1].pendingImageIds, ["image-2"]);
});

test("attaches delayed images that were sequenced before the text", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1", "chat-a", 1));
  state = lineCaptureReducer(state, textReceived("text-1", "Details", "chat-a", 3));
  state = lineCaptureReducer(state, imagePending("image-2", "chat-a", 2, 1_300));
  assert.equal(state.queue.length, 1);
  assert.deepEqual(state.queue[0].pendingImageIds, ["image-1", "image-2"]);
});

test("does not attach an image sequenced after standalone text", () => {
  let state = lineCaptureReducer(initialCaptureState, textReceived("text-1", "Earlier text", "chat-a", 2));
  state = lineCaptureReducer(state, imagePending("image-1", "chat-a", 3, 1_300));
  assert.equal(state.queue[0].text, "");
  assert.equal(state.pendingTexts[0].text, "Earlier text");
});

test("expires text-only captures after sixty seconds", () => {
  let state = lineCaptureReducer(initialCaptureState, textReceived("text-1", "Old", "chat-a", 1, 1_000));
  state = lineCaptureReducer(state, { type: "expire", now: 61_001 });
  assert.equal(state.pendingTexts.length, 0);
});

test("rejects a sixth capture and exposes one overflow notice", () => {
  let state = initialCaptureState;
  for (let index = 0; index < 6; index += 1) {
    state = lineCaptureReducer(state, imagePending(`image-${index}`, `chat-${index}`, index + 1));
  }
  assert.equal(state.queue.length, 5);
  assert.equal(state.notice?.type, "queue-full");
});

test("allows saving successful images when another image fails", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1"));
  state = lineCaptureReducer(state, imagePending("image-2", "chat-a", 2));
  state = lineCaptureReducer(state, textReceived("text-1", "Details", "chat-a", 3));
  state = lineCaptureReducer(state, imageLoaded("image-1"));
  state = lineCaptureReducer(state, { type: "image-error", messageId: "image-2", chatId: "chat-a", sequence: 2, receivedAt: 1_500 });
  assert.equal(state.queue[0].status, "ready-to-save");
  assert.equal(state.queue[0].failedImageCount, 1);
});

test("deduplicates replayed image and text message ids", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1"));
  state = lineCaptureReducer(state, imagePending("image-1"));
  state = lineCaptureReducer(state, imageLoaded("image-1"));
  state = lineCaptureReducer(state, imageLoaded("image-1"));
  state = lineCaptureReducer(state, textReceived("text-1", "Details"));
  state = lineCaptureReducer(state, textReceived("text-1", "Details"));
  assert.equal(state.queue.length, 1);
  assert.equal(state.queue[0].images.length, 1);
});

test("deduplicates by chat and message id together", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("same-id", "chat-a", 1));
  state = lineCaptureReducer(state, imagePending("same-id", "chat-b", 2));
  assert.equal(state.queue.length, 2);
});

test("updates the matching chat when message ids collide", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("same-id", "chat-a", 1));
  state = lineCaptureReducer(state, imagePending("same-id", "chat-b", 2));
  state = lineCaptureReducer(state, imageLoaded("same-id", "image-b", "chat-b", 2));
  assert.deepEqual(state.queue[0].pendingImageIds, ["same-id"]);
  assert.deepEqual(state.queue[1].images.map((image) => image.dataUrl), ["image-b"]);
});

test("does not consume another chat's colliding pending text id", () => {
  let state = lineCaptureReducer(initialCaptureState, textReceived("same-id", "A", "chat-a", 2));
  state = lineCaptureReducer(state, textReceived("same-id", "B", "chat-b", 3));
  state = lineCaptureReducer(state, imagePending("image-a", "chat-a", 1));
  assert.deepEqual(state.pendingTexts.map((pending) => pending.chatId), ["chat-b"]);
  assert.equal(state.queue[0].text, "A");
});

test("discarding a loading capture ignores its late image payload", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1"));
  state = lineCaptureReducer(state, { type: "discard-active" });
  state = lineCaptureReducer(state, imageLoaded("image-1"));
  assert.equal(state.queue.length, 0);
});

test("clear-queue ignores late image payloads from stopped captures", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1"));
  state = lineCaptureReducer(state, { type: "clear-queue" });
  state = lineCaptureReducer(state, imageLoaded("image-1"));
  assert.equal(state.queue.length, 0);
});

test("keeps image order by receive sequence when downloads finish out of order", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1", "chat-a", 1));
  state = lineCaptureReducer(state, imagePending("image-2", "chat-a", 2));
  state = lineCaptureReducer(state, imageLoaded("image-2", "image-2", "chat-a", 2));
  state = lineCaptureReducer(state, imageLoaded("image-1", "image-1", "chat-a", 1));
  assert.deepEqual(state.queue[0].images.map((image) => image.dataUrl), ["image-1", "image-2"]);
});

test("completing the same capture twice does not remove the next capture", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-a", "chat-a", 1));
  state = lineCaptureReducer(state, imagePending("image-b", "chat-b", 2));
  const completedId = state.queue[0].id;
  state = lineCaptureReducer(state, { type: "complete-capture", id: completedId });
  state = lineCaptureReducer(state, { type: "complete-capture", id: completedId });
  assert.equal(state.queue.length, 1);
  assert.equal(state.queue[0].chatId, "chat-b");
});

test("inserts an older buffered capture into FIFO order", () => {
  let state = lineCaptureReducer(initialCaptureState, textReceived("text-old", "Old", "chat-a", 2, 1_000));
  state = lineCaptureReducer(state, imagePending("image-new", "chat-b", 3, 2_000));
  state = lineCaptureReducer(state, imagePending("image-old", "chat-a", 1, 2_100));
  assert.deepEqual(state.queue.map((capture) => capture.chatId), ["chat-a", "chat-b"]);
});

test("copying an image duplicates only the selected active image", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1"));
  state = lineCaptureReducer(state, imageLoaded("image-1", "image-a"));
  state = lineCaptureReducer(state, { type: "copy-image", index: 0 });
  assert.deepEqual(state.queue[0].images.map((image) => image.dataUrl), ["image-a", "image-a"]);
});

test("clearing removes active, queued, and pending text captures", () => {
  let state = lineCaptureReducer(initialCaptureState, imagePending("image-1"));
  state = lineCaptureReducer(state, textReceived("text-b", "Waiting", "chat-b"));
  assert.deepEqual(lineCaptureReducer(state, { type: "clear" }), initialCaptureState);
});
