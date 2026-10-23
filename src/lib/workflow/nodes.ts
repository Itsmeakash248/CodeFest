import type { WorkflowNodeDef, WorkflowNodeType } from "@/lib/types";

export const WORKFLOW_NODE_DEFS: Record<WorkflowNodeType, WorkflowNodeDef> = {
  "upload-resume": {
    type: "upload-resume",
    label: "Upload resume",
    description: "Parse resume text into a structured candidate profile.",
    category: "input",
    outputs: "Profile · skills · experience",
    estimatedMs: 700,
  },
  "set-target-role": {
    type: "set-target-role",
    label: "Set target role",
    description: "Freeze the role, level and interview format for the run.",
    category: "input",
    outputs: "Role, level, format",
    estimatedMs: 500,
  },
  "resume-review": {
    type: "resume-review",
    label: "Resume review",
    description: "Score impact, clarity, relevance and structure with rewrites.",
    category: "analysis",
    outputs: "4 scores · top fixes",
    estimatedMs: 1100,
  },
  "skill-gap": {
    type: "skill-gap",
    label: "Skill gap analysis",
    description: "Rank missing skills by hiring impact for the target role.",
    category: "analysis",
    outputs: "Gap ranking · 4-week plan",
    estimatedMs: 1000,
  },
  "generate-questions": {
    type: "generate-questions",
    label: "Generate questions",
    description: "Build a five-question set from the role, level and gaps.",
    category: "practice",
    outputs: "5 role-specific prompts",
    estimatedMs: 900,
  },
  "mock-interview": {
    type: "mock-interview",
    label: "Mock interview",
    description: "Open a live session with voice, follow-ups and a timer.",
    category: "practice",
    outputs: "Live interview workspace",
    estimatedMs: 800,
  },
  "evaluate-answers": {
    type: "evaluate-answers",
    label: "Evaluate answers",
    description: "Score the transcript against the visible four-part rubric.",
    category: "analysis",
    outputs: "Rubric scores · evidence",
    estimatedMs: 1200,
  },
  "generate-report": {
    type: "generate-report",
    label: "Generate report",
    description: "Assemble strengths, gaps and an evidence-backed scorecard.",
    category: "output",
    outputs: "Report · export ready",
    estimatedMs: 1000,
  },
  "practice-plan": {
    type: "practice-plan",
    label: "Practice plan",
    description: "Turn the evaluation into three micro-actions and a STAR blueprint.",
    category: "output",
    outputs: "3 actions · STAR blueprint",
    estimatedMs: 700,
  },
};

export const WORKFLOW_NODE_LIST: WorkflowNodeDef[] = Object.values(WORKFLOW_NODE_DEFS);

export const DEFAULT_NODE_CONFIG: Record<WorkflowNodeType, Record<string, string | number>> = {
  "upload-resume": { resume: "" },
  "set-target-role": { role: "Frontend Engineer", level: "Entry level" },
  "resume-review": {},
  "skill-gap": {},
  "generate-questions": { count: 5, type: "Mixed", difficulty: "Standard" },
  "mock-interview": { mode: "voice" },
  "evaluate-answers": {},
  "generate-report": {},
  "practice-plan": {},
};

export function defaultConfigFor(type: WorkflowNodeType): Record<string, string | number> {
  return { ...DEFAULT_NODE_CONFIG[type] };
}

export function createWorkflowNode(
  type: WorkflowNodeType,
  idSeed?: string,
): { id: string; type: WorkflowNodeType; config: Record<string, string | number> } {
  return {
    id: idSeed ?? `node_${Math.random().toString(36).slice(2, 9)}`,
    type,
    config: defaultConfigFor(type),
  };
}
