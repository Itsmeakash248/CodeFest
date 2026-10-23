import Link from "next/link";
import type { ReactNode } from "react";
import { FAQ, RUBRIC, SITE } from "@/lib/content";
import Reveal from "@/components/vp/Reveal";
import {
  ArrowRight,
  ArrowUpRight,
  Chat,
  Check,
  Gauge,
  Layers,
  Robot,
  Shield,
  Spark,
  Target,
} from "@/components/vp/Icons";

function SectionHead({
  eyebrow,
  title,
  lede,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-l mt-3 text-ink">{title}</h2>
      {lede && <p className={`lede mt-4 ${center ? "mx-auto" : ""}`}>{lede}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" aria-hidden />
      <div className="blob -left-24 top-10 h-72 w-72 bg-lilac/80" aria-hidden />
      <div className="blob -right-16 top-32 h-64 w-64 bg-sun/30" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Reveal>
            <span className="chip chip-violet">
              <Spark className="h-3.5 w-3.5" />
              {SITE.event} · {SITE.team} · {SITE.domain}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="display-xl mt-6 max-w-2xl text-ink">
              Interview practice that{" "}
              <span className="text-gradient">actually prepares you.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="lede mt-6 max-w-xl">
              ViewPilot is an AI-powered interview coach for students and early-career
              applicants. Pick a role, answer realistic questions, and get feedback tied
              to your own words — not a mystery score.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/interview" className="btn btn-primary px-6 py-3.5">
                Start a mock interview
                <ArrowRight />
              </Link>
              <Link href="/how" className="btn btn-ghost px-6 py-3.5">
                See how it works
              </Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.78rem] font-semibold text-muted">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-teal" /> Works with zero API keys
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-teal" /> 5 questions · ~12 minutes
              </span>
              <span className="inline-flex items-center gap-2">
                <Robot className="h-4 w-4 text-violet" /> Robot optional
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <ReportMock />
        </Reveal>
      </div>
    </section>
  );
}

