import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type Tone = "neutral" | "accent" | "cyan" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "",
  accent: "chip-accent",
  cyan: "chip-cyan",
  success: "chip-success",
  warning: "chip-warning",
  danger: "chip-danger",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

export default function Badge({ children, tone = "neutral", dot = false, className }: BadgeProps) {
  return (
    <span className={cn("chip", tones[tone], className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function scoreTone(score: number): Tone {
  if (score >= 80) return "success";
  if (score >= 65) return "cyan";
  if (score >= 50) return "warning";
  return "danger";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 65) return "#00D9FF";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}
