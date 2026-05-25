import { getSupabaseAdmin, loadUserData, saveUserData, handleRouteError, jsonResponse, rateLimit, requireAuthenticatedUser } from "../../../../lib/tempo/google/server";

export async function POST(request) {
  try {
    await rateLimit(request, { key: "google-disconnect", limit: 10, windowMs: 60_000 });
    const user = await requireAuthenticatedUser(request);
    const userId = user.id;
    const sb = getSupabaseAdmin();
    await sb.from("google_calendar_tokens").delete().eq("user_id", userId);
    try {
      await sb.from("google_calendar_sync_state").delete().eq("user_id", userId);
    } catch {
      // Older deployments may not have the optional Phase 96-100 sync-state table yet.
    }

    const userData = await loadUserData(userId);
    const googleCalendars = (userData.settings?.calendars || []).filter(c => c.source === "google");
    const googleTempoCalendarIds = new Set(googleCalendars.map(c => c.id));
    const googleExternalCalendarIds = new Set(googleCalendars.map(c => c.googleCalendarId).filter(Boolean));
    const settings = {
      ...(userData.settings || {}),
      calendars: (userData.settings?.calendars || []).filter(c => c.source !== "google"),
      hiddenCals: (userData.settings?.hiddenCals || []).filter(id => !googleTempoCalendarIds.has(id)),
      googleCalendarSync: { connected: false, disconnectedAt: new Date().toISOString() },
    };
    const events = (userData.events || []).filter(ev => {
      if (ev?.source !== "google") return true;
      return !(googleExternalCalendarIds.has(ev.googleCalendarId) || ev.externalSource === "google_calendar" || String(ev.id || "").startsWith("gcal-"));
    });
    await saveUserData(userId, { events, tasks: userData.tasks || [], settings });
    return jsonResponse({ ok: true, connected: false, events, settings });
  } catch (err) {
    return handleRouteError(err);
  }
}
