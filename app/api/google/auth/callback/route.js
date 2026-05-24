import {
  exchangeCodeForTokens,
  storeGoogleTokens,
  verifyOAuthState,
  listGoogleCalendars,
  loadUserData,
  saveUserData,
  googleCalendarSettingsFromList,
  appBaseUrl,
  safeReturnPath,
  rateLimit,
  handleRouteError,
} from "../../../../../lib/tempo/google/server";

export async function GET(request) {
  try {
    rateLimit(request, { key: "google-auth-callback", limit: 20, windowMs: 60_000 });
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    if (error) return Response.redirect(`${appBaseUrl(request)}/?page=calendar&google=error&reason=${encodeURIComponent(error)}`, 302);
    if (!code || !state) throw new Error("Missing Google OAuth callback code/state");

    const parsedState = verifyOAuthState(state);
    const tokens = await exchangeCodeForTokens(request, code);
    await storeGoogleTokens(parsedState.userId, tokens);

    const calendarItems = await listGoogleCalendars(parsedState.userId);
    const userData = await loadUserData(parsedState.userId);
    const settings = googleCalendarSettingsFromList(userData.settings || {}, calendarItems);
    await saveUserData(parsedState.userId, { events: userData.events || [], tasks: userData.tasks || [], settings });

    const returnTo = safeReturnPath(parsedState.returnTo || "/?page=calendar&google=connected");
    const finalUrl = new URL(`${appBaseUrl(request)}${returnTo}`);
    finalUrl.searchParams.set("google", "connected");
    finalUrl.searchParams.set("page", finalUrl.searchParams.get("page") || "calendar");
    return Response.redirect(finalUrl.toString(), 302);
  } catch (err) {
    console.error("Google callback failed", err);
    return Response.redirect(`${appBaseUrl(request)}/?page=calendar&google=error&reason=${encodeURIComponent(err.message || "callback_failed")}`, 302);
  }
}
