import { ArrowRight, Check, Clock3, FileDown, Quote, Sparkles } from "lucide-react";
import ScoreRing from "@/components/ui/ScoreRing";
import ScoreBar from "@/components/ui/ScoreBar";

const dimensions = [
  { label: "Communication", score: 78, weight: 0.25 },
  { label: "Role knowledge", score: 71, weight: 0.3 },
  { label: "Problem solving", score: 66, weight: 0.25 },
  { label: "Answer quality", score: 74, weight: 0.2 },
];

export default function ReportPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(ellipse_at_30%_20%,rgba(108,99,255,0.14),transparent_62%)] blur-xl"
      />

      <div className="glass relative overflow-hidden rounded-[26px]">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] bg-[var(--color-surface-container)] px-5 py-3">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
            <Sparkles size={11} className="text-[var(--color-tertiary)]" />
            Sample report
          </span>
          <span className="chip chip-accent" style={{ fontSize: "8.5px" }}>Frontend Engineer</span>
          <span className="chip" style={{ fontSize: "8.5px" }}>Entry level</span>
          <span className="chip" style={{ fontSize: "8.5px" }}>Mixed</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
            <Clock3 size={9} /> Generated in 48s
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-white/[0.06] p-5 md:border-b-0 md:border-r md:p-6">
            <div className="flex items-start gap-4">
              <ScoreRing score={74} size={104} stroke={7} label="overall" />
              <div className="min-w-0 pt-1">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--color-info)]">Strong foundation</p>
                <p className="mt-1.5 font-display text-[20px] font-semibold leading-tight text-[var(--color-text-primary)]">
                  Clear structure.
                  <br />
                  Thin on trade-offs.
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-text-secondary)]">
                  You hold the thread and land the result. Next: name the trade-off.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
              {dimensions.map((dimension) => (
                <ScoreBar
                  key={dimension.label}
                  label={dimension.label}
                  score={dimension.score}
                  weight={dimension.weight}
                />
              ))}
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                Evidence from your answer
              </span>
              <Quote size={14} className="text-[var(--color-text-faint)]" />
            </div>
            <blockquote className="mt-3 rounded-xl border border-[#6c63ff]/20 bg-[#6c63ff]/[0.06] p-4">
              <p className="text-[12.5px] leading-relaxed text-[var(--color-text-primary)]">
                &ldquo;I proposed a single reducer with explicit checkout events because the
                three-team handoff kept losing state between payment and confirmation.&rdquo;
              </p>
              <p className="mt-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                Question 2 · Problem solving · quoted verbatim
              </p>
            </blockquote>

            <div className="mt-4 rounded-xl border border-white/[0.07] bg-[var(--color-surface-container)] p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  <Sparkles size={10} className="text-amber-300" />
                  Next practice
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">3 actions · 25 min</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {[
                  { title: "Rebuild one answer around a constraint", minutes: "8 min" },
                  { title: "Say the trade-off before the outcome", minutes: "7 min" },
                  { title: "Re-run the same five questions", minutes: "10 min" },
                ].map((action) => (
                  <div key={action.title} className="flex items-center gap-2.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                      <Check size={9} strokeWidth={2.5} />
                    </span>
                    <p className="flex-1 text-[11.5px] text-[var(--color-text-primary)]">{action.title}</p>
                    <span className="font-mono text-[8px] text-[var(--color-text-faint)]">{action.minutes}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[var(--color-surface-container)] px-2.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                <FileDown size={10} /> Print / PDF
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[var(--color-surface-container)] px-2.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                Export JSON
              </span>
              <span className="ml-auto flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--color-info)]">
                Practice again <ArrowRight size={9} />
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] bg-[var(--color-surface-container)] px-5 py-2.5">
          <p className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
            Practice estimate — not a hiring decision
          </p>
          <p className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
            No protected traits scored
          </p>
          <p className="ml-auto font-mono text-[7.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
            128 words analysed · local rubric
          </p>
        </div>
      </div>
    </div>
  );
}
