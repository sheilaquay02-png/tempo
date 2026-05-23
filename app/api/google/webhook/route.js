import { jsonResponse } from "../../../../lib/tempo/google/server";

export async function POST(request) {
  // Phase 22 live-update placeholder.
  // Google push notifications are acknowledged here first; the safe import sync remains user-triggered/cron-ready.
  // This avoids destructive two-way behavior until channel registration + incremental sync tokens are enabled.
  const channelId = request.headers.get("x-goog-channel-id");
  const resourceState = request.headers.get("x-goog-resource-state");
  return jsonResponse({ ok: true, received: true, channelId, resourceState });
}
