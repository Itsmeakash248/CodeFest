"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnswerFeedback,
  InterviewQuestion,
  InterviewReport,
  InterviewSetup,
  InterviewTurn,
  ProctoringViolation,
} from "@/lib/types";
import {
  answerInterview,
  finalizeInterview,
  saveCloudReport,
  startInterview,
} from "@/lib/client/api";
import { useVideoProctor } from "@/lib/interview/useVideoProctor";
import { createProctorSession, type ProctorSession } from "@/lib/interview/proctorEngine";
import {
  readLastSetup,
  readLatestReport,
  saveLastSetup,
  saveLatestReport,
} from "@/lib/store/interview-store";
import { speakText, stopSpeaking } from "@/lib/voice/browser";
import {
  PREF_KEYS,
  readPreference,
  readStoredFlag,
  writeStoredFlag,
} from "@/components/preferences";
import InterviewTopBar from "@/components/interview/InterviewTopBar";
import InterviewSetupPanel from "@/components/interview/InterviewSetup";
import InterviewRoom from "@/components/interview/InterviewRoom";
import InterviewReportView from "@/components/interview/InterviewReportView";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Screen = "setup" | "room" | "report";
type Busy = "start" | "answer" | "finalize" | null;
type VoiceState = "idle" | "loading" | "playing";

const DEFAULT_SETUP: InterviewSetup = {
  role: "Frontend Engineer",
  level: "Entry level",
  type: "Mixed",
  difficulty: "Standard",
  resume: "",
  videoEnabled: true,
  conversationalMode: true,
};

interface InterviewAppProps {
  user: { name: string; email: string };
  initialReport: "latest" | null;
}

