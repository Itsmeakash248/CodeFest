import { NextResponse } from "next/server";
import { aiConfigured, aiNextQuestion, aiReport } from "@/lib/ai";
import {
  MAX_MAIN_QUESTIONS,
  countMainQuestions,
  localNext,
  localReport,
  normalizeReport,
  setupIsValid,
  type Setup,
  type Turn,
} from "@/lib/interview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Body = {
  action?: "start" | "next" | "evaluate";
  setup?: Partial<Setup>;
  turns?: Turn[];
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeSetup(input: Partial<Setup> | undefined): Setup | null {
  if (!input) return null;
  const setup: Setup = {
    role: (input.role || "frontend") as Setup["role"],
    roleLabel: String(input.roleLabel || "").slice(0, 80),
    level: input.level || "Entry",
    type: input.type || "Mixed",
    difficulty: input.difficulty || "Standard",
    resume: String(input.resume || "").slice(0, 4000),
  };
  return setupIsValid(setup) ? setup : null;
}

function sanitizeTurns(input: Turn[] | undefined): Turn[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (t) =>
        t &&
        t.question &&
        typeof t.question.text === "string" &&
        typeof t.answer === "string"
    )
    .slice(0, MAX_MAIN_QUESTIONS + 2)
    .map((t) => ({
      question: {
        id: String(t.question.id || "").slice(0, 80),
        text: String(t.question.text).slice(0, 500),
        dimension: t.question.dimension,
        isFollowUp: Boolean(t.question.isFollowUp),
        hint: t.question.hint
          ? String(t.question.hint).slice(0, 240)
          : undefined,
      },
      answer: String(t.answer).slice(0, 6000),
    }));
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return bad("Invalid JSON body.");
  }

  const setup = sanitizeSetup(body.setup);
  if (!setup) return bad("Choose a role, level, interview type and difficulty.");
  const turns = sanitizeTurns(body.turns);
  const action = body.action || "start";

  if (action === "start") {
    const fallback = localNext(setup, [], MAX_MAIN_QUESTIONS);
    if (aiConfigured()) {
      const question = await aiNextQuestion(setup, [], 0);
      if (question) {
        return NextResponse.json({
          question,
          done: false,
          source: "ai",
          aiEnabled: true,
        });
      }
    }
    return NextResponse.json({ ...fallback, aiEnabled: aiConfigured() });
  }

  if (action === "next") {
    if (countMainQuestions(turns) >= MAX_MAIN_QUESTIONS) {
      return NextResponse.json({ done: true, source: "local", aiEnabled: aiConfigured() });
    }

    const fallback = localNext(setup, turns, MAX_MAIN_QUESTIONS);
    const lastTwoFollowUps =
      turns.length >= 2 &&
      turns[turns.length - 1]?.question.isFollowUp &&
      turns[turns.length - 2]?.question.isFollowUp;

    if (aiConfigured() && !lastTwoFollowUps) {
      const question = await aiNextQuestion(
        setup,
        turns,
        countMainQuestions(turns)
      );
      const followUpsSoFar = turns.filter((t) => t.question.isFollowUp).length;
      if (question && !(question.isFollowUp && followUpsSoFar >= 1)) {
        return NextResponse.json({
          question,
          done: false,
          source: "ai",
          aiEnabled: true,
        });
      }
    }
    return NextResponse.json({ ...fallback, aiEnabled: aiConfigured() });
  }

  if (action === "evaluate") {
    if (!turns.length) return bad("Answer at least one question first.");

    const fallback = localReport(setup, turns);
    if (aiConfigured()) {
      const raw = await aiReport(setup, turns);
      if (raw) {
        return NextResponse.json({
          report: normalizeReport(raw, fallback),
          aiEnabled: true,
        });
      }
    }
    return NextResponse.json({ report: fallback, aiEnabled: aiConfigured() });
  }

  return bad("Unknown action.");
}
