import {
  BarChart3,
  Compass,
  FileText,
  MessageSquare,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { Agent, AgentId } from "@/lib/types";
import { AGENT_MAP } from "@/lib/agents/agents";
import { cn } from "@/components/ui/cn";

export interface AccentVisual {
  text: string;
  bg: string;
  border: string;
  dot: string;
  glow: string;
  icon: LucideIcon;
}

export const ACCENTS: Record<Agent["accent"], AccentVisual> = {
  violet: {
    text: "text-[var(--color-tertiary)]",
    bg: "bg-[var(--color-tertiary)]/12 dark:bg-[var(--color-tertiary)]/15",
    border: "border-[var(--color-tertiary)]/30",
    dot: "bg-[var(--color-tertiary)]",
    glow: "group-hover:shadow-[0_0_32px_rgba(98,91,138,0.22)]",
    icon: Target,
  },
  cyan: {
    text: "text-[var(--color-secondary)]",
    bg: "bg-[var(--color-secondary)]/12 dark:bg-[var(--color-secondary)]/15",
    border: "border-[var(--color-secondary)]/30",
    dot: "bg-[var(--color-secondary)]",
    glow: "group-hover:shadow-[0_0_32px_rgba(104,107,78,0.22)]",
    icon: FileText,
  },
  green: {
    text: "text-[var(--color-success)]",
    bg: "bg-[var(--color-success)]/12 dark:bg-[var(--color-success)]/15",
    border: "border-[var(--color-success)]/30",
    dot: "bg-[var(--color-success)]",
    glow: "group-hover:shadow-[0_0_32px_rgba(56,106,74,0.22)]",
    icon: BarChart3,
  },
  amber: {
    text: "text-[var(--color-warning)]",
    bg: "bg-[var(--color-warning)]/12 dark:bg-[var(--color-warning)]/15",
    border: "border-[var(--color-warning)]/30",
    dot: "bg-[var(--color-warning)]",
    glow: "group-hover:shadow-[0_0_32px_rgba(138,91,22,0.22)]",
    icon: Compass,
  },
  rose: {
    text: "text-[var(--color-primary)]",
    bg: "bg-[var(--color-primary)]/12 dark:bg-[var(--color-primary)]/15",
    border: "border-[var(--color-primary)]/30",
    dot: "bg-[var(--color-primary)]",
    glow: "group-hover:shadow-[0_0_32px_rgba(185,87,61,0.22)]",
    icon: MessageSquare,
  },
};

export function agentAccent(agentId: AgentId): AccentVisual {
  return ACCENTS[AGENT_MAP[agentId].accent];
}

export function AgentGlyph({
  agentId,
  size = 18,
  boxed = false,
  boxSize = "h-9 w-9",
  className,
}: {
  agentId: AgentId;
  size?: number;
  boxed?: boolean;
  boxSize?: string;
  className?: string;
}) {
  const accent = agentAccent(agentId);
  const Icon = accent.icon;
  if (!boxed) {
    return <Icon size={size} strokeWidth={1.7} className={cn(accent.text, className)} aria-hidden="true" />;
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] border",
        boxSize,
        accent.bg,
        accent.border,
        accent.text,
        className,
      )}
    >
      <Icon size={size} strokeWidth={1.7} aria-hidden="true" />
    </span>
  );
}

export function AgentAvatar({ agentId, size = 34 }: { agentId: AgentId; size?: number }) {
  return <AgentGlyph agentId={agentId} size={Math.round(size * 0.46)} boxed boxSize="h-full w-full" className="rounded-xl" />;
}
