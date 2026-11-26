// This intentionally returns a positive signal ONLY from the disposable local
// development environment. No credentials, account data or financial data.
export const dynamic = "force-dynamic";

export function GET() {
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const allowed = process.env.NODE_ENV === "development"
    && process.env.TEMPO_QA_LOCAL_ONLY === "1"
    && ["http://127.0.0.1:54321", "http://localhost:54321"].includes(supabase);
  return Response.json({localQa:allowed}, {
    status: allowed ? 200 : 404,
    headers: {"Cache-Control": "no-store, no-cache, must-revalidate"},
  });
}
