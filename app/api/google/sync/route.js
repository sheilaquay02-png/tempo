import {
  listGoogleCalendars,
  loadUserData,
  saveUserData,
  googleCalendarSettingsFromList,
  listGoogleEvents,
  mapGoogleEvent,
  mergeGoogleImport,
  handleRouteError,
  jsonResponse,
  rateLimit,
  requireAuthenticatedUser,
  validateGoogleSyncWindow,
} from "../../../../lib/tempo/google/server";

export async function POST(request) {
  try {
    rateLimit(request, { key: "google-sync", limit: 12, windowMs: 60_000 });
    const user = await requireAuthenticatedUser(request);
    const userId = user.id;
    const { timeMin, timeMax } = await request.json().catch(() => ({}));
    const syncWindow = validateGoogleSyncWindow({ timeMin, timeMax });

    const calendarItems = await listGoogleCalendars(userId);
    const userData = await loadUserData(userId);
    const settings = googleCalendarSettingsFromList(userData.settings || {}, calendarItems);
    const googleCalendars = settings.calendars.filter(c => c.source === "google" && c.syncEnabled !== false);

    const imported = [];
    const cancelled = new Set();

    for (const calendar of googleCalendars) {
      const googleEvents = await listGoogleEvents(userId, calendar.googleCalendarId, syncWindow);
      for (const item of googleEvents) {
        if (!item?.id) continue;
        const mapped = mapGoogleEvent(item, calendar);
        if (item.status === "cancelled") cancelled.add(mapped.id);
        else imported.push(mapped);
      }
    }

    const events = mergeGoogleImport({
      existingEvents: userData.events || [],
      googleEvents: imported,
      cancelledIds: cancelled,
    });

    const nextSettings = {
      ...settings,
      googleCalendarSync: {
        ...(settings.googleCalendarSync || {}),
        connected: true,
        lastImportAt: new Date().toISOString(),
        importedCount: imported.length,
        cancelledCount: cancelled.size,
        mode: "import-first",
        timeMin: syncWindow.timeMin,
        timeMax: syncWindow.timeMax,
      },
    };

    await saveUserData(userId, { events, tasks: userData.tasks || [], settings: nextSettings });
    return jsonResponse({
      ok: true,
      mode: "import-first",
      imported: imported.length,
      cancelled: cancelled.size,
      events,
      calendars: nextSettings.calendars,
      hiddenCals: nextSettings.hiddenCals || [],
      googleCalendarSync: nextSettings.googleCalendarSync,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
