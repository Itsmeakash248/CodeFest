import { cn } from "@/components/ui/cn";
import { scoreColor } from "@/components/ui/Badge";

interface ScoreBarProps {
  label: string;
  score: number;
  weight?: number;
  className?: string;
  compact?: boolean;
}

export default function ScoreBar({ label, score, weight, className, compact = false }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className={cn("truncate text-[#c5c5d4]", compact ? "text-[11.5px]" : "text-[12.5px]")}>
          {label}
        </span>
        <span className="flex items-baseline gap-1.5 font-mono text-[11px] tabular-nums text-white">
          {clamped}
          {weight ? <span className="text-[9px] text-[#6b7280]">{Math.round(weight * 100)}%</span> : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${scoreColor(clamped)}99, ${scoreColor(clamped)})`,
            transition: "width 800ms cubic-bezier(0.2,0.7,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}
