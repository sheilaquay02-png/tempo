// Browser-side push notification helpers extracted from TempoApp.

export async function enableClosedPushNotificationsForUser({ userId, registerTempoPushNotifications, showToast, logger = console } = {}) {
  try {
    const result = await registerTempoPushNotifications(userId);
    if (!result?.ok) throw new Error(result?.reason || "Push setup failed");
    showToast?.("Closed-app push notifications enabled ✓");
    return true;
  } catch (err) {
    logger?.warn?.("Push notification setup failed", err);
    showToast?.(err?.message || "Push setup failed. Check VAPID/server setup.");
    return false;
  }
}
