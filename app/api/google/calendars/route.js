import { listGoogleCalendars, loadUserData, saveUserData, googleCalendarSettingsFromList, handleRouteError, jsonResponse } from "../../../../lib/tempo/google/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return jsonResponse({ ok: false, error: "Missing userId" }, 400);
    const items = await listGoogleCalendars(userId);
    const userData = await loadUserData(userId);
    const settings = googleCalendarSettingsFromList(userData.settings || {}, items);
    await saveUserData(userId, { events: userData.events || [], tasks: userData.tasks || [], settings });
    return jsonResponse({ ok: true, calendars: settings.calendars.filter(c => c.source === "google"), hiddenCals: settings.hiddenCals || [] });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request) {
  try {
    const { userId, calendarId, patch = {} } = await request.json();
    if (!userId || !calendarId) return jsonResponse({ ok: false, error: "Missing userId/calendarId" }, 400);
    const userData = await loadUserData(userId);
    const settings = userData.settings || {};
    const calendars = (settings.calendars || []).map(cal => {
      if (cal.id !== calendarId) return cal;
      return {
        ...cal,
        visible: patch.visible === undefined ? cal.visible !== false : Boolean(patch.visible),
        syncEnabled: patch.syncEnabled === undefined ? cal.syncEnabled !== false : Boolean(patch.syncEnabled),
        updatedAt: new Date().toISOString(),
      };
    });
    const hidden = new Set(Array.isArray(settings.hiddenCals) ? settings.hiddenCals : []);
    calendars.filter(c => c.source === "google").forEach(cal => {
      if (cal.visible === false) hidden.add(cal.id);
      else hidden.delete(cal.id);
    });
    const nextSettings = { ...settings, calendars, hiddenCals: [...hidden] };
    await saveUserData(userId, { events: userData.events || [], tasks: userData.tasks || [], settings: nextSettings });
    return jsonResponse({ ok: true, calendars: calendars.filter(c => c.source === "google"), hiddenCals: nextSettings.hiddenCals });
  } catch (err) {
    return handleRouteError(err);
  }
}
