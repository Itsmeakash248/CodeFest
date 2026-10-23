"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Clock3,
  FileText,
  Lightbulb,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AnswerFeedback, InterviewQuestion, InterviewSetup, InterviewTurn } from "@/lib/types";
import { startDictation, type DictationHandle } from "@/lib/voice/browser";
import { roleById } from "@/lib/data/roles";
import ScoreRing from "@/components/ui/ScoreRing";
import { cn } from "@/components/ui/cn";

type VoiceState = "idle" | "loading" | "playing";

interface InterviewRoomProps {
  setup: InterviewSetup;
  current: InterviewQuestion;
  totalQuestions: number;
  answeredMain: number;
  isFollowUp: boolean;
  turns: InterviewTurn[];
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  finalizing: boolean;
  error: string | null;
  evaluation: AnswerFeedback | null;
  elapsedLabel: string;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  voiceState: VoiceState;
  onListen: () => void;
  onStopVoice: () => void;
  onEnd: () => void;
}

const tips = [
  "Open with one sentence of context, then move.",
  "Name the constraint and the option you rejected.",
  "Close on a number: time saved, users affected, error rate.",
];

export default function InterviewRoom({
  setup,
  current,
  totalQuestions,
  answeredMain,
  isFollowUp,
  turns,
  answer,
  onAnswerChange,
  onSubmit,
  busy,
  finalizing,
  error,
  evaluation,
  elapsedLabel,
  voiceEnabled,
  onToggleVoice,
  voiceState,
  onListen,
  onStopVoice,
  onEnd,
}: InterviewRoomProps) {
  const [dictating, setDictating] = useState(false);
  const [dictationNote, setDictationNote] = useState<string | null>(null);
  const recognitionRef = useRef<DictationHandle | null>(null);
  const dictationBase = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeMain = isFollowUp ? answeredMain : answeredMain + 1;
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const lastMain = answeredMain >= totalQuestions - 1 && !isFollowUp;

  useEffect(() => {
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, [current.id]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleDictation() {
    setDictationNote(null);
    if (dictating) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setDictating(false);
      return;
    }
    dictationBase.current = answer.trim();
    const handle = startDictation({
      onTranscript: (transcript) => {
        onAnswerChange(`${dictationBase.current} ${transcript}`.replace(/\s+/g, " ").trim().slice(0, 8000));
      },
      onError: (message) => {
        setDictationNote(message);
        setDictating(false);
      },
      onEnd: () => {
        setDictating(false);
        recognitionRef.current = null;
      },
    });
    if (handle) {
      recognitionRef.current = handle;
      setDictating(true);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (answer.trim() && !busy) onSubmit();
    }
  }

  const role = roleById(setup.role);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#8b8ba3]">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#6c63ff]" />
          Live session
        </span>
        <span className="hidden h-3 w-px bg-white/[0.09] sm:block" />
        <span className="text-[11px] text-[#9b9cae]">
          {role.label} <span className="text-[#565969]">·</span> {setup.level}{" "}
          <span className="text-[#565969]">·</span> {setup.type}{" "}
          <span className="text-[#565969]">·</span> {setup.difficulty}
        </span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 font-mono text-[8px] tabular-nums tracking-[0.06em] text-[#b8b8c9]">
          <Clock3 size={9} className="text-[#8b8ba3]" />
          {elapsedLabel}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_296px]">
        <div className="min-w-0">
          <section className="glass relative overflow-hidden rounded-2xl p-5 sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[-60px] top-[-80px] h-56 w-56 rounded-full bg-[#6c63ff]/[0.09] blur-3xl"
            />
            <div className="relative flex flex-wrap items-center gap-1.5">
              <span className="chip chip-accent">
                Question {activeMain} <span className="text-[#8d86ff]">/ {totalQuestions}</span>
              </span>
              {isFollowUp ? (
                <span className="chip chip-cyan">Follow-up · not a new question</span>
              ) : null}
              <span className="ml-auto flex items-center gap-1">
                <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-[#8b8ba3]">
                  {current.competency}
                </span>
                <span className="hidden rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-[#8b8ba3] sm:inline">
                  {current.type}
                </span>
              </span>
            </div>

            <div className="relative mt-5 flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#6c63ff]/25 bg-[#6c63ff]/10 font-mono text-[9px] font-semibold text-[#c9c5ff] sm:flex"
              >
                VP
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[21px] font-medium leading-[1.36] tracking-[-0.015em] text-white sm:text-[26px]">
                  {current.text}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {voiceState === "idle" ? (
                    <button
                      type="button"
                      onClick={onListen}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#b8b8c9] transition-colors hover:bg-white/[0.07] hover:text-white"
                    >
                      <Volume2 size={11} /> Listen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onStopVoice}
                      disabled={voiceState === "loading"}
                      className="flex items-center gap-1.5 rounded-lg border border-[#6c63ff]/30 bg-[#6c63ff]/12 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#c9c5ff] transition-colors hover:bg-[#6c63ff]/18 disabled:opacity-60"
                    >
                      {voiceState === "loading" ? (
                        <>
                          <Loader2 size={11} className="animate-spin" /> Preparing voice
                        </>
                      ) : (
                        <>
                          <Square size={9} /> Stop
                        </>
                      )}
                    </button>
                  )}
                  <span className="font-mono text-[7px] uppercase tracking-[0.06em] text-[#565969]">
                    {voiceEnabled ? "Auto-read on" : "Auto-read off"}
                  </span>
                </div>
              </div>
            </div>

            <details className="group relative mt-5 border-t border-white/[0.06] pt-3">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.09em] text-[#8b8ba3] transition-colors hover:text-white">
                <Lightbulb size={10} className="text-amber-300/70" />
                How to shape this answer
                <ChevronDown size={10} className="ml-auto transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 max-w-[680px] text-[11.5px] leading-relaxed text-[#9b9cae]">
                {current.starHint}
              </p>
              {isFollowUp ? (
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#7d7f92]">
                  The follow-up is scored inside the same question. A direct correction is stronger
                  than a second full story.
                </p>
              ) : null}
            </details>
          </section>

          {evaluation ? <LastEvaluation feedback={evaluation} /> : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy) onSubmit();
            }}
            className="glass mt-3 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#8b8ba3]">
                Your answer
              </span>
              <span className="font-mono text-[7px] uppercase tracking-[0.06em] text-[#565969]">
                {words} {words === 1 ? "word" : "words"}
              </span>
              <span className="ml-auto font-mono text-[7px] uppercase tracking-[0.06em] text-[#565969]">
                {answer.length}/8000
              </span>
            </div>

            <label htmlFor="interview-answer" className="sr-only">
              Your answer to the interview question
            </label>
            <textarea
              ref={textareaRef}
              id="interview-answer"
              value={answer}
              maxLength={8000}
              onChange={(event) => onAnswerChange(event.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              placeholder="Talk through one real example. Context, what you owned, the result."
              className="min-h-[172px] w-full resize-y bg-transparent px-4 py-3.5 text-[13.5px] leading-[1.75] text-[#e6e6f0] outline-none placeholder:text-[#565969] disabled:opacity-60 sm:min-h-[196px]"
            />

            <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.05] px-3 py-2.5">
              <button
                type="button"
                onClick={toggleDictation}
                disabled={busy}
                aria-pressed={dictating}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.06em] transition-colors disabled:opacity-50",
                  dictating
                    ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                    : "border-white/[0.07] bg-white/[0.025] text-[#8b8ba3] hover:text-white",
                )}
              >
                {dictating ? <MicOff size={11} /> : <Mic size={11} />}
                {dictating ? "Stop dictation" : "Dictate"}
              </button>

              {dictating ? (
                <span className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.07em] text-[#7fe8ff]">
                  <span className="flex h-3 items-end gap-[2px]">
                    {[0, 1, 2].map((bar) => (
                      <span
                        key={bar}
                        className="w-[2px] animate-[wave_0.9s_ease-in-out_infinite] rounded-full bg-[#00d9ff]"
                        style={{ height: `${6 + bar * 3}px`, animationDelay: `${bar * 120}ms` }}
                      />
                    ))}
                  </span>
                  Listening
                </span>
              ) : (
                <span className="font-mono text-[7.5px] uppercase tracking-[0.06em] text-[#565969]">
                  {navigatorSafe() ? "Mic optional · type any time" : "Type your answer"}
                </span>
              )}

              <span className="ml-auto hidden items-center gap-2 font-mono text-[7px] uppercase tracking-[0.06em] text-[#565969] sm:flex">
                <kbd className="rounded border border-white/[0.09] bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-[#8b8ba3]">
                  ⌘
                </kbd>
                <kbd className="rounded border border-white/[0.09] bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-[#8b8ba3]">
                  ↵
                </kbd>
                to submit
              </span>

              <button
                type="submit"
                disabled={busy || !answer.trim()}
                className="btn btn-primary ml-auto !px-3.5 !py-2.5 !text-[12px]"
              >
                {busy ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Evaluating
                  </>
                ) : (
                  <>
                    {lastMain ? "Finish & score" : "Submit answer"}
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </form>

          {dictationNote ? (
            <p className="mt-2 flex items-start gap-2 px-1 text-[10.5px] leading-relaxed text-amber-200/90">
              <AlertCircle size={11} className="mt-0.5 shrink-0" /> {dictationNote}
            </p>
          ) : null}

          {words > 0 && words < 25 ? (
            <p className="mt-2 px-1 text-[10px] leading-relaxed text-[#6f7284]">
              Under 25 words is usually too thin to score well. You can still submit — the report will
              show exactly where the evidence is missing.
            </p>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-3 text-[11.5px] leading-relaxed text-rose-200"
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>{error}</p>
                  <p className="mt-1 text-[10.5px] text-rose-200/70">
                    Your answer is still in the box. Submit again when the connection recovers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={busy}
                  className="shrink-0 rounded-lg border border-rose-300/20 bg-rose-500/10 px-2.5 py-1.5 text-[10.5px] font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[84px] lg:self-start">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#6f7284]">
                Session progress
              </span>
              <span className="font-mono text-[8px] tabular-nums text-[#b8b8c9]">
                {answeredMain}/{totalQuestions}
              </span>
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6c63ff] to-[#00d9ff] transition-[width] duration-500"
                style={{ width: `${(answeredMain / totalQuestions) * 100}%` }}
              />
            </div>

            <ol className="mt-3 space-y-1" aria-label="Question progress">
              {Array.from({ length: totalQuestions }).map((_, index) => {
                const number = index + 1;
                const complete = number < activeMain || (number === activeMain && isFollowUp);
                const active = number === activeMain && !isFollowUp;
                const probing = number === activeMain && isFollowUp;
                return (
                  <li
                    key={number}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5",
                      active
                        ? "border-[#6c63ff]/25 bg-[#6c63ff]/[0.07]"
                        : probing
                          ? "border-[#00d9ff]/20 bg-[#00d9ff]/[0.05]"
                          : "border-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border font-mono text-[7px]",
                        complete
                          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                          : active || probing
                            ? "border-[#6c63ff]/40 bg-[#6c63ff]/15 text-[#c9c5ff]"
                            : "border-white/[0.09] text-[#565969]",
                      )}
                      style={{ height: 18, width: 18 }}
                    >
                      {complete ? <Check size={9} /> : number}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[10.5px]",
                        active || probing ? "text-[#dedee9]" : complete ? "text-[#9b9cae]" : "text-[#5f6273]",
                      )}
                    >
                      {number === 1
                        ? "Warm-up"
                        : number === totalQuestions
                          ? "Close & score"
                          : `Question ${number}`}
                    </span>
                    {probing ? (
                      <span className="font-mono text-[6.5px] uppercase tracking-[0.06em] text-[#7fe8ff]">
                        follow-up
                      </span>
                    ) : active ? (
                      <span className="h-1 w-1 animate-pulse-soft rounded-full bg-[#8d86ff]" />
                    ) : complete ? (
                      <span className="font-mono text-[6.5px] uppercase tracking-[0.06em] text-[#565969]">
                        done
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
              <div className="flex items-center gap-2">
                {voiceEnabled ? (
                  <Volume2 size={11} className="text-[#8b8ba3]" />
                ) : (
                  <VolumeX size={11} className="text-[#565969]" />
                )}
                <span className="text-[10px] text-[#8b8ba3]">Read aloud</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={voiceEnabled}
                aria-label="Read questions aloud"
                onClick={onToggleVoice}
                className={cn(
                  "relative h-5 w-9 rounded-full border transition-colors",
                  voiceEnabled
                    ? "border-[#6c63ff]/40 bg-[#6c63ff]/40"
                    : "border-white/[0.09] bg-white/[0.05]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow transition-[left] duration-200",
                    voiceEnabled ? "left-[18px]" : "left-[2px]",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#6f7284]">
              <Lightbulb size={10} className="text-amber-300/70" /> Answer shape
            </p>
            <ul className="mt-2.5 space-y-2">
              {tips.map((tip, index) => (
                <li key={tip} className="flex items-start gap-2 text-[10.5px] leading-relaxed text-[#8d8d9f]">
                  <span className="mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-white/[0.09] font-mono text-[6.5px] text-[#6f7284]">
                    {index + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-white/[0.05] pt-2.5 font-mono text-[7px] uppercase tracking-[0.06em] text-[#565969]">
              {role.skills.slice(0, 3).join(" · ")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="flex items-center gap-1.5 text-[10.5px] leading-relaxed text-[#7d7f92]">
              <FileText size={11} className="shrink-0 text-[#8b8ba3]" />
              Stop any time. Answers already submitted are still scored.
            </p>
            <button
              type="button"
              onClick={onEnd}
              disabled={busy || finalizing || turns.length === 0}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-2 text-[10.5px] text-[#9b9cae] transition-colors hover:border-rose-400/20 hover:bg-rose-500/[0.06] hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {finalizing ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
              End session &amp; score
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 font-mono text-[6.5px] uppercase tracking-[0.08em] text-[#4f5262]">
            <Circle size={5} className="text-emerald-400/60" />
            Answers stay in this browser
          </div>
        </aside>
      </div>
    </div>
  );
}

function LastEvaluation({ feedback }: { feedback: AnswerFeedback }) {
  return (
    <details className="group mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-2.5">
        <ScoreRing score={feedback.score} size={38} stroke={3.2} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#7fe8ff]">
            Last answer · {feedback.label}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] text-[#b8b8c9]">{feedback.summary}</p>
        </div>
        <ChevronDown size={11} className="shrink-0 text-[#6f7284] transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-3 border-t border-white/[0.05] px-3.5 py-3 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[6.5px] uppercase tracking-[0.08em] text-emerald-300/80">
            What worked
          </p>
          <ul className="mt-1.5 space-y-1">
            {feedback.strengths.slice(0, 2).map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[#9b9cae]">
                <Check size={8} className="mt-[3px] shrink-0 text-emerald-400/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[6.5px] uppercase tracking-[0.08em] text-amber-300/80">
            Next rep
          </p>
          <ul className="mt-1.5 space-y-1">
            {feedback.improve.slice(0, 2).map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[#9b9cae]">
                <ArrowRight size={8} className="mt-[3px] shrink-0 text-amber-400/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

function navigatorSafe(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}
