"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  DIFFICULTIES,
  INTERVIEW_TYPES,
  LEVELS,
  ROLES,
  RUBRIC,
  RUBRIC_BY_KEY,
} from "@/lib/content";
import {
  MAX_MAIN_QUESTIONS,
  countMainQuestions,
  defaultSetup,
  localNext,
  localReport,
  resolveRole,
  scoreTone,
  type Question,
  type Report,
  type Setup,
  type Turn,
} from "@/lib/interview";
import {
  ArrowRight,
  Check,
  Clock,
  Download,
  Mic,
  Refresh,
  Robot,
  Spark,
} from "@/components/vp/Icons";

type Phase = "setup" | "session" | "evaluating" | "report";

type SpeechRecognitionResultLike = {
  readonly length: number;
  [index: number]: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type HistoryItem = {
  id: string;
  date: string;
  setup: Setup;
  overall: number;
  report: Report;
  turns: Turn[];
};

const HISTORY_KEY = "viewpilot-history-v1";

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

async function postJSON<T>(body: unknown, timeoutMs = 26_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export default function InterviewClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<Setup>(defaultSetup());
  const [customRole, setCustomRole] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [source, setSource] = useState<"ai" | "local">("local");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [listening, setListening] = useState(false);
  const [robotMode, setRobotMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [startedAt, setStartedAt] = useState("");
  const [notice, setNotice] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      // Loading local history is an external-system read; there is no
      // server-side value to hydrate from, so this intentionally runs once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setHistory(JSON.parse(raw) as HistoryItem[]);
    } catch {
      /* local history is optional */
    }
  }, []);

  useEffect(() => {
    if (phase !== "session" || !current) return;
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [phase, current]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const role = resolveRole(setup.role, customRole);
  const effectiveSetup: Setup = {
    ...setup,
    roleLabel: role.label,
  };

  function saveHistory(item: HistoryItem) {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 8);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }

  async function robotEmotion(emotion: string) {
    if (!robotMode) return;
    try {
      await fetch("/api/robot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion }),
      });
    } catch {
      /* robot is optional */
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function toggleMic() {
    if (typeof window === "undefined") return;
    const SR =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input is not supported in this browser. Type your answer instead.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      setAnswer((prev) => `${prev}${prev ? " " : ""}${text.trim()}`);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Microphone stopped. You can keep typing.");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError("");
  }

  function startSession() {
    if (setup.role === "custom" && !customRole.trim()) {
      setError("Type the role you are targeting.");
      return;
    }
    const nextSetup = {
      ...setup,
      roleLabel: resolveRole(setup.role, customRole).label,
    };
    setSetup(nextSetup);
    const first = localNext(nextSetup, [], MAX_MAIN_QUESTIONS);
    if (!first.question) {
      setError("Could not build a question. Try a different interview type.");
      return;
    }
    setTurns([]);
    setCurrent(first.question);
    setAnswer("");
    setReport(null);
    setError("");
    setStartedAt(new Date().toISOString());
    setPhase("session");
    setElapsed(0);
    setNotice("");
    robotEmotion("Curious");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      if (window.innerWidth >= 768) {
        textareaRef.current?.focus({ preventScroll: true });
      }
    }, 120);
  }

  async function evaluate(finalTurns: Turn[], activeSetup = effectiveSetup) {
    if (!finalTurns.length) return;
    setPhase("evaluating");
    setError("");
    setNotice("");
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const started = startedAt || new Date().toISOString();

    try {
      const data = await postJSON<{
        report: Report;
        aiEnabled: boolean;
      }>({
        action: "evaluate",
        setup: activeSetup,
        turns: finalTurns,
      });
      const finalReport = data.report;
      setReport(finalReport);
      setSource(finalReport.source || (data.aiEnabled ? "ai" : "local"));
      saveHistory({
        id: `${Date.now().toString(36)}`,
        date: started,
        setup: activeSetup,
        overall: finalReport.overall,
        report: finalReport,
        turns: finalTurns,
      });
      setPhase("report");
      robotEmotion(finalReport.overall >= 70 ? "Happy" : "Focused");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      const fallback = localReport(activeSetup, finalTurns);
      setReport(fallback);
      setSource("local");
      saveHistory({
        id: `${Date.now().toString(36)}`,
        date: started,
        setup: activeSetup,
        overall: fallback.overall,
        report: fallback,
        turns: finalTurns,
      });
      setPhase("report");
      robotEmotion("Focused");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!current || loading) return;
    if (answer.trim().length < 12) {
      setError("Add a little more detail before submitting (at least a sentence).");
      return;
    }
    setError("");
    setLoading(true);
    const nextTurns: Turn[] = [...turns, { question: current, answer: answer.trim() }];
    setTurns(nextTurns);
    setAnswer("");
    recognitionRef.current?.stop?.();
    setListening(false);

    const finish = () => {
      setCurrent(null);
      void evaluate(nextTurns);
      setLoading(false);
    };

    if (countMainQuestions(nextTurns) >= MAX_MAIN_QUESTIONS) {
      finish();
      return;
    }

    try {
      const data = await postJSON<{
        question?: Question;
        done: boolean;
        source: "ai" | "local";
        aiEnabled: boolean;
      }>({
        action: "next",
        setup: effectiveSetup,
        turns: nextTurns,
      });

      if (data.done || !data.question) {
        finish();
        return;
      }
      setSource(data.source);
      setCurrent(data.question);
      setElapsed(0);
      robotEmotion("Curious");
      setTimeout(() => {
        if (window.innerWidth >= 768) {
          textareaRef.current?.focus({ preventScroll: true });
        }
      }, 80);
    } catch {
      const local = localNext(effectiveSetup, nextTurns, MAX_MAIN_QUESTIONS);
      if (local.done || !local.question) {
        finish();
        return;
      }
      setSource("local");
      setCurrent(local.question);
      setElapsed(0);
    } finally {
      setLoading(false);
    }
  }

  function finishEarly() {
    if (!turns.length) return;
    setCurrent(null);
    void evaluate(turns);
  }

  function reset() {
    setPhase("setup");
    setTurns([]);
    setCurrent(null);
    setAnswer("");
    setReport(null);
    setError("");
    setElapsed(0);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openHistory(item: HistoryItem) {
    setSetup(item.setup);
    if (item.setup.role === "custom") setCustomRole(item.setup.roleLabel);
    setTurns(item.turns);
    setReport(item.report);
    setSource(item.report.source || "local");
    setStartedAt(item.date);
    setNotice("");
    setPhase("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadJSON() {
    if (!report) return;
    const payload = {
      app: "ViewPilot",
      generatedAt: new Date().toISOString(),
      setup: effectiveSetup,
      report,
      turns,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viewpilot-${effectiveSetup.roleLabel.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copySummary() {
    if (!report) return;
    const text = [
      `ViewPilot practice report — ${effectiveSetup.roleLabel} (${effectiveSetup.level})`,
      `Overall practice estimate: ${report.overall}/100`,
      report.summary,
      ...report.dimensions.map((d) => `${d.label}: ${d.score}/100 — ${d.rationale}`),
      "Next practice:",
      ...report.nextPractice.map((n) => `- ${n}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Summary copied to clipboard.");
    } catch {
      setNotice("Could not copy. Use Print / Save PDF instead.");
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Setup                                                              */
  /* ------------------------------------------------------------------ */
  if (phase === "setup") {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="chip chip-violet">Set up · 30 seconds</span>
          <h1 className="display-l mt-4 text-ink">Build your interview.</h1>
          <p className="lede mt-3 max-w-xl">
            Five questions, one report, no account. Choose the context a real interviewer
            would use.
          </p>

          <div className="mt-8 space-y-7">
            <div>
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-semibold text-ink">Target role</label>
                <span className="text-[0.68rem] font-semibold text-muted">Required</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="option"
                    data-selected={setup.role === r.id}
                    onClick={() => {
                      setSetup((s) => ({ ...s, role: r.id }));
                      if (r.id !== "custom") {
                        setSetup((s) => ({ ...s, role: r.id, roleLabel: r.label }));
                      }
                    }}
                  >
                    <span className="option-title">{r.label}</span>
                    <span className="option-desc">{r.blurb}</span>
                  </button>
                ))}
              </div>
              {setup.role === "custom" && (
                <input
                  className="field mt-2"
                  placeholder="e.g. Machine Learning Engineer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  maxLength={60}
                />
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-ink">Experience level</label>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className="option"
                    data-selected={setup.level === l.id}
                    onClick={() => setSetup((s) => ({ ...s, level: l.id }))}
                  >
                    <span className="option-title">{l.label}</span>
                    <span className="option-desc">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink">Interview type</label>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="option"
                    data-selected={setup.type === t.id}
                    onClick={() => setSetup((s) => ({ ...s, type: t.id }))}
                  >
                    <span className="option-title">{t.label}</span>
                    <span className="option-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink">Difficulty</label>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="option"
                    data-selected={setup.difficulty === d.id}
                    onClick={() => setSetup((s) => ({ ...s, difficulty: d.id }))}
                  >
                    <span className="option-title">{d.label}</span>
                    <span className="option-desc">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="resume" className="text-sm font-semibold text-ink">
                  Resume context
                </label>
                <span className="text-[0.68rem] font-semibold text-muted">Optional</span>
              </div>
              <textarea
                id="resume"
                className="field mt-3 min-h-28 resize-y"
                placeholder="Paste 3–5 lines from your resume if you want questions that reference your projects. Treated as untrusted data."
                value={setup.resume}
                onChange={(e) => setSetup((s) => ({ ...s, resume: e.target.value }))}
                maxLength={4000}
              />
              <p className="mt-1.5 text-[0.68rem] font-semibold text-muted">
                Used to personalise questions only. Never used as instructions and never
                sent anywhere in local mode.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper/70 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac text-violet">
                  <Robot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Robot presence</p>
                  <p className="text-[0.7rem] font-semibold text-muted">
                    Optional. If offline, the session continues silently.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={robotMode}
                onClick={() => setRobotMode((v) => !v)}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  robotMode ? "bg-violet" : "bg-cream-2"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    robotMode ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {error && (
              <p className="rounded-2xl border border-coral/30 bg-[#fdebe7] px-4 py-3 text-sm font-semibold text-[#ad4f3d]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={startSession}
              className="btn btn-primary w-full px-6 py-4 text-base"
            >
              Start the interview
              <ArrowRight />
            </button>
            <p className="text-center text-[0.68rem] font-semibold text-muted">
              Text first · voice optional · Gemini if configured · local rubric always on
            </p>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Spark className="h-4 w-4 text-violet" />
              <p className="text-sm font-semibold text-ink">What you leave with</p>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                "A four-dimension scorecard",
                "Quotes from your own answers",
                "Strengths and gaps, not just a number",
                "2–3 micro-actions and a re-practice outline",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl bg-cream/70 p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
                Rubric preview
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {RUBRIC.map((d) => (
                  <span
                    key={d.key}
                    className="rounded-full px-2 py-0.5 text-[0.64rem] font-bold"
                    style={{ background: d.tint, color: d.color }}
                  >
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Recent practice</p>
                <span className="text-[0.66rem] font-bold text-muted">last {history.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {history.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openHistory(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-cream/50 px-3 py-2 text-left transition-colors hover:bg-cream"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.78rem] font-semibold text-ink">
                        {item.setup.roleLabel}
                      </p>
                      <p className="text-[0.64rem] font-semibold text-muted">
                        {formatDate(item.date)} · {item.setup.level}
                      </p>
                    </div>
                    <span className="shrink-0 text-[0.8rem] font-bold text-violet">
                      {item.overall}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Evaluating                                                         */
  /* ------------------------------------------------------------------ */
  if (phase === "evaluating") {
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-2xl flex-col items-center justify-center px-5 pb-20 pt-32 text-center sm:px-8">
        <div className="card w-full p-8">
          <span className="mx-auto flex h-14 w-14 animate-pulse-ring items-center justify-center rounded-2xl bg-lilac text-violet">
            <Spark className="h-6 w-6" />
          </span>
          <h1 className="display-m mt-6 text-ink">Reading your answers.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Checking structure, role signal, problem solving and evidence. This usually
            takes a few seconds.
          </p>
          <div className="mt-7 space-y-2 text-left">
            {[
              "Mapping each answer to the rubric",
              "Selecting transcript evidence",
              "Writing the next-practice plan",
            ].map((line, i) => (
              <div
                key={line}
                className="flex items-center gap-3 rounded-xl border border-line bg-cream/60 px-4 py-3 text-[0.8rem] font-semibold text-ink-soft"
              >
                <span
                  className="h-2 w-2 rounded-full bg-violet"
                  style={{ animation: `vp-pulse 1.2s ${i * 0.25}s ease-in-out infinite` }}
                />
                {line}
              </div>
            ))}
          </div>
          {loading && (
            <p className="mt-5 text-[0.68rem] font-semibold text-muted">
              If the AI is slow, the local rubric engine takes over automatically.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Report                                                             */
  /* ------------------------------------------------------------------ */
  if (phase === "report" && report) {
    const tone = scoreTone(report.overall);
    return (
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={reset} className="btn btn-ghost px-4 py-2 text-[0.82rem]">
            <Refresh className="h-4 w-4" />
            New interview
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copySummary} className="btn btn-ghost px-4 py-2 text-[0.82rem]">
              Copy summary
            </button>
            <button type="button" onClick={downloadJSON} className="btn btn-ghost px-4 py-2 text-[0.82rem]">
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary px-4 py-2 text-[0.82rem]"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {notice && (
          <p className="no-print mt-3 rounded-2xl border border-teal/20 bg-[#e2f6f1] px-4 py-2.5 text-sm font-semibold text-teal">
            {notice}
          </p>
        )}

        <div className="mt-6">
          <span className="chip chip-violet">Session report</span>
          <h1 className="display-l mt-3 text-ink">
            {effectiveSetup.roleLabel} · {effectiveSetup.level}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold text-muted">
            <span>{effectiveSetup.type}</span>
            <span>·</span>
            <span>{effectiveSetup.difficulty}</span>
            <span>·</span>
            <span>{turns.filter((t) => !t.question.isFollowUp).length} questions</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {startedAt ? formatDate(startedAt) : "today"}
            </span>
            <span className="chip !px-2 !py-0.5 !text-[0.6rem]">
              {source === "ai" ? "Gemini + rubric" : "Local rubric"}
            </span>
          </div>
        </div>

        <div className="card-solid mt-6 overflow-hidden print-block">
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
            <div
              className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${tone.color} 0deg ${report.overall * 3.6}deg, #eee8ff ${report.overall * 3.6}deg 360deg)`,
              }}
            >
              <div className="flex h-[102px] w-[102px] flex-col items-center justify-center rounded-full bg-paper">
                <span className="font-display text-4xl font-semibold text-ink">
                  {report.overall}
                </span>
                <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted">
                  practice estimate
                </span>
              </div>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em]" style={{ color: tone.color }}>
                {tone.label}
              </p>
              <p className="mt-1 text-lg font-semibold leading-snug text-ink">
                {report.summary}
              </p>
              <p className="mt-2 text-[0.72rem] font-semibold text-muted">
                Scored against the visible four-part rubric. This is practice guidance,
                not a hiring prediction.
              </p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-line p-6 sm:grid-cols-2 sm:p-8">
            {report.dimensions.map((d) => {
              const meta = RUBRIC_BY_KEY[d.key];
              return (
                <div key={d.key} className="rounded-2xl border border-line bg-cream/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                      <p className="text-sm font-semibold text-ink">{d.label}</p>
                    </div>
                    <span className="font-display text-lg font-semibold" style={{ color: meta.color }}>
                      {d.score}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-2">
                    <div className="h-full rounded-full" style={{ width: `${d.score}%`, background: meta.color }} />
                  </div>
                  <p className="mt-2.5 text-[0.78rem] leading-relaxed text-muted">{d.rationale}</p>
                  {d.evidence.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {d.evidence.slice(0, 2).map((quote, i) => (
                        <p key={i} className="border-l-2 border-lilac-2 pl-2.5 text-[0.72rem] italic leading-relaxed text-ink-soft">
                          “{quote}”
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card p-6 print-block">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-teal">
              Strengths
            </p>
            <ul className="mt-3 space-y-2">
              {report.strengths.map((s) => (
                <li key={s} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6 print-block">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-coral">
              Gaps to close
            </p>
            <ul className="mt-3 space-y-2">
              {report.gaps.map((g) => (
                <li key={g} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card mt-4 p-6 print-block">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-violet">
            Next practice
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <ol className="space-y-2">
              {report.nextPractice.map((item, i) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lilac text-[0.64rem] font-bold text-violet-deep">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <div className="rounded-2xl bg-ink p-4 text-cream">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-lilac-2">
                Improved answer blueprint
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-[0.78rem] leading-relaxed text-cream/80">
                {report.blueprint}
              </pre>
            </div>
          </div>
        </div>

        <details className="card mt-4 px-6 py-4 print-block">
          <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
            Transcript · {turns.length} answers
          </summary>
          <div className="mt-4 space-y-4">
            {turns.map((turn, i) => (
              <div key={`${turn.question.id}-${i}`} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <p className="text-[0.72rem] font-bold text-violet">
                  Q{i + 1} {turn.question.isFollowUp ? "· follow-up" : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{turn.question.text}</p>
                <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">{turn.answer}</p>
              </div>
            ))}
          </div>
        </details>

        <p className="mt-6 text-center text-[0.68rem] font-semibold text-muted">
          ViewPilot is a practice tool. Scores are estimates against a disclosed rubric
          and must not be used as a hiring decision.
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Session                                                            */
  /* ------------------------------------------------------------------ */
  const mainAnswered = countMainQuestions(turns);
  const questionNumber = Math.min(MAX_MAIN_QUESTIONS, mainAnswered + 1);
  const progress = Math.round((mainAnswered / MAX_MAIN_QUESTIONS) * 100);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="chip chip-violet">
            {current?.isFollowUp ? "Follow-up" : `Question ${questionNumber} of ${MAX_MAIN_QUESTIONS}`}
          </span>
          <p className="mt-2 text-[0.74rem] font-semibold text-muted">
            {effectiveSetup.roleLabel} · {effectiveSetup.level} · {effectiveSetup.type} ·{" "}
            {effectiveSetup.difficulty}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">
            <Clock className="h-3.5 w-3.5" />
            {mmss(elapsed)}
          </span>
          <button
            type="button"
            onClick={finishEarly}
            disabled={!turns.length}
            className="btn btn-ghost px-4 py-2 text-[0.8rem]"
          >
            Finish early
          </button>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cream-2">
        <div
          className="h-full rounded-full bg-violet transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="card-solid p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-violet">
                {current?.isFollowUp ? "Follow-up · add evidence" : "Interviewer"}
              </span>
              <button
                type="button"
                onClick={() => current && speak(current.text)}
                className="btn btn-ghost px-3 py-1.5 text-[0.72rem]"
                aria-label="Read the question aloud"
              >
                Read aloud
              </button>
            </div>
            <h1 className="mt-4 font-display text-2xl font-medium leading-snug text-ink sm:text-[1.7rem]">
              {current?.text}
            </h1>
            {current?.hint && (
              <p className="mt-3 rounded-xl bg-lilac/50 px-3 py-2 text-[0.76rem] font-semibold text-violet-deep">
                {current.hint}
              </p>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label htmlFor="answer" className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Your answer
                </label>
                <span className="text-[0.68rem] font-semibold text-muted">
                  {answer.trim() ? answer.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <textarea
                id="answer"
                ref={textareaRef}
                className="field mt-2 min-h-44 resize-y text-[0.95rem] leading-relaxed"
                placeholder="Use a concrete example: situation, what you did, and the result."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={6000}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`btn px-4 py-2 text-[0.8rem] ${
                    listening ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  {listening ? "Stop dictation" : "Dictate"}
                </button>
                <span className="text-[0.68rem] font-semibold text-muted">
                  {listening ? "Listening… speak naturally." : "Text is the primary path; voice is optional."}
                </span>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl border border-coral/30 bg-[#fdebe7] px-4 py-3 text-sm font-semibold text-[#ad4f3d]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submitAnswer}
              disabled={loading}
              className="btn btn-primary mt-5 w-full px-6 py-3.5"
            >
              {loading ? "Preparing the next question…" : "Submit answer"}
              {!loading && <ArrowRight />}
            </button>
            <p className="mt-2 text-center text-[0.66rem] font-semibold text-muted">
              There is no “perfect” answer. A follow-up is a chance to add evidence.
            </p>
          </div>

          {turns.length > 0 && (
            <div className="card mt-4 p-5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-violet">
                This session
              </p>
              <div className="mt-3 space-y-2">
                {turns.map((turn, i) => (
                  <div key={`${turn.question.id}-${i}`} className="rounded-xl border border-line bg-cream/40 px-3 py-2">
                    <p className="text-[0.72rem] font-semibold text-ink">
                      {i + 1}. {turn.question.text}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[0.68rem] text-muted">
                      {turn.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink">Progress</p>
            <div className="mt-3 flex items-center gap-1.5">
              {Array.from({ length: MAX_MAIN_QUESTIONS }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < mainAnswered
                      ? "bg-violet"
                      : i === mainAnswered
                        ? "bg-lilac-2"
                        : "bg-cream-2"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-[0.68rem] font-semibold text-muted">
              {mainAnswered} of {MAX_MAIN_QUESTIONS} main questions answered
            </p>
          </div>

          <div className="card p-5">
            <p className="text-sm font-semibold text-ink">Rubric</p>
            <div className="mt-3 space-y-2">
              {RUBRIC.map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-[0.74rem] font-semibold text-muted">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Robot className="h-4 w-4 text-violet" />
              <p className="text-sm font-semibold text-ink">Robot presence</p>
            </div>
            <p className="mt-1 text-[0.7rem] font-semibold text-muted">
              {robotMode
                ? "Optional. If the robot is offline, nothing changes."
                : "Off. The browser is the only interviewer."}
            </p>
          </div>

          <Link href="/how" className="btn btn-ghost w-full px-4 py-2 text-[0.8rem]">
            How scoring works
          </Link>
        </aside>
      </div>
    </div>
  );
}
