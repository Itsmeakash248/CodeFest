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
        generationConfig: {
          temperature: 0.65,
          topP: 0.92,
          maxOutputTokens: 1200,
          // Gemini 3.x spends most of the budget on hidden thinking by default.
          thinkingConfig: { thinkingBudget: 0 },
        },
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

function mergeTimeout(signal: AbortSignal | undefined, ms = 45_000): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  if (!signal) return timeout;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted || timeout.aborted) controller.abort();
  else {
    signal.addEventListener("abort", abort, { once: true });
    timeout.addEventListener("abort", abort, { once: true });
  }
  return controller.signal;
}

async function* readSseJson(response: Response): AsyncGenerator<Record<string, unknown>> {
  if (!response.body) throw new Error("Provider returned an empty stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n");
    while (boundary !== -1) {
      const line = buffer.slice(0, boundary).replace(/\r$/, "");
      buffer = buffer.slice(boundary + 1);
      if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        if (raw && raw !== "[DONE]") {
          try {
            yield JSON.parse(raw) as Record<string, unknown>;
          } catch {
            // Ignore keep-alive / partial lines.
          }
        }
      }
      boundary = buffer.indexOf("\n");
    }
    if (done) break;
  }
}

async function* streamGeminiText(
  messages: LlmMessage[],
  system: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: 0.65,
          topP: 0.92,
          maxOutputTokens: 1200,
          // Gemini 3.x spends most of the budget on hidden thinking by default.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: mergeTimeout(signal),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini ${response.status}: ${detail.slice(0, 160)}`);
  }

  for await (const data of readSseJson(response)) {
    const chunk = data as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    const text = (chunk.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("");
    if (text) yield text;
  }
}

async function* streamOpenRouterText(
  messages: LlmMessage[],
  system: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
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
      stream: true,
    }),
    signal: mergeTimeout(signal),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 160)}`);
  }

  for await (const data of readSseJson(response)) {
    const chunk = data as { choices?: { delta?: { content?: string } }[] };
    const text = chunk.choices?.[0]?.delta?.content ?? "";
    if (text) yield text;
  }
}

export interface LlmStreamInfo {
  source: LlmSource;
  model?: string;
  latencyMs: number;
}

/**
 * Stream a coach reply, falling back across providers. `onStart` fires on the
 * first real token so the UI never shows a provider badge for a failed attempt.
 */
export async function streamAgentReply(args: {
  agent: AgentId;
  messages: Pick<{ role: string; content: string }, "role" | "content">[];
  context?: ChatContext;
  forceLocal?: boolean;
  signal?: AbortSignal;
  onStart?: (info: LlmStreamInfo) => void;
  onDelta: (text: string) => void;
}): Promise<LlmResult> {
  const startedAt = performance.now();
  const messages = normalizeMessages(args.messages);
  const system = agentSystemPrompt(args.agent, args.context);
  let content = "";
  let firstTokenAt = 0;

  const emit = (text: string, source: LlmSource, model?: string) => {
    if (!text) return;
    if (!content) {
      firstTokenAt = performance.now();
      args.onStart?.({
        source,
        model,
        latencyMs: Math.round(firstTokenAt - startedAt),
      });
    }
    content += text;
    args.onDelta(text);
  };

  const emitLocal = async () => {
    const reply = localAgentReply(args.agent, args.messages, args.context);
    for (const chunk of chunksOf(reply)) {
      emit(chunk, "local");
      await sleep(12);
    }
  };

  if (!messages.length || args.forceLocal) {
    await emitLocal();
    return {
      content,
      source: "local",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
      for await (const text of streamGeminiText(messages, system, args.signal)) {
        emit(text, "gemini", model);
      }
      if (!content.trim()) throw new Error("Gemini returned an empty stream");
      return {
        content,
        source: "gemini",
        model,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      console.warn("[agents] Gemini stream failed, trying fallback:", (error as Error).message);
      if (content.trim()) {
        return {
          content,
          source: "gemini",
          model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
          latencyMs: Math.round(performance.now() - startedAt),
        };
      }
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
      for await (const text of streamOpenRouterText(messages, system, args.signal)) {
        emit(text, "openrouter", model);
      }
      if (!content.trim()) throw new Error("OpenRouter returned an empty stream");
      return {
        content,
        source: "openrouter",
        model,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      console.warn("[agents] OpenRouter stream failed, using local engine:", (error as Error).message);
      if (content.trim()) {
        return {
          content,
          source: "openrouter",
          model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
          latencyMs: Math.round(performance.now() - startedAt),
        };
      }
    }
  }

  await emitLocal();
  return {
    content,
    source: "local",
    latencyMs: Math.round(performance.now() - startedAt),
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
