import type {
  AgentId,
  ChatContext,
  InterviewReport,
  InterviewResponse,
  InterviewSetup,
  InterviewTurn,
  ProctoringReport,
  WorkflowEvent,
  WorkflowNode,
  WorkflowStatus,
} from "@/lib/types";
import { readSse } from "@/lib/client/sse";

export type ChatStreamEvent =
  | { type: "meta"; source: "gemini" | "openrouter" | "local" | "error"; agent: AgentId; model?: string | null; latencyMs?: number }
  | { type: "delta"; text: string }
  | { type: "done"; source: "gemini" | "openrouter" | "local" | "error"; latencyMs: number; characters?: number }
  | { type: "error"; message: string };

export interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(args: {
  agent: AgentId;
  messages: ChatRequestMessage[];
  context?: ChatContext;
  /** "local" demonstrates the zero-key engine even when keys are configured. */
  engine?: "auto" | "local";
  signal?: AbortSignal;
  onEvent: (event: ChatStreamEvent) => void;
}): Promise<void> {
  const response = await fetch("/api/agents/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: args.agent,
      messages: args.messages,
      context: args.context,
      engine: args.engine,
    }),
    signal: args.signal,
  });
  await readSse<ChatStreamEvent>(response, args.onEvent);
}

export async function startInterview(setup: InterviewSetup): Promise<InterviewResponse> {
  return postJson<InterviewResponse>("/api/interview/session", { action: "start", setup });
}

export async function answerInterview(args: {
  sessionId: string;
  setup: InterviewSetup;
  turns: InterviewTurn[];
  answer: string;
  questionId: string;
  isFollowUp?: boolean;
}): Promise<InterviewResponse> {
  return postJson<InterviewResponse>("/api/interview/session", {
    action: "answer",
    ...args,
  });
}

export async function finalizeInterview(args: {
  sessionId: string;
  setup: InterviewSetup;
  turns: InterviewTurn[];
  integrity?: ProctoringReport;
}): Promise<InterviewResponse> {
  return postJson<InterviewResponse>("/api/interview/session", {
    action: "finalize",
    ...args,
  });
}

export async function runWorkflow(args: {
  runId: string;
  name: string;
  nodes: WorkflowNode[];
  onEvent: (event: WorkflowEvent) => void;
}): Promise<void> {
  const response = await fetch("/api/workflow/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflow: {
        id: args.runId,
        name: args.name,
        nodes: args.nodes,
      },
    }),
  });
  await readSse<WorkflowEvent>(response, args.onEvent);
}

export interface ProviderStatus {
  gemini: boolean;
  openrouter: boolean;
  elevenlabs: boolean;
  supabase?: boolean;
  authMode?: "supabase" | "demo";
  robot: boolean;
  engine: "ai" | "local" | "none";
  connected: boolean;
  localFallback: boolean;
  voice: string;
  model: string;
  interviewEngine: string;
}

export async function fetchStatus(options?: { forceLocal?: boolean }): Promise<ProviderStatus> {
  const response = await fetch(`/api/status${options?.forceLocal ? "?engine=local" : ""}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not read provider status.");
  return (await response.json()) as ProviderStatus;
}

export async function synthesizeSpeech(text: string, voiceId?: string): Promise<Blob> {
  const response = await fetch("/api/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!response.ok) {
    let message = "Voice synthesis unavailable.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  return response.blob();
}

export interface RobotState {
  configured: boolean;
  online: boolean;
  expression?: string;
  battery?: number;
  ip?: string;
  error?: string;
}

export async function fetchRobotStatus(): Promise<RobotState> {
  const response = await fetch("/api/robot", { cache: "no-store" });
  if (!response.ok) return { configured: false, online: false };
  return (await response.json()) as RobotState;
}

export async function setRobotExpression(expression: string): Promise<RobotState & { sent?: boolean }> {
  const response = await fetch("/api/robot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expression }),
  });
  if (!response.ok) return { configured: false, online: false };
  return (await response.json()) as RobotState & { sent?: boolean };
}

export interface LoginResponse {
  user: { id?: string; email: string; name: string; demo: boolean; issuedAt: number };
  needsEmailConfirmation?: boolean;
}

export async function login(
  email: string,
  name?: string,
  password?: string,
  demo?: boolean,
): Promise<LoginResponse> {
  return postJson<LoginResponse>("/api/auth/login", { email, name, password, demo });
}

export async function signup(
  email: string,
  password?: string,
  name?: string,
): Promise<LoginResponse> {
  return postJson<LoginResponse>("/api/auth/signup", { email, password, name });
}

export async function saveCloudReport(report: InterviewReport): Promise<{ ok: boolean; id?: string | null; source?: string }> {
  return postJson<{ ok: boolean; id?: string | null; source?: string }>("/api/interview/reports", { report });
}

export async function fetchCloudReports(): Promise<InterviewReport[]> {
  const response = await fetch("/api/interview/reports", { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { reports?: InterviewReport[] };
  return data.reports || [];
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}

export type { WorkflowStatus };
