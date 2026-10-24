import {
  ArrowUpRight,
  Bot,
  Check,
  CircleDot,
  GripVertical,
  History,
  Loader2,
  Mic,
  Play,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Volume2,
  Workflow,
} from "lucide-react";
import { AGENTS } from "@/lib/agents/agents";
import type { AgentId } from "@/lib/types";
import { AGENT_MAP } from "@/lib/agents/agents";
import { AgentGlyph } from "@/components/ui/AgentIcon";
import { cn } from "@/components/ui/cn";

type View = "chat" | "workflow" | "interview";

interface WorkspaceMockProps {
  view?: View;
  className?: string;
  /** Slightly larger type for the lead hero. */
  grand?: boolean;
}

const workflowNodes = [
  { label: "Set target role", output: "Frontend Engineer · Entry", state: "done" },
  { label: "Generate questions", output: "5 prompts · mixed", state: "done" },
  { label: "Mock interview", output: "Voice on · follow-ups armed", state: "live" },
  { label: "Evaluate answers", output: "4 rubric scores", state: "queued" },
  { label: "Practice plan", output: "3 actions · STAR", state: "queued" },
] as const;

const chatMessages = [
  {
    role: "user" as const,
    text: "Ask me about a time I disagreed with a teammate.",
  },
  {
    role: "assistant" as const,
    text: "Tell me about a time you disagreed with a teammate on a technical decision.",
    note: "AI COACH · GEMINI 2.0 FLASH",
  },
  {
    role: "user" as const,
    text: "In my last project we argued over the state model…",
  },
] as const;

const recent = [
  { id: "interview-coach" as AgentId, title: "Frontend mock · round 2", time: "12m" },
  { id: "resume-reviewer" as AgentId, title: "Resume vs. product roles", time: "1h" },
  { id: "skill-analyzer" as AgentId, title: "4-week backend plan", time: "3h" },
];

