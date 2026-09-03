import assert from "node:assert/strict";
import test from "node:test";
import { classifyLineMessage, dispatchLineMessages, isExpectedPollTimeout, isImageMimeType, pollLineMessages, shouldCaptureLineMessage } from "./line-message.mjs";

test("polls LINE sync operations when push transport produces no messages", async () => {
  let syncCalls = 0;
  const operations = [
    { type: "NOTIFIED_UPDATE_PROFILE", message: null },
    { type: "SEND_MESSAGE", message: { id: "image-1", contentType: "IMAGE" } },
    { type: "RECEIVE_MESSAGE", message: { id: "text-1", contentType: "NONE", text: "hello" } },
  ];
  const client = {
    base: {
      talk: { sync: async () => {
        syncCalls += 1;
        return { operationResponse: { operations } };
      } },
      e2ee: { decryptE2EEMessage: async (message) => ({ ...message, decrypted: true }) },
    },
  };
  const received = [];
  for await (const message of pollLineMessages(client, { sleep: async () => {} })) {
    received.push(message);
    if (received.length === 2) break;
  }
  assert.deepEqual(received, [
    { id: "image-1", contentType: "IMAGE", decrypted: true },
    { id: "text-1", contentType: "NONE", text: "hello", decrypted: true },
  ]);
  assert.equal(syncCalls, 1);
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

test("treats HTTP 410 as an expected long-poll timeout", () => {
  assert.equal(isExpectedPollTimeout(new Error("Request internal failed: status=410 headers=[] body=<>")), true);
  assert.equal(isExpectedPollTimeout(new Error("Request internal failed: status=500")), false);
});

test("continues after HTTP 410 without reporting an error", async () => {
  let syncCalls = 0;
  const reconnects = [];
  const client = {
    base: {
      talk: { sync: async () => {
        syncCalls += 1;
        if (syncCalls === 1) throw new Error("Request internal failed: status=410 headers=[] body=<>");
        return { operationResponse: { operations: [{ type: "SEND_MESSAGE", message: { id: "text-1", contentType: "TEXT", text: "hello" } }] } };
      } },
      e2ee: { decryptE2EEMessage: async (message) => message },
    },
  };
  const received = [];
  for await (const message of pollLineMessages(client, { onReconnecting: (error) => reconnects.push(error), sleep: async () => {} })) {
    received.push(message);
    break;
  }
  assert.equal(reconnects.length, 0);
  assert.equal(received[0].id, "text-1");
});

test("retries transient failures three times with exponential backoff before stopping", async () => {
  let syncCalls = 0;
  const delays = [];
  const reconnects = [];
  const stopped = [];
  const client = {
    base: {
      talk: { sync: async () => { syncCalls += 1; throw new Error("Request internal failed: status=500"); } },
      e2ee: { decryptE2EEMessage: async (message) => message },
    },
  };
  for await (const message of pollLineMessages(client, {
    onReconnecting: (_error, attempt) => reconnects.push(attempt),
    onStopped: (error) => stopped.push(error),
    sleep: async (delay) => { delays.push(delay); },
  })) void message;
  assert.equal(syncCalls, 4);
  assert.deepEqual(reconnects, [1, 2, 3]);
  assert.deepEqual(delays, [1_000, 2_000, 4_000]);
  assert.equal(stopped.length, 1);
});

test("stops immediately for authentication failures", async () => {
  let syncCalls = 0;
  const reconnects = [];
  const stopped = [];
  const client = {
    base: {
      talk: { sync: async () => { syncCalls += 1; throw new Error("Request internal failed: status=401"); } },
      e2ee: { decryptE2EEMessage: async (message) => message },
    },
  };
  for await (const message of pollLineMessages(client, {
    onReconnecting: (error) => reconnects.push(error),
    onStopped: (error) => stopped.push(error),
    sleep: async () => {},
  })) void message;
  assert.equal(syncCalls, 1);
  assert.equal(reconnects.length, 0);
  assert.equal(stopped.length, 1);
});

test("dispatches later LINE messages while an image handler is still loading", async () => {
  let releaseImage;
  const imageLoaded = new Promise((resolve) => { releaseImage = resolve; });
  const started = [];
  async function* messages() {
    yield { id: "image" };
    yield { id: "text" };
  }
  const running = dispatchLineMessages(messages(), async (message) => {
    started.push(message.id);
    if (message.id === "image") await imageLoaded;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(started, ["image", "text"]);
  releaseImage();
  await running;
});
