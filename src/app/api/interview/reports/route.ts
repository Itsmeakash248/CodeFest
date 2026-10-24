import { getSessionFromCookies } from "@/lib/session";
import { fetchInterviewReportsFromDb, saveInterviewReportToDb } from "@/lib/supabase/db";
import type { InterviewReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionFromCookies();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.demo || !user.id) {
    return Response.json({ reports: [], source: "local" });
  }

  const { reports, error } = await fetchInterviewReportsFromDb(user.id);
  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json({ reports, source: "supabase" });
}

export async function POST(request: Request) {
  const user = await getSessionFromCookies();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { report?: InterviewReport };
  try {
    body = (await request.json()) as { report?: InterviewReport };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.report || typeof body.report.overall !== "number") {
    return Response.json({ error: "Invalid report data." }, { status: 400 });
  }

  if (user.demo || !user.id) {
    // In demo mode, acknowledge without cloud persistence
    return Response.json({ ok: true, source: "local", id: null });
  }

  const { id, error } = await saveInterviewReportToDb(body.report, user.id);
  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json({ ok: true, id, source: "supabase" });
}
