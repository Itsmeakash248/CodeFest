import { generateAgentReply } from "@/lib/ai/llm";
import { isAgentId } from "@/lib/agents/agents";
import { createSseResponse, chunksOf, sleep } from "@/lib/sse";
import type { ChatContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  agent?: unknown;
  messages?: unknown;
  context?: unknown;
  engine?: unknown;
}

function parseContext(raw: unknown): ChatContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const context = raw as Record<string, unknown>;
  return {
    targetRole: typeof context.targetRole === "string" ? context.targetRole.slice(0, 80) : undefined,
    level: typeof context.level === "string" ? context.level.slice(0, 40) : undefined,
  };
}

export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const agent = typeof body.agent === "string" ? body.agent : "";
  if (!isAgentId(agent)) {
    return Response.json({ error: "Unknown agent." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "messages must be a non-empty array." }, { status: 400 });
  }

  const messages = body.messages
    .slice(-30)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const message = item as Record<string, unknown>;
      const role = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
      const content = typeof message.content === "string" ? message.content.trim() : "";
      if (!role || !content) return null;
      return { role, content: content.slice(0, 6000) };
    })
    .filter((message): message is { role: "user" | "assistant"; content: string } => message !== null);

  if (!messages.some((message) => message.role === "user")) {
    return Response.json({ error: "At least one user message is required." }, { status: 400 });
  }

  const context = parseContext(body.context);

  try {
    const result = await generateAgentReply({ agent, messages, context });

    return createSseResponse(async (send) => {
      send({
        type: "meta",
        source: result.source,
        agent,
        model: result.model ?? null,
        latencyMs: result.latencyMs,
      });

      const chunks = chunksOf(result.content);
      for (const chunk of chunks) {
        if (request.signal.aborted) return;
        send({ type: "delta", text: chunk });
        await sleep(chunks.length > 80 ? 6 : 12);
      }

      send({
        type: "done",
        source: result.source,
        latencyMs: result.latencyMs,
        characters: result.content.length,
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI API request failed.";
    return Response.json({ error: message }, { status: 503 });
  }
}
