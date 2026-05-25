import {
  findGoogleSyncStateByChannel,
  jsonResponse,
  markGoogleWebhookSeen,
  rateLimit,
  syncGoogleCalendarsForUser,
} from "../../../../lib/tempo/google/server";

export async function POST(request) {
  try {
    await rateLimit(request, { key: "google-webhook", limit: 120, windowMs: 60_000 });
    const expectedToken = process.env.GOOGLE_WEBHOOK_TOKEN || process.env.TEMPO_GOOGLE_WEBHOOK_TOKEN || "";
    const receivedToken = request.headers.get("x-goog-channel-token") || "";
    if (expectedToken && receivedToken !== expectedToken) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const channelId = request.headers.get("x-goog-channel-id") || "";
    const resourceId = request.headers.get("x-goog-resource-id") || "";
    const resourceState = request.headers.get("x-goog-resource-state") || "";
    const messageNumber = request.headers.get("x-goog-message-number") || "";

    // Do not trigger server-side sync unless a webhook token is configured and
    // the channel is already mapped to a user/calendar in the server-only sync table.
    if (!expectedToken || !channelId) {
      return jsonResponse({ ok: true, received: true, syncTriggered: false, reason: expectedToken ? "missing_channel" : "webhook_token_not_configured" });
    }

    const found = await findGoogleSyncStateByChannel({ channelId, resourceId });
    if (!found.tableAvailable) {
      return jsonResponse({ ok: true, received: true, syncTriggered: false, reason: "sync_state_table_missing" });
    }
    if (!found.state?.user_id || !found.state?.google_calendar_id) {
      return jsonResponse({ ok: true, received: true, syncTriggered: false, reason: "unknown_channel" });
    }

    await markGoogleWebhookSeen(found.state.user_id, found.state.google_calendar_id, { channelId, resourceId, resourceState, messageNumber });
    const payload = await syncGoogleCalendarsForUser(found.state.user_id, {
      mode: "webhook",
      calendarIds: [found.state.google_calendar_id],
      allowIncremental: true,
    });
    return jsonResponse({ ok: true, received: true, syncTriggered: true, resourceState, messageNumber, googleCalendarSync: payload.googleCalendarSync });
  } catch (err) {
    return jsonResponse({ ok: false, error: err?.status === 429 ? "Too many requests" : err?.needsReconnect ? "Google Calendar needs reconnecting." : "Webhook request failed" }, err?.status || 500);
  }
}
