import { jsonResponse, rateLimit } from "../../../../lib/tempo/google/server";

export async function POST(request) {
  try {
    await rateLimit(request, { key: "google-webhook", limit: 120, windowMs: 60_000 });
    // Google Calendar webhooks are intentionally acknowledged but not used for writes yet.
    // If GOOGLE_WEBHOOK_TOKEN is configured, require Google's channel token to match it.
    const expectedToken = process.env.GOOGLE_WEBHOOK_TOKEN || process.env.TEMPO_GOOGLE_WEBHOOK_TOKEN || "";
    const receivedToken = request.headers.get("x-goog-channel-token") || "";
    if (expectedToken && receivedToken !== expectedToken) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }
    return jsonResponse({ ok: true, received: true, syncTriggered: false });
  } catch (err) {
    return jsonResponse({ ok: false, error: err?.status === 429 ? "Too many requests" : "Webhook request failed" }, err?.status || 500);
  }
}
