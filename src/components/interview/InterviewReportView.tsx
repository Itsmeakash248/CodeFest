"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Printer,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { InterviewReport } from "@/lib/types";
import ScoreRing from "@/components/ui/ScoreRing";
import ScoreBar from "@/components/ui/ScoreBar";
import Badge, { scoreTone } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";

interface InterviewReportViewProps {
  report: InterviewReport;
  onPracticeAgain: () => void;
}

export default function InterviewReportView({ report, onPracticeAgain }: InterviewReportViewProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const mainAnswered = useMemo(
    () => report.perQuestion.filter((item) => !item.question.startsWith("Follow-up:")).length,
    [report.perQuestion],
  );

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 2600);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `viewpilot-report-${report.sessionId}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copySummary() {
    const lines = [
      "ViewPilot Pro — mock interview report",
      `${report.setup.role} · ${report.setup.level} · ${report.setup.type} · ${report.setup.difficulty}`,
      `Overall: ${report.overall}/100 (${report.band})`,
      ...report.dimensions.map(
        (dimension) => `${dimension.label}: ${dimension.score} — ${dimension.note}`,
      ),
      `Strongest: ${report.strengths[0] ?? "Not enough evidence yet."}`,
      `Next step: ${report.nextPractice[0]?.title ?? "Run another session."}`,
      "Practice estimate, not a hiring decision.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyState("copied");
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = lines.join("\n");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        setCopyState("copied");
      } catch {
        setCopyState("error");
      }
    }
  }

  return (
    <div className="print-plain mx-auto w-full max-w-[1180px] px-5 py-7 sm:px-8 sm:py-9">
      <div className="no-print mb-5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2.5 py-2 text-[11px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={12} /> Back to setup
        </button>
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => void copySummary()}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2.5 py-2 text-[11px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]"
          >
            {copyState === "copied" ? (
              <>
                <Check size={12} className="text-emerald-300" /> Copied
              </>
            ) : copyState === "error" ? (
              <>
                <ClipboardCheck size={12} className="text-amber-300" /> Select manually
              </>
            ) : (
              <>
                <ClipboardCheck size={12} /> Copy summary
              </>
            )}
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2.5 py-2 text-[11px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]"
          >
            <Download size={12} /> JSON
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2.5 py-2 text-[11px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]"
          >
            <Printer size={12} /> Print
          </button>
          <button
            type="button"
            onClick={onPracticeAgain}
            className="btn btn-primary !px-3 !py-2 !text-[11.5px]"
          >
            <RotateCcw size={12} /> Practice again
          </button>
        </span>
      </div>

      <article>
        <header className="print-break relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(108,99,255,0.14),rgba(255,255,255,0.025)_42%,rgba(0,217,255,0.06))] p-5 sm:p-7">
          <span
            aria-hidden="true"
            className="orbit-ring right-[-40px] top-[-70px] h-64 w-64 opacity-70"
          />
          <span
            aria-hidden="true"
            className="orbit-ring right-[20px] top-[-20px] h-40 w-40 border-dashed opacity-40"
          />

          <div className="relative flex flex-wrap items-center gap-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
              Session report
            </span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
              {report.source === "ai" ? "AI + local rubric" : "Local rubric"}
            </span>
            <span className="ml-auto font-mono text-[7.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
              {formatDate(report.generatedAt)}
            </span>
          </div>

          <div className="relative mt-5 grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <h1 className="font-display text-[30px] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-[38px]">
                {report.setup.role}
                <span className="text-[var(--color-text-secondary)]"> mock interview</span>
              </h1>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="neutral">{report.setup.level}</Badge>
                <Badge tone="neutral">{report.setup.type}</Badge>
                <Badge tone="neutral">{report.setup.difficulty}</Badge>
                <Badge tone={scoreTone(report.overall)} dot>
                  {report.band}
                </Badge>
              </div>
              <p className="mt-4 max-w-[610px] text-[12.5px] leading-relaxed text-[var(--color-text-primary)]">
                {report.summary}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <ScoreRing score={report.overall} size={126} stroke={8} label="overall" />
              <div className="sm:text-right">
                <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--color-info)]">
                  Practice estimate
                </p>
                <p className="mt-1 text-[11.5px] font-medium text-[var(--color-text-primary)]">{report.band}</p>
                <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                  4 weighted dimensions
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-4 sm:grid-cols-4">
            {[
              { label: "Questions scored", value: `${mainAnswered}`, note: "of 5 main" },
              { label: "Words captured", value: report.answeredWords.toLocaleString(), note: "own words" },
              {
                label: "Follow-ups",
                value: `${Math.max(0, report.perQuestion.length - mainAnswered)}`,
                note: "evidence probes",
              },
              { label: "Next rep", value: `${report.nextPractice.reduce((sum, item) => sum + item.minutes, 0)}m`, note: "practice plan" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                  {stat.label}
                </p>
                <p className="mt-1.5 font-display text-[19px] font-semibold leading-none text-[var(--color-text-primary)]">
                  {stat.value}
                </p>
                <p className="mt-1 font-mono text-[6.5px] uppercase tracking-[0.07em] text-[var(--color-text-faint)]">
                  {stat.note}
                </p>
              </div>
            ))}
          </div>
        </header>

        {/* Anti-Cheating & AI Proctoring Audit Card */}
        {report.integrity && (
          <section className="print-break mt-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className={report.integrity.integrityScore >= 80 ? "text-emerald-400" : "text-amber-400"} />
                <div>
                  <h2 className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">
                    Session Integrity &amp; Proctoring Audit
                  </h2>
                  <p className="text-[10.5px] text-[var(--color-text-faint)]">
                    Real-time biometric gaze tracking, tab focus monitoring, and clipboard paste verification.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
                  {report.integrity.integrityScore}% {report.integrity.rating} Integrity
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/[0.05] bg-[var(--color-surface-container)] p-3">
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                  Eye Contact
                </p>
                <p className="mt-1 font-display text-[20px] font-semibold text-emerald-400">
                  {report.integrity.eyeContactPct}%
                </p>
                <p className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                  Focused on camera
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-[var(--color-surface-container)] p-3">
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                  Face Presence
                </p>
                <p className="mt-1 font-display text-[20px] font-semibold text-emerald-400">
                  {report.integrity.faceInFramePct}%
                </p>
                <p className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                  Candidate in frame
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-[var(--color-surface-container)] p-3">
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                  Tab Switches
                </p>
                <p className={cn("mt-1 font-display text-[20px] font-semibold", report.integrity.tabSwitches === 0 ? "text-emerald-400" : "text-amber-400")}>
                  {report.integrity.tabSwitches}
                </p>
                <p className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                  Window blur events
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-[var(--color-surface-container)] p-3">
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                  Pasted Chunks
                </p>
                <p className={cn("mt-1 font-display text-[20px] font-semibold", report.integrity.pasteEvents === 0 ? "text-emerald-400" : "text-amber-400")}>
                  {report.integrity.pasteEvents}
                </p>
                <p className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                  Clipboard insertions
                </p>
              </div>
            </div>

            {report.integrity.violations.length > 0 && (
              <div className="mt-3.5 border-t border-white/[0.05] pt-3">
                <p className="font-mono text-[7.5px] uppercase tracking-[0.08em] text-amber-300">
                  Logged Incidents ({report.integrity.violations.length})
                </p>
                <ul className="mt-1.5 space-y-1">
                  {report.integrity.violations.slice(0, 4).map((v) => (
                    <li key={v.id} className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] font-mono">
                      <span className="text-amber-400">⚠️</span>
                      <span>{v.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="print-break mt-4">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <h2 className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">The four dimensions</h2>
            <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
              Evidence from your answers
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {report.dimensions.map((dimension) => (
              <article
                key={dimension.key}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.022] p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[12px] font-semibold text-[var(--color-text-primary)]">{dimension.label}</h3>
                  <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                    {Math.round(dimension.weight * 100)}% weight
                  </span>
                </div>
                <ScoreBar
                  label={dimension.label}
                  score={dimension.score}
                  className="mt-2 [&>div:first-child]:hidden"
                  compact
                />
                <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--color-text-primary)]">{dimension.note}</p>
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-white/[0.05] bg-[var(--color-surface-container)] px-2.5 py-2">
                  <Quote size={10} className="mt-0.5 shrink-0 text-[#8d86ff]" />
                  <p className="text-[10px] italic leading-relaxed text-[var(--color-text-secondary)]">
                    {dimension.evidence}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="print-break mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.045] p-4">
            <p className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-emerald-300/90">
              <TrendingUp size={11} /> What already works
            </p>
            <ul className="mt-3 space-y-2.5">
              {report.strengths.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--color-success)]">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.04] p-4">
            <p className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-amber-300/90">
              <Target size={11} /> Fastest lifts
            </p>
            <ul className="mt-3 space-y-2.5">
              {report.improvements.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--color-warning)]">
                  <ArrowUpRight size={12} className="mt-0.5 shrink-0 text-amber-400/80" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="print-break mt-4">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <h2 className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">Answer by answer</h2>
            <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
              {report.perQuestion.length} scored response{report.perQuestion.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-2">
            {report.perQuestion.map((item, index) => (
              <article
                key={`${item.question}-${index}`}
                className="rounded-2xl border border-white/[0.06] bg-[var(--color-surface-container)] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[var(--color-surface-container)] font-mono text-[8px] text-[var(--color-text-secondary)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-medium leading-snug text-[var(--color-text-primary)]">{item.question}</p>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--color-text-secondary)]">{item.note}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-1 font-mono text-[8px] tabular-nums",
                      item.score >= 75
                        ? "border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-300"
                        : item.score >= 60
                          ? "border-[var(--color-info-strong)]/20 bg-[var(--color-info-strong)]/[0.06] text-[var(--color-info)]"
                          : "border-amber-400/20 bg-amber-500/[0.06] text-amber-300",
                    )}
                  >
                    {item.score}
                  </span>
                </div>
                <blockquote className="mt-3 border-l border-[#6c63ff]/30 pl-3 text-[10.5px] leading-relaxed text-[var(--color-text-secondary)]">
                  {item.answer}
                </blockquote>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-4 grid gap-2.5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="print-break rounded-2xl border border-white/[0.06] bg-white/[0.022] p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-display text-[14px] font-semibold text-[var(--color-text-primary)]">
                <GraduationCap size={14} className="text-[var(--color-tertiary)]" /> Next practice
              </h2>
              <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                {report.nextPractice.reduce((sum, item) => sum + item.minutes, 0)} min total
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {report.nextPractice.map((action, index) => (
                <div
                  key={action.title}
                  className="flex items-start gap-2.5 rounded-xl border border-white/[0.05] bg-[var(--color-surface-container)] p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#6c63ff]/25 bg-[#6c63ff]/10 font-mono text-[8px] text-[var(--color-tertiary)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-medium text-[var(--color-text-primary)]">{action.title}</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--color-text-secondary)]">{action.detail}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                    <Clock3 size={8} /> {action.minutes}m
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="print-break rounded-2xl border border-white/[0.06] bg-white/[0.022] p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-display text-[14px] font-semibold text-[var(--color-text-primary)]">
                <Sparkles size={14} className="text-[var(--color-info)]" /> STAR blueprint
              </h2>
              <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                Rebuild your richest answer
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { key: "S", label: "Situation", value: report.starBlueprint.situation },
                { key: "T", label: "Task", value: report.starBlueprint.task },
                { key: "A", label: "Action", value: report.starBlueprint.action },
                { key: "R", label: "Result", value: report.starBlueprint.result },
              ].map((item) => (
                <div key={item.key} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[var(--color-surface-container)] font-mono text-[8px] font-semibold text-[var(--color-tertiary)]">
                    {item.key}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[6.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-[var(--color-text-secondary)]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <FileText size={12} className="mt-0.5 shrink-0 text-[var(--color-text-faint)]" />
              <p className="max-w-[620px] text-[10px] leading-relaxed text-[var(--color-text-faint)]">
                This is a practice estimate generated from {report.answeredWords.toLocaleString()} words
                in your own answers. It is not a hiring decision, a personality test, or a prediction of
                interview outcomes. No protected traits are scored. Stored locally in this browser under{" "}
                <span className="font-mono text-[9px]">viewpilot.latestReport</span>.
              </p>
            </div>
            <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
              ViewPilot Pro · Team Mooncraft
            </p>
          </div>

          <div className="no-print mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
            <button
              type="button"
              onClick={onPracticeAgain}
              className="btn btn-primary !px-3.5 !py-2.5 !text-[12px]"
            >
              Run another five <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-ghost !px-3 !py-2.5 !text-[11.5px]"
            >
              <Printer size={12} /> Print or save PDF
            </button>
            <span className="ml-auto font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
              Session {report.sessionId.slice(0, 12)}
            </span>
          </div>
        </footer>
      </article>
    </div>
  );
}

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(timestamp);
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}
