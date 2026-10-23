"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CircleDot,
  GripVertical,
  Layers3,
  MessageSquare,
  MousePointer2,
  Play,
  Sparkles,
  Volume2,
  Workflow,
} from "lucide-react";
import WorkspaceMock from "@/components/landing/WorkspaceMock";
import RobotFace from "@/components/landing/RobotFace";
import { cn } from "@/components/ui/cn";

const phases = [
  {
    id: "chat",
    label: "Chat",
    kicker: "01 · Conversation",
    title: "Talk to a specialist,",
    titleAccent: "not a question bank.",
    body: "One role. One thread. Five specialists.",
    points: [
      "Streamed replies with the source visible",
      "Mic, markdown and rubric in context",
    ],
    cta: "Open the coach",
    href: "/interview",
    view: "chat" as const,
    icon: MessageSquare,
  },
  {
    id: "workflow",
    label: "Workflow",
    kicker: "02 · Orchestration",
    title: "Build the prep loop once.",
    titleAccent: "Run it before every interview.",
    body: "Drag. Reorder. Run. Every step reports in.",
    points: ["Nine node types · three templates", "Live status and output per node"],
    cta: "See the builder",
    href: "/login",
    view: "workflow" as const,
    icon: Workflow,
  },
  {
    id: "interview",
    label: "Interview",
    kicker: "03 · Rehearsal",
    title: "A room that listens back.",
    titleAccent: "Then shows its work.",
    body: "Probes thin answers once. Scores what you said.",
    points: ["Adaptive follow-up on thin answers", "Four weighted scores with quotes"],
    cta: "Begin a mock interview",
    href: "/interview",
    view: "interview" as const,
    icon: Bot,
  },
];

