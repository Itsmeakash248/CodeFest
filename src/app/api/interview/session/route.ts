import { answerInterview, finalizeInterview, startInterview } from "@/lib/interview/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  try {
    if (action === "start") {
      return Response.json(startInterview(body));
    }
    if (action === "answer") {
      return Response.json(answerInterview(body));
    }
    if (action === "finalize") {
      return Response.json(finalizeInterview(body));
    }
    return Response.json(
      { error: "action must be one of: start, answer, finalize." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Interview request failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  return Response.json({
    totalQuestions: 5,
    dimensions: [
      { key: "communication", label: "Communication", weight: 0.25 },
      { key: "roleKnowledge", label: "Role knowledge", weight: 0.3 },
      { key: "problemSolving", label: "Problem solving", weight: 0.25 },
      { key: "answerQuality", label: "Answer quality", weight: 0.2 },
    ],
    note: "Practice estimate, not a hiring decision. No protected traits are scored.",
  });
}
