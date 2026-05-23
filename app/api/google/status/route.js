import { getValidGoogleToken, listGoogleCalendars, loadUserData, googleCalendarSettingsFromList, saveUserData, handleRouteError, jsonResponse } from "../../../../lib/tempo/google/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return jsonResponse({ ok: false, error: "Missing userId" }, 400);
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
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
