import type { ProctoringReport, ProctoringViolation, ViolationType } from "@/lib/types";

export interface ProctorSessionOptions {
  onViolation?: (violation: ProctoringViolation) => void;
  onScoreChange?: (score: number) => void;
}

export interface ProctorSession {
  recordViolation: (type: ViolationType, message: string, severity?: "low" | "medium" | "high") => void;
  recordPaste: (pastedLength: number) => void;
  recordFaceAnomaly: (status: "absent" | "looking-away" | "multiple-faces") => void;
  getIntegrityScore: () => number;
  getViolations: () => ProctoringViolation[];
  generateReport: (inFramePct?: number, eyeContactPct?: number) => ProctoringReport;
  destroy: () => void;
}

export function createProctorSession(options?: ProctorSessionOptions): ProctorSession {
  const violations: ProctoringViolation[] = [];
  let tabSwitches = 0;
  let pasteEvents = 0;
  let score = 100;
  let lastBlurAt = 0;
  let lastGazeAlertAt = 0;
  let lastAbsenceAlertAt = 0;

  function calculateScore(): number {
    let penalty = 0;
    for (const v of violations) {
      if (v.severity === "high") penalty += 20;
      else if (v.severity === "medium") penalty += 12;
      else penalty += 5;
    }
    return Math.max(0, Math.min(100, 100 - penalty));
  }

  function recordViolation(
    type: ViolationType,
    message: string,
    severity: "low" | "medium" | "high" = "medium",
  ) {
    const violation: ProctoringViolation = {
      id: `viol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      timestamp: Date.now(),
      message,
      severity,
    };
    violations.push(violation);
    score = calculateScore();
    options?.onViolation?.(violation);
    options?.onScoreChange?.(score);
  }

  function onVisibilityChange() {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "hidden") {
      lastBlurAt = Date.now();
      tabSwitches += 1;
      recordViolation("tab-switch", "Browser tab was hidden or switched.", "medium");
    }
  }

  function onWindowBlur() {
    // Avoid double counting if visibilitychange already fired in the last 200ms
    if (Date.now() - lastBlurAt < 250) return;
    lastBlurAt = Date.now();
    tabSwitches += 1;
    recordViolation("window-blur", "Interview window lost focus.", "low");
  }

  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
  }

  function recordPaste(pastedLength: number) {
    pasteEvents += 1;
    const severity = pastedLength > 120 ? "high" : "medium";
    recordViolation(
      "paste-detected",
      `External text pasted into answer (${pastedLength} characters).`,
      severity,
    );
  }

  function recordFaceAnomaly(status: "absent" | "looking-away" | "multiple-faces") {
    const now = Date.now();
    if (status === "absent") {
      if (now - lastAbsenceAlertAt > 8000) {
        lastAbsenceAlertAt = now;
        recordViolation("face-absent", "Candidate face left camera frame.", "high");
      }
    } else if (status === "multiple-faces") {
      if (now - lastAbsenceAlertAt > 8000) {
        lastAbsenceAlertAt = now;
        recordViolation("multiple-faces", "Multiple people detected in video stream.", "high");
      }
    } else if (status === "looking-away") {
      if (now - lastGazeAlertAt > 9000) {
        lastGazeAlertAt = now;
        recordViolation("gaze-away", "Prolonged gaze deviation away from screen.", "low");
      }
    }
  }

  function generateReport(inFramePct = 98, eyeContactPct = 95): ProctoringReport {
    const finalScore = calculateScore();
    const rating: "High" | "Moderate" | "Needs Review" =
      finalScore >= 88 ? "High" : finalScore >= 65 ? "Moderate" : "Needs Review";

    return {
      integrityScore: finalScore,
      rating,
      tabSwitches,
      pasteEvents,
      eyeContactPct: Math.min(100, Math.max(0, eyeContactPct)),
      faceInFramePct: Math.min(100, Math.max(0, inFramePct)),
      violations: [...violations],
    };
  }

  function destroy() {
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    }
  }

  return {
    recordViolation,
    recordPaste,
    recordFaceAnomaly,
    getIntegrityScore: () => score,
    getViolations: () => [...violations],
    generateReport,
    destroy,
  };
}
