import { aiStatus } from "@/lib/ai/llm";
import { robotConfigured } from "@/lib/robot/client";
import { DEFAULT_VOICE } from "@/lib/voice/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const providers = aiStatus();
  return Response.json(
    {
      ...providers,
      robot: robotConfigured(),
      localFallback: true,
      voice: DEFAULT_VOICE.name,
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
      interviewEngine: "deterministic-rubric",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