export default function InterviewApp({ user, initialReport }: InterviewAppProps) {
  const [screen, setScreen] = useState<Screen>("setup");
  const [setup, setSetup] = useState<InterviewSetup>(DEFAULT_SETUP);
  const [latestReport, setLatestReport] = useState<InterviewReport | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [reportMissing, setReportMissing] = useState(false);
  const [current, setCurrent] = useState<InterviewQuestion | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerFeedback | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const speechToken = useRef(0);

  const videoProctor = useVideoProctor(screen === "room" && (setup.videoEnabled ?? true));
  const proctorRef = useRef<ProctorSession | null>(null);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [proctorToast, setProctorToast] = useState<string | null>(null);

  const stopVoice = useCallback(() => {
    speechToken.current += 1;
    stopSpeaking();
    setVoiceState("idle");
  }, []);

  const playQuestion = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const token = speechToken.current + 1;
      speechToken.current = token;
      setVoiceState("loading");
      try {
        const handle = await speakText(text, voiceId);
        if (token !== speechToken.current) {
          handle.stop();
          return;
        }
        setVoiceState("playing");
        await handle.finished;
      } finally {
        if (token === speechToken.current) setVoiceState("idle");
      }
    },
    [voiceId],
  );

  useEffect(() => {
    setLatestReport(readLatestReport());
    const savedSetup = readLastSetup();
    if (savedSetup && typeof savedSetup.role === "string") {
      setSetup({ ...DEFAULT_SETUP, ...savedSetup, resume: savedSetup.resume ?? "" });
    }
    const storedVoice = readPreference(PREF_KEYS.voiceId);
    if (storedVoice) setVoiceId(storedVoice);
    setVoiceEnabled(readStoredFlag(PREF_KEYS.interviewVoice));

    if (initialReport === "latest") {
      const saved = readLatestReport();
      if (saved) {
        setReport(saved);
        setScreen("report");
      } else {
        setReportMissing(true);
      }
    }
  }, [initialReport]);

  useEffect(() => {
    if (screen !== "room" || !startedAt) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [screen, startedAt]);

  useEffect(() => {
    return () => {
      speechToken.current += 1;
      stopSpeaking();
    };
  }, []);

  function updateSetup(patch: Partial<InterviewSetup>) {
    setSetup((previous) => ({ ...previous, ...patch }));
  }

  function toggleVoice() {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    writeStoredFlag(PREF_KEYS.interviewVoice, next);
    if (!next) stopVoice();
  }

  useEffect(() => {
    if (screen === "room") {
      setIntegrityScore(100);
      setViolations([]);
      const session = createProctorSession({
        onViolation: (v) => {
          setViolations((prev) => [...prev, v]);
          setProctorToast(`⚠️ ${v.message}`);
          window.setTimeout(() => setProctorToast((curr) => (curr?.includes(v.message) ? null : curr)), 3800);
        },
        onScoreChange: (s) => setIntegrityScore(s),
      });
      proctorRef.current = session;
      return () => {
        session.destroy();
        proctorRef.current = null;
      };
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "room" && videoProctor.faceStatus !== "centered") {
      proctorRef.current?.recordFaceAnomaly(videoProctor.faceStatus);
    }
  }, [screen, videoProctor.faceStatus]);

  function finishReport(nextReport: InterviewReport) {
    const proctorReport = proctorRef.current?.generateReport(
      videoProctor.inFramePct,
      videoProctor.eyeContactPct,
    );
    const enrichedReport: InterviewReport = {
      ...nextReport,
      integrity: proctorReport,
    };
    saveLatestReport(enrichedReport);
    setLatestReport(enrichedReport);
    setReport(enrichedReport);
    void saveCloudReport(enrichedReport).catch(() => {});
    setScreen("report");
    setStartedAt(null);
    setConfirmEnd(false);
    stopVoice();
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/interview?report=latest");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function start() {
    if (busy) return;
    setBusy("start");
    setError(null);
    try {
      const cleanSetup: InterviewSetup = {
        ...setup,
        resume: setup.resume?.trim().slice(0, 6000) || undefined,
      };
      saveLastSetup(cleanSetup);
      const response = await startInterview(cleanSetup);
      if (!response.question) throw new Error("The interviewer did not return a question. Try again.");

      setSessionId(response.sessionId);
      setCurrent(response.question);
      setIsFollowUp(Boolean(response.isFollowUp));
      setTotalQuestions(response.totalQuestions || 5);
      setTurns([]);
      setAnswer("");
      setEvaluation(null);
      setReport(null);
      setReportMissing(false);
      setError(null);
      setStartedAt(Date.now());
      setElapsed(0);
      setConfirmEnd(false);
      setScreen("room");
      window.history.replaceState(null, "", "/interview");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (voiceEnabled) void playQuestion(response.question.text);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the interview.");
    } finally {
      setBusy(null);
    }
  }

  async function submitAnswer() {
    if (busy || !current || !sessionId) return;
    const clean = answer.trim();
    if (!clean) {
      setError("Type or dictate an answer before submitting.");
      return;
    }
    const question = current;
    const turn: InterviewTurn = {
      questionId: question.id,
      question: question.text,
      answer: clean,
      isFollowUp,
      competency: question.competency,
      signals: question.signals,
    };
    const priorTurns = turns;

    setBusy("answer");
    setError(null);
    try {
      const response = await answerInterview({
        sessionId,
        setup,
        turns: priorTurns,
        answer: clean,
        questionId: question.id,
        isFollowUp,
      });

      const nextTurns = [...priorTurns, turn];
      setTurns(nextTurns);
      if (response.evaluation) setEvaluation(response.evaluation);

      if (response.done) {
        if (!response.report) throw new Error("The report could not be built. Try submitting again.");
        finishReport(response.report);
        return;
      }
      if (!response.question) throw new Error("The next question was empty. Try submitting again.");

      setCurrent(response.question);
      setIsFollowUp(Boolean(response.isFollowUp));
      setTotalQuestions(response.totalQuestions || totalQuestions);
      setAnswer("");
      stopVoice();
      if (voiceEnabled) void playQuestion(response.question.text);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not evaluate that answer. Your answer has been kept.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function endSession() {
    if (busy || !sessionId || turns.length === 0) return;
    setBusy("finalize");
    setError(null);
    try {
      const integrity = proctorRef.current?.generateReport(
        videoProctor.inFramePct,
        videoProctor.eyeContactPct,
      );
      const response = await finalizeInterview({ sessionId, setup, turns, integrity });
      if (!response.report) throw new Error("The report could not be built from the answers so far.");
      finishReport(response.report);
    } catch (cause) {
      setConfirmEnd(false);
      setError(
        cause instanceof Error ? cause.message : "Could not finalize the session. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  function openLatest() {
    if (!latestReport) return;
    setReport(latestReport);
    setScreen("report");
    setReportMissing(false);
    setError(null);
    window.history.replaceState(null, "", "/interview?report=latest");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function practiceAgain() {
    stopVoice();
    setScreen("setup");
    setReport(null);
    setTurns([]);
    setCurrent(null);
    setSessionId(null);
    setAnswer("");
    setEvaluation(null);
    setIsFollowUp(false);
    setError(null);
    setElapsed(0);
    setStartedAt(null);
    setLatestReport(readLatestReport());
    window.history.replaceState(null, "", "/interview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(
    elapsed % 60,
  ).padStart(2, "0")}`;
  const answeredMain = turns.filter((turn) => !turn.isFollowUp).length;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--color-background)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="aurora left-[-8%] top-[-10%] h-[520px] w-[520px] bg-[#6c63ff]/[0.13]" />
        <div className="aurora bottom-[-18%] right-[-8%] h-[460px] w-[460px] bg-[var(--color-info-strong)]/[0.07]" />
      </div>

      <InterviewTopBar screen={screen} user={user} />

      <main className="relative">
        {screen === "report" && report ? (
          <InterviewReportView report={report} onPracticeAgain={practiceAgain} />
        ) : screen === "room" && current ? (
          <InterviewRoom
            setup={setup}
            current={current}
            totalQuestions={totalQuestions}
            answeredMain={answeredMain}
            isFollowUp={isFollowUp}
            turns={turns}
            answer={answer}
            onAnswerChange={setAnswer}
            onSubmit={() => void submitAnswer()}
            busy={busy === "answer"}
            finalizing={busy === "finalize"}
            error={error}
            evaluation={evaluation}
            elapsedLabel={elapsedLabel}
            voiceEnabled={voiceEnabled}
            onToggleVoice={toggleVoice}
            voiceState={voiceState}
            onListen={() => {
              if (current) void playQuestion(current.text);
            }}
            onStopVoice={stopVoice}
            onEnd={() => setConfirmEnd(true)}
            videoProctor={videoProctor}
            integrityScore={integrityScore}
            violations={violations}
            proctorToast={proctorToast}
            onPasteDetected={(len) => proctorRef.current?.recordPaste(len)}
            conversationalMode={setup.conversationalMode ?? true}
          />
        ) : (
          <InterviewSetupPanel
            setup={setup}
            onChange={updateSetup}
            onStart={() => void start()}
            busy={busy === "start"}
            error={error}
            latestReport={latestReport}
            onOpenLatest={openLatest}
            reportMissing={reportMissing}
            voiceEnabled={voiceEnabled}
            onToggleVoice={toggleVoice}
          />
        )}
      </main>

      <ConfirmDialog
        open={confirmEnd}
        title="End the session early?"
        body={`You have answered ${answeredMain} of ${totalQuestions} questions. The report will score those answers only and skip the rest. You can start a fresh five-question session afterwards.`}
        confirmLabel={busy === "finalize" ? "Scoring…" : "Score current answers"}
        cancelLabel="Keep rehearsing"
        tone="danger"
        loading={busy === "finalize"}
        onConfirm={() => void endSession()}
        onClose={() => {
          if (busy !== "finalize") setConfirmEnd(false);
        }}
      />
    </div>
  );
}
