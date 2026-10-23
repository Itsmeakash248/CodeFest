import {
  BarChart3,
  CheckCircle2,
  Circle,
  FileSearch,
  FileText,
  Gauge,
  ListChecks,
  Mic,
  Sparkles,
  Target,
  Upload,
  XCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type { WorkflowNodeType, WorkflowStatus } from "@/lib/types";

export const NODE_VISUALS: Record<
  WorkflowNodeType,
  { icon: LucideIcon; tint: string; border: string; dot: string; short: string }
> = {
  "upload-resume": {
    icon: Upload,
    tint: "text-[#fcd34d]",
    border: "border-amber-400/20 bg-amber-500/[0.08]",
    dot: "bg-amber-400",
    short: "Upload resume",
  },
  "set-target-role": {
    icon: Target,
    tint: "text-[#fcd34d]",
    border: "border-amber-400/20 bg-amber-500/[0.08]",
    dot: "bg-amber-400",
    short: "Set role",
  },
  "resume-review": {
    icon: FileSearch,
    tint: "text-[#7fe8ff]",
    border: "border-[#00d9ff]/20 bg-[#00d9ff]/[0.07]",
    dot: "bg-[#00d9ff]",
    short: "Resume review",
  },
  "skill-gap": {
    icon: BarChart3,
    tint: "text-[#7fe8ff]",
    border: "border-[#00d9ff]/20 bg-[#00d9ff]/[0.07]",
    dot: "bg-[#00d9ff]",
    short: "Skill gap",
  },
  "generate-questions": {
    icon: ListChecks,
    tint: "text-[#b3adff]",
    border: "border-[#6c63ff]/25 bg-[#6c63ff]/[0.09]",
    dot: "bg-[#8d86ff]",
    short: "Questions",
  },
  "mock-interview": {
    icon: Mic,
    tint: "text-[#b3adff]",
    border: "border-[#6c63ff]/25 bg-[#6c63ff]/[0.09]",
    dot: "bg-[#8d86ff]",
    short: "Interview",
  },
  "evaluate-answers": {
    icon: Gauge,
    tint: "text-[#7fe8ff]",
    border: "border-[#00d9ff]/20 bg-[#00d9ff]/[0.07]",
    dot: "bg-[#00d9ff]",
    short: "Evaluate",
  },
  "generate-report": {
    icon: FileText,
    tint: "text-[#86efac]",
    border: "border-emerald-400/20 bg-emerald-500/[0.07]",
    dot: "bg-emerald-400",
    short: "Report",
  },
  "practice-plan": {
    icon: Sparkles,
    tint: "text-[#86efac]",
    border: "border-emerald-400/20 bg-emerald-500/[0.07]",
    dot: "bg-emerald-400",
    short: "Practice plan",
  },
};

export const CATEGORY_GROUPS: { id: "input" | "analysis" | "practice" | "output"; label: string; types: WorkflowNodeType[] }[] = [
  { id: "input", label: "Input", types: ["upload-resume", "set-target-role"] },
  { id: "analysis", label: "Analysis", types: ["resume-review", "skill-gap", "evaluate-answers"] },
  { id: "practice", label: "Practice", types: ["generate-questions", "mock-interview"] },
  { id: "output", label: "Output", types: ["generate-report", "practice-plan"] },
];

export const STATUS_VISUAL: Record<
  WorkflowStatus,
  { icon: LucideIcon; label: string; className: string; spin?: boolean }
> = {
  queued: { icon: Circle, label: "Queued", className: "text-[#6f7284]" },
  running: { icon: Loader2, label: "Running", className: "text-[#a8a2ff]", spin: true },
  complete: { icon: CheckCircle2, label: "Done", className: "text-emerald-300" },
  failed: { icon: XCircle, label: "Failed", className: "text-rose-300" },
};
