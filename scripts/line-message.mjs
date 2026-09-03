export function classifyLineMessage(contentType) {
  const normalized = String(contentType).toUpperCase();
  if (contentType === 0 || normalized === "0" || normalized === "NONE" || normalized === "TEXT") return "text";
  if (contentType === 1 || contentType === 21 || normalized === "1" || normalized === "IMAGE" || normalized === "EXTIMAGE") return "image";
  return null;
}

export function isImageMimeType(mimeType) {
  return typeof mimeType === "string" && mimeType.toLowerCase().startsWith("image/");
}

export function isExpectedPollTimeout(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /status=410\b/.test(message);
}

export function isAuthenticationError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /status=(401|403)\b/.test(message);
}

// A secondary-device self-bot receives messages sent by the logged-in account
// with isMyMessage=true. Those events are the primary capture source.
export function shouldCaptureLineMessage(message) {
  return Boolean(message);
}

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export async function dispatchLineMessages(messages, handler, onError = () => {}) {
  const active = new Set();
  for await (const message of messages) {
    let task;
    try {
      task = Promise.resolve(handler(message));
    } catch (error) {
      onError(error);
      continue;
    }
    active.add(task);
    void task.catch(onError).finally(() => active.delete(task));
  }
  await Promise.allSettled(active);
}

export async function* pollLineMessages(client, options = {}) {
  const handlers = typeof options === "function" ? { onStopped: options } : options;
  const {
    onReconnecting = () => {},
    onRunning = () => {},
    onStopped = () => {},
    sleep = wait,
    signal,
  } = handlers;
  const sync = { revision: 0, globalRev: 0, individualRev: 0 };
  const backoff = [1_000, 2_000, 4_000];
  let retryAttempt = 0;

  while (!signal?.aborted) {
    try {
      const response = await client.base.talk.sync({
        revision: sync.revision,
        globalRev: sync.globalRev,
        individualRev: sync.individualRev,
        limit: 100,
      });
      if (retryAttempt) onRunning();
      retryAttempt = 0;

      if (response.fullSyncResponse?.nextRevision) {
        sync.revision = response.fullSyncResponse.nextRevision;
      }
      if (response.operationResponse?.globalEvents?.lastRevision) {
        sync.globalRev = response.operationResponse.globalEvents.lastRevision;
      }
      if (response.operationResponse?.individualEvents?.lastRevision) {
        sync.individualRev = response.operationResponse.individualEvents.lastRevision;
      }
      for (const event of response.operationResponse?.operations ?? []) {
        sync.revision = event.revision ?? sync.revision;
        if (event.type !== "SEND_MESSAGE" && event.type !== "RECEIVE_MESSAGE") continue;
        yield await client.base.e2ee.decryptE2EEMessage(event.message);
      }
      await sleep(250);
    } catch (error) {
      if (isExpectedPollTimeout(error)) {
        await sleep(250);
        continue;
      }
      if (isAuthenticationError(error) || retryAttempt >= backoff.length) {
        onStopped(error);
        return;
      }
      retryAttempt += 1;
      onReconnecting(error, retryAttempt);
      await sleep(backoff[retryAttempt - 1]);
    }
  }
}
