import { listGoogleCalendars, loadUserData, saveUserData, googleCalendarSettingsFromList, handleRouteError, jsonResponse, rateLimit, requireAuthenticatedUser } from "../../../../lib/tempo/google/server";
import { readJsonBody, sanitizeCalendarPreferencePayload } from "../../../../lib/tempo/validation.js";

export async function GET(request) {
  try {
    await rateLimit(request, { key: "google-calendars", limit: 60, windowMs: 60_000 });
    const user = await requireAuthenticatedUser(request);
    const userId = user.id;
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
    await rateLimit(request, { key: "google-calendar-prefs", limit: 40, windowMs: 60_000 });
    const user = await requireAuthenticatedUser(request);
    const userId = user.id;
    const { calendarId, patch } = sanitizeCalendarPreferencePayload(await readJsonBody(request));

    const userData = await loadUserData(userId);
    const settings = userData.settings || {};
    const calendars = Array.isArray(settings.calendars) ? settings.calendars : [];
    const target = calendars.find(cal => cal.id === calendarId && cal.source === "google");
    if (!target) return jsonResponse({ ok: false, error: "Google calendar not found" }, 404);

    const nextCalendars = calendars.map(cal => {
      if (cal.id !== calendarId || cal.source !== "google") return cal;
      return {
        ...cal,
        visible: patch.visible === undefined ? cal.visible !== false : Boolean(patch.visible),
        syncEnabled: patch.syncEnabled === undefined ? cal.syncEnabled !== false : Boolean(patch.syncEnabled),
        updatedAt: new Date().toISOString(),
      };
    });
    const hidden = new Set(Array.isArray(settings.hiddenCals) ? settings.hiddenCals : []);
    nextCalendars.filter(c => c.source === "google").forEach(cal => {
      if (cal.visible === false) hidden.add(cal.id);
      else hidden.delete(cal.id);
    });
    const nextSettings = { ...settings, calendars: nextCalendars, hiddenCals: [...hidden] };
    await saveUserData(userId, { events: userData.events || [], tasks: userData.tasks || [], settings: nextSettings });
    return jsonResponse({ ok: true, calendars: nextCalendars.filter(c => c.source === "google"), hiddenCals: nextSettings.hiddenCals });
  } catch (err) {
    return handleRouteError(err);
  }
}
