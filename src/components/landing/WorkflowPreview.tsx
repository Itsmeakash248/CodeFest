"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  GripVertical,
  Loader2,
  Play,
  RotateCcw,
  Target,
  Workflow,
} from "lucide-react";
import Button from "@/components/ui/Button";

const NODES = [
  {
    label: "Set target role",
    output: "Frontend Engineer · Entry level",
    icon: Target,
    tint: "text-[#fcd34d]",
    bg: "bg-amber-500/10 border-amber-400/20",
  },
  {
    label: "Generate questions",
    output: "5 role-specific prompts",
    icon: FileText,
    tint: "text-[#7fe8ff]",
    bg: "bg-cyan-500/10 border-cyan-400/20",
  },
  {
    label: "Mock interview",
    output: "Voice on · follow-ups armed",
    icon: Workflow,
    tint: "text-[#b3adff]",
    bg: "bg-violet-500/10 border-violet-400/20",
  },
  {
    label: "Evaluate answers",
    output: "4 rubric scores · evidence",
    icon: BarChart3,
    tint: "text-[#86efac]",
    bg: "bg-emerald-500/10 border-emerald-400/20",
  },
  {
    label: "Practice plan",
    output: "3 actions · STAR blueprint",
    icon: ArrowRight,
    tint: "text-[#fda4af]",
    bg: "bg-rose-500/10 border-rose-400/20",
  },
];

export default function WorkflowPreview() {
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (active >= NODES.length) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setActive((current) => current + 1), 680);
    return () => window.clearTimeout(timer);
  }, [running, active]);

  const complete = !running && active >= NODES.length;

  function run() {
    setActive(0);
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setActive(-1);
  }

  return (
    <div className="glass overflow-hidden rounded-[18px]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] bg-black/15 px-3.5 py-2.5">
        <div className="mr-auto flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[#b3adff]">
            <Workflow size={12} aria-hidden="true" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8b8ba3]">
            Workflow builder
          </span>
        </div>
        <span className="chip chip-accent" style={{ fontSize: "9px" }}>30-minute drill</span>
        <span className="chip" style={{ fontSize: "9px" }}>Full prep loop</span>
        <span className="chip" style={{ fontSize: "9px" }}>Resume sprint</span>
      </div>

      <div className="p-4">
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-[13px] font-semibold text-white">30-minute drill</p>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#6f7284]">
                5 nodes · local engine
              </p>
            </div>
            <div className="flex gap-1.5">
              {running || complete ? (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Reset preview"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#9ca3af] transition-colors hover:text-white"
                >
                  <RotateCcw size={13} />
                </button>
              ) : null}
              <Button
                variant="primary"
                size="sm"
                onClick={run}
                disabled={running}
                loading={running}
                aria-label="Run the sample workflow preview"
              >
                {running ? "Running" : complete ? "Run again" : "Run"}
                {!running ? <Play size={12} aria-hidden="true" /> : null}
              </Button>
            </div>
          </div>

          <div className="relative space-y-1.5">
            {NODES.map((node, index) => {
              const state =
                complete || index < active ? "complete" : running && index === active ? "running" : "queued";
              const Icon = node.icon;
              return (
                <div key={node.label} className="relative">
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 left-[19px] h-1.5 w-px bg-white/10"
                    />
                  ) : null}
                  <div
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-300 ${
                      state === "running"
                        ? "border-[#6c63ff]/40 bg-[#6c63ff]/[0.07]"
                        : state === "complete"
                          ? "border-white/[0.07] bg-white/[0.03]"
                          : "border-white/[0.05] bg-white/[0.015] opacity-70"
                    }`}
                  >
                    <GripVertical size={12} className="shrink-0 text-[#4f5262]" aria-hidden="true" />
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${node.bg} ${node.tint}`}>
                      <Icon size={11} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium text-[#e4e4ee]">{node.label}</p>
                      <p className="truncate font-mono text-[8px] uppercase tracking-[0.06em] text-[#6f7284]">
                        {node.output}
                      </p>
                    </div>
                    <span className="shrink-0">
                      {state === "complete" ? (
                        <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-emerald-300">
                          <Check size={10} /> done
                        </span>
                      ) : state === "running" ? (
                        <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[#a8a2ff]">
                          <Loader2 size={10} className="animate-spin" /> running
                        </span>
                      ) : (
                        <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[#5f6273]">
                          queued
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2.5 border-t border-white/[0.05] pt-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6c63ff] to-[#00d9ff] transition-[width] duration-500"
                style={{ width: `${Math.max(0, Math.min(100, (active / NODES.length) * 100))}%` }}
              />
            </div>
            <span className="font-mono text-[8.5px] tabular-nums text-[#777a8e]">
              {complete ? "complete" : running ? `${Math.min(active + 1, NODES.length)} / 5` : "idle"}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#5f6273]">
            Palette
          </span>
          {["Upload resume", "Set role", "Resume review", "Skill gap", "Questions", "Evaluate"].map((item) => (
            <span
              key={item}
              className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 font-mono text-[8px] text-[#8b8ba3]"
            >
              + {item}
            </span>
          ))}
        </div>

        {complete ? (
          <div className="animate-rise mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] px-3 py-2.5">
            <Check size={13} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
            <p className="text-[10.5px] leading-relaxed text-[#b7d9c6]">
              Preview complete. In the workspace, every node streams its status and output into the run console.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
