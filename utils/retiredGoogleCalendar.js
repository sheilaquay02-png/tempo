import { addDeletedRecords } from "./deletedRecordsUtils.js";

// Imported Google records are excluded from Tempo's active calendar by the
// filters below, which never modify data. archiveImportedGoogleEvents (at the
// end) removes them from saved data for good, with deletion markers.
export const isGoogleCalendarReference = calendar => calendar?.source === "google";

export function isGoogleEventReference(event, calendars = []) {
  if (!event) return false;
  if (event.source === "google" || event.externalSource === "google_calendar") return true;
  if (String(event.id || "").startsWith("gcal-")) return true;
  return Array.isArray(calendars) && calendars.some(calendar =>
    calendar?.id === event.calendar && isGoogleCalendarReference(calendar)
  );
}

export const activeTempoCalendars = (calendars = []) =>
  (Array.isArray(calendars) ? calendars : []).filter(calendar => !isGoogleCalendarReference(calendar));

export const activeTempoEvents = (events = [], calendars = []) =>
  (Array.isArray(events) ? events : []).filter(event => !isGoogleEventReference(event, calendars));

// Phase 1 clean-up: remove imported Google events from saved data for good.
// They have been hidden since the Google integration was retired; keeping them
// made every sync about twice as large. Each removed event gets a deletion
// marker so a device holding an older copy cannot bring it back when merging.
// Returns the input unchanged (same references) when there is nothing to remove.
export function archiveImportedGoogleEvents(events = [], calendars = [], deletedRecords = {}, timestamp = new Date().toISOString()) {
  const list = Array.isArray(events) ? events : [];
  const removedIds = [];
  const kept = [];
  for (const event of list) {
    if (isGoogleEventReference(event, calendars)) {
      if (event?.id) removedIds.push(event.id);
    } else {
      kept.push(event);
    }
  }
  if (kept.length === list.length) return { events, deletedRecords, removedIds: [] };
  return {
    events: kept,
    deletedRecords: addDeletedRecords(deletedRecords, "events", removedIds, timestamp),
    removedIds,
  };
}
