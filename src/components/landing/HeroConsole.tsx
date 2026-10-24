import { Check, Mic, Send, Sparkles } from "lucide-react";
import { AgentGlyph } from "@/components/ui/AgentIcon";
import ScoreRing from "@/components/ui/ScoreRing";
import ScoreBar from "@/components/ui/ScoreBar";

export default function HeroConsole() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[36px] bg-[radial-gradient(ellipse_at_center,rgba(108,99,255,0.16),transparent_68%)] blur-2xl"
      />

      <div className="glass relative overflow-hidden rounded-[20px]">
        <div className="flex h-10 items-center gap-2 border-b border-white/[0.07] bg-[var(--color-surface-container)] px-3.5">
          <span className="h-2 w-2 rounded-full bg-[#ff6159]/70" aria-hidden="true" />
          <span className="h-2 w-2 rounded-full bg-[#ffbd2e]/70" aria-hidden="true" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]/70" aria-hidden="true" />
          <span className="ml-2 flex-1 truncate font-mono text-[9.5px] tracking-[0.1em] text-[var(--color-text-faint)]">
            WORKSPACE / INTERVIEW-COACH
          </span>
          <span className="chip chip-success" style={{ padding: "3px 8px", fontSize: "8.5px" }}>
            <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
            Local ready
          </span>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9">
              <AgentGlyph agentId="interview-coach" boxed boxSize="h-9 w-9" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[13px] font-semibold text-[var(--color-text-primary)]">Interview Coach</p>
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.11em] text-[var(--color-text-secondary)]">
                Frontend Engineer · Entry level · Mixed
              </p>
            </div>
            <span className="chip chip-accent" style={{ fontSize: "9px" }}>Q2 / 5</span>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[86%] rounded-[14px] rounded-br-[5px] border border-[#6c63ff]/20 bg-[#6c63ff]/[0.11] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-[var(--color-text-primary)]">
              Ask me about a time I disagreed with a teammate.
            </div>
          </div>

          <div className="flex gap-2.5">
            <span className="mt-0.5 h-8 w-8 shrink-0">
              <AgentGlyph agentId="interview-coach" boxed boxSize="h-8 w-8" size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="rounded-[14px] rounded-tl-[5px] border border-white/[0.07] bg-[var(--color-surface-container)] px-3.5 py-2.5">
                <p className="text-[11.5px] leading-relaxed text-[var(--color-text-primary)]">
                  <strong className="font-semibold text-[var(--color-text-primary)]">
                    Tell me about a time you disagreed with a teammate.
                  </strong>{" "}
                  Stay with the decision you owned — not the argument itself.
                </p>
              </div>
              <p className="mt-1.5 font-mono text-[8.5px] tracking-[0.08em] text-[var(--color-text-secondary)]">
                LOCAL RUBRIC · 12MS · ADAPTIVE FOLLOW-UP ARMED
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3">
            <div className="flex items-center gap-4">
              <ScoreRing score={74} size={64} stroke={5} label="live" />
              <div className="min-w-0 flex-1 space-y-2">
                <ScoreBar label="Communication" score={78} weight={0.25} compact />
                <ScoreBar label="Role knowledge" score={71} weight={0.3} compact />
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/[0.05] pt-2.5">
              <ScoreBar label="Problem solving" score={66} weight={0.25} compact />
              <ScoreBar label="Answer quality" score={74} weight={0.2} compact />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                30-minute drill
              </span>
              <span className="font-mono text-[8.5px] text-[var(--color-info)]">3 / 5 nodes</span>
            </div>
            <div className="flex items-center">
              {[
                { label: "Resume", state: "done" },
                { label: "Questions", state: "done" },
                { label: "Interview", state: "live" },
              ].map((node, index) => (
                <div key={node.label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2 py-1.5">
                    {node.state === "done" ? (
                      <Check size={10} className="text-emerald-400" aria-hidden="true" />
                    ) : (
                      <span className="relative flex h-2 w-2" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-info-strong)] opacity-50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-info-strong)]" />
                      </span>
                    )}
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                      {node.label}
                    </span>
                  </div>
                  {index < 2 ? <span className="mx-1 h-px flex-1 bg-white/10" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-[var(--color-surface-container)] p-2.5">
            <p className="flex-1 px-1 pb-0.5 text-[11px] text-[var(--color-text-secondary)]">Answer as you would out loud…</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-secondary)]">
              <Mic size={12} aria-hidden="true" />
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6c63ff] text-[var(--color-text-primary)]">
              <Send size={12} aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      <div className="animate-float absolute -left-7 bottom-16 hidden w-[168px] rounded-xl border border-white/[0.1] bg-[var(--color-surface-container)] p-3 shadow-2xl backdrop-blur-xl xl:block">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <Sparkles size={13} aria-hidden="true" />
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.11em] text-[var(--color-text-secondary)]">Report ready</span>
        </div>
        <p className="mt-2 font-display text-[21px] font-semibold leading-none text-[var(--color-text-primary)]">48s</p>
        <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">5 answers · 4 scores · 1 plan</p>
      </div>

      <div className="absolute -right-4 top-24 hidden rounded-xl border border-white/[0.1] bg-[var(--color-surface-container)] px-3.5 py-2.5 shadow-xl backdrop-blur-xl lg:block">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Rubric</p>
        <p className="mt-1 font-display text-[14px] font-semibold text-[var(--color-text-primary)]">4 dimensions</p>
        <p className="mt-0.5 text-[9.5px] text-[var(--color-text-secondary)]">weights visible</p>
      </div>
    </div>
  );
}
