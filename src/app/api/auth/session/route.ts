import { getSessionFromCookies } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionFromCookies();
  return Response.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