function ReportMock() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="card-solid animate-float overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-violet">
              Session report
            </p>
            <p className="mt-0.5 text-[0.72rem] font-semibold text-muted">
              Frontend Engineer · Entry · Mixed
            </p>
          </div>
          <span className="chip chip-teal">Practice estimate</span>
        </div>

        <div className="grid grid-cols-[auto_1fr] items-center gap-5 px-5 py-5">
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background:
                "conic-gradient(#6c4de6 0deg 266deg, #eee8ff 266deg 360deg)",
            }}
          >
            <div className="flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full bg-paper">
              <span className="font-display text-2xl font-semibold text-ink">74</span>
              <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted">
                overall
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Solid foundation</p>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-muted">
              Strong role signal. The fastest gain is one measured result per answer.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 px-5 pb-5">
          {RUBRIC.map((d, i) => {
            const value = [78, 81, 66, 71][i];
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between text-[0.68rem] font-semibold">
                  <span className="text-ink-soft">{d.label}</span>
                  <span className="text-muted">{value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${value}%`, background: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-line bg-cream/60 px-5 py-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
            Evidence
          </p>
          <p className="mt-1.5 border-l-2 border-lilac-2 pl-3 text-[0.76rem] italic leading-relaxed text-ink-soft">
            “I moved the filter state into the URL and cut the p95 render from 820 ms to
            310 ms.”
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-muted">
            <Spark className="h-3.5 w-3.5 text-violet" />
            Next: quantify the result in every answer.
          </p>
        </div>
      </div>

      <div
        className="absolute -bottom-20 -right-4 z-10 hidden rotate-[4deg] rounded-2xl border border-line bg-lilac px-4 py-3 shadow-soft sm:block"
        aria-hidden
      >
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet-deep">
          Local fallback
        </p>
        <p className="mt-1 text-[0.72rem] font-semibold text-ink">
          AI offline · session continues
        </p>
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    "Role, level, type & difficulty",
    "Adaptive follow-ups",
    "Visible four-part rubric",
    "Evidence quoted from your answers",
    "Targeted next practice",
  ];
  return (
    <section className="border-y border-line bg-paper/60 px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 text-[0.74rem] font-semibold text-muted"
          >
            <Check className="h-3.5 w-3.5 text-teal" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  const cards = [
    {
      icon: <Chat />,
      title: "Generic question banks",
      body: "Static lists do not adapt to your target role, seniority, or what you actually said in the last answer.",
      tint: "bg-lilac",
      color: "text-violet",
    },
    {
      icon: <Gauge />,
      title: "Vague post-interview feedback",
      body: "A rejection or a pass/fail note rarely tells you which sentence lost the interviewer — or what to fix first.",
      tint: "bg-[#fdebe7]",
      color: "text-coral",
    },
    {
      icon: <Target />,
      title: "Real practice is expensive",
      body: "Expert mock interviews need a willing mentor, a schedule, and money. Most students get one shot at the real thing.",
      tint: "bg-[#e2f6f1]",
      color: "text-teal",
    },
  ];

  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            eyebrow="The problem"
            title={
              <>
                Interview practice is out of reach for{" "}
                <span className="text-violet">most students.</span>
              </>
            }
            lede="Early-career applicants rarely get realistic, role-specific practice before the interview that matters. The gap is not effort — it is access to a feedback loop."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90}>
              <article className="card card-hover h-full p-6">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.tint} ${card.color}`}>
                  {card.icon}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Loop() {
  const steps = [
    {
      n: "01",
      title: "Prepare",
      body: "Role, level, interview type and difficulty become one focused session plan.",
      icon: <Target />,
    },
    {
      n: "02",
      title: "Answer",
      body: "One question at a time, with realistic follow-ups that react to what you said.",
      icon: <Chat />,
    },
    {
      n: "03",
      title: "Understand",
      body: "Four transparent dimensions, each backed by a quote from your transcript.",
      icon: <Gauge />,
    },
    {
      n: "04",
      title: "Improve",
      body: "Two or three micro-actions plus an improved-answer blueprint to re-practice.",
      icon: <Spark />,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-ink px-5 py-24 text-cream sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(40rem 24rem at 12% 0%, #6c4de6, transparent 65%), radial-gradient(34rem 22rem at 90% 100%, #2eaa96, transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-3xl">
            <p className="eyebrow !text-lilac-2">The coaching loop</p>
            <h2 className="display-l mt-3 text-cream">
              Practice becomes growth when the loop closes.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream/65">
              ViewPilot is built as a continuous cycle: diagnose the gap, practise the
              answer, see the evidence, and return with a specific target.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 90}>
              <div className="group relative h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:bg-white/[0.07]">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lilac text-violet-deep">
                    {step.icon}
                  </span>
                  <span className="font-mono text-[0.66rem] font-bold tracking-widest text-cream/35">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-cream">{step.title}</h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-cream/60">
                  {step.body}
                </p>
                {i < steps.length - 1 && (
                  <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-cream/25 lg:block">
                    <ArrowRight />
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    {
      n: "01",
      title: "Choose",
      body: "Select target role, seniority, interview type and difficulty. Add a resume only if you want personalisation.",
    },
    {
      n: "02",
      title: "Interview",
      body: "Answer adaptive prompts one at a time. A thin answer earns one evidence-seeking follow-up, not a new topic.",
    },
    {
      n: "03",
      title: "Improve",
      body: "Open a report with four scores, transcript evidence, strengths, gaps and a re-practice plan.",
    },
  ];

  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <SectionHead
            eyebrow="The session"
            title={
              <>
                Three steps. No setup maze.
              </>
            }
            lede="A candidate can go from landing page to the first question in under thirty seconds."
          />
          <Link
            href="/interview"
            className="btn btn-primary mt-7 px-6 py-3.5"
          >
            Try the live flow
            <ArrowRight />
          </Link>
        </Reveal>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 100}>
              <div className="card flex items-start gap-4 p-5 sm:p-6">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lilac font-mono text-[0.72rem] font-bold text-violet-deep">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={320}>
            <p className="px-2 text-[0.72rem] font-semibold text-muted">
              Text first. Voice is an optional input, not a dependency.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function RubricSection() {
  return (
    <section className="border-y border-line bg-paper/55 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            eyebrow="Evaluation standard"
            title={
              <>
                Feedback you can trust,{" "}
                <span className="text-violet">not a mystery score.</span>
              </>
            }
            lede="Four transparent dimensions pair clear criteria with concrete coaching advice. The rubric is visible before, during and after the session."
            center
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {RUBRIC.map((d, i) => (
            <Reveal key={d.key} delay={i * 80}>
              <article className="card card-hover h-full p-6">
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: d.color }}
                  />
                  <h3 className="text-lg font-semibold text-ink">{d.label}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{d.criteria}</p>
                <div className="mt-4 rounded-2xl bg-cream/80 px-4 py-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em]" style={{ color: d.color }}>
                    Coaching tip
                  </p>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-soft">
                    {d.tip}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportSection() {
  const points = [
    {
      title: "Transparent scorecard",
      body: "A practice estimate across all four dimensions, with an executive summary you can read in ten seconds.",
    },
    {
      title: "Transcript evidence",
      body: "Exact phrases are quoted to justify a strength or show a missed signal. No feedback without a receipt.",
    },
    {
      title: "Targeted next practice",
      body: "Two or three micro-actions plus an improved-answer blueprint, ready for an immediate second attempt.",
    },
  ];

  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="card-solid overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <span className="chip chip-violet">Report preview</span>
                <span className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted">
                  Attempt 01
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-ink">
                “Tell me about a time you delivered under a tight deadline.”
              </h3>
              <div className="mt-4 rounded-2xl border-l-2 border-violet bg-cream/70 px-4 py-3">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
                  Your words
                </p>
                <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-soft">
                  “We shipped the dashboard in three weeks. I cut the scope to the two
                  screens candidates actually used, and the completion rate went from 41%
                  to 63%.”
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#e2f6f1] p-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-teal">
                    Strength
                  </p>
                  <p className="mt-1 text-[0.74rem] font-semibold leading-snug text-ink">
                    Specific scope decision + measured outcome.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#fdebe7] p-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-coral">
                    Next gain
                  </p>
                  <p className="mt-1 text-[0.74rem] font-semibold leading-snug text-ink">
                    Name the trade-off you rejected.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-2 hidden rounded-2xl border border-line bg-paper px-4 py-3 shadow-soft sm:block">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
                Re-practice
              </p>
              <p className="mt-1 text-[0.72rem] font-semibold text-ink">
                90 seconds · same question
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <SectionHead
            eyebrow="Actionable output"
            title={
              <>
                The report shows the{" "}
                <span className="text-violet">why</span> behind every score.
              </>
            }
            lede="Every critique ties directly to the transcript, so the candidate knows what to keep and what to change."
          />
          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lilac text-violet-deep">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function Architecture() {
  const nodes = [
    { title: "Candidate", body: "Role, level, type, difficulty", icon: <Target /> },
    { title: "Next.js app", body: "Setup, session and report UI", icon: <Layers /> },
    { title: "Server route", body: "Validation · zero keys in browser", icon: <Shield /> },
    { title: "Gemini / local", body: "Questions, follow-ups, evaluation", icon: <Spark /> },
    { title: "Report", body: "Schema-checked coaching output", icon: <Gauge /> },
  ];

  return (
    <section className="px-5 pb-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="card relative overflow-hidden p-7 sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lilac/60 blur-3xl" aria-hidden />
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHead
                eyebrow="System architecture"
                title="Small, explainable, and hard to break on stage."
                lede="A stateless request path keeps API keys server-side. If the model is slow or missing, the deterministic rubric engine takes over without a blank screen."
              />
              <Link href="/stack" className="btn btn-ghost shrink-0">
                Under the hood
                <ArrowUpRight />
              </Link>
            </div>

            <div className="relative mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {nodes.map((node, i) => (
                <div key={node.title} className="relative rounded-2xl border border-line bg-cream/60 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-paper text-violet shadow-sm">
                    {node.icon}
                  </span>
                  <p className="mt-3 text-[0.8rem] font-semibold text-ink">{node.title}</p>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">{node.body}</p>
                  {i < nodes.length - 1 && (
                    <span className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-lilac-2 lg:block">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Reliability() {
  const cards = [
    {
      icon: <Shield />,
      title: "Keys stay on the server",
      body: "The browser never receives a Gemini key. Requests are validated and the response is schema-checked before it reaches the report.",
      tint: "bg-lilac/70 text-violet",
    },
    {
      icon: <Gauge />,
      title: "Local engine, zero keys",
      body: "A deterministic question bank and rubric engine ship with the app. The entire interview and report work without any external API.",
      tint: "bg-[#e2f6f1] text-teal",
    },
    {
      icon: <Robot />,
      title: "Robot is a backup, not a dependency",
      body: "The ESP32-S3 can add a physical presence or run a preloaded script if the laptop fails. Unplug it and the browser flow is unchanged.",
      tint: "bg-[#fdebe7] text-coral",
    },
  ];

  return (
    <section className="px-5 pb-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            eyebrow="Demo insurance"
            title="Built to survive a bad Wi-Fi day."
            lede="Hackathon demos fail at the worst moment. ViewPilot degrades in layers instead of showing a spinner."
            center
          />
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 80}>
              <article className="card card-hover h-full p-6">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.tint}`}>
                  {card.icon}
                </span>
                <h3 className="mt-5 text-base font-semibold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={260}>
          <p className="mt-6 text-center text-[0.72rem] font-semibold text-muted">
            Robot setup is optional and documented separately.{" "}
            <Link href="/robot" className="underline decoration-lilac-2 underline-offset-4 hover:text-violet">
              See the backup path →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Ethics() {
  const items = [
    {
      title: "Coaching, never gatekeeping",
      body: "Evaluations are preparation feedback, never predictive hiring scores.",
    },
    {
      title: "Zero demographic scoring",
      body: "No evaluation of accent, appearance, pitch, age, gender or any protected trait.",
    },
    {
      title: "Privacy by default",
      body: "Answers stay in your browser unless you deploy AI mode with your own server key.",
    },
  ];

  return (
    <section className="border-y border-line bg-paper/60 px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal>
          <SectionHead
            eyebrow="Ethics & trust"
            title="Responsible by design, not by disclaimer."
            lede="A practice tool should make you better, not rank you. These constraints are part of the product, not a footnote."
          />
        </Reveal>
        <div className="grid gap-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <div className="flex gap-4 rounded-2xl border border-line bg-cream/60 p-5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac text-violet-deep">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionHead eyebrow="Questions" title="The short answers." center />
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="group card px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                  {item.q}
                  <span className="text-violet transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="px-5 pb-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-center sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(30rem 18rem at 20% 0%, #6c4de6, transparent 65%), radial-gradient(26rem 16rem at 85% 100%, #2eaa96, transparent 65%)",
              }}
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <p className="eyebrow !text-lilac-2">Your next interview</p>
              <h2 className="display-l mt-3 text-cream">
                Practise the answer before it counts.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/65">
                Five questions. One report. A clear next step. No account, no keys, and
                no robot required.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="/interview" className="btn btn-primary px-6 py-3.5">
                  Start practicing
                  <ArrowRight />
                </Link>
                <Link
                  href="/how"
                  className="btn border border-white/15 bg-white/5 px-6 py-3.5 text-cream hover:bg-white/10"
                >
                  Read the method
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Problem />
      <Loop />
      <Workflow />
      <RubricSection />
      <ReportSection />
      <Architecture />
      <Reliability />
      <Ethics />
      <Faq />
      <Cta />
    </>
  );
}
