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
    text: "text-[#b3adff]",
    bg: "bg-[rgba(108,99,255,0.14)]",
    border: "border-[rgba(108,99,255,0.3)]",
    dot: "bg-[#8b85ff]",
    glow: "group-hover:shadow-[0_0_44px_rgba(108,99,255,0.13)]",
    icon: Target,
  },
  cyan: {
    text: "text-[#7fe8ff]",
    bg: "bg-[rgba(0,217,255,0.12)]",
    border: "border-[rgba(0,217,255,0.28)]",
    dot: "bg-[#00d9ff]",
    glow: "group-hover:shadow-[0_0_44px_rgba(0,217,255,0.1)]",
    icon: FileText,
  },
  green: {
    text: "text-[#86efac]",
    bg: "bg-[rgba(34,197,94,0.12)]",
    border: "border-[rgba(34,197,94,0.28)]",
    dot: "bg-emerald-400",
    glow: "group-hover:shadow-[0_0_44px_rgba(34,197,94,0.1)]",
    icon: BarChart3,
  },
  amber: {
    text: "text-[#fcd34d]",
    bg: "bg-[rgba(245,158,11,0.12)]",
    border: "border-[rgba(245,158,11,0.28)]",
    dot: "bg-amber-400",
    glow: "group-hover:shadow-[0_0_44px_rgba(245,158,11,0.1)]",
    icon: Compass,
  },
  rose: {
    text: "text-[#fda4af]",
    bg: "bg-[rgba(244,63,94,0.12)]",
    border: "border-[rgba(244,63,94,0.28)]",
    dot: "bg-rose-400",
    glow: "group-hover:shadow-[0_0_44px_rgba(244,63,94,0.1)]",
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
