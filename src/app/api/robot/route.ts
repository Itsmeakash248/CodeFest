import { getRobotStatus, setRobotExpression } from "@/lib/robot/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getRobotStatus();
  return Response.json(status, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const expression = typeof body.expression === "string" ? body.expression : "neutral";
  const result = await setRobotExpression(expression);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
