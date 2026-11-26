import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  activeTempoCalendars,
  activeTempoEvents,
  isGoogleEventReference,
} from "../utils/retiredGoogleCalendar.js";

const tempoApp = readFileSync("components/TempoApp.jsx", "utf8");
const settings = readFileSync("components/settings/SettingsPanel.jsx", "utf8");
test("Google Calendar server routes and helpers are deleted", () => {
  for (const path of ["app/api/google", "lib/tempo/google", "lib/tempo/client/googleCalendarClient.js"]) {
    assert.equal(existsSync(path), false, path + " should stay removed");
  }
});

test("Tempo does not call Google at startup or expose its connection controls", () => {
  assert.doesNotMatch(tempoApp, /refreshGoogleCalendarStatus|googleCalendarRequest\(|onGoogleConnect=|onGoogleSyncNow=/);
  assert.doesNotMatch(settings, /Google Calendar Sync|Connect Google Calendar|Import Google events|onGoogleDisconnect/);
  assert.match(tempoApp, /activeTempoEvents\(events, calendars\)/);
  assert.match(tempoApp, /return expandRecurring\(activeTempoEvents\(events, calendars\), dayStart\(candidate\.start\)/, "conflict warnings must ignore hidden Google events");
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
