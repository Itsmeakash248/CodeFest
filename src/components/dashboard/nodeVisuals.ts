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
    tint: "text-[#8A5B16] dark:text-[#F0C078]",
    border: "border-[#8A5B16]/25 bg-[#8A5B16]/[0.09]",
    dot: "bg-[#8A5B16] dark:bg-[#F0C078]",
    short: "Upload resume",
  },
  "set-target-role": {
    icon: Target,
    tint: "text-[#8A5B16] dark:text-[#F0C078]",
    border: "border-[#8A5B16]/25 bg-[#8A5B16]/[0.09]",
    dot: "bg-[#8A5B16] dark:bg-[#F0C078]",
    short: "Set role",
  },
  "resume-review": {
    icon: FileSearch,
    tint: "text-[#686B4E] dark:text-[#C9CAA7]",
    border: "border-[#686B4E]/25 bg-[#686B4E]/[0.09]",
    dot: "bg-[#686B4E] dark:bg-[#C9CAA7]",
    short: "Resume review",
  },
  "skill-gap": {
    icon: BarChart3,
    tint: "text-[#686B4E] dark:text-[#C9CAA7]",
    border: "border-[#686B4E]/25 bg-[#686B4E]/[0.09]",
    dot: "bg-[#686B4E] dark:bg-[#C9CAA7]",
    short: "Skill gap",
  },
  "generate-questions": {
    icon: ListChecks,
    tint: "text-[#625B8A] dark:text-[#C9BDF7]",
    border: "border-[#625B8A]/25 bg-[#625B8A]/[0.09]",
    dot: "bg-[#625B8A] dark:bg-[#C9BDF7]",
    short: "Questions",
  },
  "mock-interview": {
    icon: Mic,
    tint: "text-[#B9573D] dark:text-[#F0A18A]",
    border: "border-[#B9573D]/25 bg-[#B9573D]/[0.09]",
    dot: "bg-[#B9573D] dark:bg-[#F0A18A]",
    short: "Interview",
  },
  "evaluate-answers": {
    icon: Gauge,
    tint: "text-[#686B4E] dark:text-[#C9CAA7]",
    border: "border-[#686B4E]/25 bg-[#686B4E]/[0.09]",
    dot: "bg-[#686B4E] dark:bg-[#C9CAA7]",
    short: "Evaluate",
  },
  "generate-report": {
    icon: FileText,
    tint: "text-[#386A4A] dark:text-[#9BD0A6]",
    border: "border-[#386A4A]/25 bg-[#386A4A]/[0.09]",
    dot: "bg-[#386A4A] dark:bg-[#9BD0A6]",
    short: "Report",
  },
  "practice-plan": {
    icon: Sparkles,
    tint: "text-[#386A4A] dark:text-[#9BD0A6]",
    border: "border-[#386A4A]/25 bg-[#386A4A]/[0.09]",
    dot: "bg-[#386A4A] dark:bg-[#9BD0A6]",
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
  queued: { icon: Circle, label: "Queued", className: "text-[var(--color-text-secondary)]" },
  running: { icon: Loader2, label: "Running", className: "text-[#B9573D] dark:text-[#F0A18A]", spin: true },
  complete: { icon: CheckCircle2, label: "Done", className: "text-[#386A4A] dark:text-[#9BD0A6]" },
  failed: { icon: XCircle, label: "Failed", className: "text-[#B3261E] dark:text-[#F2B8B5]" },
};
