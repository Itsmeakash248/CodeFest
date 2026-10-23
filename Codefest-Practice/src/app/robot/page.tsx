import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/vp/PageHero";
import Reveal from "@/components/vp/Reveal";
import RobotStatus from "@/components/vp/RobotStatus";
import { ArrowRight, Check, Robot, Shield } from "@/components/vp/Icons";

export const metadata: Metadata = {
  title: "Robot backup — ViewPilot",
  description:
    "The ESP32-S3 robot is an optional backup interviewer and physical presence. ViewPilot works fully without it.",
};

export default function RobotPage() {
  return (
    <>
      <PageHero
        eyebrow="Robot backup"
        title={
          <>
            A backup interviewer,{" "}
            <span className="text-violet">never a dependency.</span>
          </>
        }
        lede="The ESP32-S3 robot can add a face, a physical presence and a fallback script to the demo. Every ViewPilot interview, evaluation and report works with it switched off."
      >
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/interview" className="btn btn-primary">
            Start without the robot
            <ArrowRight />
          </Link>
          <Link href="/stack" className="btn btn-ghost">
            See the architecture
          </Link>
        </div>
      </PageHero>

      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="card h-full p-7 sm:p-8">
              <span className="chip chip-coral">Optional layer</span>
              <h2 className="display-m mt-4 text-ink">
                What the robot actually does.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The current firmware exposes a local REST API for face emotions,
                actions and telemetry. ViewPilot uses it for presence, not for the
                interview logic.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Presence", "Reacts with a curious, focused or happy face as the session moves."],
                  ["Backup script", "If the laptop or network fails, the team can run a preloaded five-question script beside the robot."],
                  ["Local only", "The robot API is LAN-only and unauthenticated; it is never exposed to the public internet."],
                  ["No dependency", "No question, score, report or page requires the robot to be online."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-line bg-cream/60 p-4">
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">{body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
                  What it does not do
                </p>
                <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">
                  It does not score answers, generate questions, store transcripts or
                  replace the browser flow. The microphone/speaker add-on is future work,
                  not part of the current demo.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-4">
              <RobotStatus />
              <div className="card p-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal" />
                  <p className="text-sm font-semibold text-ink">Demo fallback ladder</p>
                </div>
                <ol className="mt-3 space-y-2 text-[0.8rem] text-muted">
                  <li><b className="text-ink">1.</b> Gemini session (best experience)</li>
                  <li><b className="text-ink">2.</b> Local rubric engine (no network)</li>
                  <li><b className="text-ink">3.</b> Preloaded script + robot presence</li>
                  <li><b className="text-ink">4.</b> Recorded backup video</li>
                </ol>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="eyebrow">Setup</p>
            <h2 className="display-m mt-3 text-ink">Two commands, no tight coupling.</h2>
          </Reveal>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              ["1 · Flash", "Build and flash the ESP32-S3 firmware. Join the robot to the same trusted Wi-Fi network as the demo laptop."],
              ["2 · Point", "Set ROBOT_BASE_URL to the IP printed by the serial log, for example http://192.168.1.42."],
              ["3 · Test", "Open this page and press “Send a curious face”. If it is offline, ignore it and start the interview."],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="card h-full p-6">
                  <span className="font-mono text-[0.7rem] font-bold text-violet">0{i + 1}</span>
                  <h3 className="mt-2 text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={220}>
            <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
                Environment
              </p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-ink px-4 py-3 text-[0.74rem] text-cream/90">
                <code>ROBOT_BASE_URL=http://192.168.1.42</code>
              </pre>
              <p className="mt-2 text-[0.72rem] font-semibold text-muted">
                Optional. Leave it unset and the robot card simply reports “not connected”.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="card p-7 sm:p-9">
              <span className="chip chip-coral">Backup kit</span>
              <h2 className="display-m mt-4 text-ink">
                Five questions if the laptop dies.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The robot supplies the physical presence; a teammate reads the questions
                and takes short notes. This is a human fallback, not a scored ViewPilot
                session — and it still works if the robot is switched off.
              </p>
              <ol className="mt-6 space-y-3">
                {[
                  "Walk me through a project you are proud of. What was your specific contribution, not the team's?",
                  "Tell me about a time you delivered under a tight deadline. What trade-off did you make?",
                  "Describe a disagreement with a teammate. How did you resolve it, and what changed?",
                  "What is a technical decision you made that you would change now, and why?",
                  "Why this role, and what would you want to learn in the first month?",
                ].map((question, i) => (
                  <li key={question} className="flex gap-3 rounded-2xl border border-line bg-cream/50 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lilac text-[0.66rem] font-bold text-violet-deep">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-ink-soft">{question}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[0.72rem] font-semibold text-muted">
                Tip: keep answers to 60–90 seconds and ask for one concrete metric.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-paper/60 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac text-violet">
                <Robot />
              </span>
              <h2 className="display-m mt-4 text-ink">The rule for the demo.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                Start the interview first. It must reach the report with the robot
                unplugged. Only then add the robot as a visual layer. That order keeps the
                product honest and the demo alive.
              </p>
            </div>
            <ul className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
              {[
                "Robot offline → session unchanged",
                "Robot online → face reacts, no extra wait",
                "No robot credentials in the browser",
                "No question or score depends on it",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-xl border border-line bg-cream/60 px-3 py-2 text-[0.78rem] font-semibold text-ink-soft">
                  <Check className="h-4 w-4 text-teal" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
