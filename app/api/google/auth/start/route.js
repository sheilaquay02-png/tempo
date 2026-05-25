import { googleAuthUrl, handleRouteError, jsonResponse, rateLimit, requireAuthenticatedUser, safeReturnPath } from "../../../../../lib/tempo/google/server";

async function buildAuthResponse(request) {
  await rateLimit(request, { key: "google-auth-start", limit: 10, windowMs: 60_000 });
  const user = await requireAuthenticatedUser(request);
  const url = new URL(request.url);
  const returnTo = safeReturnPath(url.searchParams.get("returnTo") || "/?page=calendar&google=connected");
  return googleAuthUrl(request, { userId: user.id, returnTo });
}

export async function GET(request) {
  try {
    const authUrl = await buildAuthResponse(request);
    return Response.redirect(authUrl, 302);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request) {
  try {
    const authUrl = await buildAuthResponse(request);
    return jsonResponse({ ok: true, url: authUrl });
  } catch (err) {
    return handleRouteError(err);
  }
}
