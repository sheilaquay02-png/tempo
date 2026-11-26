import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { archiveImportedGoogleEvents } from "../utils/retiredGoogleCalendar.js";
import { mergeTempoData } from "../lib/tempo/core.js";

const T0 = "2026-11-20T10:00:00.000Z";
const calendars = [
  { id: "personal", source: "tempo" },
  { id: "google-work", source: "google" },
];
const ev = (id, extra = {}) => ({ id, title: id, calendar: "personal", start: "2026-11-27T01:00:00.000Z", end: "2026-11-27T02:00:00.000Z", updatedAt: T0, ...extra });
const events = [
  ev("tempo-1"),
  ev("tempo-2"),
  ev("g-1", { source: "google" }),
  ev("g-2", { externalSource: "google_calendar" }),
  ev("gcal-3"),
  ev("g-4", { calendar: "google-work" }),
];

test("removes every imported Google event, keeps Tempo events, and records deletion markers", () => {
  const now = "2026-11-26T09:00:00.000Z";
  const out = archiveImportedGoogleEvents(events, calendars, {}, now);
  assert.deepEqual(out.events.map(e => e.id), ["tempo-1", "tempo-2"]);
  assert.deepEqual(out.removedIds.sort(), ["g-1", "g-2", "g-4", "gcal-3"]);
  for (const id of out.removedIds) assert.equal(out.deletedRecords.events[id], now);
  assert.equal(events.length, 6, "input list is not modified");
});

test("does nothing (same references) when there are no Google events left", () => {
  const clean = [ev("tempo-1")];
  const markers = { events: { old: T0 } };
  const out = archiveImportedGoogleEvents(clean, calendars, markers, "2026-11-26T09:00:00.000Z");
  assert.equal(out.events, clean);
  assert.equal(out.deletedRecords, markers);
  assert.equal(out.removedIds.length, 0);
});

test("an older device still holding Google events cannot bring them back when syncing", () => {
  const now = "2026-11-26T09:00:00.000Z";
  const cleaned = archiveImportedGoogleEvents(events, calendars, {}, now);
  const cloud = { events: cleaned.events, tasks: [], settings: { deletedRecords: cleaned.deletedRecords, calendars }, updated_at: now };
  const oldDevice = { events, tasks: [], settings: { calendars }, updated_at: T0 };
  const merged = mergeTempoData(cloud, oldDevice);
  assert.deepEqual(merged.events.map(e => e.id).sort(), ["tempo-1", "tempo-2"]);
  // and the other way round (old device's merge of the cleaned cloud row)
  const mergedReverse = mergeTempoData(oldDevice, cloud);
  assert.deepEqual(mergedReverse.events.map(e => e.id).sort(), ["tempo-1", "tempo-2"]);
});

test("a Tempo event edited on another device is kept after the clean-up", () => {
  const now = "2026-11-26T09:00:00.000Z";
  const cleaned = archiveImportedGoogleEvents(events, calendars, {}, now);
  const cloud = { events: cleaned.events, tasks: [], settings: { deletedRecords: cleaned.deletedRecords, calendars }, updated_at: now };
  const phone = { events: events.map(e => (e.id === "tempo-2" ? { ...e, title: "Edited on phone", updatedAt: "2026-11-26T09:05:00.000Z" } : e)), tasks: [], settings: { calendars }, updated_at: "2026-11-26T09:05:00.000Z" };
  const merged = mergeTempoData(cloud, phone);
  assert.equal(merged.events.find(e => e.id === "tempo-2").title, "Edited on phone");
  assert.equal(merged.events.length, 2);
});

test("the app runs the clean-up as a self-checking effect, not a version-gated migration", () => {
  const app = readFileSync("components/TempoApp.jsx", "utf8");
  assert.match(app, /archiveImportedGoogleEvents\(events, calendars, normalizeDeletedRecords\(deletedRecords\), now\)/);
  assert.match(app, /if \(!events\.some\(e => isGoogleEventReference\(e, calendars\)\)\) return;/);
  assert.match(app, /queueCloudSave\(cleanup\.events, tasks, currentSettings\(\{ deletedRecords: cleanup\.deletedRecords/);
  assert.match(app, /\}, \[auth\.user\?\.id, dataReady, events, calendars\]\);/);
});
