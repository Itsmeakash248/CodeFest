"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Gauge,
  History,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { InterviewReport, InterviewSetup } from "@/lib/types";
import { DIFFICULTIES, INTERVIEW_TYPES, LEVELS, ROLES, roleById } from "@/lib/data/roles";
import ScoreRing from "@/components/ui/ScoreRing";
import { cn } from "@/components/ui/cn";

interface InterviewSetupProps {
  setup: InterviewSetup;
  onChange: (patch: Partial<InterviewSetup>) => void;
  onStart: () => void;
  busy: boolean;
  error: string | null;
  latestReport: InterviewReport | null;
  onOpenLatest: () => void;
  reportMissing: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

const flow = [
  {
    icon: Target,
    title: "Choose the target",
    body: "Role, level, format and pressure. Resume context is optional.",
  },
  {
    icon: Mic,
    title: "Answer five questions",
    body: "Speak or type. A thin answer earns one evidence-seeking follow-up.",
  },
  {
    icon: Gauge,
    title: "Read the evidence",
    body: "Four weighted scores, quoted moments, and three drills for the next rep.",
  },
];

export default function InterviewSetup({
  setup,
  onChange,
  onStart,
  busy,
  error,
  latestReport,
  onOpenLatest,
  reportMissing,
  voiceEnabled,
  onToggleVoice,
}: InterviewSetupProps) {
  const [showResume, setShowResume] = useState(Boolean(setup.resume));
  const role = roleById(setup.role);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onStart();
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-10 sm:px-8 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[var(--color-surface-container)] px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[var(--color-info-strong)]" />
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
              Adaptive mock interview
            </span>
          </div>

          <h1 className="mt-6 max-w-[520px] font-display text-[44px] font-semibold leading-[0.96] tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-[58px]">
            Five questions.
            <br />
            One <span className="text-gradient">honest scorecard.</span>
          </h1>
          <p className="mt-5 max-w-[470px] text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
            Rehearse out loud or in text. The interviewer probes thin answers, then scores what you
            actually said against four visible dimensions. No key required.
          </p>

          <div className="mt-8 space-y-4">
            {flow.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3.5">
                  <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[var(--color-surface-container)] text-[var(--color-tertiary)]">
                    <Icon size={14} strokeWidth={1.7} />
                    {index < flow.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 top-9 h-[22px] w-px -translate-x-1/2 bg-gradient-to-b from-white/[0.12] to-transparent"
                      />
                    ) : null}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium text-[var(--color-text-primary)]">{item.title}</p>
                    <p className="mt-1 max-w-[380px] text-[11.5px] leading-relaxed text-[var(--color-text-faint)]">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[var(--color-surface-container)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                What gets scored
              </p>
              <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                Weighted rubric
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { label: "Role knowledge", weight: "30%" },
                { label: "Communication", weight: "25%" },
                { label: "Problem solving", weight: "25%" },
                { label: "Answer quality", weight: "20%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[var(--color-surface-container)] px-2.5 py-2"
                >
                  <span className="text-[10.5px] text-[var(--color-text-primary)]">{item.label}</span>
                  <span className="font-mono text-[9px] tabular-nums text-[var(--color-text-secondary)]">
                    {item.weight}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-[var(--color-text-faint)]">
              <ShieldCheck size={11} className="mt-0.5 shrink-0 text-emerald-300/70" />
              Practice estimate only. No protected traits are scored, inferred or stored.
            </p>
          </div>

          {latestReport ? (
            <div className="mt-4 rounded-2xl border border-[#6c63ff]/20 bg-[#6c63ff]/[0.06] p-4">
              <div className="flex items-center gap-3">
                <ScoreRing score={latestReport.overall} size={54} stroke={4.5} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-[var(--color-tertiary)]">
                    <History size={9} /> Last rehearsal
                  </p>
                  <p className="mt-1 truncate text-[11.5px] font-medium text-[var(--color-text-primary)]">
                    {latestReport.setup.role}
                  </p>
                  <p className="truncate font-mono text-[7px] uppercase tracking-[0.07em] text-[var(--color-text-faint)]">
                    {latestReport.band} · {new Date(latestReport.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenLatest}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-white/[0.08] bg-[var(--color-surface-container)] px-2.5 py-1.5 text-[10.5px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]"
                >
                  Open <ArrowRight size={10} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={submit} className="min-w-0 lg:pt-2">
          <div className="glass overflow-hidden rounded-[24px]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div>
                <span className="label">Session setup</span>
                <h2 className="mt-2.5 font-display text-[24px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
                  Who are you rehearsing for?
                </h2>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-text-secondary)]">
                  Five questions, about twelve minutes. You can stop early and still get scored.
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[var(--color-tertiary)]">
                <Sparkles size={15} />
              </span>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              {reportMissing ? (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-amber-200"
                >
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  No saved report on this browser. Finish a session first, or open the last report
                  from the workspace.
                </div>
              ) : null}

              <div>
                <label htmlFor="interview-role" className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-primary)]">
                  Target role
                </label>
                <select
                  id="interview-role"
                  className="input"
                  value={setup.role}
                  onChange={(event) => onChange({ role: event.target.value })}
                >
                  {ROLES.map((option) => (
                    <option key={option.id} value={option.label}>
                      {option.label} · {option.family}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex flex-wrap gap-1">
                  {role.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-white/[0.06] bg-[var(--color-surface-container)] px-1.5 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.04em] text-[var(--color-text-faint)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <Segmented
                label="Level"
                hint="Sets the expected depth."
                options={LEVELS}
                value={setup.level}
                onChange={(value) => onChange({ level: value })}
                columns="sm:grid-cols-4"
              />

              <Segmented
                label="Interview type"
                hint="Mixed keeps one foot in the role."
                options={INTERVIEW_TYPES}
                value={setup.type}
                onChange={(value) => onChange({ type: value })}
                columns="sm:grid-cols-4"
              />

              <Segmented
                label="Difficulty"
                hint="Stretch adds ambiguity and trade-offs."
                options={DIFFICULTIES}
                value={setup.difficulty}
                onChange={(value) => onChange({ difficulty: value })}
                columns="sm:grid-cols-3"
              />

              <div className="rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)]">
                <button
                  type="button"
                  onClick={() => setShowResume((value) => !value)}
                  aria-expanded={showResume}
                  aria-controls="interview-resume-wrap"
                  className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
                >
                  <FileText size={13} className="shrink-0 text-[var(--color-text-secondary)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-medium text-[var(--color-text-primary)]">
                      Resume context <span className="font-normal text-[var(--color-text-faint)]">(optional)</span>
                    </span>
                    <span className="block text-[10px] text-[var(--color-text-faint)]">
                      Pastes into question context. Never stored on the server.
                    </span>
                  </span>
                  <ChevronDown
                    size={13}
                    className={cn("shrink-0 text-[var(--color-text-faint)] transition-transform", showResume && "rotate-180")}
                  />
                </button>
                {showResume ? (
                  <div id="interview-resume-wrap" className="border-t border-white/[0.05] px-3.5 py-3">
                    <label htmlFor="interview-resume" className="sr-only">
                      Resume context
                    </label>
                    <textarea
                      id="interview-resume"
                      className="input min-h-[104px] !text-[12px]"
                      value={setup.resume ?? ""}
                      maxLength={6000}
                      onChange={(event) => onChange({ resume: event.target.value })}
                      placeholder="Paste two or three bullets: projects you owned, tools you used, one result with a number."
                    />
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.07em] text-[var(--color-text-faint)]">
                      <span>Read for tailoring only</span>
                      <span className="tabular-nums">{(setup.resume ?? "").length}/6000</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                {/* Webcam & Proctoring Toggle */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <div>
                      <p className="text-[11.5px] font-medium text-[var(--color-text-primary)]">Webcam &amp; AI Proctoring</p>
                      <p className="text-[10px] text-[var(--color-text-faint)]">
                        Live face tracking, eye-contact detection, and tab focus monitoring.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={setup.videoEnabled ?? true}
                    aria-label="Toggle camera and proctoring"
                    onClick={() => onChange({ videoEnabled: !(setup.videoEnabled ?? true) })}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                      setup.videoEnabled ?? true
                        ? "border-emerald-500/40 bg-emerald-500/30"
                        : "border-white/[0.09] bg-[var(--color-surface-container-high)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[#1a1a24] shadow transition-[left] duration-200",
                        setup.videoEnabled ?? true ? "left-[22px]" : "left-0.5",
                      )}
                      style={{ height: 18, width: 18 }}
                    >
                      {setup.videoEnabled ?? true ? <Video size={9} /> : <VideoOff size={9} />}
                    </span>
                  </button>
                </div>

                {/* Conversational Hands-Free Mode Toggle */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={14} className="text-[#6c63ff]" />
                    <div>
                      <p className="text-[11.5px] font-medium text-[var(--color-text-primary)]">Conversational AI Mode</p>
                      <p className="text-[10px] text-[var(--color-text-faint)]">
                        Voice-first turn-taking with live transcript streaming and audio visualizer.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={setup.conversationalMode ?? true}
                    aria-label="Toggle conversational hands-free mode"
                    onClick={() => onChange({ conversationalMode: !(setup.conversationalMode ?? true) })}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                      setup.conversationalMode ?? true
                        ? "border-[#6c63ff]/40 bg-[#6c63ff]/40"
                        : "border-white/[0.09] bg-[var(--color-surface-container-high)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[#1a1a24] shadow transition-[left] duration-200",
                        setup.conversationalMode ?? true ? "left-[22px]" : "left-0.5",
                      )}
                      style={{ height: 18, width: 18 }}
                    >
                      <Sparkles size={9} />
                    </span>
                  </button>
                </div>

                {/* Read questions aloud */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={13} className="text-[var(--color-text-secondary)]" />
                    <div>
                      <p className="text-[11.5px] font-medium text-[var(--color-text-primary)]">Read questions aloud</p>
                      <p className="text-[10px] text-[var(--color-text-faint)]">
                        ElevenLabs when configured, browser voice as fallback.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={voiceEnabled}
                    aria-label="Read interview questions aloud"
                    onClick={onToggleVoice}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                      voiceEnabled
                        ? "border-[#6c63ff]/40 bg-[#6c63ff]/40"
                        : "border-white/[0.09] bg-[var(--color-surface-container-high)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[#1a1a24] shadow transition-[left] duration-200",
                        voiceEnabled ? "left-[22px]" : "left-0.5",
                      )}
                      style={{ height: 18, width: 18 }}
                    >
                      {voiceEnabled ? <Volume2 size={9} /> : <VolumeX size={9} />}
                    </span>
                  </button>
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3 py-2.5 text-[11.5px] leading-relaxed text-rose-200"
                >
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p>{error}</p>
                    <button
                      type="submit"
                      className="mt-1 font-medium text-rose-100 underline underline-offset-2 hover:text-[var(--color-text-primary)]"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="btn btn-primary w-full !py-3.5 !text-[13.5px]"
              >
                {busy ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Building your question set
                  </>
                ) : (
                  <>
                    Start five-question interview
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[7.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                <span className="flex items-center gap-1">
                  <Clock3 size={8} /> ~12 minutes
                </span>
                <span className="flex items-center gap-1">
                  <Check size={8} /> No API key needed
                </span>
                <span className="flex items-center gap-1">
                  <Mic size={8} /> Mic optional
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 px-1 text-[10.5px] leading-relaxed text-[var(--color-text-faint)]">
            By starting, you agree this is a practice tool, not a hiring decision. Your answers stay
            in this browser unless you download the report.
          </p>
        </form>
      </div>
    </div>
  );
}

function Segmented({
  label,
  hint,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  hint: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  columns: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className="truncate text-[9.5px] text-[var(--color-text-faint)]">{hint}</span>
      </div>
      <div
        role="group"
        aria-label={label}
        className={cn("grid grid-cols-2 gap-1 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] p-1", columns)}
      >
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={active}
              className={cn(
                "rounded-lg px-2 py-2 text-[10.5px] font-medium transition-all",
                active
                  ? "bg-[var(--color-surface-container-high)] text-[var(--color-text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                  : "text-[var(--color-text-faint)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
