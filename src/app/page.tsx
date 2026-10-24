import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  Clock3,
  Database,
  Gauge,
  Layers3,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import Hero3D from "@/components/landing/Hero3D";
import ScrollStory from "@/components/landing/ScrollStory";
import WorkflowPreview from "@/components/landing/WorkflowPreview";
import ReportPreview from "@/components/landing/ReportPreview";
import RobotDemo from "@/components/landing/RobotDemo";
import RubricCube from "@/components/landing/RubricCube";
import TiltCard from "@/components/landing/TiltCard";
import Logo from "@/components/ui/Logo";
import Reveal from "@/components/ui/Reveal";
import { agentAccent } from "@/components/ui/AgentIcon";
import { AGENTS } from "@/lib/agents/agents";
import { ROLES } from "@/lib/data/roles";
import { getSessionFromCookies } from "@/lib/session";
import { cn } from "@/components/ui/cn";

export const metadata: Metadata = {
  title: "Rehearse the interview. Own the feedback.",
  description:
    "Five specialist agents, adaptive mock interviews, a visible four-part rubric and a practice plan built from your own answers. Built by Team Mooncraft for CodeFest 2026.",
};

const container = "mx-auto w-full max-w-[1480px] px-6 sm:px-10";

const marqueeRoles = ROLES.slice(0, 9).map((role) => role.label);

const steps = [
  {
    number: "01",
    title: "Set the target",
    body: "Role, level, format. Resume optional.",
    meta: "~20 seconds",
    icon: Target,
  },
  {
    number: "02",
    title: "Rehearse",
    body: "Five questions. Voice or text. Follow-ups on thin answers.",
    meta: "~12 minutes",
    icon: Mic,
  },
  {
    number: "03",
    title: "Read the scorecard",
    body: "Four scores. Quoted evidence. One next lift.",
    meta: "<60 seconds",
    icon: Gauge,
  },
  {
    number: "04",
    title: "Run the next rep",
    body: "Three timed drills. Next-interview blueprint.",
    meta: "25 minutes",
    icon: Workflow,
  },
];

const reliability = [
  {
    label: "Layer 01 · AI",
    title: "Gemini 2.5 Flash",
    body: "Adaptive questions and deeper scoring with a key.",
    icon: Sparkles,
    tone: "text-[var(--color-tertiary)] dark:text-[var(--color-tertiary)] border-[var(--color-tertiary)]/30 bg-[var(--color-tertiary)]/10",
    status: "When available",
  },
  {
    label: "Layer 02 · always on",
    title: "Local rubric engine",
    body: "Deterministic signal, structure, evidence and role scoring.",
    icon: ShieldCheck,
    tone: "text-[var(--color-success)] dark:text-[var(--color-success)] border-[var(--color-success)]/30 bg-[var(--color-success)]/10",
    status: "Zero-key",
  },
  {
    label: "Layer 03 · optional",
    title: "Robot presence",
    body: "Listening, thinking, encouraging. LAN only. Never required.",
    icon: Bot,
    tone: "text-[var(--color-primary)] dark:text-[var(--color-primary)] border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10",
    status: "LAN only",
  },
];

const trust = [
  {
    title: "Practice estimate, not a verdict",
    body: "Coaching, never a hiring prediction.",
    icon: Gauge,
  },
  {
    title: "No protected traits scored",
    body: "Structure, evidence and clarity. Nothing else.",
    icon: ShieldCheck,
  },
  {
    title: "Local by default",
    body: "Reports stay in this browser.",
    icon: Database,
  },
];

