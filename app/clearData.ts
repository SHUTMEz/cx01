export type ClearDataTarget = "all" | "morning" | "afternoon" | "night" | "custom";

type CardTimestamp = {
  id: string;
  createdAt: number;
};

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export function selectCardIdsToClear(
  cards: CardTimestamp[],
  target: ClearDataTarget,
  customStart = "",
  customEnd = "",
) {
  if (target === "all") return cards.map((card) => card.id);
  if (target === "custom" && (!customStart || !customEnd)) return [];

  return cards.filter((card) => {
    const date = new Date(card.createdAt);
    const cardMinutes = date.getHours() * 60 + date.getMinutes();
    if (target === "morning") return cardMinutes >= 6 * 60 && cardMinutes < 12 * 60;
    if (target === "afternoon") return cardMinutes >= 12 * 60 && cardMinutes < 18 * 60;
    if (target === "night") return cardMinutes >= 18 * 60 || cardMinutes < 6 * 60;
    const start = minutes(customStart);
    const end = minutes(customEnd);
    return start <= end
      ? cardMinutes >= start && cardMinutes <= end
      : cardMinutes >= start || cardMinutes <= end;
  }).map((card) => card.id);
}
