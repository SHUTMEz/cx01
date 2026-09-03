import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { selectCardIdsToClear } from "./clearData.ts";

const card = (id: string, hour: number, minute = 0) => ({
  id,
  createdAt: new Date(2026, 8, 3, hour, minute).getTime(),
});

const cards = [
  card("early", 2),
  card("morning", 8),
  card("afternoon", 14),
  card("night", 20),
];

test("selects all cards", () => {
  assert.deepEqual(selectCardIdsToClear(cards, "all"), ["early", "morning", "afternoon", "night"]);
});

test("selects cards in each named time period", () => {
  assert.deepEqual(selectCardIdsToClear(cards, "morning"), ["morning"]);
  assert.deepEqual(selectCardIdsToClear(cards, "afternoon"), ["afternoon"]);
  assert.deepEqual(selectCardIdsToClear(cards, "night"), ["early", "night"]);
});

test("supports a custom range that crosses midnight", () => {
  assert.deepEqual(selectCardIdsToClear(cards, "custom", "19:00", "03:00"), ["early", "night"]);
});

test("returns no cards for an incomplete custom range", () => {
  assert.deepEqual(selectCardIdsToClear(cards, "custom", "", "03:00"), []);
});
