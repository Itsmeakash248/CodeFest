"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import type { WorkflowNode, WorkflowStatus } from "@/lib/types";
import { WORKFLOW_NODE_DEFS } from "@/lib/workflow/nodes";
import { NODE_VISUALS, STATUS_VISUAL } from "@/components/dashboard/nodeVisuals";
import { formatMs } from "@/components/dashboard/utils";
import { cn } from "@/components/ui/cn";

interface WorkflowNodeCardProps {
  node: WorkflowNode;
  index: number;
  selected: boolean;
  status?: WorkflowStatus;
  elapsedMs?: number;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function WorkflowNodeCard({
  node,
  index,
  selected,
  status,
  elapsedMs,
  disabled,
  onSelect,
  onRemove,
}: WorkflowNodeCardProps) {
  const def = WORKFLOW_NODE_DEFS[node.type];
  const visual = NODE_VISUALS[node.type];
  const Icon = visual.icon;
  const state = status ? STATUS_VISUAL[status] : null;
  const StateIcon = state?.icon;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { from: "canvas" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-30 opacity-40")}
    >
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border bg-[var(--color-surface)] px-2 py-2 transition-all duration-200",
          selected
            ? "border-[#6c63ff]/45 bg-[#6c63ff]/[0.07] shadow-[0_0_0_1px_rgba(108,99,255,0.1),0_8px_24px_rgba(0,0,0,0.35)]"
            : "border-white/[0.07] hover:border-white/[0.13] hover:bg-[var(--color-surface-container)]",
          status === "running" && !selected && "border-[#6c63ff]/30",
          status === "complete" && !selected && "border-emerald-400/15",
        )}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label={`Reorder ${def.label} node`}
          title="Drag to reorder"
          className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text-secondary)] disabled:cursor-not-allowed"
        >
          <GripVertical size={12} />
        </button>

        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", visual.border, visual.tint)}>
          <Icon size={13} strokeWidth={1.7} />
        </span>

        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left" aria-pressed={selected}>
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[6.5px] tabular-nums text-[var(--color-text-faint)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="truncate text-[11.5px] font-medium text-[var(--color-text-primary)]">{def.label}</span>
          </span>
          <span className="mt-0.5 block truncate font-mono text-[7px] uppercase tracking-[0.05em] text-[var(--color-text-faint)]">
            {def.outputs}
          </span>
        </button>

        {state && StateIcon ? (
          <span
            className={cn("hidden shrink-0 items-center gap-1 font-mono text-[6.5px] uppercase tracking-[0.05em] sm:flex", state.className)}
            title={state.label}
          >
            <StateIcon size={9} className={state.spin ? "animate-spin" : ""} />
            <span className="hidden lg:inline">{status === "complete" ? formatMs(elapsedMs) : state.label}</span>
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${def.label}`}
          title="Remove node"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-text-faint)] opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
