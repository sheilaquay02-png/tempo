import crypto from "crypto";
import { googleAllDayRangeToUtc, normalizeTimeZone, safeDate } from "../dateTime.js";

const GOOGLE_COLOR_FALLBACKS = ["#FF7BAC", "#B08AE0", "#70C8A0", "#A0C8E0", "#FFB870", "#C060A0"];

function shortHash(value, len = 12) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, len);
}

export function tempoGoogleCalendarId(googleCalendarId) {
  const slug = String(googleCalendarId || "google")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 38) || "google";
  return `google-${slug}-${shortHash(googleCalendarId, 8)}`;
}

export function tempoGoogleEventId(googleCalendarId, googleEventId) {
  return `gcal-${shortHash(`${googleCalendarId}:${googleEventId}`, 20)}`;
}

export function googleEventStableKey(item = {}) {
  const recurringId = item.recurringEventId || "";
  const originalStart = item.originalStartTime?.dateTime || item.originalStartTime?.date || "";
  if (recurringId && originalStart) return `${recurringId}:${originalStart}`;
  return item.id || "";
}

function googleCalendarColor(item, index) {
  return item.backgroundColor || item.foregroundColor || GOOGLE_COLOR_FALLBACKS[index % GOOGLE_COLOR_FALLBACKS.length];
}

export function mapGoogleCalendar(item, index = 0, existing = null) {
  const id = tempoGoogleCalendarId(item.id);
  const accessRole = item.accessRole || "reader";
  const readOnly = ["reader", "freeBusyReader"].includes(accessRole);
  return {
    ...(existing || {}),
    id,
    name: item.summaryOverride || item.summary || existing?.name || "Google Calendar",
    color: existing?.color || googleCalendarColor(item, index),
    account: "Google",
    source: "google",
    googleCalendarId: item.id,
    readOnly,
    visible: existing?.visible ?? !item.hidden,
    syncEnabled: existing?.syncEnabled ?? true,
    googleAccessRole: accessRole,
    googlePrimary: Boolean(item.primary),
    googleSummaryOverride: item.summaryOverride || null,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
}

function isDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function assertValidDate(date, label = "date") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    const err = new Error(`Invalid Google event ${label}`);
    err.status = 400;
    throw err;
  }
  return date;
}

function parseGoogleDate(value, fallback = null, { timeZone = "Asia/Singapore", allDay = false } = {}) {
  if (!value) return fallback ? safeDate(fallback, null) : null;
  if (allDay || isDateOnly(value)) return googleAllDayRangeToUtc(value, null, timeZone).start;
  return assertValidDate(safeDate(value, null), "dateTime");
}

