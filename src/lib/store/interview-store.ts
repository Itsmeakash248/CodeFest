"use client";

import { create } from "zustand";
import type { InterviewReport, InterviewSetup } from "@/lib/types";

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

interface InterviewStore {
  latestReport: InterviewReport | null;
  hydrated: boolean;
  hydrate: () => void;
  clear: () => void;
}

/**
 * Thin view over the latest report for the dashboard / settings panels.
 * The interview page can keep its live session in local state.
 */
export const useInterviewStore = create<InterviewStore>((set) => ({
  latestReport: null,
  hydrated: false,
  hydrate: () => set({ latestReport: readLatestReport(), hydrated: true }),
  clear: () => {
    clearLatestReport();
    set({ latestReport: null });
  },
}));
