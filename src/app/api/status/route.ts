import { aiStatus } from "@/lib/ai/llm";
import { robotConfigured } from "@/lib/robot/client";
import { DEFAULT_VOICE } from "@/lib/voice/voices";
import { isSupabaseConfigured } from "@/lib/supabase/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const providers = aiStatus();
  const supabaseActive = isSupabaseConfigured();
  return Response.json(
    {
      ...providers,
      supabase: supabaseActive,
      authMode: supabaseActive ? "supabase" : "demo",
      robot: robotConfigured(),
      localFallback: true,
      voice: DEFAULT_VOICE.name,
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
      interviewEngine: providers.connected ? "ai-rubric-hybrid" : "deterministic-rubric",
      workflowEngine: providers.connected ? "ai-enhanced" : "deterministic-template",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
