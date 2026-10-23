import type { Metadata } from "next";
import Link from "next/link";
import { RUBRIC } from "@/lib/content";
import PageHero from "@/components/vp/PageHero";
import Reveal from "@/components/vp/Reveal";
import { ArrowRight, Check, Chat, Gauge, Spark, Target } from "@/components/vp/Icons";

export const metadata: Metadata = {
  title: "How it works — ViewPilot",
  description:
    "The ViewPilot practice loop: choose a role, answer adaptive questions, understand the rubric, and leave with a specific next step.",
};

const STEPS = [
  {
    n: "01",
    title: "Set up",
    body: "Pick a target role, experience level, interview type and difficulty. Resume text is optional and never required.",
    detail: "Under 30 seconds · no account",
    icon: <Target />,
  },
  {
    n: "02",
    title: "Answer",
    body: "One question at a time. If the answer is thin, ViewPilot asks one follow-up instead of moving on.",
    detail: "5 main questions · ~12 minutes",
    icon: <Chat />,
  },
  {
    n: "03",
    title: "Evaluate",
    body: "Each answer is scored against the same four-part rubric. Scores are practice estimates, not hiring predictions.",
    detail: "Visible rubric · schema-checked",
    icon: <Gauge />,
  },
  {
    n: "04",
    title: "Understand",
    body: "The report quotes your own words to justify each strength and each gap. No feedback without evidence.",
    detail: "Transcript evidence",
    icon: <Spark />,
  },
  {
    n: "05",
    title: "Improve",
    body: "Leave with two or three micro-actions and an improved-answer blueprint for an immediate second attempt.",
    detail: "Re-practice ready",
    icon: <Check />,
  },
];

export default function HowPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            A complete practice loop,{" "}
            <span className="text-violet">not a question dump.</span>
          </>
        }
        lede="Every session follows the same path: a focused setup, a realistic interview, a transparent evaluation, and one concrete next step."
      />

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 60}>
              <article className="card grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lilac text-violet-deep">
                  {step.icon}
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">{step.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
                  {step.detail}
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="card h-full p-7 sm:p-8">
              <p className="eyebrow">Adaptive follow-ups</p>
              <h2 className="display-m mt-3 text-ink">
                A thin answer earns a follow-up, not a pass.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Generic banks move to the next item no matter what you said. ViewPilot
                checks whether the answer contains a situation, a personal action and a
                result — then asks for the missing piece.
              </p>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-cream/80 p-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
                    Question
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    Tell me about a time you delivered under a tight deadline.
                  </p>
                </div>
                <div className="rounded-2xl border border-line p-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-coral">
                    Thin answer
                  </p>
                  <p className="mt-1 text-sm italic text-muted">
                    “It went well. We worked hard and shipped it.”
                  </p>
                </div>
                <div className="rounded-2xl border border-violet/30 bg-lilac/40 p-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet-deep">
                    Follow-up
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    Give me one concrete detail: what did you personally do, and what
                    changed because of it?
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="card h-full p-7 sm:p-8">
              <p className="eyebrow">The rubric</p>
              <h2 className="display-m mt-3 text-ink">
                The same four dimensions every time.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                A fixed rubric makes sessions comparable and keeps the feedback honest.
                It is shown before the first question and repeated in the report.
              </p>
              <div className="mt-6 space-y-3">
                {RUBRIC.map((d) => (
                  <div key={d.key} className="rounded-2xl border border-line p-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <p className="text-sm font-semibold text-ink">{d.label}</p>
                    </div>
                    <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">
                      {d.criteria}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-paper/60 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="eyebrow">Report anatomy</p>
            <h2 className="display-m mt-3 text-ink">Read it in ten seconds, use it for the next hour.</h2>
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              {[
                ["Scorecard", "Overall practice estimate plus four dimension scores."],
                ["Evidence", "Quotes from your transcript justify each judgement."],
                ["Next practice", "Two or three actions and a better answer outline."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-line bg-cream/70 p-5">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
            <Link href="/interview" className="btn btn-primary mt-8">
              Run the loop once
              <ArrowRight />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
