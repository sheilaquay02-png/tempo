// Preserve imported Google records in storage while excluding them from Tempo's active calendar.
// This retirement filter never writes, modifies, or deletes saved data.
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
