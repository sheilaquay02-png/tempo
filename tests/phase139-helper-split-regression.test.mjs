import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("components/TempoApp.jsx", "utf8");
const ritualUtilsSource = readFileSync("utils/ritualUtils.js", "utf8");
const deletedRecordsUtilsSource = readFileSync("utils/deletedRecordsUtils.js", "utf8");

test("legacy ritual normalization helpers are split out of TempoApp", () => {
  assert.match(appSource, /from "\.\.\/utils\/ritualUtils"/);
  assert.doesNotMatch(appSource, /function normalizeRitual\(/);
  assert.doesNotMatch(appSource, /function normalizeRitualCompletions\(/);
  assert.match(ritualUtilsSource, /export function normalizeRitual\(/);
  assert.match(ritualUtilsSource, /export function normalizeRituals\(/);
  assert.match(ritualUtilsSource, /export function normalizeRitualCompletions\(/);
});

test("deleted-record and settings timestamp helpers are split out of TempoApp", () => {
  assert.match(appSource, /from "\.\.\/utils\/deletedRecordsUtils"/);
  assert.doesNotMatch(appSource, /function normalizeDeletedRecords\(/);
  assert.doesNotMatch(appSource, /function addDeletedRecords\(/);
  assert.match(deletedRecordsUtilsSource, /export function normalizeSettingsUpdatedAt\(/);
  assert.match(deletedRecordsUtilsSource, /export function normalizeDeletedRecords\(/);
  assert.match(deletedRecordsUtilsSource, /export function addDeletedRecords\(/);
});
