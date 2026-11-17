import { GOOGLE_CALENDAR_INTEGRATION_ENABLED, googleCalendarRetiredResponse } from "../../../../lib/tempo/google/retiredRoute";
import { getValidGoogleToken, listGoogleCalendars, loadUserData, googleCalendarSettingsFromList, saveUserData, handleRouteError, jsonResponse, rateLimit, requireAuthenticatedUser } from "../../../../lib/tempo/google/server";

export async function GET(request) {
  if (!GOOGLE_CALENDAR_INTEGRATION_ENABLED) return googleCalendarRetiredResponse();
  try {
    await rateLimit(request, { key: "google-status", limit: 60, windowMs: 60_000 });
    const user = await requireAuthenticatedUser(request);
    const userId = user.id;
    const token = await getValidGoogleToken(userId);
    if (!token) return jsonResponse({ ok: true, connected: false, calendars: [] });

    const calendarItems = await listGoogleCalendars(userId);
    const userData = await loadUserData(userId);
    const settings = googleCalendarSettingsFromList(userData.settings || {}, calendarItems);
    await saveUserData(userId, { events: userData.events || [], tasks: userData.tasks || [], settings });

    return jsonResponse({
      ok: true,
      connected: true,
      calendars: settings.calendars.filter(c => c.source === "google"),
      hiddenCals: settings.hiddenCals || [],
      lastCalendarRefreshAt: settings.googleCalendarSync?.lastCalendarRefreshAt || null,
      googleCalendarSync: settings.googleCalendarSync || null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