export default async function LandingPage() {
  const user = await getSessionFromCookies();
  const workspaceHref = user ? "/dashboard" : "/login";
  const workflowHref = user
    ? "/dashboard?mode=workflow"
    : "/login?next=%2Fdashboard%3Fmode%3Dworkflow";
  const settingsHref = user ? "/settings" : "/login?next=%2Fsettings";
  const practiceHref = user ? "/interview" : "/signup?next=%2Finterview";

  return (
    <div className="landing-page relative min-h-dvh overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--color-surface)] focus:px-5 focus:py-3 focus:text-[13px] focus:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        Skip to content
      </a>

      <LandingNav user={user ? { name: user.name, email: user.email } : null} />

      <main id="main">
        {/* ---------------------------------------------------------------- hero */}
        <section className="relative overflow-hidden pb-14 pt-8 sm:pt-12 lg:pb-20 lg:pt-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 grid-bg opacity-40" />
            <div className="aurora left-[-12%] top-[-6%] h-[560px] w-[560px] bg-[var(--color-primary)]/15" />
            <div className="aurora right-[-10%] top-[18%] h-[520px] w-[520px] bg-[var(--color-secondary)]/15" />
            <div className="absolute left-1/2 top-0 h-[720px] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--color-outline)]/40 to-transparent" />
          </div>

          <div className={`${container} relative`}>
            <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10 xl:gap-14">
              <div className="relative z-10 max-w-[620px]">
                <Reveal>
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-4 py-2">
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                      CodeFest 2026 · Job readiness
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={90}>
                  <h1 className="mt-6 font-display text-[56px] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-[70px] xl:text-[84px]">
                    Rehearse the
                    <br />
                    interview.
                    <br />
                    <span className="text-gradient">Own the feedback.</span>
                  </h1>
                </Reveal>

                <Reveal delay={160}>
                  <p className="mt-6 max-w-[480px] text-[16.5px] leading-relaxed text-[var(--color-text-secondary)] sm:text-[18px]">
                    Five specialists. Adaptive interviews. One scorecard from your words.
                  </p>
                </Reveal>

                <Reveal delay={230}>
                  <div className="mt-8 flex flex-wrap items-center gap-3.5">
                    <Link href={practiceHref} className="btn btn-primary !px-6 !py-4 !text-[15px]">
                      Run a mock interview
                      <ArrowUpRight size={18} />
                    </Link>
                    <Link href={user ? workspaceHref : "/signup"} className="btn btn-ghost !px-6 !py-4 !text-[15px]">
                      {user ? "Explore the workspace" : "Create a free account"}
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={300}>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-secondary)]">
                      <Check size={13} className="text-[var(--color-success)]" />
                      Demo sign-in
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[var(--color-outline)]" aria-hidden="true" />
                    <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-secondary)]">
                      <Check size={13} className="text-[var(--color-success)]" />
                      Voice optional
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[var(--color-outline)]" aria-hidden="true" />
                    <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-secondary)]">
                      <Check size={13} className="text-[var(--color-success)]" />
                      Runs locally
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={360}>
                  <div className="mt-8 grid max-w-[420px] grid-cols-3 divide-x divide-[var(--color-outline)] rounded-3xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] py-3.5 shadow-sm">
                    {[
                      { value: "5", label: "Specialists" },
                      { value: "4", label: "Rubric scores" },
                      { value: "<60s", label: "Report" },
                    ].map((stat) => (
                      <div key={stat.label} className="px-4 text-center">
                        <p className="font-display text-[22px] font-semibold leading-none text-[var(--color-text-primary)]">{stat.value}</p>
                        <p className="mt-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>

              <Reveal delay={140} className="relative min-w-0">
                <Hero3D />
              </Reveal>
            </div>
          </div>

          {/* role marquee */}
          <div className="relative mt-12 overflow-hidden border-y border-white/[0.05] bg-[var(--color-surface-container)] py-3 sm:mt-16">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--color-background)] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--color-background)] to-transparent" />
            <div className="flex w-max animate-marquee items-center">
              {[0, 1].map((group) => (
                <div key={group} className="flex items-center" aria-hidden={group === 1}>
                  {marqueeRoles.map((role) => (
                    <span key={`${group}-${role}`} className="flex items-center">
                      <span className="px-6 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                        {role}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-[var(--color-outline)]" aria-hidden="true" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- scroll-driven 3D */}
        <ScrollStory />

        {/* --------------------------------------------------------------- agents */}
        <section id="agents" className="relative scroll-mt-[68px] py-16 sm:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="aurora right-[-10%] top-[10%] h-[420px] w-[420px] bg-[var(--color-info-strong)]/[0.08]" />
            <div className="pointer-events-none absolute inset-x-0 top-[44%] hidden h-[360px] [perspective:1100px] lg:block">
              <div className="absolute left-1/2 top-1/2 h-[300px] w-[76%] -translate-x-1/2 -translate-y-1/2 [transform:rotateX(72deg)]">
                <span className="orbit-ring inset-0" />
                <span className="orbit-ring inset-[11%] border-dashed opacity-60" />
                <span className="absolute left-[14%] top-1/2 h-1 w-1 rounded-full bg-[var(--color-info-strong)]/70 shadow-[0_0_12px_rgba(0,217,255,0.8)]" />
                <span className="absolute right-[17%] top-[38%] h-1 w-1 rounded-full bg-[var(--color-tertiary)]/70 shadow-[0_0_12px_rgba(168,162,255,0.8)]" />
              </div>
            </div>
          </div>

          <div className={`${container} relative`}>
            <Reveal>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="label">The desk</span>
                  <h2 className="mt-4 max-w-[640px] font-display text-[40px] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-[50px]">
                    Five specialists.{" "}
                    <span className="text-gradient-cyan">One workspace.</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-end">
                  <div className="flex -space-x-2">
                    {AGENTS.map((agent) => {
                      const accent = agentAccent(agent.id);
                      const Icon = accent.icon;
                      return (
                        <span
                          key={agent.id}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border bg-[var(--color-surface)]",
                            accent.border,
                            accent.text,
                          )}
                        >
                          <Icon size={13} strokeWidth={1.7} />
                        </span>
                      );
                    })}
                  </div>
                  <p className="max-w-[120px] text-[10.5px] leading-relaxed text-[var(--color-text-secondary)]">
                    Shared role context.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {AGENTS.map((agent, index) => {
                const accent = agentAccent(agent.id);
                const Icon = accent.icon;
                return (
                  <Reveal key={agent.id} delay={index * 60} className="h-full">
                    <TiltCard className="h-full" maxTilt={8}>
                      <Link
                        href={`/dashboard?agent=${agent.id}`}
                        className={cn(
                          "group glass-subtle relative flex h-full flex-col p-5 transition-[border-color,background,box-shadow] duration-300 hover:border-white/[0.14] hover:bg-white/[0.045] [transform-style:preserve-3d]",
                          accent.glow,
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                        <div className="flex items-start justify-between [transform:translateZ(12px)]">
                          <span
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl border [transform:translateZ(16px)]",
                              accent.bg,
                              accent.border,
                              accent.text,
                            )}
                          >
                            <Icon size={18} strokeWidth={1.7} />
                          </span>
                          <span className="font-mono text-[8.5px] tracking-[0.14em] text-[var(--color-text-faint)]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <h3 className="mt-5 font-display text-[15.5px] font-semibold leading-tight text-[var(--color-text-primary)] [transform:translateZ(10px)]">
                          {agent.name}
                        </h3>
                        <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--color-text-secondary)]">{agent.tagline}</p>
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {agent.capabilities.slice(0, 2).map((capability) => (
                            <span key={capability} className="chip !px-2 !py-1 !text-[8px]">
                              {capability}
                            </span>
                          ))}
                        </div>
                        <span className="mt-auto flex items-center gap-1.5 pt-5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--color-text-faint)] transition-colors group-hover:text-[var(--color-tertiary)]">
                          Open agent
                          <ArrowUpRight size={9} />
                        </span>
                      </Link>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- workflow */}
        <section
          id="workflow"
          className="relative scroll-mt-[68px] border-y border-white/[0.05] bg-[var(--color-surface)] py-16 sm:py-24"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-bg opacity-25" />
          <div className={`${container} relative`}>
            <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
              <Reveal>
                <span className="label">Workflow builder</span>
                <h2 className="mt-4 font-display text-[38px] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-[48px]">
                  Build the prep loop once.
                  <br />
                  <span className="text-gradient">Run it before every interview.</span>
                </h2>
                <p className="mt-5 max-w-[390px] text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
                  Drag. Reorder. Run. Every step reports in.
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {[
                    { label: "9 node types", icon: Layers3, tone: "chip-accent" },
                    { label: "3 templates", icon: Workflow, tone: "" },
                    { label: "Live run status", icon: Gauge, tone: "chip-cyan" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <span key={item.label} className={cn("chip", item.tone)}>
                        <Icon size={9} />
                        {item.label}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={workflowHref} className="btn btn-primary !px-4 !py-3 !text-[12.5px]">
                    Build a pipeline
                    <ArrowRight size={14} />
                  </Link>
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                    Input → analysis → practice → output
                  </span>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-4 rounded-[28px] bg-[radial-gradient(ellipse_at_center,rgba(108,99,255,0.13),transparent_65%)] blur-xl"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-8 top-8 -bottom-3 rounded-[24px] border border-white/[0.04] bg-[var(--color-surface-container)] [transform:translateY(16px)_scale(0.975)]"
                  />
                  <TiltCard maxTilt={5} className="relative z-10">
                    <div className="relative [transform-style:preserve-3d]">
                      <WorkflowPreview />
                      <div
                        className="pointer-events-none absolute -right-4 -top-5 z-20 hidden w-[132px] [transform:translateZ(74px)] xl:block"
                        aria-hidden="true"
                      >
                        <div className="rounded-xl border border-emerald-400/20 bg-[var(--color-surface-container)] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                          <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-emerald-300">
                            Run complete
                          </p>
                          <p className="mt-1 font-display text-[18px] font-semibold leading-none text-[var(--color-text-primary)]">5 / 5</p>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                            <span className="block h-full w-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#00d9ff]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- report */}
        <section id="report" className="relative scroll-mt-[68px] py-16 sm:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="aurora left-[-8%] top-[18%] h-[460px] w-[460px] bg-[#6c63ff]/[0.13]" />
            <div className="aurora bottom-0 right-[-10%] h-[400px] w-[400px] bg-[var(--color-info-strong)]/[0.07]" />
          </div>
          <div className={`${container} relative`}>
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <Reveal>
                <span className="label">The output</span>
                <h2 className="mt-4 font-display text-[38px] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-[48px]">
                  The report is <span className="text-gradient">the product.</span>
                </h2>
                <p className="mt-4 max-w-[460px] text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
                  Four weighted scores. A quote behind each. Three drills.
                </p>
              </Reveal>
              <Reveal delay={90}>
                <div className="hidden items-center gap-4 sm:flex">
                  <RubricCube className="!mx-0 shrink-0" />
                  <div className="max-w-[150px]">
                    <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-[var(--color-info)]">
                      Weighted rubric
                    </p>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--color-text-faint)]">
                      Every score links to your exact words.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <div className="relative mt-8">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-10 top-10 -bottom-3 rounded-[28px] border border-white/[0.04] bg-[var(--color-surface-container)] [transform:translateY(14px)_scale(0.98)]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-6 top-14 -bottom-5 rounded-[30px] border border-white/[0.025] bg-[var(--color-surface)] [transform:translateY(24px)_scale(0.96)]"
                />
                <TiltCard maxTilt={4} className="relative z-10">
                  <div className="relative [transform-style:preserve-3d]">
                    <ReportPreview />
                    <div
                      className="pointer-events-none absolute -right-4 top-6 z-20 hidden items-center gap-1.5 rounded-full border border-[#6c63ff]/25 bg-[var(--color-surface-container)] px-3 py-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl [transform:translateZ(82px)] xl:flex"
                      aria-hidden="true"
                    >
                      <Check size={10} className="text-emerald-300" />
                      <span className="font-mono text-[7.5px] uppercase tracking-[0.09em] text-[var(--color-tertiary)]">
                        Evidence linked
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </div>
            </Reveal>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {["Quote behind every score", "Ready in under a minute", "Three timed next reps"].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[var(--color-surface-container)] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.07em] text-[var(--color-text-secondary)]"
                >
                  <Check size={9} className="text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- robot */}
        <section
          id="robot"
          className="relative scroll-mt-[68px] border-y border-white/[0.05] bg-[var(--color-surface)] py-16 sm:py-24"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 grid-bg opacity-25" />
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.06),transparent_65%)] blur-2xl" />
          </div>
          <div className={`${container} relative`}>
            <Reveal>
              <RobotDemo />
            </Reveal>
          </div>
        </section>

        {/* ----------------------------------------------------------- how it works */}
        <section id="how" className="relative scroll-mt-[68px] py-16 sm:py-24">
          <div className={container}>
            <Reveal>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="label">How it works</span>
                  <h2 className="mt-4 max-w-[540px] font-display text-[38px] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-[48px]">
                    Four moves from rusty to ready.
                  </h2>
                </div>
                <span className="flex items-center gap-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                  <Clock3 size={10} /> About 15 minutes end to end
                </span>
              </div>
            </Reveal>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div aria-hidden="true" className="absolute left-0 right-0 top-[26px] hidden h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent lg:block" />
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.number} delay={index * 80} className="h-full">
                    <div className="group relative h-full rounded-2xl border border-white/[0.06] bg-[var(--color-surface)] p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-white/[0.12]">
                      <div className="flex items-center justify-between">
                        <span className="relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-white/[0.09] bg-[var(--color-surface-container)] text-[var(--color-tertiary)] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                          <Icon size={19} strokeWidth={1.7} />
                        </span>
                        <span className="font-display text-[34px] font-semibold leading-none text-white/[0.07]">
                          {step.number}
                        </span>
                      </div>
                      <h3 className="mt-5 font-display text-[16px] font-semibold text-[var(--color-text-primary)]">{step.title}</h3>
                      <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-text-secondary)]">{step.body}</p>
                      <p className="mt-4 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--color-info)]">
                        <Clock3 size={9} /> {step.meta}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={200}>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={practiceHref} className="btn btn-primary !px-4 !py-3 !text-[12.5px]">
                  Start at step one
                  <ArrowRight size={14} />
                </Link>
                <Link href={workspaceHref} className="btn btn-ghost !px-4 !py-3 !text-[12.5px]">
                  See the full workspace
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------------------- reliability */}
        <section id="trust" className="relative scroll-mt-[68px] py-16 sm:py-20">
          <div className={container}>
            <div className="glass relative overflow-hidden rounded-[28px] p-5 sm:p-8">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 grid-bg opacity-20" />
                <div className="absolute right-[-10%] top-[-30%] h-[380px] w-[380px] rounded-full bg-[#6c63ff]/10 blur-3xl" />
              </div>

              <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
                <Reveal>
                  <span className="label">Reliability</span>
                  <h2 className="mt-4 max-w-[400px] font-display text-[36px] font-semibold leading-[1] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-[44px]">
                    Works when the model doesn&rsquo;t.
                  </h2>
                  <p className="mt-4 max-w-[370px] text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
                    Three layers. The rehearsal still runs.
                  </p>
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.05] px-3 py-2.5">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-emerald-300">
                      Degrades gracefully · never a dead screen
                    </span>
                  </div>
                </Reveal>

                <div className="space-y-2">
                  {reliability.map((layer, index) => {
                    const Icon = layer.icon;
                    return (
                      <Reveal key={layer.title} delay={index * 70}>
                        <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3.5 transition-colors hover:border-white/[0.11]">
                          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", layer.tone)}>
                            <Icon size={17} strokeWidth={1.7} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[7.5px] uppercase tracking-[0.13em] text-[var(--color-text-faint)]">
                                {layer.label}
                              </span>
                              <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                                {layer.status}
                              </span>
                            </div>
                            <h3 className="mt-1.5 font-display text-[15px] font-semibold text-[var(--color-text-primary)]">{layer.title}</h3>
                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">{layer.body}</p>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>

              <div className="relative mt-7 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
                {trust.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Reveal key={item.title} delay={index * 60}>
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-secondary)]">
                          <Icon size={12} />
                        </span>
                        <div>
                          <h3 className="text-[11.5px] font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                          <p className="mt-0.5 text-[10.5px] leading-relaxed text-[var(--color-text-faint)]">{item.body}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- final CTA */}
        <section className="relative pb-16 pt-6 sm:pb-24">
          <div className={container}>
            <Reveal>
              <TiltCard maxTilt={3}>
                <div className="relative overflow-hidden rounded-[32px] border border-white/[0.09] bg-[linear-gradient(140deg,rgba(108,99,255,0.17),rgba(16,16,24,0.9)_42%,rgba(0,217,255,0.08))] px-6 py-14 text-center sm:px-12 sm:py-20">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 grid-bg opacity-30" />
                    <span className="orbit-ring left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-50" />
                    <span className="orbit-ring left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 border-dashed opacity-30" />
                    <span className="absolute left-[12%] top-[24%] h-8 w-8 rounded-full border border-[var(--color-info-strong)]/20 bg-[var(--color-info-strong)]/[0.06]" />
                    <span className="absolute bottom-[22%] right-[14%] h-10 w-10 rounded-full border border-[#a8a2ff]/20 bg-[#6c63ff]/[0.08]" />
                    <div className="absolute left-[22%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-[var(--color-info-strong)]/70 shadow-[0_0_16px_rgba(0,217,255,0.8)]" />
                    <div className="absolute right-[22%] top-[20%] h-1 w-1 rounded-full bg-[var(--color-tertiary)]/70" />
                  </div>

                  <div className="relative mx-auto max-w-[620px]">
                    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/[0.1] bg-[var(--color-surface-container)] px-3 py-1.5">
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
                      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--color-text-primary)]">
                        The local engine is ready
                      </span>
                    </div>
                    <h2 className="mt-6 font-display text-[42px] font-semibold leading-[0.96] tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-[56px]">
                      Your next interview
                      <br />
                      starts with one rep.
                    </h2>
                    <p className="mx-auto mt-4 max-w-[420px] text-[13px] leading-relaxed text-[#b0b0c0]">
                      Five questions. Four scores. One next step. Demo sign-in, no setup.
                    </p>
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                      <Link href={practiceHref} className="btn btn-primary !px-5 !py-3.5 !text-[13.5px]">
                        Start a mock interview
                        <ArrowUpRight size={16} />
                      </Link>
                      <Link href={workspaceHref} className="btn btn-ghost !px-5 !py-3.5 !text-[13.5px]">
                        Open the workspace
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                    <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                      5 questions · 4 scores · evidence included
                    </p>
                    {!user ? (
                      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11.5px] text-[var(--color-text-secondary)]">
                        <Link href="/login" className="font-medium text-[var(--color-tertiary)] transition-colors hover:text-[var(--color-text-primary)]">
                          Log in
                        </Link>
                        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/15" />
                        <Link href="/signup" className="font-medium text-[var(--color-tertiary)] transition-colors hover:text-[var(--color-text-primary)]">
                          Create a free account
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ----------------------------------------------------------------- footer */}
      <footer className="relative border-t border-white/[0.06] bg-[var(--color-background)] py-9">
        <div className={`${container} flex flex-col gap-8`}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[300px]">
              <Logo size={28} />
              <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--color-text-faint)]">
                Five specialists. Adaptive interviews. Visible rubrics.
              </p>
              <p className="mt-4 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                <Sparkles size={9} /> Team Mooncraft · Domain 2
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--color-text-faint)]">Product</p>
                <div className="mt-3 space-y-2">
                  <a href="#workspace" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Workspace
                  </a>
                  <a href="#agents" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Agents
                  </a>
                  <a href="#workflow" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Workflow
                  </a>
                  <a href="#report" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Report
                  </a>
                </div>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--color-text-faint)]">Practice</p>
                <div className="mt-3 space-y-2">
                  <Link href={practiceHref} className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Mock interview
                  </Link>
                  <Link href={workspaceHref} className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Agent workspace
                  </Link>
                  <Link href={workflowHref} className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Workflow builder
                  </Link>
                  <Link href={settingsHref} className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Settings
                  </Link>
                </div>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--color-text-faint)]">Trust</p>
                <div className="mt-3 space-y-2">
                  <a href="#how" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    How it works
                  </a>
                  <a href="#robot" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Robot, optional
                  </a>
                  <a href="#trust" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Rubric &amp; ethics
                  </a>
                  <a href="#main" className="block text-[11.5px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    Back to top
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[var(--color-surface-container)] p-4 lg:w-[214px]">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Works when offline</p>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                Local rubric. Browser voice. Optional robot.
              </p>
              <Link href={practiceHref} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-tertiary)] transition-colors hover:text-[var(--color-text-primary)]">
                Test it now <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>

          <div className="hairline" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
              © 2026 ViewPilot Pro · Team Mooncraft · CodeFest 2026
            </p>
            {!user ? (
              <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                <Link href="/login" className="transition-colors hover:text-[var(--color-text-primary)]">
                  Log in
                </Link>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/15" />
                <Link href="/signup" className="transition-colors hover:text-[var(--color-text-primary)]">
                  Create account
                </Link>
              </p>
            ) : null}
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
              Practice estimate — not a hiring decision
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
