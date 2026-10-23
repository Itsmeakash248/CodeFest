import { ArrowUpRight, Clock3, Quote, Sparkles } from "lucide-react";
import ScoreRing from "@/components/ui/ScoreRing";
import ScoreBar from "@/components/ui/ScoreBar";

const DIMENSIONS = [
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
        className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(ellipse_at_40%_30%,rgba(0,217,255,0.09),transparent_66%)] blur-2xl"
      />

      <div className="glass relative overflow-hidden rounded-[20px]">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] bg-black/20 px-4 py-3">
          <span className="chip chip-success">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            Session complete
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#777a8e]">
            Frontend Engineer · Entry level · Mixed
          </span>
          <span className="ml-auto font-mono text-[9px] text-[#8b8ba3]">sample report</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <ScoreRing score={73} size={104} label="overall" />
              <div>
                <p className="font-display text-[19px] font-semibold text-white">Strong foundation</p>
                <p className="mt-1 max-w-[190px] text-[11.5px] leading-relaxed text-[#9ca3af]">
                  Clear structure. The evidence gets thin when the answer turns technical.
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#7fe8ff]">
                  <Clock3 size={11} aria-hidden="true" />
                  42s to report
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2.5 sm:border-l sm:border-white/[0.07] sm:pl-5">
              {DIMENSIONS.map((dimension) => (
                <ScoreBar
                  key={dimension.label}
                  label={dimension.label}
                  score={dimension.score}
                  weight={dimension.weight}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
            <div className="flex items-start gap-2.5">
              <Quote size={14} className="mt-0.5 shrink-0 text-[#8b85ff]" aria-hidden="true" />
              <div>
                <p className="text-[12.5px] leading-relaxed text-[#dcdce8]">
                  “I rebuilt the checkout summary as a server component and cut first render from 1.9s to
                  0.8s — support tickets about missing totals stopped the following week.”
                </p>
                <p className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#6f7284]">
                  Evidence · answer quality · Q2
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.05] p-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-300/80">
                Keep doing
              </p>
              <p className="mt-1.5 text-[11.5px] leading-snug text-[#c5e5d2]">
                Naming the constraint before the solution.
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-amber-300/80">
                Next practice
              </p>
              <p className="mt-1.5 text-[11.5px] leading-snug text-[#e9d6ac]">
                One project story with a measurable result.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <span className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#6f7284]">
              <Sparkles size={10} className="text-[#9d95ff]" aria-hidden="true" />
              3 strengths · 3 fixes · STAR blueprint
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#b3adff]">
              Full report
              <ArrowUpRight size={12} aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
