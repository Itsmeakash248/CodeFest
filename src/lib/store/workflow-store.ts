"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  WorkflowEvent,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowRun,
  WorkflowStatus,
} from "@/lib/types";
import { createWorkflowNode } from "@/lib/workflow/nodes";
import { nodesFromTemplate, templateById } from "@/lib/workflow/templates";
import { uid } from "@/lib/text";

interface WorkflowState {
  nodes: WorkflowNode[];
  selectedNodeId: string | null;
  runs: WorkflowRun[];
  workflowName: string;
  isRunning: boolean;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  addNode: (type: WorkflowNodeType) => void;
  removeNode: (id: string) => void;
  updateNodeConfig: (id: string, key: string, value: string | number) => void;
  selectNode: (id: string | null) => void;
  loadTemplate: (templateId: string) => void;
  clearNodes: () => void;
  beginRun: () => string;
  applyEvent: (event: WorkflowEvent) => void;
  clearRuns: () => void;
}

const initialNodes = nodesFromTemplate("drill-30");

function withProgress(run: WorkflowRun): WorkflowRun {
  const total = run.nodes.length || 1;
  const finished = run.nodes.filter(
    (node) => node.status === "complete" || node.status === "failed",
  ).length;
  return { ...run, progress: Math.round((finished / total) * 100) };
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      selectedNodeId: initialNodes[0]?.id ?? null,
      runs: [],
      workflowName: "30-minute drill",
      isRunning: false,
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      setNodes: (nodes) => set({ nodes, workflowName: "Custom pipeline" }),

      addNode: (type) => {
        const node = createWorkflowNode(type);
        set((state) => ({
          nodes: [...state.nodes, node],
          selectedNodeId: node.id,
          workflowName: state.workflowName === "30-minute drill" ? "Custom pipeline" : state.workflowName,
        }));
      },

      removeNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
      },

      updateNodeConfig: (id, key, value) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, config: { ...node.config, [key]: value } } : node,
          ),
        }));
      },

      selectNode: (id) => set({ selectedNodeId: id }),

      loadTemplate: (templateId) => {
        const template = templateById(templateId);
        const nodes = nodesFromTemplate(templateId);
        set({
          nodes,
          selectedNodeId: nodes[0]?.id ?? null,
          workflowName: template?.name ?? "Custom pipeline",
        });
      },

      clearNodes: () => set({ nodes: [], selectedNodeId: null, workflowName: "Custom pipeline" }),

      beginRun: () => {
        if (get().isRunning) return "";
        const { nodes, workflowName } = get();
        if (nodes.length === 0) return "";
        const runId = uid("run");
        const run: WorkflowRun = {
          id: runId,
          workflowName,
          startedAt: Date.now(),
          status: "running",
          progress: 0,
          nodes: nodes.map((node) => ({ nodeId: node.id, status: "queued" as WorkflowStatus })),
        };
        set((state) => ({
          runs: [run, ...state.runs].slice(0, 8),
          isRunning: true,
        }));
        return runId;
      },

      applyEvent: (event) => {
        if (!event.runId) return;
        set((state) => {
          // Tolerate a server-generated run id: if it is unknown, bind to the
          // single running run created by beginRun().
          const fallback = state.runs.find((run) => run.status === "running");
          const targetId = state.runs.some((run) => run.id === event.runId)
            ? event.runId
            : fallback?.id;

          const runs = state.runs.map((run) => {
            if (run.id !== targetId) return run;

            if (event.type === "run-start") {
              return { ...run, status: "running" as WorkflowStatus, progress: 0 };
            }

            if (event.type === "run-complete") {
              return {
                ...run,
                status: "complete" as WorkflowStatus,
                progress: 100,
                summary: event.summary ?? "Workflow complete",
              };
            }

            if (event.type === "error") {
              return {
                ...run,
                status: "failed" as WorkflowStatus,
                summary: event.message ?? "Workflow failed",
              };
            }

            if (!event.nodeId) return run;

            const nodes = run.nodes.map((node) =>
              node.nodeId === event.nodeId
                ? {
                    ...node,
                    status: event.status ?? node.status,
                    output: event.output ?? node.output,
                    metrics: event.metrics ?? node.metrics,
                    elapsedMs: event.elapsedMs ?? node.elapsedMs,
                    error: event.type === "node-error" ? event.message ?? "Node failed" : node.error,
                  }
                : node,
            );

            return withProgress({
              ...run,
              status: "running" as WorkflowStatus,
              nodes,
              progress: event.progress ?? run.progress,
            });
          });

          const running = runs.some((run) => run.status === "running");
          return { runs, isRunning: running };
        });
      },

      clearRuns: () => set({ runs: [], isRunning: false }),
    }),
    {
      name: "viewpilot.workflow.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        selectedNodeId: state.selectedNodeId,
        workflowName: state.workflowName,
        runs: state.runs,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export const WORKFLOW_NAME_FALLBACK = "Custom pipeline";
