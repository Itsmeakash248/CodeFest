import type { InterviewQuestion, InterviewResponse, InterviewSetup, InterviewTurn } from "@/lib/types";
import { DIFFICULTIES, INTERVIEW_TYPES, LEVELS, roleById } from "@/lib/data/roles";
import { buildQuestionSetForSession, followUpFor } from "@/lib/interview/questions";
import { buildReport, evaluateTurn, shouldFollowUp } from "@/lib/interview/engine";
import { uid } from "@/lib/text";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : fallback;
}

function pick(value: unknown, allowed: string[], fallback: string): string {
  if (typeof value !== "string") return fallback;
  return allowed.find((option) => option.toLowerCase() === value.toLowerCase()) ?? fallback;
}

export function parseSetup(raw: unknown): InterviewSetup {
  const obj = asRecord(raw);
  const profile = roleById(readString(obj.role, "Frontend Engineer", 80));
  return {
    role: profile.label,
    level: pick(obj.level, LEVELS, "Entry level"),
    type: pick(obj.type, INTERVIEW_TYPES, "Mixed"),
    difficulty: pick(obj.difficulty, DIFFICULTIES, "Standard"),
    resume: readString(obj.resume, "", 6000) || undefined,
  };
}

export function parseSessionId(raw: unknown): string {
  if (typeof raw === "string" && /^[a-zA-Z0-9_-]{3,120}$/.test(raw)) return raw;
  return uid("sess");
}

export function parseTurns(raw: unknown): InterviewTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: InterviewTurn[] = [];
  for (const item of raw.slice(-14)) {
    const obj = asRecord(item);
    const questionId = readString(obj.questionId, "", 120);
    const question = readString(obj.question, "", 600);
    const answer = readString(obj.answer, "", 8000);
    if (!question || !answer) continue;
    const signals = Array.isArray(obj.signals)
      ? obj.signals
          .filter((signal): signal is string => typeof signal === "string")
          .slice(0, 12)
          .map((signal) => signal.slice(0, 60))
      : [];
    turns.push({
      questionId: questionId || "unknown",
      question,
      answer,
      isFollowUp: obj.isFollowUp === true,
      competency: readString(obj.competency, "", 100) || undefined,
      signals,
    });
  }
  return turns;
}

function currentQuestion(
  questionId: string,
  questions: InterviewQuestion[],
  fallbackIndex: number,
): { question: InterviewQuestion; isFollowUp: boolean } {
  const isFollowUp = questionId.endsWith("-fu");
  const baseId = isFollowUp ? questionId.slice(0, -3) : questionId;
  const base = questions.find((question) => question.id === baseId);
  if (base) {
    return { question: isFollowUp ? followUpFor(base) : base, isFollowUp };
  }
  const fallback = questions[Math.min(Math.max(fallbackIndex, 0), questions.length - 1)] ?? questions[0];
  return { question: fallback, isFollowUp: false };
}

function hydrateTurns(
  turns: InterviewTurn[],
  setup: InterviewSetup,
  sessionId: string,
): InterviewTurn[] {
  const questions = buildQuestionSetForSession(setup, sessionId);
  return turns.map((turn) => {
    const hydrated = currentQuestion(turn.questionId, questions, 0).question;
    return {
      ...turn,
      question: hydrated.text,
      competency: hydrated.competency,
      signals: hydrated.signals,
    };
  });
}

export function startInterview(raw: unknown): InterviewResponse {
  const body = asRecord(raw);
  const setup = parseSetup(body.setup);
  const sessionId = parseSessionId(body.sessionId);
  const questions = buildQuestionSetForSession(setup, sessionId);
  return {
    sessionId,
    question: questions[0],
    isFollowUp: false,
    questionNumber: 1,
    totalQuestions: 5,
    answered: 0,
    done: false,
    source: "local",
  };
}

export function answerInterview(raw: unknown): InterviewResponse {
  const body = asRecord(raw);
  const setup = parseSetup(body.setup);
  const sessionId = parseSessionId(body.sessionId);
  const answer = readString(body.answer, "", 8000);
  const questionId = readString(body.questionId, "", 120);
  if (!answer) throw new Error("An answer is required.");
  if (!questionId) throw new Error("A questionId is required.");

  const priorTurns = parseTurns(body.turns);
  const questions = buildQuestionSetForSession(setup, sessionId);
  const priorMain = priorTurns.filter((turn) => !turn.isFollowUp).length;
  const { question, isFollowUp } = currentQuestion(questionId, questions, priorMain);

  // Accept both client conventions: turns = prior turns only, or turns already
  // containing the current answer.
  const alreadyIncluded = priorTurns.some(
    (turn) => turn.questionId === questionId && turn.answer.trim().length > 0,
  );

  const currentTurn: InterviewTurn = {
    questionId: question.id,
    question: question.text,
    answer,
    isFollowUp,
    competency: question.competency,
    signals: question.signals,
  };

  const allTurns = alreadyIncluded
    ? hydrateTurns(priorTurns, setup, sessionId)
    : [...hydrateTurns(priorTurns, setup, sessionId), currentTurn];

  const lastTurn = alreadyIncluded
    ? allTurns[allTurns.length - 1]
    : currentTurn;
  const evaluation = evaluateTurn(lastTurn, setup);
  const answered = allTurns.filter((turn) => !turn.isFollowUp).length;
  const totalFollowUps = allTurns.filter((turn) => turn.isFollowUp).length;
  const sessionQuestions = questions;

  if (answered >= 5) {
    const report = buildReport(sessionId, setup, allTurns);
    return {
      sessionId,
      isFollowUp,
      questionNumber: 5,
      totalQuestions: 5,
      answered: 5,
      done: true,
      report,
      evaluation,
      source: "local",
    };
  }

  const followUpAlreadyUsed = allTurns.some(
    (turn) =>
      turn.isFollowUp &&
      (turn.questionId === `${question.id}-fu` || turn.questionId === question.id),
  );
  const takeFollowUp =
    !alreadyIncluded &&
    !isFollowUp &&
    !followUpAlreadyUsed &&
    shouldFollowUp(allTurns, currentTurn, totalFollowUps);

  const nextQuestion = takeFollowUp
    ? followUpFor(question)
    : sessionQuestions[Math.min(answered, sessionQuestions.length - 1)];

  return {
    sessionId,
    question: nextQuestion,
    isFollowUp: takeFollowUp,
    questionNumber: answered + 1,
    totalQuestions: 5,
    answered,
    done: false,
    evaluation,
    source: "local",
  };
}

export function finalizeInterview(raw: unknown): InterviewResponse {
  const body = asRecord(raw);
  const setup = parseSetup(body.setup);
  const sessionId = parseSessionId(body.sessionId);
  const turns = hydrateTurns(parseTurns(body.turns), setup, sessionId);
  const report = buildReport(sessionId, setup, turns);
  return {
    sessionId,
    questionNumber: Math.min(turns.filter((turn) => !turn.isFollowUp).length, 5),
    totalQuestions: 5,
    answered: turns.filter((turn) => !turn.isFollowUp).length,
    done: true,
    report,
    source: "local",
  };
}
