// One-way release gate for the retired Google Calendar integration.
// Existing imported events and stored credentials are not modified here.
export const GOOGLE_CALENDAR_INTEGRATION_ENABLED = false;

export function googleCalendarRetiredResponse() {
  return Response.json(
    { ok: false, error: "Google Calendar integration is no longer available in Tempo." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
