export type AgentId =
  | "interview-coach"
  | "resume-reviewer"
  | "skill-analyzer"
  | "career-advisor"
  | "communication-trainer";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  source?: "gemini" | "openrouter" | "local";
  latencyMs?: number;
}

export interface Agent {
  id: AgentId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accent: "violet" | "cyan" | "green" | "amber" | "rose";
  starters: string[];
  capabilities: string[];
}

export interface ChatSession {
  id: string;
  agentId: AgentId;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatContext {
  targetRole?: string;
  level?: string;
  resume?: string;
}

/* ---------------- interview ---------------- */

export interface InterviewSetup {
  role: string;
  level: string;
  type: string;
  difficulty: string;
  resume?: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  competency: string;
  type: string;
  difficulty: string;
  signals: string[];
  probe: string;
  starHint: string;
}

export interface InterviewTurn {
  questionId: string;
  question: string;
  answer: string;
  isFollowUp?: boolean;
  competency?: string;
  signals?: string[];
}

export type DimensionKey = "communication" | "roleKnowledge" | "problemSolving" | "answerQuality";

export interface DimensionScore {
  key: DimensionKey;
  label: string;
  score: number;
  evidence: string;
  note: string;
  weight: number;
}

export interface AnswerFeedback {
  score: number;
  label: string;
  summary: string;
  strengths: string[];
  improve: string[];
}

export interface QuestionFeedback {
  question: string;
  answer: string;
  score: number;
  note: string;
}

export interface PracticeAction {
  title: string;
  detail: string;
  minutes: number;
}

export interface StarBlueprint {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface InterviewReport {
  sessionId: string;
  generatedAt: number;
  setup: InterviewSetup;
  overall: number;
  band: string;
  summary: string;
  dimensions: DimensionScore[];
  perQuestion: QuestionFeedback[];
  strengths: string[];
  improvements: string[];
  nextPractice: PracticeAction[];
  starBlueprint: StarBlueprint;
  answeredWords: number;
  source: "local" | "ai";
}

export interface InterviewResponse {
  sessionId: string;
  question?: InterviewQuestion;
  isFollowUp?: boolean;
  questionNumber: number;
  totalQuestions: number;
  answered: number;
  done: boolean;
  report?: InterviewReport;
  evaluation?: AnswerFeedback;
  source: "local" | "ai";
}

/* ---------------- workflow ---------------- */

export type WorkflowNodeType =
  | "upload-resume"
  | "set-target-role"
  | "resume-review"
  | "skill-gap"
  | "generate-questions"
  | "mock-interview"
  | "evaluate-answers"
  | "generate-report"
  | "practice-plan";

export type WorkflowStatus = "queued" | "running" | "complete" | "failed";

export interface WorkflowNodeDef {
  type: WorkflowNodeType;
  label: string;
  description: string;
  category: "input" | "analysis" | "practice" | "output";
  outputs: string;
  estimatedMs: number;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  config: Record<string, string | number>;
}

export interface NodeRunResult {
  nodeId: string;
  status: WorkflowStatus;
  output?: string;
  metrics?: Record<string, string | number>;
  elapsedMs?: number;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  workflowName: string;
  startedAt: number;
  status: WorkflowStatus;
  nodes: NodeRunResult[];
  progress: number;
  summary?: string;
}

export interface WorkflowEvent {
  type: "run-start" | "node-start" | "node-complete" | "node-error" | "run-complete" | "error";
  runId: string;
  nodeId?: string;
  nodeType?: WorkflowNodeType;
  label?: string;
  status?: WorkflowStatus;
  output?: string;
  metrics?: Record<string, string | number>;
  elapsedMs?: number;
  progress?: number;
  summary?: string;
  message?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  minutes: string;
  nodeTypes: WorkflowNodeType[];
}
