"use client";

import { create } from "zustand";
import { answerInterview, startInterview } from "@/lib/client/api";
import type {
  AnswerFeedback,
  InterviewQuestion,
  InterviewReport,
  InterviewSetup,
  InterviewTurn,
} from "@/lib/types";

export const LATEST_REPORT_KEY = "viewpilot.latestReport";
export const LAST_SETUP_KEY = "viewpilot.lastSetup";

export function readLatestReport(): InterviewReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LATEST_REPORT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InterviewReport;
    if (!parsed || typeof parsed.overall !== "number" || !Array.isArray(parsed.dimensions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLatestReport(report: InterviewReport): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LATEST_REPORT_KEY, JSON.stringify(report));
    useInterviewStore.setState({ latestReport: report });
  } catch {
    // private mode / quota
  }
}

export function clearLatestReport(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LATEST_REPORT_KEY);
  useInterviewStore.setState({ latestReport: null });
}

export function saveLastSetup(setup: InterviewSetup): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(setup));
  } catch {
    // ignore
  }
}

export function readLastSetup(): InterviewSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_SETUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InterviewSetup;
  } catch {
    return null;
  }
}

type Phase = "setup" | "question" | "report";

interface InterviewStore {
  phase: Phase;
  setup: InterviewSetup | null;
  current: InterviewQuestion | null;
  turns: InterviewTurn[];
  report: InterviewReport | null;
  latestReport: InterviewReport | null;
  evaluation: AnswerFeedback | null;
  sessionId: string | null;
  questionNumber: number;
  totalQuestions: number;
  isFollowUp: boolean;
  loading: boolean;
  error: string | null;
  hydrated: boolean;

  hydrate: () => void;
  start: (setup: InterviewSetup) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  reset: () => void;
  clear: () => void;
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  phase: "setup",
  setup: null,
  current: null,
  turns: [],
  report: null,
  latestReport: null,
  evaluation: null,
  sessionId: null,
  questionNumber: 0,
  totalQuestions: 5,
  isFollowUp: false,
  loading: false,
  error: null,
  hydrated: false,

  hydrate: () =>
    set({
      latestReport: readLatestReport(),
      setup: readLastSetup(),
      hydrated: true,
    }),

  start: async (setup) => {
    set({
      phase: "setup",
      setup,
      current: null,
      turns: [],
      report: null,
      evaluation: null,
      sessionId: null,
      questionNumber: 0,
      loading: true,
      error: null,
    });
    try {
      saveLastSetup(setup);
      const response = await startInterview(setup);
      set({
        phase: "question",
        sessionId: response.sessionId,
        current: response.question ?? null,
        questionNumber: response.questionNumber || 1,
        totalQuestions: response.totalQuestions || 5,
        isFollowUp: Boolean(response.isFollowUp),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Could not start the interview.",
      });
    }
  },

  submitAnswer: async (answer) => {
    const state = get();
    const { current, sessionId, setup, turns } = state;
    const clean = answer.trim();
    if (!current || !sessionId || !setup) return;
    if (!clean) {
      set({ error: "Type or dictate an answer before submitting." });
      return;
    }

    const turn: InterviewTurn = {
      questionId: current.id,
      question: current.text,
      answer: clean,
      isFollowUp: state.isFollowUp,
      competency: current.competency,
      signals: current.signals,
    };

    set({ loading: true, error: null });
    try {
      const response = await answerInterview({
        sessionId,
        setup,
        turns,
        answer: clean,
        questionId: current.id,
        isFollowUp: state.isFollowUp,
      });

      const nextTurns = [...turns, turn];
      if (response.done && response.report) {
        saveLatestReport(response.report);
        set({
          turns: nextTurns,
          report: response.report,
          evaluation: response.evaluation ?? null,
          current: null,
          phase: "report",
          loading: false,
          questionNumber: response.questionNumber || state.questionNumber,
          totalQuestions: response.totalQuestions || state.totalQuestions,
        });
        return;
      }

      set({
        turns: nextTurns,
        evaluation: response.evaluation ?? state.evaluation,
        current: response.question ?? null,
        questionNumber: response.questionNumber || state.questionNumber,
        totalQuestions: response.totalQuestions || state.totalQuestions,
        isFollowUp: Boolean(response.isFollowUp),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Could not evaluate that answer.",
      });
    }
  },

  reset: () =>
    set({
      phase: "setup",
      setup: readLastSetup(),
      current: null,
      turns: [],
      report: null,
      evaluation: null,
      sessionId: null,
      questionNumber: 0,
      totalQuestions: 5,
      isFollowUp: false,
      loading: false,
      error: null,
    }),

  clear: () => {
    clearLatestReport();
    if (typeof window !== "undefined") window.localStorage.removeItem(LAST_SETUP_KEY);
    set({
      latestReport: null,
      report: null,
      setup: null,
      phase: "setup",
      current: null,
      turns: [],
      evaluation: null,
      sessionId: null,
      questionNumber: 0,
      isFollowUp: false,
      error: null,
    });
  },
}));
