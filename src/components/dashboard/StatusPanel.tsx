"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Clock3,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
  Bot,
  Smile,
  Brain,
  Meh,
} from "lucide-react";
import type { InterviewReport, WorkflowRun } from "@/lib/types";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { useInterviewStore } from "@/lib/store/interview-store";
import { WORKFLOW_NODE_DEFS } from "@/lib/workflow/nodes";
import { fetchRobotStatus, setRobotExpression, type RobotState } from "@/lib/client/api";
import { formatMs, relativeTime } from "@/components/dashboard/utils";
import ScoreRing from "@/components/ui/ScoreRing";
import ScoreBar from "@/components/ui/ScoreBar";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/components/ui/cn";

type Tab = "run" | "report" | "robot";

interface StatusPanelProps {
  open: boolean;
  onClose: () => void;
  onToast: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenWorkflow: () => void;
  robotOnline: boolean | null;
  onRobotStatus: (online: boolean) => void;
}

export default function StatusPanel({
  open,
  onClose,
  onToast,
  onOpenWorkflow,
  robotOnline,
  onRobotStatus,
}: StatusPanelProps) {
  const [tab, setTab] = useState<Tab>("run");
  const [expanded, setExpanded] = useState<string | null>(null);
  const runs = useWorkflowStore((state) => state.runs);
  const nodes = useWorkflowStore((state) => state.nodes);
  const latestReport = useInterviewStore((state) => state.latestReport);
  const hydrate = useInterviewStore((state) => state.hydrate);
  const [robot, setRobot] = useState<RobotState | null>(null);
  const [robotBusy, setRobotBusy] = useState(false);
  const [expression, setExpression] = useState<string>("neutral");

  const run = runs[0] ?? null;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (tab !== "robot") return;
    let alive = true;
    fetchRobotStatus()
      .then((state) => {
        if (!alive) return;
        setRobot(state);
        onRobotStatus(Boolean(state.configured && state.online));
        if (state.expression) setExpression(state.expression);
      })
      .catch(() => {
        if (alive) setRobot({ configured: false, online: false });
      });
    return () => {
      alive = false;
    };
  }, [tab, onRobotStatus]);

  async function refreshRobot() {
    setRobotBusy(true);
    try {
      const state = await fetchRobotStatus();
      setRobot(state);
      onRobotStatus(Boolean(state.configured && state.online));
      if (state.expression) setExpression(state.expression);
    } catch {
      onToast("Could not reach the robot bridge.", "error");
    } finally {
      setRobotBusy(false);
    }
  }

  async function testExpression(next: string) {
    setRobotBusy(true);
    try {
      const state = await setRobotExpression(next);
      setExpression(next);
      setRobot(state);
      onRobotStatus(Boolean(state.configured && state.online));
      if (state.online) onToast(`Robot expression set to ${next}.`, "success");
      else onToast("Robot is offline. Expression kept in the preview.", "info");
    } catch {
      onToast("Robot did not acknowledge the expression.", "error");
    } finally {
      setRobotBusy(false);
    }
  }

  const robotReady = Boolean(robot?.configured && robot.online);

  return (
    <aside
      aria-label="Run status, latest report and robot"
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-[min(360px,92vw)] shrink-0 flex-col border-l border-white/[0.06] bg-[#0b0b11] transition-transform duration-300 ease-out xl:static xl:z-auto xl:w-[332px] xl:translate-x-0",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-[64px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-3.5">
        <CircleDot size={12} className="text-[#00d9ff]" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[13px] font-semibold leading-tight text-white">Run console</p>
          <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#6f7284]">
            {run ? `${run.workflowName} · ${run.status}` : "Nothing running"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close run panel"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8b8ba3] hover:bg-white/[0.05] hover:text-white xl:hidden"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex shrink-0 gap-0.5 border-b border-white/[0.06] px-2.5 py-2">
        {(
          [
            { id: "run" as const, label: "Active run", icon: Loader2 },
            { id: "report" as const, label: "Latest report", icon: Sparkles },
            { id: "robot" as const, label: "Robot", icon: Bot },
          ] satisfies { id: Tab; label: string; icon: typeof Loader2 }[]
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-pressed={active}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 font-mono text-[7.5px] uppercase tracking-[0.05em] transition-colors",
                active ? "bg-white/[0.08] text-white" : "text-[#6f7284] hover:text-[#b8b8c9]",
              )}
            >
              <Icon size={10} className={item.id === "run" && run?.status === "running" ? "animate-spin" : ""} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "run" ? (
          run ? (
            <RunView run={run} expanded={expanded} onExpand={setExpanded} />
          ) : (
            <div className="space-y-3">
              <EmptyState
                icon={Loader2}
                title="No active run"
                body="Build a pipeline and press Run. Node statuses stream in here while the workflow executes."
                action={
                  <button type="button" onClick={onOpenWorkflow} className="btn btn-soft !px-3 !py-2 !text-[11px]">
                    Open workflow builder <ArrowRight size={12} />
                  </button>
                }
              />
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#6f7284]">What streams in</p>
                <div className="mt-2 space-y-1.5">
                  {["Node start and completion", "Elapsed time per step", "Output previews", "Overall progress"].map((item) => (
                    <p key={item} className="flex items-center gap-2 text-[10.5px] text-[#9b9cae]">
                      <Circle size={6} className="text-[#565969]" /> {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : null}

        {tab === "report" ? (
          latestReport ? (
            <ReportView report={latestReport} />
          ) : (
            <EmptyState
              icon={FileText}
              title="No rehearsal yet"
              body="Finish a mock interview to unlock the four-score report here. It stays in this browser."
              action={
                <Link href="/interview" className="btn btn-soft !px-3 !py-2 !text-[11px]">
                  Start a mock interview <ArrowRight size={12} />
                </Link>
              }
            />
          )
        ) : null}

        {tab === "robot" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00d9ff]/20 bg-[#00d9ff]/10 text-[#7fe8ff]">
                  <Bot size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-medium text-white">ESP32-S3 presence</p>
                  <p className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.07em] text-[#6f7284]">
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        robotReady ? "bg-emerald-400" : "bg-[#565969]",
                      )}
                    />
                    {robotReady ? "Online over LAN" : "Offline · optional"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshRobot()}
                  disabled={robotBusy}
                  aria-label="Refresh robot status"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-[#8b8ba3] transition-colors hover:text-white disabled:opacity-40"
                >
                  <RotateCcw size={11} className={robotBusy ? "animate-spin" : ""} />
                </button>
              </div>

              {robot?.battery ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#6f7284]">Battery</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#00d9ff]"
                      style={{ width: `${Math.max(0, Math.min(100, robot.battery))}%` }}
                    />
                  </span>
                  <span className="font-mono text-[8px] text-[#b8b8c9]">{robot.battery}%</span>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#6f7284]">Test expression</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[
                  { id: "happy", label: "Happy", icon: Smile },
                  { id: "thinking", label: "Thinking", icon: Brain },
                  { id: "neutral", label: "Neutral", icon: Meh },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void testExpression(item.id)}
                      disabled={robotBusy || !robotReady}
                      title={robotReady ? `Send ${item.label} to the robot` : "Robot bridge offline"}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 font-mono text-[7px] uppercase tracking-[0.05em] transition-colors",
                        expression === item.id
                          ? "border-[#00d9ff]/30 bg-[#00d9ff]/10 text-[#c9f8ff]"
                          : "border-white/[0.07] bg-white/[0.025] text-[#8b8ba3] hover:text-white",
                        !robotReady && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <Icon size={13} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[9.5px] leading-relaxed text-[#6f7284]">
                {robotReady
                  ? "Expressions sync with the interview: listening, evaluating, encouraging."
                  : "The robot bridge is configured with a server-side LAN URL. Nothing else in the product depends on it."}
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] p-2.5">
              <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-300/70" />
              <p className="text-[9.5px] leading-relaxed text-[#6f7284]">
                Robot presence is optional. The interview runs with browser voice when the bridge is
                offline.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-white/[0.06] px-3.5 py-2.5">
        <p className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[#4f5262]">
          <CircleDot size={7} className="text-emerald-400/70" />
          Every run works offline
        </p>
      </div>
    </aside>
  );
}

function RunView({
  run,
  expanded,
  onExpand,
}: {
  run: WorkflowRun;
  expanded: string | null;
  onExpand: (id: string | null) => void;
}) {
  const nodes = useWorkflowStore((state) => state.nodes);
  const completed = run.nodes.filter((node) => node.status === "complete").length;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-[13px] font-semibold text-white">{run.workflowName}</p>
            <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[#6f7284]">
              Started {relativeTime(run.startedAt)} ago · {run.nodes.length} nodes
            </p>
          </div>
          <span
            className={cn(
              "chip shrink-0 !px-2 !py-[3px] !text-[7px] uppercase",
              run.status === "complete"
                ? "chip-success"
                : run.status === "failed"
                  ? "chip-danger"
                  : "chip-accent",
            )}
          >
            {run.status === "running" ? <Loader2 size={7} className="animate-spin" /> : null}
            {run.status}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
            <span
              className={cn(
                "block h-full rounded-full transition-[width] duration-500",
                run.status === "failed"
                  ? "bg-rose-400"
                  : "bg-gradient-to-r from-[#6c63ff] to-[#00d9ff]",
              )}
              style={{ width: `${run.progress}%` }}
            />
          </span>
          <span className="font-mono text-[8px] tabular-nums text-[#b8b8c9]">{run.progress}%</span>
        </div>
        <p className="mt-2 font-mono text-[6.5px] uppercase tracking-[0.06em] text-[#565969]">
          {completed} / {run.nodes.length} complete
        </p>
      </div>

      <div className="space-y-1">
        {run.nodes.map((nodeRun, index) => {
          const node = nodes.find((item) => item.id === nodeRun.nodeId);
          const label = node ? WORKFLOW_NODE_DEFS[node.type].label : `Step ${index + 1}`;
          const Icon =
            nodeRun.status === "complete"
              ? CheckCircle2
              : nodeRun.status === "running"
                ? Loader2
                : nodeRun.status === "failed"
                  ? XCircle
                  : Circle;
          const open = expanded === nodeRun.nodeId;
          return (
            <div
              key={`${nodeRun.nodeId}-${index}`}
              className={cn(
                "rounded-lg border transition-colors",
                nodeRun.status === "running"
                  ? "border-[#6c63ff]/25 bg-[#6c63ff]/[0.05]"
                  : "border-white/[0.05] bg-white/[0.02]",
              )}
            >
              <button
                type="button"
                onClick={() => onExpand(open ? null : nodeRun.nodeId)}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
                aria-expanded={open}
              >
                <Icon
                  size={10}
                  className={cn(
                    nodeRun.status === "complete"
                      ? "text-emerald-300"
                      : nodeRun.status === "running"
                        ? "animate-spin text-[#a8a2ff]"
                        : nodeRun.status === "failed"
                          ? "text-rose-300"
                          : "text-[#4f5262]",
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[10px]",
                    nodeRun.status === "queued" ? "text-[#6f7284]" : "text-[#d4d4e0]",
                  )}
                >
                  {label}
                </span>
                <span className="font-mono text-[6.5px] tabular-nums text-[#565969]">
                  {formatMs(nodeRun.elapsedMs)}
                </span>
                <ChevronDown
                  size={9}
                  className={cn("shrink-0 text-[#565969] transition-transform", open && "rotate-180")}
                />
              </button>
              {open ? (
                <div className="border-t border-white/[0.05] px-2.5 py-2">
                  {nodeRun.output ? (
                    <p className="text-[9.5px] leading-relaxed text-[#9b9cae]">{nodeRun.output}</p>
                  ) : nodeRun.error ? (
                    <p className="text-[9.5px] leading-relaxed text-rose-300">{nodeRun.error}</p>
                  ) : (
                    <p className="font-mono text-[7px] uppercase tracking-[0.06em] text-[#565969]">
                      {nodeRun.status === "running" ? "Waiting for output…" : "No output yet."}
                    </p>
                  )}
                  {nodeRun.metrics ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(nodeRun.metrics)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="rounded border border-white/[0.06] bg-black/20 px-1.5 py-0.5 font-mono text-[6.5px] text-[#7d7f92]"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {run.summary ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.05] p-2.5">
          <Check size={11} className="mt-0.5 shrink-0 text-emerald-300" />
          <p className="text-[9.5px] leading-relaxed text-[#b7d9c6]">{run.summary}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 font-mono text-[6.5px] uppercase tracking-[0.06em] text-[#4f5262]">
        <Clock3 size={8} /> Streamed node events · {relativeTime(run.startedAt)} ago
      </div>
    </div>
  );
}

function ReportView({ report }: { report: InterviewReport }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div className="flex items-center gap-3">
          <ScoreRing score={report.overall} size={72} stroke={5.5} label="overall" />
          <div className="min-w-0">
            <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#7fe8ff]">{report.band}</p>
            <p className="mt-1 text-[11px] font-medium text-white">
              {report.setup.role}
            </p>
            <p className="mt-0.5 font-mono text-[6.5px] uppercase tracking-[0.06em] text-[#6f7284]">
              {report.setup.level} · {report.setup.type} · {relativeTime(report.generatedAt)} ago
            </p>
          </div>
        </div>
        <p className="mt-2.5 line-clamp-3 text-[10px] leading-relaxed text-[#9b9cae]">{report.summary}</p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="space-y-2.5">
          {report.dimensions.map((dimension) => (
            <ScoreBar
              key={dimension.key}
              label={dimension.label}
              score={dimension.score}
              weight={dimension.weight}
              compact
            />
          ))}
        </div>
      </div>

      <Link href="/interview?report=latest" className="btn btn-soft w-full !py-2.5 !text-[11px]">
        Open full report <ArrowRight size={12} />
      </Link>
      <p className="text-center font-mono text-[6.5px] uppercase tracking-[0.06em] text-[#4f5262]">
        Stored locally · not a hiring decision
      </p>
    </div>
  );
}
