import { getSupabaseAdmin, loadUserData, saveUserData, handleRouteError, jsonResponse } from "../../../../lib/tempo/google/server";

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) return jsonResponse({ ok: false, error: "Missing userId" }, 400);
    const sb = getSupabaseAdmin();
    await sb.from("google_calendar_tokens").delete().eq("user_id", userId);

    const userData = await loadUserData(userId);
    const settings = {
      ...(userData.settings || {}),
      calendars: (userData.settings?.calendars || []).filter(c => c.source !== "google"),
      hiddenCals: (userData.settings?.hiddenCals || []).filter(id => !String(id).startsWith("google-")),
      googleCalendarSync: { connected: false, disconnectedAt: new Date().toISOString() },
    };
    const events = (userData.events || []).filter(ev => ev.source !== "google");
    await saveUserData(userId, { events, tasks: userData.tasks || [], settings });
    return jsonResponse({ ok: true, connected: false, events, settings });
  } catch (err) {
    return handleRouteError(err);
  }
}
