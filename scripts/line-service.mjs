import { createInterface } from "node:readline";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { FileStorage } from "@jsr/evex__linejs/storage";
import { loginWithAuthToken, loginWithQR } from "@jsr/evex__linejs";

const storagePath = process.argv[process.argv.indexOf("--storage") + 1];
if (!storagePath) throw new Error("Missing --storage path");
await mkdir(dirname(storagePath), { recursive: true });

const emit = (type, payload = {}) => process.stdout.write(`${JSON.stringify({ type, ...payload })}\n`);
const storage = new FileStorage(storagePath);
const tokenPath = `${storagePath}.token`;
let client;
let listening = false;

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

if (client) {
  client.on("message", async (message) => {
    if (message.isMyMessage) return;
    const contentType = message.raw.contentType;
    try {
      if (contentType === 1 || contentType === "IMAGE") {
        const data = await message.getData();
        emit("image", { messageId: message.raw.id, chatId: message.to, mimeType: data.type, data: Buffer.from(await data.arrayBuffer()).toString("base64") });
      } else if (contentType === 0 || contentType === "NONE") {
        emit("text", { messageId: message.raw.id, chatId: message.to, text: message.text });
      }
    } catch (error) { emit("error", { message: error instanceof Error ? error.message : String(error) }); }
  });
  emit("status", { status: "ready" });
}

const input = createInterface({ input: process.stdin });
input.on("line", (line) => {
  if (line.trim() === "start" && client && !listening) {
    client.listen({ talk: true, square: false });
    listening = true;
    emit("status", { status: "running" });
  }
  if (line.trim() === "stop") {
    listening = false;
    input.close();
    process.exit(0);
  }
});

process.on("SIGTERM", () => process.exit(0));