export default function WorkspaceMock({ view = "chat", className, grand = false }: WorkspaceMockProps) {
  const activeAgent: AgentId = view === "interview" ? "interview-coach" : "interview-coach";
  const agent = AGENT_MAP[activeAgent];

  return (
    <div
      className={cn(
        "glass relative w-full overflow-hidden rounded-[18px] bg-[var(--color-surface)] text-left",
        grand ? "text-[11px]" : "text-[10px]",
        className,
      )}
      aria-hidden="true"
    >
      {/* window chrome */}
      <div className="flex h-8 items-center gap-1.5 border-b border-white/[0.07] bg-[var(--color-surface-container)] px-3">
        <span className="h-[7px] w-[7px] rounded-full bg-[#ff6159]/70" />
        <span className="h-[7px] w-[7px] rounded-full bg-[#ffbd2e]/70" />
        <span className="h-[7px] w-[7px] rounded-full bg-[#28c840]/70" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-[var(--color-surface-container)] px-2 py-[3px]">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span className="font-mono text-[7px] tracking-[0.08em] text-[var(--color-text-secondary)] sm:text-[7.5px]">
            viewpilot.app / workspace
          </span>
        </div>
        <span className="hidden items-center gap-1 rounded-[4px] border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-[2px] font-mono text-[6.5px] tracking-[0.08em] text-emerald-300 sm:flex">
          LOCAL READY
        </span>
        <Settings2 size={10} className="ml-1 hidden text-[var(--color-text-secondary)] sm:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[26%_1fr] md:grid-cols-[24%_1fr_26%]">
        {/* left rail */}
        <aside className="hidden min-w-0 flex-col border-r border-white/[0.06] bg-[var(--color-surface-container)] p-2.5 sm:flex">
          <div className="flex items-center gap-1.5 px-1 py-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-gradient-to-br from-[#8d86ff] to-[#00d9ff] text-[7px] font-bold text-black">
              VP
            </span>
            <span className="font-display text-[9px] font-semibold tracking-tight text-[var(--color-text-primary)]">ViewPilot</span>
            <span className="rounded-[3px] border border-white/10 px-1 font-mono text-[5.5px] tracking-[0.14em] text-[var(--color-tertiary)]">
              PRO
            </span>
          </div>

          <button
            type="button"
            tabIndex={-1}
            className="mt-2 flex items-center justify-center gap-1 rounded-md border border-[#6c63ff]/30 bg-[#6c63ff]/15 py-1.5 text-[8px] font-semibold text-[var(--color-tertiary)]"
          >
            <Plus size={9} /> New session
          </button>

          <div className="mt-2 grid grid-cols-2 gap-0.5 rounded-md border border-white/[0.06] bg-[var(--color-surface-container)] p-[2px]">
            <span className="rounded-[4px] bg-[var(--color-surface-container-high)] py-1 text-center font-mono text-[6.5px] font-semibold tracking-[0.06em] text-[var(--color-text-primary)]">
              CHAT
            </span>
            <span className="py-1 text-center font-mono text-[6.5px] font-semibold tracking-[0.06em] text-[var(--color-text-faint)]">
              WORKFLOW
            </span>
          </div>

          <p className="mt-2.5 px-1 font-mono text-[6px] tracking-[0.16em] text-[var(--color-text-faint)]">AGENTS</p>
          <div className="mt-1 space-y-0.5">
            {AGENTS.map((item) => {
              const isActive = item.id === activeAgent;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-1 py-[4px]",
                    isActive
                      ? "border border-[#6c63ff]/20 bg-[#6c63ff]/10"
                      : "border border-transparent",
                  )}
                >
                  <AgentGlyph agentId={item.id} boxed size={7} boxSize="h-[15px] w-[15px]" className="rounded-[4px]" />
                  <span className={cn("min-w-0 flex-1 truncate text-[7.5px]", isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]")}>
                    {item.shortName}
                  </span>
                  {isActive ? <span className="h-1 w-1 rounded-full bg-[var(--color-tertiary)]" /> : null}
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-between px-1">
            <span className="font-mono text-[6px] tracking-[0.16em] text-[var(--color-text-faint)]">RECENT</span>
            <History size={7} className="text-[var(--color-text-faint)]" />
          </div>
          <div className="mt-1 space-y-0.5">
            {recent.map((item) => (
              <div key={item.title} className="rounded-md px-1 py-[3px]">
                <p className="truncate text-[7px] leading-tight text-[var(--color-text-secondary)]">{item.title}</p>
                <p className="font-mono text-[5.5px] tracking-[0.05em] text-[var(--color-text-faint)]">
                  {AGENT_MAP[item.id].shortName} · {item.time}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto space-y-1.5 border-t border-white/[0.05] pt-2">
            <div className="flex items-center gap-1.5 px-1">
              <span className="h-1 w-1 rounded-full bg-[var(--color-text-faint)]" />
              <span className="font-mono text-[5.5px] tracking-[0.06em] text-[var(--color-text-faint)]">ROBOT OPTIONAL · OFFLINE</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-white/[0.05] bg-[var(--color-surface-container)] p-1">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#6c63ff] to-[#3c34a8] text-[6px] font-bold text-[var(--color-text-primary)]">
                AD
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[6.5px] text-[var(--color-text-primary)]">Aarav D.</p>
                <p className="truncate font-mono text-[5px] text-[var(--color-text-secondary)]">DEMO ACCOUNT</p>
              </div>
            </div>
          </div>
        </aside>

        {/* center */}
        <main className="flex min-w-0 flex-col border-r border-white/[0.05]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-2.5 py-2">
            <AgentGlyph agentId={activeAgent} boxed size={9} boxSize="h-6 w-6" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[9px] font-semibold text-[var(--color-text-primary)]">{agent.name}</p>
              <p className="truncate font-mono text-[5.5px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                {view === "workflow" ? "CUSTOM PIPELINE · 5 NODES" : "FRONTEND ENGINEER · ENTRY · MIXED"}
              </p>
            </div>
            <span className="hidden items-center gap-1 rounded-full border border-white/[0.08] px-1.5 py-[2px] font-mono text-[5.5px] tracking-[0.04em] text-[var(--color-text-secondary)] sm:flex">
              <Volume2 size={6} /> VOICE OFF
            </span>
            <span className="chip chip-success !px-1.5 !py-[2px] !text-[5.5px]">LOCAL</span>
          </div>

          {view === "chat" ? (
            <div className="flex min-h-0 flex-1 flex-col p-2.5">
              <div className="flex-1 space-y-2">
                {chatMessages.map((message, index) =>
                  message.role === "user" ? (
                    <div key={index} className="flex justify-end">
                      <div className="max-w-[88%] rounded-[8px] rounded-br-[3px] border border-[#6c63ff]/20 bg-[#6c63ff]/10 px-2 py-1.5 text-[8px] leading-relaxed text-[var(--color-text-primary)]">
                        {message.text}
                      </div>
                    </div>
                  ) : (
                    <div key={index} className="flex gap-1.5">
                      <AgentGlyph agentId={activeAgent} boxed size={8} boxSize="h-5 w-5" />
                      <div className="min-w-0 flex-1">
                        <div className="rounded-[8px] rounded-tl-[3px] border border-white/[0.07] bg-[var(--color-surface-container)] px-2 py-1.5">
                          <p className="text-[8px] leading-relaxed text-[var(--color-text-primary)]">
                            <strong className="font-semibold text-[var(--color-text-primary)]">{message.text}</strong>
                          </p>
                          <p className="mt-1 text-[7px] leading-relaxed text-[var(--color-text-secondary)]">
                            Lead with the decision you owned, then the result. Structure it as situation, action,
                            outcome — keep it under 90 seconds.
                          </p>
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="rounded-full border border-[var(--color-info-strong)]/20 bg-[var(--color-info-strong)]/10 px-1.5 py-[1px] font-mono text-[5px] tracking-[0.08em] text-[var(--color-info)]">
                              ADAPTIVE
                            </span>
                            <span className="rounded-full border border-white/[0.08] px-1.5 py-[1px] font-mono text-[5px] tracking-[0.08em] text-[var(--color-text-secondary)]">
                              STAR
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 font-mono text-[5px] tracking-[0.06em] text-[var(--color-text-faint)]">{message.note}</p>
                      </div>
                    </div>
                  ),
                )}
                <div className="ml-[26px] flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[var(--color-surface-container)] px-2 py-1.5">
                  <span className="h-2.5 w-2.5 rounded border border-white/[0.09]" />
                  <span className="h-2.5 w-2.5 rounded border border-white/[0.09]" />
                  <span className="ml-auto flex items-center gap-1 font-mono text-[5.5px] text-[var(--color-text-faint)]">
                    <Mic size={7} /> DICTATE · ⌘ENTER
                  </span>
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-[#6c63ff] text-[var(--color-text-primary)]">
                    <Send size={6} />
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-md border border-white/[0.05] bg-[var(--color-surface-container)] px-2 py-1">
                <span className="flex items-center gap-1 font-mono text-[5.5px] tracking-[0.04em] text-[var(--color-text-faint)]">
                  <CircleDot size={7} className="text-emerald-400" /> 4-DIMENSION RUBRIC VISIBLE
                </span>
                <span className="font-mono text-[5.5px] text-[var(--color-text-faint)]">Q2 / 5</span>
              </div>
            </div>
          ) : null}

          {view === "workflow" ? (
            <div className="flex min-h-0 flex-1 flex-col p-2.5">
              <div className="mb-2 flex items-center gap-1">
                <span className="rounded-full border border-[#6c63ff]/30 bg-[#6c63ff]/15 px-1.5 py-[2px] font-mono text-[5.5px] text-[var(--color-tertiary)]">
                  30-MIN DRILL
                </span>
                <span className="rounded-full border border-white/[0.07] px-1.5 py-[2px] font-mono text-[5.5px] text-[var(--color-text-secondary)]">
                  RESUME SPRINT
                </span>
                <span className="ml-auto flex items-center gap-1 rounded-md bg-[#6c63ff] px-1.5 py-1 font-mono text-[5.5px] font-semibold text-[var(--color-text-primary)]">
                  <Play size={6} /> RUN
                </span>
              </div>

              <div className="relative flex-1 rounded-lg border border-white/[0.06] bg-[var(--color-surface-container)] p-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[6px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                    PIPELINE · 5 NODES
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[5.5px] text-[var(--color-info)]">
                    <Loader2 size={6} className="animate-spin" /> 62%
                  </span>
                </div>
                <div className="space-y-[3px]">
                  {workflowNodes.map((node, index) => (
                    <div key={node.label} className="relative flex items-center gap-1.5">
                      {index > 0 ? (
                        <span className="absolute -top-[3px] left-[9px] h-[3px] w-px bg-white/10" aria-hidden="true" />
                      ) : null}
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                          node.state === "done"
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                            : node.state === "live"
                              ? "border-[#6c63ff]/35 bg-[#6c63ff]/15 text-[var(--color-tertiary)]"
                              : "border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-faint)]",
                        )}
                      >
                        {node.state === "done" ? (
                          <Check size={7} />
                        ) : node.state === "live" ? (
                          <Loader2 size={7} className="animate-spin" />
                        ) : (
                          <GripVertical size={7} />
                        )}
                      </span>
                      <div
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-1.5 rounded-md border px-1.5 py-[3px]",
                          node.state === "live"
                            ? "border-[#6c63ff]/30 bg-[#6c63ff]/[0.08]"
                            : "border-white/[0.05] bg-[var(--color-surface-container)]",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[7px] text-[var(--color-text-primary)]">{node.label}</p>
                          <p className="truncate font-mono text-[5px] tracking-[0.04em] text-[var(--color-text-faint)]">
                            {node.output}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "font-mono text-[5px] uppercase tracking-[0.06em]",
                            node.state === "done"
                              ? "text-emerald-300"
                              : node.state === "live"
                                ? "text-[var(--color-tertiary)]"
                                : "text-[var(--color-text-faint)]",
                          )}
                        >
                          {node.state === "live" ? "running" : node.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                    <span className="block h-full w-[62%] rounded-full bg-gradient-to-r from-[#6c63ff] to-[#00d9ff]" />
                  </span>
                  <span className="font-mono text-[5px] text-[var(--color-text-faint)]">3 / 5</span>
                </div>

                <div className="mt-1.5 rounded-md border border-dashed border-white/[0.09] px-2 py-1.5 text-center font-mono text-[5.5px] tracking-[0.06em] text-[var(--color-text-faint)]">
                  DRAG A NODE HERE FROM THE PALETTE
                </div>
              </div>

              <div className="mt-1.5 flex items-center gap-1">
                <span className="font-mono text-[5px] tracking-[0.12em] text-[var(--color-text-faint)]">PALETTE</span>
                {["Resume", "Skill gap", "Questions", "Evaluate", "Report"].map((item) => (
                  <span
                    key={item}
                    className="rounded border border-white/[0.06] bg-[var(--color-surface-container)] px-1 py-[2px] font-mono text-[5px] text-[var(--color-text-secondary)]"
                  >
                    + {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {view === "interview" ? (
            <div className="flex min-h-0 flex-1 flex-col p-2.5">
              <div className="mb-2 flex items-center gap-1">
                <span className="chip chip-accent !px-1.5 !py-[2px] !text-[5.5px]">FRONTEND ENGINEER</span>
                <span className="chip !px-1.5 !py-[2px] !text-[5.5px]">ENTRY LEVEL</span>
                <span className="chip !px-1.5 !py-[2px] !text-[5.5px]">MIXED</span>
                <span className="ml-auto font-mono text-[6px] text-[var(--color-text-secondary)]">02:41</span>
              </div>

              <div className="rounded-lg border border-[#6c63ff]/20 bg-[#6c63ff]/[0.06] p-2.5">
                <div className="flex items-center gap-1.5">
                  <AgentGlyph agentId="interview-coach" boxed size={8} boxSize="h-5 w-5" />
                  <span className="font-mono text-[5.5px] uppercase tracking-[0.1em] text-[var(--color-tertiary)]">
                    QUESTION 2 · PROBLEM SOLVING
                  </span>
                  <span className="ml-auto flex items-center gap-[2px] text-[var(--color-info)]">
                    {[3, 6, 4, 8, 5, 3].map((height, index) => (
                      <span
                        key={index}
                        className="w-[1.5px] rounded-full bg-current"
                        style={{ height, animation: `wave 1.1s ease-in-out ${index * 0.09}s infinite` }}
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-1.5 font-display text-[10.5px] font-medium leading-snug text-[var(--color-text-primary)]">
                  Tell me about a time you disagreed with a teammate on a technical decision.
                </p>
                <p className="mt-1 text-[7px] leading-relaxed text-[var(--color-text-secondary)]">
                  Stay with the decision you owned — not the argument itself.
                </p>
              </div>

              <div className="mt-2 flex-1 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] p-2">
                <p className="text-[7.5px] leading-relaxed text-[var(--color-text-primary)]">
                  In my last project, our team disagreed about how to model checkout state. I proposed a single
                  reducer with explicit events because…
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="flex h-4 items-center gap-1 rounded border border-rose-400/20 bg-rose-500/10 px-1.5 font-mono text-[5px] text-rose-300">
                    <Mic size={6} /> LISTENING
                  </span>
                  <span className="font-mono text-[5px] text-[var(--color-text-faint)]">128 WORDS · 42S</span>
                  <span className="ml-auto flex h-4 items-center gap-0.5 rounded bg-[#6c63ff] px-1.5 font-mono text-[5px] font-semibold text-[var(--color-text-primary)]">
                    SUBMIT <ArrowUpRight size={6} />
                  </span>
                </div>
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-1">
                <div className="rounded-md border border-white/[0.05] bg-[var(--color-surface-container)] px-1.5 py-1">
                  <p className="font-mono text-[5px] tracking-[0.1em] text-[var(--color-text-faint)]">LIVE RUBRIC</p>
                  <p className="mt-0.5 text-[6.5px] text-[var(--color-text-primary)]">Problem solving · 25%</p>
                </div>
                <div className="rounded-md border border-white/[0.05] bg-[var(--color-surface-container)] px-1.5 py-1">
                  <p className="font-mono text-[5px] tracking-[0.1em] text-[var(--color-text-faint)]">COACH CUE</p>
                  <p className="mt-0.5 text-[6.5px] text-[var(--color-text-primary)]">Name the trade-off</p>
                </div>
              </div>
            </div>
          ) : null}
        </main>

        {/* right rail */}
        <aside className="hidden min-w-0 flex-col gap-2 border-l border-white/[0.05] bg-[var(--color-surface-container)] p-2.5 md:flex">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[5.5px] tracking-[0.14em] text-[var(--color-text-faint)]">ACTIVE RUN</span>
              <span className="flex items-center gap-1 font-mono text-[5.5px] text-[var(--color-info)]">
                <span className="h-1 w-1 animate-pulse-soft rounded-full bg-[var(--color-info-strong)]" /> LIVE
              </span>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] p-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[7.5px] font-medium text-[var(--color-text-primary)]">30-minute drill</p>
                <span className="font-mono text-[5.5px] text-[var(--color-text-secondary)]">62%</span>
              </div>
              <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#6c63ff] to-[#00d9ff]" />
              </div>
              <div className="mt-1.5 space-y-1">
                {[
                  { label: "Set target role", state: "done", ms: "0.4s" },
                  { label: "Generate questions", state: "done", ms: "0.8s" },
                  { label: "Mock interview", state: "live", ms: "—" },
                  { label: "Evaluate answers", state: "queued", ms: "—" },
                ].map((node) => (
                  <div key={node.label} className="flex items-center gap-1">
                    {node.state === "done" ? (
                      <Check size={6} className="text-emerald-300" />
                    ) : node.state === "live" ? (
                      <Loader2 size={6} className="animate-spin text-[var(--color-tertiary)]" />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-[var(--color-outline)]" />
                    )}
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[6.5px]",
                        node.state === "queued" ? "text-[var(--color-text-faint)]" : "text-[var(--color-text-primary)]",
                      )}
                    >
                      {node.label}
                    </span>
                    <span className="font-mono text-[5px] text-[var(--color-text-faint)]">{node.ms}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[5.5px] tracking-[0.14em] text-[var(--color-text-faint)]">LATEST REPORT</span>
              <Sparkles size={7} className="text-[var(--color-tertiary)]" />
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] p-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full">
                  <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
                    <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                    <circle
                      cx="20"
                      cy="20"
                      r="17"
                      fill="none"
                      stroke="#00d9ff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="106.8"
                      strokeDashoffset="27.8"
                    />
                  </svg>
                  <span className="font-display text-[9px] font-semibold text-[var(--color-text-primary)]">74</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[6.5px] text-[var(--color-text-primary)]">Frontend · round 2</p>
                  <p className="font-mono text-[5px] text-[var(--color-text-faint)]">4 DIMENSIONS · 5 ANSWERS</p>
                </div>
              </div>
              <div className="mt-1 space-y-[3px]">
                {[
                  ["Communication", 78, "#00d9ff"],
                  ["Role knowledge", 71, "#8d86ff"],
                  ["Problem solving", 66, "#f59e0b"],
                ].map(([label, score, color]) => (
                  <div key={String(label)} className="flex items-center gap-1">
                    <span className="w-[38px] truncate text-[5.5px] text-[var(--color-text-secondary)]">{label}</span>
                    <span className="h-[2px] flex-1 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${score}%`, background: String(color) }}
                      />
                    </span>
                    <span className="font-mono text-[5px] tabular-nums text-[var(--color-text-secondary)]">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[5.5px] tracking-[0.14em] text-[var(--color-text-faint)]">ROBOT</span>
              <span className="flex items-center gap-1 font-mono text-[5px] text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400" /> ONLINE
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] p-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-info-strong)]/20 bg-[var(--color-info-strong)]/10 text-[var(--color-info)]">
                <Bot size={10} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[6.5px] text-[var(--color-text-primary)]">Interviewer presence</p>
                <p className="font-mono text-[5px] text-[var(--color-text-faint)]">EXPRESSION · THINKING</p>
              </div>
              <span className="font-mono text-[5px] text-[var(--color-info)]">LAN</span>
            </div>
          </div>

          <div className="mt-auto rounded-md border border-white/[0.05] bg-[var(--color-surface-container)] px-1.5 py-1.5">
            <p className="flex items-center gap-1 font-mono text-[5px] tracking-[0.06em] text-[var(--color-text-faint)]">
              <CircleDot size={6} className="text-emerald-400" /> EVERY RUN WORKS OFFLINE
            </p>
          </div>
        </aside>
      </div>

      <div className="flex h-[18px] items-center gap-2 border-t border-white/[0.05] bg-[var(--color-surface-container)] px-2.5">
        <span className="flex items-center gap-1 font-mono text-[5px] tracking-[0.06em] text-[var(--color-text-faint)]">
          <CircleDot size={5} className="text-emerald-400" /> LOCAL RUBRIC ENGINE
        </span>
        <span className="font-mono text-[5px] tracking-[0.06em] text-[var(--color-text-faint)]">GEMINI READY</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[5px] tracking-[0.06em] text-[var(--color-text-faint)]">
          <Workflow size={5} /> 9 NODE TYPES
        </span>
        <span className="font-mono text-[5px] tracking-[0.06em] text-[var(--color-text-faint)]">v0.9</span>
      </div>
    </div>
  );
}
