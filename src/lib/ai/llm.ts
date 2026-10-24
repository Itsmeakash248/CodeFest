import { agentSystemPrompt } from "@/lib/agents/prompts";
import { chunksOf, sleep } from "@/lib/sse";
import type { AgentId, ChatContext } from "@/lib/types";

export type LlmSource = "gemini" | "openrouter" | "local" | "error";

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

function parseKeys(val?: string): string[] {
  if (!val) return [];
  return val.split(",").map((k) => k.trim()).filter(Boolean);
}

async function callGemini(
  messages: LlmMessage[],
  system: string,
  options?: { maxTokens?: number; timeoutMs?: number; temperature?: number; jsonMode?: boolean },
): Promise<{ content: string; model: string }> {
  const keys = parseKeys(process.env.GEMINI_API_KEY);
  if (!keys.length) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  let lastError: Error | null = null;
  const timeoutMs = options?.timeoutMs ?? 18_000;
  const maxOutputTokens = options?.maxTokens ?? 1200;
  const temperature = options?.temperature ?? 0.65;

  for (const key of keys) {
    try {
      const generationConfig: Record<string, unknown> = {
        temperature,
        topP: 0.92,
        maxOutputTokens,
        // Gemini 3.x spends most of the budget on hidden thinking by default.
        thinkingConfig: { thinkingBudget: 0 },
      };
      if (options?.jsonMode) {
        generationConfig.responseMimeType = "application/json";
      }

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
            generationConfig,
          }),
          signal: AbortSignal.timeout(timeoutMs),
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
      if (content.length < 5) throw new Error("Gemini returned an empty or blocked response");
      return { content, model };
    } catch (err) {
      lastError = err as Error;
      console.warn(`[agents] Gemini key failed (${lastError.message}), trying next key if available...`);
    }
  }

  throw lastError ?? new Error("All Gemini API keys failed");
}

