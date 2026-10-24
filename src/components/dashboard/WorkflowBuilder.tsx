"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Layers3,
  Loader2,
  PanelRight,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";
import type { WorkflowNodeType } from "@/lib/types";
import { WORKFLOW_TEMPLATES } from "@/lib/workflow/templates";
import { createWorkflowNode, WORKFLOW_NODE_DEFS } from "@/lib/workflow/nodes";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { runWorkflow } from "@/lib/client/api";
import { ROLES, LEVELS, INTERVIEW_TYPES, DIFFICULTIES } from "@/lib/data/roles";
import NodePalette from "@/components/dashboard/NodePalette";
import WorkflowNodeCard from "@/components/dashboard/WorkflowNodeCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import { CATEGORY_GROUPS, NODE_VISUALS } from "@/components/dashboard/nodeVisuals";
import { formatMs } from "@/components/dashboard/utils";
import { cn } from "@/components/ui/cn";

interface WorkflowBuilderProps {
  onToast: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenRight: () => void;
}

export default function WorkflowBuilder({ onToast, onOpenRight }: WorkflowBuilderProps) {
  const nodes = useWorkflowStore((state) => state.nodes);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const workflowName = useWorkflowStore((state) => state.workflowName);
  const runs = useWorkflowStore((state) => state.runs);
  const isRunning = useWorkflowStore((state) => state.isRunning);
  const addNode = useWorkflowStore((state) => state.addNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);
  const loadTemplate = useWorkflowStore((state) => state.loadTemplate);
  const clearNodes = useWorkflowStore((state) => state.clearNodes);
  const beginRun = useWorkflowStore((state) => state.beginRun);
  const applyEvent = useWorkflowStore((state) => state.applyEvent);

  const { setNodeRef: setCanvasRef, isOver } = useDroppable({ id: "canvas" });
  const [activeDrag, setActiveDrag] = useState<
    { kind: "palette"; type: WorkflowNodeType } | { kind: "node"; id: string } | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const latestRun = runs[0] ?? null;
  const statusFor = (nodeId: string) => latestRun?.nodes.find((item) => item.nodeId === nodeId);
  const ids = nodes.map((node) => node.id);

  const draggingNode =
    activeDrag?.kind === "palette" ? null : nodes.find((node) => node.id === activeDrag?.id) ?? null;

  function insertNode(type: WorkflowNodeType, index: number) {
    const node = createWorkflowNode(type);
    const next = [...nodes];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, node);
    useWorkflowStore.setState({ nodes: next, selectedNodeId: node.id });
    setError(null);
  }

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { from?: string; type?: WorkflowNodeType } | undefined;
    if (data?.from === "palette" && data.type) {
      setActiveDrag({ kind: "palette", type: data.type });
    } else {
      setActiveDrag({ kind: "node", id: String(event.active.id) });
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDrag(null);
    if (!over) return;

    const data = active.data.current as { from?: string; type?: WorkflowNodeType } | undefined;
    if (data?.from === "palette" && data.type) {
      let index = nodes.length;
      if (over.id !== "canvas") {
        const position = nodes.findIndex((node) => node.id === over.id);
        if (position >= 0) index = position;
      }
      insertNode(data.type, index);
      return;
    }

    if (over.id === "canvas") return;
    const oldIndex = nodes.findIndex((node) => node.id === active.id);
    const newIndex = nodes.findIndex((node) => node.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
      useWorkflowStore.setState({ nodes: arrayMove(nodes, oldIndex, newIndex) });
    }
  }

  async function run() {
    if (isRunning) return;
    if (!nodes.length) {
      setError("Add at least one node, or load a template from the toolbar.");
      return;
    }
    setError(null);
    const runId = beginRun();
    if (!runId) return;
    try {
      await runWorkflow({
        runId,
        name: workflowName,
        nodes,
        onEvent: (event) => {
          applyEvent(event);
          if (event.type === "run-complete") {
            onToast("Workflow complete. Every node reported in.", "success");
          }
          if (event.type === "error") {
            onToast(event.message ?? "The workflow stopped on an error.", "error");
          }
        },
      });
    } catch (cause) {
      useWorkflowStore.setState({ isRunning: false });
      const message = cause instanceof Error ? cause.message : "The workflow could not start.";
      setError(message);
      onToast(message, "error");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* toolbar */}
        <div className="shrink-0 border-b border-white/[0.06] bg-[var(--color-background)]">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[var(--color-tertiary)]">
              <WorkflowIcon size={14} />
            </span>
            <div className="mr-2 min-w-0">
              <p className="truncate font-display text-[13px] font-semibold leading-tight text-[var(--color-text-primary)]">
                {workflowName}
              </p>
              <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                {nodes.length} node{nodes.length === 1 ? "" : "s"} · local execution
              </p>
            </div>

            <div className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 pb-0.5 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:pb-0">
              <span className="mr-1 hidden shrink-0 font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)] lg:inline">
                Templates
              </span>
              {WORKFLOW_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    loadTemplate(template.id);
                    setError(null);
                  }}
                  disabled={isRunning}
                  title={`${template.description} · ${template.minutes}`}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.06em] transition-colors disabled:opacity-40",
                    workflowName === template.name
                      ? "border-[#6c63ff]/35 bg-[#6c63ff]/12 text-[var(--color-tertiary)]"
                      : "border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  {template.name}
                </button>
              ))}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={isRunning || nodes.length === 0}
                title={nodes.length === 0 ? "Nothing to clear" : "Clear the canvas"}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2 font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] disabled:opacity-35"
              >
                <Trash2 size={11} />
                <span className="hidden md:inline">Clear</span>
              </button>
              <button
                type="button"
                onClick={onOpenRight}
                aria-label="Open run status panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] xl:hidden"
              >
                <PanelRight size={13} />
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void run()}
                loading={isRunning}
                disabled={isRunning || nodes.length === 0}
                className="!h-8 !px-3 !text-[11px]"
              >
                {isRunning ? "Running" : "Run workflow"}
                {!isRunning ? <Play size={11} /> : null}
              </Button>
            </div>
          </div>

          {latestRun ? (
            <div className="flex items-center gap-2 px-3 pb-2">
              <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-[#6c63ff] to-[#00d9ff] transition-[width] duration-500"
                  style={{ width: `${latestRun.progress}%` }}
                />
              </span>
              <span className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                {latestRun.status === "complete"
                  ? "Last run complete"
                  : latestRun.status === "failed"
                    ? "Last run failed"
                    : `${latestRun.progress}%`}
              </span>
            </div>
          ) : null}
        </div>

        <NodePalette onAdd={(type) => addNode(type)} disabled={isRunning} />

        {error ? (
          <div className="flex items-center gap-2 border-b border-rose-400/15 bg-rose-500/[0.06] px-3 py-2 text-[10.5px] text-rose-200">
            <AlertCircle size={12} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-rose-300/60 hover:text-[var(--color-text-primary)]"
            >
              <X size={11} />
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid w-full max-w-[1080px] gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            {/* canvas */}
            <div>
              <div
                ref={setCanvasRef}
                className={cn(
                  "relative rounded-2xl border border-dashed p-3 transition-colors sm:p-4",
                  isOver || (activeDrag?.kind === "palette" && !nodes.length)
                    ? "border-[#6c63ff]/50 bg-[#6c63ff]/[0.045]"
                    : "border-white/[0.08] bg-[var(--color-surface-container)]",
                  nodes.length === 0 && "min-h-[330px]",
                )}
              >
                {activeDrag?.kind === "palette" ? (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl border border-[#6c63ff]/40 bg-[var(--color-surface)] backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 rounded-xl border border-[#6c63ff]/35 bg-[var(--color-surface-container)] px-3 py-2 text-[11px] text-[var(--color-tertiary)]">
                      <Plus size={13} /> Drop to add {WORKFLOW_NODE_DEFS[activeDrag.type].label}
                    </div>
                  </div>
                ) : null}

                {nodes.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-4 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-[var(--color-surface-container)] text-[#8d86ff]">
                      <Layers3 size={20} />
                    </span>
                    <p className="mt-4 font-display text-[16px] font-semibold text-[var(--color-text-primary)]">Build the prep loop</p>
                    <p className="mt-1.5 max-w-[300px] text-[11.5px] leading-relaxed text-[var(--color-text-secondary)]">
                      Drag a node here or load a template. Every node reports its status to the run
                      panel on the right.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {WORKFLOW_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => loadTemplate(template.id)}
                          className="rounded-full border border-white/[0.08] bg-[var(--color-surface-container)] px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.06em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute bottom-4 left-[10px] top-4 w-px bg-gradient-to-b from-[#6c63ff]/30 via-white/[0.08] to-transparent"
                    />
                    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {nodes.map((node, index) => {
                          const runNode = statusFor(node.id);
                          return (
                            <div key={node.id} className="relative pl-5">
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute left-[6px] top-1/2 h-[8px] w-[8px] -translate-y-1/2 rounded-full border-2 border-[var(--color-surface)]",
                                  runNode?.status === "complete"
                                    ? "bg-emerald-400"
                                    : runNode?.status === "running"
                                      ? "animate-pulse-soft bg-[var(--color-tertiary)]"
                                      : runNode?.status === "failed"
                                        ? "bg-rose-400"
                                        : "bg-[var(--color-outline)]",
                                )}
                              />
                              <WorkflowNodeCard
                                node={node}
                                index={index}
                                selected={node.id === selectedNodeId}
                                status={runNode?.status}
                                elapsedMs={runNode?.elapsedMs}
                                disabled={isRunning}
                                onSelect={() => selectNode(node.id)}
                                onRemove={() => removeNode(node.id)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </SortableContext>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5">
                      <span className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                        Drag to reorder · click to configure
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                        <ArrowRight size={8} /> {nodes.length} steps · ~
                        {Math.round(
                          nodes.reduce((total, node) => total + WORKFLOW_NODE_DEFS[node.type].estimatedMs, 0) / 1000,
                        )}
                        s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* inspector */}
            <aside className="self-start rounded-2xl border border-white/[0.07] bg-[var(--color-surface)] lg:sticky lg:top-0">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
                <SlidersHorizontal size={12} className="text-[var(--color-text-secondary)]" />
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  Node inspector
                </span>
                {selectedNode ? (
                  <button
                    type="button"
                    onClick={() => selectNode(null)}
                    aria-label="Close inspector"
                    className="ml-auto flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={11} />
                  </button>
                ) : null}
              </div>

              {selectedNode ? (
                <Inspector
                  key={selectedNode.id}
                  node={selectedNode}
                  running={isRunning}
                  onChange={(key, value) => updateNodeConfig(selectedNode.id, key, value)}
                  onRemove={() => removeNode(selectedNode.id)}
                />
              ) : (
                <div className="p-3.5">
                  <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                    Select a node to set the role, difficulty or resume context. Configuration is
                    stored locally with the pipeline.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {CATEGORY_GROUPS.map((group) => (
                      <div key={group.id} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-[var(--color-surface-container)] px-2 py-1.5">
                        <span className="flex gap-0.5">
                          {group.types.map((type) => {
                            const Visual = NODE_VISUALS[type];
                            const Icon = Visual.icon;
                            return <Icon key={type} size={8} className={Visual.tint} />;
                          })}
                        </span>
                        <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                          {group.label}
                        </span>
                        <span className="ml-auto font-mono text-[6.5px] text-[var(--color-text-faint)]">{group.types.length}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#6c63ff]/15 bg-[#6c63ff]/[0.05] px-2.5 py-2">
                    <Sparkles size={11} className="mt-0.5 shrink-0 text-[var(--color-tertiary)]" />
                    <p className="text-[10px] leading-relaxed text-[var(--color-text-secondary)]">
                      Tip: the 30-minute drill is the fastest path from role to report.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag?.kind === "palette" ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#6c63ff]/35 bg-[var(--color-surface-container)] px-3 py-2 shadow-2xl">
            {(() => {
              const Visual = NODE_VISUALS[activeDrag.type];
              const Icon = Visual.icon;
              return <Icon size={12} className={Visual.tint} />;
            })()}
            <span className="text-[11px] text-[var(--color-text-primary)]">{WORKFLOW_NODE_DEFS[activeDrag.type].label}</span>
          </div>
        ) : draggingNode ? (
          <div className="w-[420px] max-w-[80vw] rounded-xl border border-[#6c63ff]/35 bg-[var(--color-surface-container)] px-3 py-2.5 shadow-2xl">
            <p className="text-[11px] text-[var(--color-text-primary)]">{WORKFLOW_NODE_DEFS[draggingNode.type].label}</p>
            <p className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
              {WORKFLOW_NODE_DEFS[draggingNode.type].outputs}
            </p>
          </div>
        ) : null}
      </DragOverlay>

      <ConfirmDialog
        open={confirmClear}
        title="Clear the workflow?"
        body="Every node and its configuration will be removed from this canvas. Saved chat sessions and the latest report are untouched."
        confirmLabel="Clear canvas"
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearNodes();
          setConfirmClear(false);
          onToast("Workflow canvas cleared.", "info");
        }}
      />
    </DndContext>
  );
}

function Inspector({
  node,
  running,
  onChange,
  onRemove,
}: {
  node: ReturnType<typeof useWorkflowStore.getState>["nodes"][number];
  running: boolean;
  onChange: (key: string, value: string | number) => void;
  onRemove: () => void;
}) {
  const def = WORKFLOW_NODE_DEFS[node.type];
  const Visual = NODE_VISUALS[node.type];
  const Icon = Visual.icon;
  const config = node.config ?? {};

  return (
    <div className="p-3.5">
      <div className="flex items-start gap-2">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", Visual.border, Visual.tint)}>
          <Icon size={14} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[13px] font-semibold text-[var(--color-text-primary)]">{def.label}</p>
          <p className="mt-0.5 font-mono text-[6.5px] uppercase tracking-[0.07em] text-[var(--color-text-faint)]">
            {def.category} · ~{formatMs(def.estimatedMs)}
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[10.5px] leading-relaxed text-[var(--color-text-secondary)]">{def.description}</p>

      <div className="mt-3 space-y-2.5">
        {node.type === "upload-resume" ? (
          <div>
            <label htmlFor="node-resume" className="mb-1 block text-[10px] font-medium text-[var(--color-text-primary)]">
              Resume text
            </label>
            <textarea
              id="node-resume"
              value={String(config.resume ?? "")}
              onChange={(event) => onChange("resume", event.target.value)}
              rows={5}
              className="input !text-[10.5px]"
              placeholder="Paste resume text. Stays in this browser."
            />
            <p className="mt-1 font-mono text-[7px] text-[var(--color-text-faint)]">
              {String(config.resume ?? "").length} chars · local only
            </p>
          </div>
        ) : null}

        {node.type === "set-target-role" ? (
          <>
            <SelectField
              label="Role"
              value={String(config.role ?? ROLES[0].label)}
              onChange={(value) => onChange("role", value)}
              options={ROLES.map((role) => role.label)}
            />
            <SelectField
              label="Level"
              value={String(config.level ?? LEVELS[1])}
              onChange={(value) => onChange("level", value)}
              options={[...LEVELS]}
            />
            <SelectField
              label="Interview type"
              value={String(config.type ?? INTERVIEW_TYPES[0])}
              onChange={(value) => onChange("type", value)}
              options={[...INTERVIEW_TYPES]}
            />
            <SelectField
              label="Difficulty"
              value={String(config.difficulty ?? DIFFICULTIES[1])}
              onChange={(value) => onChange("difficulty", value)}
              options={[...DIFFICULTIES]}
            />
          </>
        ) : null}

        {node.type === "generate-questions" ? (
          <>
            <SelectField
              label="Questions"
              value={String(config.count ?? 5)}
              onChange={(value) => onChange("count", Number(value))}
              options={["3", "5", "7"]}
            />
            <SelectField
              label="Type"
              value={String(config.type ?? INTERVIEW_TYPES[0])}
              onChange={(value) => onChange("type", value)}
              options={[...INTERVIEW_TYPES]}
            />
            <SelectField
              label="Difficulty"
              value={String(config.difficulty ?? DIFFICULTIES[1])}
              onChange={(value) => onChange("difficulty", value)}
              options={[...DIFFICULTIES]}
            />
          </>
        ) : null}

        {node.type === "mock-interview" ? (
          <div>
            <span className="mb-1 block text-[10px] font-medium text-[var(--color-text-primary)]">Answer mode</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] p-[3px]">
              {["voice", "text"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange("mode", mode)}
                  aria-pressed={String(config.mode ?? "voice") === mode}
                  className={cn(
                    "rounded-md py-1.5 font-mono text-[7.5px] uppercase tracking-[0.08em] transition-colors",
                    String(config.mode ?? "voice") === mode
                      ? "bg-[var(--color-surface-container-high)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-[var(--color-text-faint)]">
              Voice falls back to the browser speech engine when ElevenLabs is unavailable.
            </p>
          </div>
        ) : null}

        {!["upload-resume", "set-target-role", "generate-questions", "mock-interview"].includes(node.type) ? (
          <div className="rounded-lg border border-white/[0.05] bg-[var(--color-surface-container)] px-2.5 py-2">
            <p className="font-mono text-[6.5px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">Output</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--color-text-primary)]">{def.outputs}</p>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-[var(--color-text-faint)]">
              No configuration. Reads the output of the previous node.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
        <span className="flex items-center gap-1 font-mono text-[6.5px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
          <ChevronRight size={8} /> Changes save automatically
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={running}
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-1 font-mono text-[6.5px] uppercase tracking-[0.06em] text-[var(--color-text-faint)] transition-colors hover:text-rose-300 disabled:opacity-40"
        >
          <RotateCcw size={8} /> Remove
        </button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const id = `node-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[10px] font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="input !py-1.5 !text-[10.5px]">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