function cleanGoogleText(value = "", max = 1600) {
  const text = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function googleEventTitle(item = {}) {
  const summary = cleanGoogleText(item.summary || "", 180);
  if (summary) return summary;
  const location = cleanGoogleText(item.location || "", 80);
  if (location) return `Google event at ${location}`;
  return "Untitled Google event";
}

export function googleEventTempoId(item, calendar) {
  return tempoGoogleEventId(calendar.googleCalendarId, googleEventStableKey(item));
}

export function mapGoogleEvent(item, calendar, { timeZone = "Asia/Singapore" } = {}) {
  if (!item?.id) {
    const err = new Error("Google event is missing an id");
    err.status = 400;
    throw err;
  }
  const safeTimeZone = normalizeTimeZone(timeZone);
  if (item.status === "cancelled" && !item.start && !item.end) {
    return {
      id: googleEventTempoId(item, calendar),
      source: "google",
      externalSource: "google_calendar",
      googleEventId: item.id,
      googleStableKey: googleEventStableKey(item),
      googleCalendarId: calendar.googleCalendarId,
      googleStatus: "cancelled",
      deletedAt: item.updated || new Date().toISOString(),
      updatedAt: item.updated || new Date().toISOString(),
    };
  }

  const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
  let start;
  let end;
  let googleAllDayStartKey = null;
  let googleAllDayEndExclusive = null;
  if (isAllDay) {
    const range = googleAllDayRangeToUtc(item.start?.date, item.end?.date, safeTimeZone);
    start = range.start;
    end = range.end;
    googleAllDayStartKey = range.startKey;
    googleAllDayEndExclusive = range.endExclusiveKey;
  } else {
    start = parseGoogleDate(item.start?.dateTime || item.start?.date, null, { timeZone: safeTimeZone, allDay: false });
    end = parseGoogleDate(item.end?.dateTime || item.end?.date, null, { timeZone: safeTimeZone, allDay: false });
  }
  if (!start) {
    const err = new Error("Google event is missing a start date");
    err.status = 422;
    throw err;
  }
  if (!end || end <= start) {
    end = isAllDay ? googleAllDayRangeToUtc(googleAllDayStartKey, null, safeTimeZone).end : new Date(start.getTime() + 30 * 60000);
  }

  return {
    id: googleEventTempoId(item, calendar),
    title: googleEventTitle(item),
    start,
    end,
    allDay: isAllDay,
    calendar: calendar.id,
    category: "meeting",
    fixed: true,
    color: calendar.color || null,
    notes: cleanGoogleText(item.description || item.location || "", 1600),
    location: cleanGoogleText(item.location || "", 240),
    recurrence: null,
    reminder: { type: "none" },
    source: "google",
    externalSource: "google_calendar",
    googleEventId: item.id,
    googleStableKey: googleEventStableKey(item),
    googleRecurringEventId: item.recurringEventId || null,
    googleOriginalStartTime: item.originalStartTime || null,
    googleCalendarId: calendar.googleCalendarId,
    googleHtmlLink: item.htmlLink || "",
    googleICalUID: item.iCalUID || null,
    googleSequence: item.sequence ?? null,
    googleUpdatedAt: item.updated || null,
    googleStatus: item.status || "confirmed",
    googleAllDayStartKey: isAllDay ? googleAllDayStartKey : null,
    googleAllDayEndExclusive: isAllDay ? googleAllDayEndExclusive : null,
    googleTimeZone: safeTimeZone,
    readOnly: true,
    createdAt: item.created || new Date().toISOString(),
    updatedAt: item.updated || new Date().toISOString(),
  };
}

function reviveEventForServer(ev) {
  const revive = v => v?.__d ? new Date(v.__d) : v;
  return { ...ev, start: revive(ev.start), end: revive(ev.end) };
}

function eventOverlapsWindow(ev, syncWindow = {}) {
  const start = ev?.start instanceof Date ? ev.start : new Date(ev?.start?.__d ?? ev?.start);
  const end = ev?.end instanceof Date ? ev.end : new Date(ev?.end?.__d ?? ev?.end);
  const min = syncWindow.timeMin ? new Date(syncWindow.timeMin) : null;
  const max = syncWindow.timeMax ? new Date(syncWindow.timeMax) : null;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  if (min && end <= min) return false;
  if (max && start >= max) return false;
  return true;
}

export function mergeGoogleImport({ existingEvents = [], googleEvents = [], cancelledIds = new Set(), seenIds = new Set(), syncedCalendarIds = new Set(), syncWindow = null } = {}) {
  const now = new Date().toISOString();
  const byId = new Map((Array.isArray(existingEvents) ? existingEvents : []).map(ev => [ev.id, reviveEventForServer(ev)]));

  cancelledIds.forEach(id => {
    const existing = byId.get(id);
    if (existing?.source === "google") byId.set(id, { ...existing, deletedAt: existing.deletedAt || now, updatedAt: now, googleStatus: "cancelled" });
  });

  googleEvents.forEach(ev => {
    const prev = byId.get(ev.id);
    if (prev?.source && prev.source !== "google") return;
    const protectedLocalFields = prev?.source === "google" ? { createdAt: prev.createdAt || ev.createdAt } : {};
    byId.set(ev.id, { ...(prev || {}), ...ev, ...protectedLocalFields, source: "google", externalSource: "google_calendar", readOnly: true, deletedAt: null, updatedAt: ev.updatedAt || now, lastImportedAt: now });
  });

  if (syncWindow && syncedCalendarIds?.size && seenIds?.size) {
    byId.forEach((ev, id) => {
      if (ev?.source !== "google" || ev.deletedAt) return;
      if (!syncedCalendarIds.has(ev.googleCalendarId)) return;
      if (seenIds.has(id)) return;
      if (!eventOverlapsWindow(ev, syncWindow)) return;
      byId.set(id, { ...ev, deletedAt: now, updatedAt: now, googleStatus: "missing_from_sync" });
    });
  }
  return [...byId.values()];
}

export function googleCalendarSettingsFromList(existingSettings = {}, googleItems = []) {
  const existingCalendars = Array.isArray(existingSettings.calendars) ? existingSettings.calendars : [];
  const existingByGoogleId = new Map(existingCalendars.filter(c => c.source === "google" && c.googleCalendarId).map(c => [c.googleCalendarId, c]));
  const googleCalendars = googleItems.map((item, i) => mapGoogleCalendar(item, i, existingByGoogleId.get(item.id)));
  const tempoCalendars = existingCalendars.filter(c => c.source !== "google");
  const calendars = [...tempoCalendars, ...googleCalendars];
  const validCalendarIds = new Set(calendars.map(cal => cal.id));
  const hidden = new Set((Array.isArray(existingSettings.hiddenCals) ? existingSettings.hiddenCals : []).filter(id => validCalendarIds.has(id)));
  googleCalendars.forEach(cal => {
    if (cal.visible === false) hidden.add(cal.id);
    else hidden.delete(cal.id);
  });
  return {
    ...existingSettings,
    calendars,
    hiddenCals: [...hidden],
    googleCalendarSync: {
      ...(existingSettings.googleCalendarSync || {}),
      connected: true,
      lastCalendarRefreshAt: new Date().toISOString(),
    },
  };
}
