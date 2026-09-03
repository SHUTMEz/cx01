import assert from "node:assert/strict";
import test from "node:test";
import { classifyLineMessage, isImageMimeType, pollLineMessages, shouldCaptureLineMessage } from "./line-message.mjs";

test("polls LINE sync operations when push transport produces no messages", async () => {
  let syncCalls = 0;
  let pushCalls = 0;
  const operations = [
    { type: "NOTIFIED_UPDATE_PROFILE", message: null },
    { type: "SEND_MESSAGE", message: { id: "image-1", contentType: "IMAGE" } },
    { type: "RECEIVE_MESSAGE", message: { id: "text-1", contentType: "NONE", text: "hello" } },
  ];
  const client = {
    base: {
      createPolling: () => ({
        listenTalkEvents: () => { pushCalls += 1; return []; },
        _listenTalkEvents: async function* () { syncCalls += 1; yield* operations; },
      }),
      e2ee: { decryptE2EEMessage: async (message) => ({ ...message, decrypted: true }) },
    },
  };
  const received = [];
  for await (const message of pollLineMessages(client)) received.push(message);
  assert.deepEqual(received, [
    { id: "image-1", contentType: "IMAGE", decrypted: true },
    { id: "text-1", contentType: "NONE", text: "hello", decrypted: true },
  ]);
  assert.equal(syncCalls, 1);
  assert.equal(pushCalls, 0);
});

test("captures messages sent by the logged-in LINE account", () => {
  assert.equal(shouldCaptureLineMessage({ isMyMessage: true }), true);
  assert.equal(shouldCaptureLineMessage({ isMyMessage: false }), true);
});

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
