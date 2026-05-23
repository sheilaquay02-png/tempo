import { googleAuthUrl, handleRouteError } from "../../../../../lib/tempo/google/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const returnTo = url.searchParams.get("returnTo") || "/?page=calendar&google=connected";
    if (!userId) return Response.json({ ok: false, error: "Missing userId" }, { status: 400 });
    return Response.redirect(googleAuthUrl(request, { userId, returnTo }), 302);
  } catch (err) {
    return handleRouteError(err);
  }
}
