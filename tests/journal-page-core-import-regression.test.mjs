import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const journalSource = readFileSync("components/journal/Journal.jsx", "utf8");

test("Journal page imports game summary helper after split", () => {
  assert.match(journalSource, /dailyGameSummary/);
  assert.match(journalSource, /const\s*\{[\s\S]*dailyGameSummary[\s\S]*\}\s*=\s*Core/);
});
