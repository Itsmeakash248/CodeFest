import { agentSystemPrompt } from "@/lib/agents/prompts";
import { localAgentReply } from "@/lib/agents/local-engine";
import { chunksOf, sleep } from "@/lib/sse";
import type { AgentId, ChatContext } from "@/lib/types";

export type LlmSource = "gemini" | "openrouter" | "local";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmResult {
  content: string;
  source: LlmSource;
  latencyMs: number;
  model?: string;
}

const MAX_MESSAGES = 16;
const MAX_CHARS_PER_MESSAGE = 6000;
const MAX_TOTAL_CHARS = 24000;

function normalizeMessages(messages: Pick<{ role: string; content: string }, "role" | "content">[]): LlmMessage[] {
  const cleaned = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: String(message.content ?? "").trim().slice(0, MAX_CHARS_PER_MESSAGE),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_MESSAGES);

  let total = 0;
  const limited: LlmMessage[] = [];
  for (let index = cleaned.length - 1; index >= 0; index -= 1) {
    total += cleaned[index].content.length;
    if (total > MAX_TOTAL_CHARS) break;
    limited.unshift(cleaned[index]);
  }
  while (limited.length && limited[0].role !== "user") limited.shift();
  return limited;
}

async function callGemini(
  messages: LlmMessage[],
  system: string,
): Promise<{ content: string; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: { temperature: 0.65, topP: 0.92, maxOutputTokens: 900 },
      }),
      signal: AbortSignal.timeout(18_000),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini ${response.status}: ${detail.slice(0, 160)}`);
  }
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (content.length < 10) throw new Error("Gemini returned an empty or blocked response");
  return { content, model };
}

async function callOpenRouter(
  messages: LlmMessage[],
  system: string,
): Promise<{ content: string; model: string }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      "X-Title": "ViewPilot Pro",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.65,
      max_tokens: 900,
    }),
    signal: AbortSignal.timeout(18_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 160)}`);
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (content.length < 10) throw new Error("OpenRouter returned an empty response");
  return { content, model };
}

export function aiStatus(): { gemini: boolean; openrouter: boolean; elevenlabs: boolean; engine: "ai" | "local" } {
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const openrouter = Boolean(process.env.OPENROUTER_API_KEY);
  return {
    gemini,
    openrouter,
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    engine: gemini || openrouter ? "ai" : "local",
  };
}

export async function generateAgentReply(args: {
  agent: AgentId;
  messages: Pick<{ role: string; content: string }, "role" | "content">[];
  context?: ChatContext;
  /** Demo / offline switch: skip every remote provider. */
  forceLocal?: boolean;
}): Promise<LlmResult> {
  const startedAt = performance.now();
  const messages = normalizeMessages(args.messages);
  const system = agentSystemPrompt(args.agent, args.context);

  if (!messages.length || args.forceLocal) {
    return {
      content: localAgentReply(args.agent, args.messages, args.context),
      source: "local",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const { content, model } = await callGemini(messages, system);
      return {
        content,
        source: "gemini",
        model,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      console.warn("[agents] Gemini failed, trying fallback:", (error as Error).message);
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const { content, model } = await callOpenRouter(messages, system);
      return {
        content,
        source: "openrouter",
        model,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      console.warn("[agents] OpenRouter failed, using local engine:", (error as Error).message);
    }
  }

  return {
    content: localAgentReply(args.agent, args.messages, args.context),
    source: "local",
    latencyMs: Math.round(performance.now() - startedAt),
  };
}
