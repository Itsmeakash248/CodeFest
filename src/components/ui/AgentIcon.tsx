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
    text: "text-[#625B8A] dark:text-[#C9BDF7]",
    bg: "bg-[#625B8A]/12 dark:bg-[#C9BDF7]/15",
    border: "border-[#625B8A]/30 dark:border-[#C9BDF7]/30",
    dot: "bg-[#625B8A] dark:bg-[#C9BDF7]",
    glow: "group-hover:shadow-[0_0_32px_rgba(98,91,138,0.22)]",
    icon: Target,
  },
  cyan: {
    text: "text-[#686B4E] dark:text-[#C9CAA7]",
    bg: "bg-[#686B4E]/12 dark:bg-[#C9CAA7]/15",
    border: "border-[#686B4E]/30 dark:border-[#C9CAA7]/30",
    dot: "bg-[#686B4E] dark:bg-[#C9CAA7]",
    glow: "group-hover:shadow-[0_0_32px_rgba(104,107,78,0.22)]",
    icon: FileText,
  },
  green: {
    text: "text-[#386A4A] dark:text-[#9BD0A6]",
    bg: "bg-[#386A4A]/12 dark:bg-[#9BD0A6]/15",
    border: "border-[#386A4A]/30 dark:border-[#9BD0A6]/30",
    dot: "bg-[#386A4A] dark:bg-[#9BD0A6]",
    glow: "group-hover:shadow-[0_0_32px_rgba(56,106,74,0.22)]",
    icon: BarChart3,
  },
  amber: {
    text: "text-[#8A5B16] dark:text-[#F0C078]",
    bg: "bg-[#8A5B16]/12 dark:bg-[#F0C078]/15",
    border: "border-[#8A5B16]/30 dark:border-[#F0C078]/30",
    dot: "bg-[#8A5B16] dark:bg-[#F0C078]",
    glow: "group-hover:shadow-[0_0_32px_rgba(138,91,22,0.22)]",
    icon: Compass,
  },
  rose: {
    text: "text-[#B9573D] dark:text-[#F0A18A]",
    bg: "bg-[#B9573D]/12 dark:bg-[#F0A18A]/15",
    border: "border-[#B9573D]/30 dark:border-[#F0A18A]/30",
    dot: "bg-[#B9573D] dark:bg-[#F0A18A]",
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
