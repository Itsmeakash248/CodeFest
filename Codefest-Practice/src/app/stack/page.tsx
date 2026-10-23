import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/vp/PageHero";
import Reveal from "@/components/vp/Reveal";
import { ArrowRight, Check, Gauge, Layers, Robot, Shield, Spark } from "@/components/vp/Icons";

export const metadata: Metadata = {
  title: "Under the hood — ViewPilot",
  description:
    "ViewPilot architecture: a Next.js client, a server-only AI route, a deterministic local rubric engine, and an optional robot backup.",
};

const LAYERS = [
  {
    title: "Client",
    body: "Next.js App Router + React 19 + Tailwind 4. Setup, session state, timer, voice input and the printable report.",
    tags: ["Next.js 16", "React 19", "Tailwind 4"],
    icon: <Layers />,
  },
  {
    title: "Server route",
    body: "Validates the request, builds the prompt and holds the key. The browser never sees a credential.",
    tags: ["/api/interview", "Zod-style guards", "Node runtime"],
    icon: <Shield />,
  },
  {
    title: "AI layer",
    body: "Gemini generates adaptive questions and structured feedback when a key is configured.",
    tags: ["Gemini 2.5 Flash", "JSON output", "22s timeout"],
    icon: <Spark />,
  },
  {
    title: "Local engine",
    body: "The same request returns a deterministic question, follow-up or report when AI is missing, slow or invalid.",
    tags: ["Zero keys", "Deterministic", "Always available"],
    icon: <Gauge />,
  },
];

const FALLBACKS = [
  {
    title: "1 · Gemini",
    body: "Adaptive questions, follow-ups and a schema-checked report. Best experience.",
    tone: "bg-lilac text-violet-deep",
  },
  {
    title: "2 · Local rubric engine",
    body: "Built-in question bank and heuristic evaluator. Full session and report, no network.",
    tone: "bg-[#e2f6f1] text-teal",
  },
  {
    title: "3 · Robot backup",
    body: "Optional physical presence or preloaded script if the demo laptop fails. Never required.",
    tone: "bg-[#fdebe7] text-coral",
  },
];

export default function StackPage() {
  return (
    <>
      <PageHero
        eyebrow="Under the hood"
        title={
          <>
            A small architecture that is{" "}
            <span className="text-violet">easy to defend.</span>
          </>
        }
        lede="One request path, two evaluation engines, and a hard boundary between the browser and every secret."
      />

      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAYERS.map((layer, i) => (
            <Reveal key={layer.title} delay={i * 70}>
              <article className="card h-full p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lilac text-violet">
                  {layer.icon}
                </span>
                <h2 className="mt-4 text-base font-semibold text-ink">{layer.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{layer.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {layer.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-cream-2 px-2 py-0.5 text-[0.62rem] font-bold text-ink-soft">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="card p-7 sm:p-9">
              <p className="eyebrow">Request path</p>
              <h2 className="display-m mt-3 text-ink">Candidate → route → engine → report.</h2>
              <div className="mt-7 grid gap-3 lg:grid-cols-5">
                {[
                  ["Candidate", "role · level · type · difficulty"],
                  ["/interview", "setup + session UI"],
                  ["/api/interview", "validate · prompt · timeout"],
                  ["Gemini or local", "question · follow-up · report"],
                  ["/report", "scorecard · evidence · next step"],
                ].map(([title, body], i) => (
                  <div key={title} className="relative rounded-2xl border border-line bg-cream/60 p-4">
                    <p className="font-mono text-[0.6rem] font-bold tracking-wider text-violet">
                      0{i + 1}
                    </p>
                    <p className="mt-1 text-[0.82rem] font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">{body}</p>
                    {i < 4 && (
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

      <section className="border-y border-line bg-paper/60 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="eyebrow">Graceful degradation</p>
            <h2 className="display-m mt-3 text-ink">Three layers. The demo never hits a dead end.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              The response includes a <code className="rounded bg-cream-2 px-1.5 py-0.5 text-[0.75rem]">source</code> field
              so the UI can tell the candidate which engine produced the feedback.
            </p>
          </Reveal>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {FALLBACKS.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="card h-full p-6">
                  <span className={`chip ${item.tone}`}>{item.title}</span>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card h-full p-7">
              <p className="eyebrow">Environment</p>
              <h2 className="display-m mt-3 text-ink">Two variables, both optional.</h2>
              <div className="mt-5 space-y-2">
                {[
                  ["GEMINI_API_KEY", "Enables adaptive AI questions and reports."],
                  ["ROBOT_BASE_URL", "Enables the optional ESP32-S3 robot bridge."],
                ].map(([key, body]) => (
                  <div key={key} className="rounded-2xl border border-line bg-cream/60 p-4">
                    <code className="text-[0.76rem] font-bold text-violet-deep">{key}</code>
                    <p className="mt-1 text-[0.78rem] text-muted">{body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[0.72rem] font-semibold text-muted">
                With neither variable set, the full interview and report still work.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="card h-full p-7">
              <p className="eyebrow">Safety rules</p>
              <h2 className="display-m mt-3 text-ink">No key in the browser. No trait scoring.</h2>
              <ul className="mt-5 space-y-3">
                {[
                  "Keys live in server environment variables only.",
                  "Resume text is treated as untrusted input, never as instructions.",
                  "Every AI response is validated before it becomes UI.",
                  "Scores are labelled practice estimates, not hiring predictions.",
                  "No accent, appearance, age, gender or disability inference.",
                  "Robot credentials stay on the local network.",
                ].map((rule) => (
                  <li key={rule} className="flex gap-3 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-lilac/50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-paper text-violet">
              <Robot />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">The robot is a separate, optional service.</p>
              <p className="text-[0.78rem] text-muted">Unplug it and every route above is unchanged.</p>
            </div>
          </div>
          <Link href="/robot" className="btn btn-ghost">
            Robot backup
            <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