async function callOpenRouter(
  messages: LlmMessage[],
  system: string,
  options?: { maxTokens?: number; timeoutMs?: number; temperature?: number; jsonMode?: boolean },
): Promise<{ content: string; model: string }> {
  const keys = parseKeys(process.env.OPENROUTER_API_KEY);
  if (!keys.length) throw new Error("OPENROUTER_API_KEY is not configured");
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  let lastError: Error | null = null;
  const timeoutMs = options?.timeoutMs ?? 18_000;
  const max_tokens = options?.maxTokens ?? 900;
  const temperature = options?.temperature ?? 0.65;

  for (const key of keys) {
    try {
      const bodyPayload: Record<string, unknown> = {
        model,
        messages: [{ role: "system", content: system }, ...messages],
        temperature,
        max_tokens,
      };
      if (options?.jsonMode) {
        bodyPayload.response_format = { type: "json_object" };
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
          "X-Title": "ViewPilot Pro",
        },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 160)}`);
      }
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (content.length < 5) throw new Error("OpenRouter returned an empty response");
      return { content, model };
    } catch (err) {
      lastError = err as Error;
      console.warn(`[agents] OpenRouter key failed (${lastError.message}), trying next key if available...`);
    }
  }

  throw lastError ?? new Error("All OpenRouter API keys failed");
}

export function aiStatus(): {
  gemini: boolean;
  openrouter: boolean;
  elevenlabs: boolean;
  engine: "ai" | "none";
  connected: boolean;
} {
  const gemini = parseKeys(process.env.GEMINI_API_KEY).length > 0;
  const openrouter = parseKeys(process.env.OPENROUTER_API_KEY).length > 0;
  const connected = gemini || openrouter;
  return {
    gemini,
    openrouter,
    elevenlabs: parseKeys(process.env.ELEVENLABS_API_KEY).length > 0,
    engine: connected ? "ai" : "none",
    connected,
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
  const keys = parseKeys(process.env.GEMINI_API_KEY);
  if (!keys.length) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  let lastError: Error | null = null;

  for (const key of keys) {
    try {
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

      let yielded = false;
      for await (const data of readSseJson(response)) {
        const chunk = data as {
          candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
        };
        const text = (chunk.candidates?.[0]?.content?.parts ?? [])
          .filter((part) => !part.thought)
          .map((part) => part.text ?? "")
          .join("");
        if (text) {
          yielded = true;
          yield text;
        }
      }
      if (yielded) return;
    } catch (err) {
      lastError = err as Error;
      console.warn(`[agents] Gemini stream key failed (${lastError.message}), trying next key...`);
    }
  }

  throw lastError ?? new Error("All Gemini streaming keys failed");
}

async function* streamOpenRouterText(
  messages: LlmMessage[],
  system: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const keys = parseKeys(process.env.OPENROUTER_API_KEY);
  if (!keys.length) throw new Error("OPENROUTER_API_KEY is not configured");
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  let lastError: Error | null = null;

  for (const key of keys) {
    try {
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

      let yielded = false;
      for await (const data of readSseJson(response)) {
        const chunk = data as { choices?: { delta?: { content?: string } }[] };
        const text = chunk.choices?.[0]?.delta?.content ?? "";
        if (text) {
          yielded = true;
          yield text;
        }
      }
      if (yielded) return;
    } catch (err) {
      lastError = err as Error;
      console.warn(`[agents] OpenRouter stream key failed (${lastError.message}), trying next key...`);
    }
  }

  throw lastError ?? new Error("All OpenRouter streaming keys failed");
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

  if (!messages.length) {
    throw new Error("No messages provided to agent.");
  }

  const geminiKeys = parseKeys(process.env.GEMINI_API_KEY);
  const openrouterKeys = parseKeys(process.env.OPENROUTER_API_KEY);

  if (!geminiKeys.length && !openrouterKeys.length) {
    throw new Error(
      "AI API is not connected. Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is configured in your environment variables (.env.local).",
    );
  }

  let lastError: Error | null = null;

  if (geminiKeys.length) {
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
      lastError = error as Error;
      console.warn("[agents] Gemini stream failed, trying fallback:", lastError.message);
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

  if (openrouterKeys.length) {
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
      lastError = error as Error;
      console.warn("[agents] OpenRouter stream failed:", lastError.message);
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

  throw new Error(`AI API connection failed: ${lastError?.message || "All configured AI providers failed."}`);
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

  if (!messages.length) {
    throw new Error("No messages provided to agent.");
  }

  const geminiKeys = parseKeys(process.env.GEMINI_API_KEY);
  const openrouterKeys = parseKeys(process.env.OPENROUTER_API_KEY);

  if (!geminiKeys.length && !openrouterKeys.length) {
    throw new Error(
      "AI API is not connected. Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is configured in your environment variables (.env.local).",
    );
  }

  let lastError: Error | null = null;

  if (geminiKeys.length) {
    try {
      const { content, model } = await callGemini(messages, system);
      return {
        content,
        source: "gemini",
        model,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      lastError = error as Error;
      console.warn("[agents] Gemini failed, trying fallback:", lastError.message);
    }
  }

  if (openrouterKeys.length) {
    try {
      const { content, model } = await callOpenRouter(messages, system);
      return {
        content,
        source: "openrouter",
        model,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      lastError = error as Error;
      console.warn("[agents] OpenRouter failed:", lastError.message);
    }
  }

  throw new Error(`AI API connection failed: ${lastError?.message || "All configured AI providers failed."}`);
}

export function extractJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]) as T;
      } catch {
        // continue
      }
    }
    const startObj = text.indexOf("{");
    const endObj = text.lastIndexOf("}");
    if (startObj !== -1 && endObj > startObj) {
      try {
        return JSON.parse(text.slice(startObj, endObj + 1)) as T;
      } catch {
        // continue
      }
    }
    const startArr = text.indexOf("[");
    const endArr = text.lastIndexOf("]");
    if (startArr !== -1 && endArr > startArr) {
      try {
        return JSON.parse(text.slice(startArr, endArr + 1)) as T;
      } catch {
        // continue
      }
    }
  }
  return null;
}

export async function callLlmText(
  prompt: string,
  system = "You are an expert AI interview and career mentor.",
  options?: { maxTokens?: number; timeoutMs?: number; temperature?: number },
): Promise<{ content: string; source: "gemini" | "openrouter"; model: string }> {
  const geminiKeys = parseKeys(process.env.GEMINI_API_KEY);
  const openrouterKeys = parseKeys(process.env.OPENROUTER_API_KEY);

  if (!geminiKeys.length && !openrouterKeys.length) {
    throw new Error("No AI provider API keys configured.");
  }

  const messages: LlmMessage[] = [{ role: "user", content: prompt }];
  let lastError: Error | null = null;

  if (geminiKeys.length) {
    try {
      const res = await callGemini(messages, system, {
        maxTokens: options?.maxTokens ?? 1200,
        timeoutMs: options?.timeoutMs ?? 10_000,
        temperature: options?.temperature ?? 0.65,
      });
      return { content: res.content, source: "gemini", model: res.model };
    } catch (err) {
      lastError = err as Error;
      console.warn("[llm] Gemini text call failed, attempting fallback:", lastError.message);
    }
  }

  if (openrouterKeys.length) {
    try {
      const res = await callOpenRouter(messages, system, {
        maxTokens: options?.maxTokens ?? 1000,
        timeoutMs: options?.timeoutMs ?? 10_000,
        temperature: options?.temperature ?? 0.65,
      });
      return { content: res.content, source: "openrouter", model: res.model };
    } catch (err) {
      lastError = err as Error;
      console.warn("[llm] OpenRouter text call failed:", lastError.message);
    }
  }

  throw lastError ?? new Error("All AI providers failed.");
}

export async function callLlmJson<T>(
  prompt: string,
  system = "You are an expert AI interview evaluator and career coach. Always respond with strict, valid JSON only. Do not include markdown codeblocks or explanatory text.",
  options?: { maxTokens?: number; timeoutMs?: number; temperature?: number },
): Promise<{ data: T; source: "gemini" | "openrouter"; model: string } | null> {
  const geminiKeys = parseKeys(process.env.GEMINI_API_KEY);
  const openrouterKeys = parseKeys(process.env.OPENROUTER_API_KEY);

  if (!geminiKeys.length && !openrouterKeys.length) {
    return null;
  }

  const messages: LlmMessage[] = [{ role: "user", content: prompt }];
  let lastError: Error | null = null;

  if (geminiKeys.length) {
    try {
      const res = await callGemini(messages, system, {
        maxTokens: options?.maxTokens ?? 1500,
        timeoutMs: options?.timeoutMs ?? 12_000,
        temperature: options?.temperature ?? 0.3,
        jsonMode: true,
      });
      const parsed = extractJson<T>(res.content);
      if (parsed) {
        return { data: parsed, source: "gemini", model: res.model };
      }
      console.warn("[llm] Failed to parse JSON from Gemini response:", res.content.slice(0, 100));
    } catch (err) {
      lastError = err as Error;
      console.warn("[llm] Gemini JSON call failed, trying OpenRouter fallback:", lastError.message);
    }
  }

  if (openrouterKeys.length) {
    try {
      const res = await callOpenRouter(messages, system, {
        maxTokens: options?.maxTokens ?? 1200,
        timeoutMs: options?.timeoutMs ?? 12_000,
        temperature: options?.temperature ?? 0.3,
        jsonMode: true,
      });
      const parsed = extractJson<T>(res.content);
      if (parsed) {
        return { data: parsed, source: "openrouter", model: res.model };
      }
      console.warn("[llm] Failed to parse JSON from OpenRouter response:", res.content.slice(0, 100));
    } catch (err) {
      lastError = err as Error;
      console.warn("[llm] OpenRouter JSON call failed:", lastError.message);
    }
  }

  return null;
}
