export function classifyLineMessage(contentType) {
  const normalized = String(contentType).toUpperCase();
  if (contentType === 0 || normalized === "0" || normalized === "NONE" || normalized === "TEXT") return "text";
  if (contentType === 1 || contentType === 21 || normalized === "1" || normalized === "IMAGE" || normalized === "EXTIMAGE") return "image";
  return null;
}

export function isImageMimeType(mimeType) {
  return typeof mimeType === "string" && mimeType.toLowerCase().startsWith("image/");
}

// A secondary-device self-bot receives messages sent by the logged-in account
// with isMyMessage=true. Those events are the primary capture source.
export function shouldCaptureLineMessage(message) {
  return Boolean(message);
}
