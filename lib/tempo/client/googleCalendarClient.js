// Browser-side Google Calendar client helpers.
// Extracted from TempoApp so the app component only owns React state updates.

import { normalizeCalendars, reviveEvents } from "../core.js";

export function mergeGoogleCalendarsLocal(googleCalendars = [], baseCalendars = []) {
  const nonGoogle = normalizeCalendars(baseCalendars).filter(cal => cal.source !== "google");
  return normalizeCalendars([...nonGoogle, ...googleCalendars]);
}

export function deriveGoogleCalendarPayloadState(payload = {}, { calendars = [], prevGoogleSync = {} } = {}) {
  let nextCalendars = calendars;
  const googleCalendars = Array.isArray(payload.calendars) ? payload.calendars : [];
  const shouldUpdateCalendars = Boolean(googleCalendars.length || payload.connected === false);
  if (shouldUpdateCalendars) {
    nextCalendars = payload.calendars?.some?.(cal => cal.source !== "google")
      ? normalizeCalendars(payload.calendars)
      : mergeGoogleCalendarsLocal(googleCalendars, calendars);
  }
  const nextGoogleCalendars = normalizeCalendars(nextCalendars).filter(cal => cal.source === "google");
  return {
    shouldUpdateCalendars,
    nextCalendars,
    hiddenCals: Array.isArray(payload.hiddenCals) ? payload.hiddenCals : null,
    events: Array.isArray(payload.events) ? reviveEvents(payload.events) : null,
    googleSync: {
      ...prevGoogleSync,
      connected: payload.connected ?? (payload.ok ? true : prevGoogleSync.connected),
      calendars: nextGoogleCalendars,
      lastImportAt: payload.googleCalendarSync?.lastImportAt || payload.lastImportAt || prevGoogleSync.lastImportAt,
      googleCalendarSync: payload.googleCalendarSync || prevGoogleSync.googleCalendarSync || null,
      message: payload.message || prevGoogleSync.message,
      error: "",
      loading: false,
    },
  };
}

export async function googleCalendarRequest(getSupabase, path, options = {}) {
  const sb = await getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Sign in again before using Google Calendar.");
  const res = await fetch(`/api/google/${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Google Calendar request failed (${res.status})`);
  return data;
}

export function countImportedGoogleEvents(events = []) {
  return (Array.isArray(events) ? events : []).filter(ev => ev?.source === "google" || ev?.externalSource === "google_calendar").length;
}

export function googleDisconnectWarning(importedCount = 0) {
  const count = Number(importedCount || 0);
  return `Disconnect Google Calendar from Tempo?\n\nThis removes ${count} imported Google reference event${count === 1 ? "" : "s"} from Tempo. It will not delete anything from Google Calendar.`;
}

export function formatGoogleImportToast(data = {}) {
  const imported = Number(data.imported || 0);
  const skipped = Number(data.skipped || 0);
  return `Imported ${imported} Google event${imported === 1 ? "" : "s"}${skipped ? ` · skipped ${skipped} unsupported` : ""} ✓`;
}
