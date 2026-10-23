"use client";

import { useDraggable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { WorkflowNodeType } from "@/lib/types";
import { WORKFLOW_NODE_DEFS } from "@/lib/workflow/nodes";
import { CATEGORY_GROUPS, NODE_VISUALS } from "@/components/dashboard/nodeVisuals";
import { cn } from "@/components/ui/cn";

interface NodePaletteProps {
  onAdd: (type: WorkflowNodeType) => void;
  disabled?: boolean;
}

function PaletteItem({
  type,
  disabled,
  onAdd,
}: {
  type: WorkflowNodeType;
  disabled?: boolean;
  onAdd: (type: WorkflowNodeType) => void;
}) {
  const def = WORKFLOW_NODE_DEFS[type];
  const visual = NODE_VISUALS[type];
  const Icon = visual.icon;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { from: "palette", type },
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onAdd(type)}
      disabled={disabled}
      title={`Drag into the canvas, or click to add ${def.label}`}
      aria-label={`Add ${def.label} node`}
      className={cn(
        "group flex cursor-grab touch-none items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-1.5 text-left transition-colors hover:border-white/[0.14] hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40",
        isDragging && "opacity-50",
      )}
    >
      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border", visual.border, visual.tint)}>
        <Icon size={10} strokeWidth={1.8} />
      </span>
      <span className="truncate text-[9.5px] text-[#b8b8c9] transition-colors group-hover:text-white">
        {def.label}
      </span>
      <Plus size={9} className="ml-auto shrink-0 text-[#4f5262] transition-colors group-hover:text-[#c9c5ff]" />
    </button>
  );
}

export default function NodePalette({ onAdd, disabled }: NodePaletteProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-white/[0.06] bg-[#0b0b11]/50 px-3 py-2">
      <span className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.14em] text-[#565969]">
        Palette
        <span className="hidden font-sans text-[6px] normal-case tracking-normal text-[#3d3f4e] sm:inline">
          drag or click
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.id} className="flex items-center gap-1">
            <span className="hidden font-mono text-[6px] uppercase tracking-[0.1em] text-[#4f5262] xl:inline">
              {group.label}
            </span>
            {group.types.map((type) => (
              <PaletteItem key={type} type={type} onAdd={onAdd} disabled={disabled} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
