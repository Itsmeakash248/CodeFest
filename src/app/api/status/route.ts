import { aiStatus } from "@/lib/ai/llm";
import { robotConfigured } from "@/lib/robot/client";
import { DEFAULT_VOICE } from "@/lib/voice/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const providers = aiStatus();
  const forceLocal = new URL(request.url).searchParams.get("engine") === "local";
  return Response.json(
    {
      ...providers,
      ...(forceLocal ? { gemini: false, openrouter: false, engine: "local" as const } : {}),
      robot: robotConfigured(),
      localFallback: true,
      voice: DEFAULT_VOICE.name,
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
      interviewEngine: "deterministic-rubric",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
