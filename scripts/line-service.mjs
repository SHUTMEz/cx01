import { createInterface } from "node:readline";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { FileStorage } from "@jsr/evex__linejs/storage";
import { loginWithAuthToken, loginWithQR, TalkMessage } from "@jsr/evex__linejs";
import { classifyLineMessage, dispatchLineMessages, isAuthenticationError, isImageMimeType, pollLineMessages, shouldCaptureLineMessage } from "./line-message.mjs";

const storagePath = process.argv[process.argv.indexOf("--storage") + 1];
if (!storagePath) throw new Error("Missing --storage path");
await mkdir(dirname(storagePath), { recursive: true });

const emit = (type, payload = {}) => process.stdout.write(`${JSON.stringify({ type, ...payload })}\n`);
const storage = new FileStorage(storagePath);
const tokenPath = `${storagePath}.token`;
let client;
let listening = false;
let captureSequence = 0;
let captureGeneration = 0;

try {
  emit("status", { status: "connecting" });
  let savedToken;
  try { savedToken = (await readFile(tokenPath, "utf8")).trim(); } catch {}
  if (savedToken) {
    try {
      client = await loginWithAuthToken(savedToken, { device: "ANDROIDSECONDARY", storage });
    } catch { savedToken = undefined; }
  }
  if (!savedToken) {
    client = await loginWithQR({
      onReceiveQRUrl: (url) => emit("qr", { url }),
      onPincodeRequest: (pincode) => emit("pincode", { pincode }),
    }, { device: "ANDROIDSECONDARY", storage });
  }
  await writeFile(tokenPath, client.authToken, "utf8");
  const profile = await client.getMyProfile();
  emit("connected", { accountId: profile.mid, accountName: profile.displayName });
} catch (error) {
  emit("error", { message: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
}

const handleMessage = async (message, generation) => {
  if (!listening || generation !== captureGeneration || !shouldCaptureLineMessage(message)) return;
  const contentType = message.raw.contentType;
  const messageId = String(message.raw.id);
  const chatId = String(message.isMyMessage ? message.to.id : message.from.id);
  const sequence = ++captureSequence;
  const receivedAt = Date.now();
  try {
    const messageKind = classifyLineMessage(contentType);
    if (messageKind === "image") {
      emit("image-pending", { messageId, chatId, sequence, receivedAt });
      try {
        const data = await message.getData();
        if (!listening || generation !== captureGeneration) return;
        const mimeType = isImageMimeType(data.type) ? data.type : "image/jpeg";
        emit("image-loaded", { messageId, chatId, sequence, receivedAt, mimeType, data: Buffer.from(await data.arrayBuffer()).toString("base64") });
      } catch (error) {
        if (!listening || generation !== captureGeneration) return;
        emit("image-error", { messageId, chatId, sequence, receivedAt, message: error instanceof Error ? error.message : String(error) });
      }
    } else if (messageKind === "text") {
      emit("text", { messageId, chatId, sequence, receivedAt, text: message.text });
    } else {
      // Some LINE events have a missing/extended content type after E2EE
      // decoding. Keep the capture flow useful for ordinary text messages.
      let recoveredImage = false;
      try {
        const data = await message.getData();
        if (isImageMimeType(data.type)) {
          if (!listening || generation !== captureGeneration) return;
          emit("image-loaded", { messageId, chatId, sequence, receivedAt, mimeType: data.type, data: Buffer.from(await data.arrayBuffer()).toString("base64") });
          recoveredImage = true;
        }
      } catch {
        // Text and non-media events may not expose downloadable data.
      }
      if (recoveredImage) return;
      if (typeof message.text === "string" && message.text.trim()) {
        emit("text", { messageId, chatId, sequence, receivedAt, text: message.text });
      } else {
        emit("log", { message: `Ignored unsupported LINE message type: ${String(contentType)}` });
      }
    }
  } catch (error) { emit("error", { message: error instanceof Error ? error.message : String(error) }); }
};

if (client) emit("status", { status: "ready" });

const input = createInterface({ input: process.stdin });
input.on("line", (line) => {
  if (line.trim() === "start" && client && !listening) {
    listening = true;
    const generation = ++captureGeneration;
    emit("status", { status: "running" });
    void (async () => {
      const messages = pollLineMessages(client, {
        onReconnecting: (_error, attempt) => emit("reconnecting", {
          attempt,
          message: `Connection interrupted. Retry ${attempt} of 3`,
        }),
        onRunning: () => emit("status", { status: "running" }),
        onStopped: (error) => {
          listening = false;
          captureGeneration += 1;
          emit("error", {
            message: isAuthenticationError(error)
              ? "LINE session expired. Please login again."
              : "LINE connection failed after 3 retries.",
          });
          emit("stopped");
        },
      });
      await dispatchLineMessages(messages, async (raw) => {
        await handleMessage(new TalkMessage({ raw, client }), generation);
      }, (error) => emit("error", { message: error instanceof Error ? error.message : String(error) }));
    })().catch((error) => emit("error", { message: error instanceof Error ? error.message : String(error) }));
  }
  if (line.trim() === "stop") {
    listening = false;
    captureGeneration += 1;
    input.close();
    process.exit(0);
  }
});

process.on("SIGTERM", () => process.exit(0));