export default function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };
    let pointerFrame = 0;

    const readScroll = () => {
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / distance));
      stage.style.setProperty("--sp", progress.toFixed(4));
      if (fillRef.current) fillRef.current.style.width = `${progress * 100}%`;
      if (pctRef.current) pctRef.current.textContent = `${String(Math.round(progress * 100)).padStart(2, "0")}%`;
      const index = progress < 0.35 ? 0 : progress < 0.7 ? 1 : 2;
      setPhase((current) => (current === index ? current : index));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        readScroll();
      });
    };

    const paintPointer = () => {
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.09;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.09;
      stage.style.setProperty("--mx", pointerCurrent.x.toFixed(3));
      stage.style.setProperty("--my", pointerCurrent.y.toFixed(3));
      if (
        Math.abs(pointerTarget.x - pointerCurrent.x) > 0.002 ||
        Math.abs(pointerTarget.y - pointerCurrent.y) > 0.002
      ) {
        pointerFrame = window.requestAnimationFrame(paintPointer);
      } else {
        pointerFrame = 0;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced) return;
      const rect = stage.getBoundingClientRect();
      pointerTarget = {
        x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)),
      };
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(paintPointer);
    };

    const onPointerLeave = () => {
      pointerTarget = { x: 0, y: 0 };
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(paintPointer);
    };

    readScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    };
  }, []);

  function jumpTo(index: number) {
    const section = sectionRef.current;
    if (!section) return;
    const top = window.scrollY + section.getBoundingClientRect().top;
    const distance = section.offsetHeight - window.innerHeight;
    const fractions = [0.16, 0.5, 0.84];
    window.scrollTo({ top: top + distance * fractions[index], behavior: "smooth" });
  }

  return (
    <div id="workspace" className="relative scroll-mt-[68px]">
      <section
        ref={sectionRef}
        aria-label="Interactive product tour"
        className="relative hidden lg:block"
        style={{ height: "300vh" }}
      >
        <div className="sticky top-[68px] flex h-[calc(100dvh-68px)] flex-col overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
          <div
            aria-hidden="true"
            className="aurora left-[-10%] top-[10%] h-[480px] w-[480px] bg-[#6c63ff]/25"
            style={{ opacity: phase === 0 ? 0.5 : 0.18 }}
          />
          <div
            aria-hidden="true"
            className="aurora right-[-8%] top-[32%] h-[420px] w-[420px] bg-[#00d9ff]/[0.16]"
            style={{ opacity: phase === 1 ? 0.55 : 0.2 }}
          />
          <div
            aria-hidden="true"
            className="aurora bottom-[-12%] left-[38%] h-[460px] w-[520px] bg-[#3b2f8f]/40"
            style={{ opacity: phase === 2 ? 0.6 : 0.22 }}
          />

          <div className="relative mx-auto flex w-full max-w-[1360px] flex-1 items-center px-8 xl:px-12">
            <div className="grid w-full grid-cols-[minmax(280px,0.78fr)_minmax(0,1.42fr)] items-center gap-10 xl:gap-16">
              {/* copy rail */}
              <div className="relative z-20">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b8ba3]">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                    <CircleDot size={8} className="text-[#a8a2ff]" />
                    3D workspace tour
                  </span>
                  <span className="text-[#565969]">/</span>
                  <span>Scroll to explore</span>
                </div>

                <div className="relative mt-6 min-h-[340px]">
                  {phases.map((item, index) => {
                    const active = phase === index;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        aria-hidden={!active}
                        className={cn(
                          "transition-all duration-500 ease-out",
                          active
                            ? "relative translate-y-0 opacity-100 blur-0"
                            : "pointer-events-none absolute inset-x-0 top-0 translate-y-5 opacity-0 blur-[3px]",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[#b3adff]">
                            <Icon size={15} strokeWidth={1.7} />
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b8ba3]">
                            {item.kicker}
                          </span>
                        </div>

                        <h2 className="mt-5 font-display text-[42px] font-semibold leading-[0.98] tracking-[-0.045em] text-white xl:text-[52px]">
                          {item.title}
                          <br />
                          <span className="text-gradient">{item.titleAccent}</span>
                        </h2>
                        <p className="mt-5 max-w-[390px] text-[13.5px] leading-relaxed text-[#a9a9ba]">
                          {item.body}
                        </p>

                        <ul className="mt-5 space-y-2.5">
                          {item.points.map((point) => (
                            <li key={point} className="flex items-start gap-2.5 text-[12px] leading-snug text-[#b8b8c8]">
                              <span className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                                <Check size={9} strokeWidth={2.5} />
                              </span>
                              {point}
                            </li>
                          ))}
                        </ul>

                        <Link
                          href={item.href}
                          className="group mt-6 inline-flex items-center gap-2 text-[12.5px] font-semibold text-white transition-colors hover:text-[#c9c5ff]"
                        >
                          {item.cta}
                          <ArrowRight
                            size={14}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </Link>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 flex items-center gap-3">
                  {phases.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => jumpTo(index)}
                      aria-label={`Jump to ${item.label} scene`}
                      aria-current={phase === index ? "true" : undefined}
                      className={cn(
                        "flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] transition-colors",
                        phase === index ? "text-white" : "text-[#5f6273] hover:text-[#9b9cae]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1 rounded-full transition-all duration-300",
                          phase === index ? "w-7 bg-[#a8a2ff]" : "w-3 bg-white/15",
                        )}
                      />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D stage */}
              <div
                ref={stageRef}
                tabIndex={0}
                role="group"
                aria-label="3D workspace preview. Use left and right arrow keys to change scenes."
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    jumpTo(Math.min(2, phase + 1));
                  }
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    jumpTo(Math.max(0, phase - 1));
                  }
                }}
                className="relative min-w-0 outline-none [perspective:2100px] focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-[#6c63ff]/50"
              >
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-[560px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(108,99,255,0.18),rgba(0,217,255,0.04)_48%,transparent_70%)] blur-2xl"
                />

                {/* orbit */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
                  <span className="orbit-ring left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-60" />
                  <span className="orbit-ring left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 border-dashed opacity-40 [transform:translate(-50%,-50%)_rotateX(70deg)]" />
                  <span className="absolute left-[6%] top-[18%] h-1 w-1 rounded-full bg-[#a8a2ff] shadow-[0_0_12px_rgba(168,162,255,0.9)]" />
                  <span className="absolute bottom-[14%] right-[6%] h-1 w-1 rounded-full bg-[#7fe8ff] shadow-[0_0_12px_rgba(127,232,255,0.9)]" />
                </div>

                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-[74%] h-24 w-[72%] -translate-x-1/2 rounded-[50%] bg-[#6c63ff]/[0.12] blur-3xl"
                />

                <div
                  className="relative z-10 [transform-style:preserve-3d]"
                  style={{
                    transform:
                      "rotateX(calc(10deg - var(--sp, 0) * 12deg + var(--my, 0) * -2.2deg)) rotateY(calc(-15deg + var(--sp, 0) * 30deg + var(--mx, 0) * 5deg)) rotateZ(calc(-1deg + var(--sp, 0) * 2deg))",
                    transformOrigin: "50% 55%",
                    transition: "transform 120ms linear",
                  }}
                >
                  <div className="absolute inset-x-8 top-6 h-full rounded-[24px] border border-white/[0.05] bg-[#0f0f17]/60" style={{ transform: "translateZ(-50px) translateY(22px) scale(0.97)" }} />
                  <div className="absolute inset-x-12 top-10 h-full rounded-[24px] border border-white/[0.035] bg-[#0b0b12]/50" style={{ transform: "translateZ(-94px) translateY(40px) scale(0.94)" }} />

                  <div className="overflow-hidden rounded-[20px] border border-white/[0.09] shadow-[0_50px_110px_rgba(0,0,0,0.62)]">
                    <WorkspaceMock view={phases[phase].view} grand />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-[20px] bg-[linear-gradient(125deg,rgba(255,255,255,0.1),transparent_22%,transparent_76%,rgba(0,217,255,0.05))] opacity-80 mix-blend-screen"
                    />
                  </div>

                  {/* phase-marked depth overlays */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute -left-10 top-[18%] w-[170px] transition-all duration-500",
                      phase === 0
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-4 opacity-0",
                    )}
                    style={{ transform: "translateZ(130px)" }}
                  >
                    <div className="rounded-2xl border border-[#6c63ff]/25 bg-[#14131f]/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#8d86ff]" />
                        <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#a8a2ff]">Streaming</span>
                      </div>
                      <p className="mt-2 text-[10.5px] leading-relaxed text-[#dedee9]">
                        &ldquo;Name the trade-off you owned, then the result.&rdquo;
                      </p>
                      <p className="mt-1.5 font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#6f7284]">
                        Gemini · 820ms · caret
                      </p>
                    </div>
                  </div>

                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute -right-8 top-[9%] w-[150px] transition-all duration-500",
                      phase === 1
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-4 opacity-0",
                    )}
                    style={{ transform: "translateZ(110px)" }}
                  >
                    <div className="rounded-2xl border border-[#00d9ff]/20 bg-[#101820]/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                      <div className="flex items-center gap-1.5">
                        <GripVertical size={9} className="text-[#7fe8ff]" />
                        <span className="font-mono text-[7px] uppercase tracking-[0.13em] text-[#7fe8ff]">Drag node</span>
                      </div>
                      <p className="mt-2 text-[10.5px] font-medium text-white">Evaluate answers</p>
                      <p className="mt-0.5 font-mono text-[6.5px] uppercase tracking-[0.08em] text-[#6f7284]">
                        4 scores · evidence
                      </p>
                    </div>
                  </div>

                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute -right-6 bottom-[2%] w-[190px] transition-all duration-500",
                      phase === 2
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-6 opacity-0",
                    )}
                    style={{ transform: "translateZ(170px)" }}
                  >
                    <div className="rounded-[24px] border border-white/[0.12] bg-[#0d0d15]/95 p-4 shadow-[0_30px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[6.5px] uppercase tracking-[0.14em] text-[#7fe8ff]">Presence</span>
                        <span className="flex items-center gap-1 font-mono text-[6px] uppercase tracking-[0.1em] text-emerald-300">
                          <span className="h-1 w-1 rounded-full bg-emerald-400" /> LAN
                        </span>
                      </div>
                      <RobotFace expression={phase === 2 ? "thinking" : "neutral"} compact className="mx-auto mt-2 w-[130px]" />
                      <p className="mt-2 text-center font-mono text-[6.5px] uppercase tracking-[0.1em] text-[#6f7284]">
                        Evaluating your answer
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative z-20 mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#565969]">
                    <MousePointer2 size={9} />
                    Move to orbit · arrows to switch
                  </span>
                  <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#565969]">
                    <span ref={pctRef}>00%</span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/[0.08]">
                      <ChevronDown size={9} />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* progress rail */}
          <div className="relative z-20 border-t border-white/[0.05] bg-black/10">
            <div className="mx-auto flex w-full max-w-[1360px] items-center gap-4 px-8 py-3 xl:px-12">
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#565969]">Tour</span>
              <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  ref={fillRef}
                  className="block h-full w-0 rounded-full bg-gradient-to-r from-[#6c63ff] via-[#8d86ff] to-[#00d9ff]"
                />
              </div>
              <div className="hidden items-center gap-4 sm:flex">
                <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#6f7284]">
                  <Volume2 size={9} /> Voice ready
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#6f7284]">
                  <Play size={9} /> Local engine
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#6f7284]">
                  <Layers3 size={9} /> 9 nodes
                </span>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 rotate-90 font-mono text-[8px] uppercase tracking-[0.4em] text-white/[0.08]"
          >
            ViewPilot workspace
          </div>
        </div>
      </section>

      {/* mobile / tablet alternative: no sticky hijack */}
      <section aria-label="Workspace surfaces" className="relative px-5 py-16 sm:py-20 lg:hidden">
        <div className="mx-auto max-w-2xl">
          <span className="label">The workspace</span>
          <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-[42px]">
            One workspace.{" "}
            <span className="text-gradient">Three surfaces.</span>
          </h2>
          <p className="mt-3 max-w-[480px] text-[13px] leading-relaxed text-[#a9a9ba]">
            One context across chat, workflow and rehearsal.
          </p>

          <div className="mt-8 space-y-7">
            {phases.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[#b3adff]">
                      <Icon size={15} />
                    </span>
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#6f7284]">{item.kicker}</p>
                      <p className="font-display text-[16px] font-semibold text-white">{item.label} surface</p>
                    </div>
                  </div>
                  <div className="relative [perspective:1100px]">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-4 top-3 h-full rounded-[18px] border border-white/[0.05] bg-[#0e0e16]/70"
                      style={{ transform: "translateY(12px) scale(0.985)" }}
                    />
                    <div className="relative overflow-hidden rounded-[18px] [transform:rotateX(1.5deg)] [transform-style:preserve-3d]">
                      <WorkspaceMock view={item.view} className="shadow-2xl" />
                    </div>
                  </div>
                  <p className="mt-2.5 text-[12px] leading-relaxed text-[#8d8d9f]">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/interview" className="btn btn-primary">
              Try the interview room <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Open the workspace <Sparkles size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
