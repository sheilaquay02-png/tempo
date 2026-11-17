import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  activeTempoCalendars,
  activeTempoEvents,
  isGoogleEventReference,
} from "../utils/retiredGoogleCalendar.js";
import {
  GOOGLE_CALENDAR_INTEGRATION_ENABLED,
  googleCalendarRetiredResponse,
} from "../lib/tempo/google/retiredRoute.js";

const tempoApp = readFileSync("components/TempoApp.jsx", "utf8");
const settings = readFileSync("components/settings/SettingsPanel.jsx", "utf8");
const endpoints = [
  "app/api/google/auth/callback/route.js",
  "app/api/google/auth/start/route.js",
  "app/api/google/calendars/route.js",
  "app/api/google/disconnect/route.js",
  "app/api/google/status/route.js",
  "app/api/google/sync/route.js",
  "app/api/google/webhook/route.js",
];

test("Retired Google Calendar endpoints reject requests before touching tokens or user data", async () => {
  assert.equal(GOOGLE_CALENDAR_INTEGRATION_ENABLED, false);
  const response = googleCalendarRetiredResponse();
  assert.equal(response.status, 410);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match((await response.json()).error, /no longer available/i);
  for (const path of endpoints) {
    const source = readFileSync(path, "utf8");
    const handlers = [...source.matchAll(/export async function (?:GET|POST|PUT|DELETE|PATCH)\(request\) \{/g)];
    const gates = [...source.matchAll(/if \(!GOOGLE_CALENDAR_INTEGRATION_ENABLED\) return googleCalendarRetiredResponse\(\);/g)];
    assert.ok(handlers.length, path + " must expose at least one handler");
    assert.equal(gates.length, handlers.length, path + " must gate every handler");
  }
});

test("Tempo does not call Google at startup or expose its connection controls", () => {
  assert.doesNotMatch(tempoApp, /refreshGoogleCalendarStatus|googleCalendarRequest\(|onGoogleConnect=|onGoogleSyncNow=/);
  assert.doesNotMatch(settings, /Google Calendar Sync|Connect Google Calendar|Import Google events|onGoogleDisconnect/);
  assert.match(tempoApp, /activeTempoEvents\(events, calendars\)/);
  assert.match(tempoApp, /calendars=\{displayCalendars\}/);
});

test("Legacy Google events and calendars are hidden from active views, without mutating saved records", () => {
  const calendars = [
    { id: "personal", source: "tempo", name: "Personal" },
    { id: "google-cal-1", source: "google", name: "Old Google Calendar" },
  ];
  const events = [
    { id: "tempo-1", source: "tempo", calendar: "personal", title: "Tempo meeting" },
    { id: "google-1", source: "google", calendar: "google-cal-1", title: "Imported reference" },
    { id: "google-2", externalSource: "google_calendar", calendar: "personal" },
    { id: "gcal-3", calendar: "personal" },
    { id: "google-4", calendar: "google-cal-1" },
  ];
  const original = JSON.stringify({ calendars, events });
  assert.deepEqual(activeTempoCalendars(calendars).map(x => x.id), ["personal"]);
  assert.deepEqual(activeTempoEvents(events, calendars).map(x => x.id), ["tempo-1"]);
  assert.equal(isGoogleEventReference(events[4], calendars), true);
  assert.equal(JSON.stringify({ calendars, events }), original, "Filtering must not delete or mutate saved records");
});
