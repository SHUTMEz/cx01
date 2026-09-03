export function classifyLineMessage(contentType) {
  const normalized = String(contentType).toUpperCase();
  if (contentType === 0 || normalized === "0" || normalized === "NONE" || normalized === "TEXT") return "text";
  if (contentType === 1 || normalized === "1" || normalized === "IMAGE") return "image";
  return null;
}
