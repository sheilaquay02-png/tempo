import { GOOGLE_CALENDAR_INTEGRATION_ENABLED, googleCalendarRetiredResponse } from "../../../../lib/tempo/google/retiredRoute";
import {
  handleRouteError,
  jsonResponse,
  rateLimit,
  requireAuthenticatedUser,
  syncGoogleCalendarsForUser,
} from "../../../../lib/tempo/google/server";
import { readJsonBody } from "../../../../lib/tempo/validation.js";

export async function POST(request) {
  if (!GOOGLE_CALENDAR_INTEGRATION_ENABLED) return googleCalendarRetiredResponse();
  try {
    await rateLimit(request, { key: "google-sync", limit: 12, windowMs: 60_000 });
    const user = await requireAuthenticatedUser(request);
    const { timeMin, timeMax, full } = await readJsonBody(request, { fallback: {} });
    const payload = await syncGoogleCalendarsForUser(user.id, {
      timeMin,
      timeMax,
      mode: full ? "manual_full" : "manual",
      allowIncremental: !full,
    });
    return jsonResponse(payload);
  } catch (err) {
    return handleRouteError(err);
  }
}
