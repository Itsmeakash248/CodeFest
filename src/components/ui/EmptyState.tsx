import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.018] text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-xl border border-white/[0.08] bg-[var(--color-surface-container)] text-[var(--color-tertiary)]",
          compact ? "h-8 w-8" : "h-11 w-11",
        )}
      >
        <Icon size={compact ? 15 : 18} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <div>
        <p className={cn("font-display font-semibold text-[var(--color-text-primary)]", compact ? "text-[13.5px]" : "text-[15px]")}>
          {title}
        </p>
        {body ? (
          <p className={cn("mx-auto max-w-[300px] text-[var(--color-text-secondary)]", compact ? "mt-1 text-[11.5px]" : "mt-1.5 text-[12.5px]")}>
            {body}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
