import type {
  AnswerFeedback,
  DimensionKey,
  DimensionScore,
  InterviewQuestion,
  InterviewReport,
  InterviewSetup,
  InterviewTurn,
  PracticeAction,
  QuestionFeedback,
  StarBlueprint,
} from "@/lib/types";
import { roleById } from "@/lib/data/roles";
import { callLlmJson } from "@/lib/ai/llm";
import {
  bandFor,
  clamp,
  countMatches,
  splitSentences,
  truncate,
  unique,
  wordCount,
} from "@/lib/text";

const ACTION_VERBS = [
  "built",
  "led",
  "designed",
  "shipped",
  "implemented",
  "created",
  "improved",
  "reduced",
  "increased",
  "launched",
  "automated",
  "migrated",
  "fixed",
  "analyzed",
  "coordinated",
  "owned",
  "tested",
  "debugged",
  "optimized",
  "delivered",
  "rewrote",
  "introduced",
  "measured",
  "mentored",
  "negotiated",
];

const OUTCOME_WORDS = [
  "result",
  "impact",
  "improved",
  "reduced",
  "increased",
  "saved",
  "shipped",
  "grew",
  "cut",
  "faster",
  "conversion",
  "retention",
  "revenue",
  "users",
  "customers",
  "outcome",
  "led to",
  "so that",
];

const PROBLEM_WORDS = [
  "constraint",
  "trade-off",
  "tradeoff",
  "hypothesis",
  "root cause",
  "edge case",
  "assumption",
  "experiment",
  "measure",
  "measured",
  "verified",
  "option",
  "compared",
  "because",
  "tested",
  "risk",
  "priority",
  "scope",
];

const FILLERS = ["um", "uh", "like", "you know", "basically", "actually", "kind of", "sort of", "i guess"];

const HEDGES = ["maybe", "probably", "i think", "not sure", "just", "a little", "hopefully", "i feel like"];

const STAR_MARKERS = [
  "situation",
  "task",
  "action",
  "result",
  "when",
  "because",
  "so",
  "then",
  "finally",
  "first",
  "after",
  "challenge",
  "outcome",
  "impact",
];

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "was",
  "were",
  "i",
  "you",
  "we",
  "my",
  "our",
  "how",
  "what",
  "why",
  "when",
  "tell",
  "me",
  "about",
  "that",
  "this",
  "it",
  "do",
  "did",
  "does",
  "would",
  "could",
  "should",
  "your",
  "their",
  "they",
  "have",
  "has",
  "had",
  "be",
  "been",
  "from",
  "at",
  "as",
  "by",
]);

function metricsCount(text: string): number {
  const matches = text.match(
    /\b\d+(?:[.,]\d+)?\s?%|\$\s?\d+(?:[.,]\d+)?|\b\d+\s?(?:users|people|customers|hours|days|weeks|months|years|x|times|percent|ms|seconds|minutes)\b/gi,
  );
  return matches ? matches.length : 0;
}

function starHits(text: string): number {
  const lower = text.toLowerCase();
  return STAR_MARKERS.reduce((count, marker) => count + (lower.includes(marker) ? 1 : 0), 0);
}

function relevanceScore(question: string, answer: string): number {
  const tokens = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3 && !STOPWORDS.has(token));
  if (!tokens.length) return 0.4;
  const lower = answer.toLowerCase();
  const hits = tokens.filter((token) => lower.includes(token)).length;
  return clamp(hits / Math.min(tokens.length, 6), 0, 1);
}

function bestSentence(answer: string, markers: string[], preferNumbers = false): string {
  const sentences = splitSentences(answer);
  if (!sentences.length) return truncate(answer, 180) || "No evidence captured.";
  let best = sentences[0];
  let bestScore = -1;
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let score = 0;
    for (const marker of markers) if (lower.includes(marker)) score += 2;
    if (preferNumbers && /\d/.test(sentence)) score += 3;
    if (ANSWER_VERB_TEST.test(lower)) score += 1;
    if (sentence.length > 120) score -= 1;
    if (score > bestScore) {
      bestScore = score;
      best = sentence;
    }
  }
  return truncate(best, 220);
}

const ANSWER_VERB_TEST = new RegExp(`\\b(${ACTION_VERBS.join("|")})\\b`, "i");

interface TurnScores {
  communication: number;
  roleKnowledge: number;
  problemSolving: number;
  answerQuality: number;
  overall: number;
  metrics: number;
  actionHits: number;
  outcomeHits: number;
  signalHits: number;
  skillHits: number;
  fillerHits: number;
  hedgeHits: number;
  relevance: number;
  words: number;
  sentences: number;
  star: number;
}

function scoreTurn(turn: InterviewTurn, setup: InterviewSetup): TurnScores {
  const answer = turn.answer ?? "";
  const lower = answer.toLowerCase();
  const words = wordCount(answer);
  const sentences = splitSentences(answer);
  const sentenceCount = Math.max(1, sentences.length);
  const metrics = metricsCount(answer);
  const actionHits = countMatches(lower, ACTION_VERBS);
  const outcomeHits = countMatches(lower, OUTCOME_WORDS);
  const signalHits = (turn.signals ?? []).filter((signal) => lower.includes(signal.toLowerCase())).length;
  const roleSkills = roleById(setup.role).skills;
  const skillHits = roleSkills.filter((skill) => lower.includes(skill.toLowerCase())).length;
  const fillerHits = countMatches(lower, FILLERS);
  const hedgeHits = countMatches(lower, HEDGES);
  const problemHits = countMatches(lower, PROBLEM_WORDS);
  const star = starHits(answer);
  const relevance = relevanceScore(turn.question, answer);
  const avgSentence = words / sentenceCount;
  const lengthBonus = words >= 120 ? 12 : words >= 70 ? 9 : words >= 40 ? 5 : words >= 20 ? 2 : 0;

  const communication = clamp(
    50 +
      lengthBonus +
      Math.min(star, 8) * 1.5 +
      Math.min(outcomeHits, 4) * 2 +
      (avgSentence >= 8 && avgSentence <= 26 ? 5 : avgSentence > 34 ? -4 : 0) -
      Math.min(fillerHits, 4) * 2.5 -
      Math.min(hedgeHits, 4) * 2,
    30,
    95,
  );

  const roleKnowledge = clamp(
    42 +
      Math.min(signalHits, 8) * 5 +
      Math.min(skillHits, 4) * 2.5 +
      Math.min(problemHits, 5) * 2 +
      lengthBonus -
      (words < 20 ? 10 : 0),
    28,
    96,
  );

  const problemSolving = clamp(
    44 +
      Math.min(problemHits, 7) * 4 +
      Math.min(metrics, 3) * 3 +
      Math.min(signalHits, 5) * 3 +
      (/\btrade-?off\b/i.test(lower) ? 6 : 0) +
      (/\bconstraint|edge case|root cause\b/i.test(lower) ? 5 : 0) +
      lengthBonus * 0.5 -
      (words < 18 ? 9 : 0),
    30,
    95,
  );

  const answerQuality = clamp(
    40 +
      relevance * 18 +
      Math.min(metrics, 4) * 4 +
      Math.min(outcomeHits, 3) * 3 +
      Math.min(actionHits, 5) * 1.5 +
      Math.min(star, 5) * 1.2 +
      lengthBonus * 0.6 -
      Math.min(fillerHits, 4) * 1.5 -
      (words < 15 ? 10 : 0),
    28,
    96,
  );

  const overall = Math.round(
    communication * 0.25 + roleKnowledge * 0.3 + problemSolving * 0.25 + answerQuality * 0.2,
  );

  return {
    communication: Math.round(communication),
    roleKnowledge: Math.round(roleKnowledge),
    problemSolving: Math.round(problemSolving),
    answerQuality: Math.round(answerQuality),
    overall,
    metrics,
    actionHits,
    outcomeHits,
    signalHits,
    skillHits,
    fillerHits,
    hedgeHits,
    relevance,
    words,
    sentences: sentences.length,
    star,
  };
}

function dimensionNote(key: DimensionKey, score: number, s: TurnScores): string {
  if (key === "communication") {
    if (score >= 80) return "Clear structure and a visible result; easy to follow under pressure.";
    if (s.fillerHits + s.hedgeHits > 1) return "The content is there, but filler and hedging weaken the delivery. Cut 'like', 'just' and 'I think'.";
    return "Structure the answer aloud: situation, the decision you owned, then the result.";
  }
  if (key === "roleKnowledge") {
    if (score >= 80) return "Role-relevant vocabulary and depth, with concrete choices rather than buzzwords.";
    if (s.signalHits < 2) return "Name the specific methods, tools or trade-offs a hiring manager would expect for this role.";
    return "Go one level deeper: explain why your choice beat the alternative.";
  }
  if (key === "problemSolving") {
    if (score >= 80) return "Constraints, alternatives and verification all appear in the answer.";
    if (!s.metrics) return "Add the constraint you were under and how you checked the fix worked.";
    return "Show the option you rejected. That is where problem-solving signal lives.";
  }
  if (score >= 80) return "Specific, relevant and backed by measurable evidence.";
  if (s.metrics === 0) return "Replace adjectives with one number: time saved, users affected, error rate, conversion.";
  if (s.star < 3) return "Anchor the story in time and context, then land the outcome in the final sentence.";
  return "Tighten the close so the result is the last thing the interviewer hears.";
}

function buildFeedback(turn: InterviewTurn, setup: InterviewSetup): { feedback: AnswerFeedback; scores: TurnScores } {
  const scores = scoreTurn(turn, setup);
  const strengths: string[] = [];
  const improve: string[] = [];

  if (scores.actionHits >= 2) strengths.push("Uses concrete action verbs instead of describing intentions.");
  if (scores.metrics > 0) strengths.push(`Quantifies the outcome (${scores.metrics} measurable detail${scores.metrics === 1 ? "" : "s"}).`);
  if (scores.signalHits >= 3) strengths.push("Hits the role-specific signals the question was probing for.");
  if (scores.words >= 70 && scores.words <= 220) strengths.push("Long enough to show context without losing the thread.");
  if (scores.relevance >= 0.5) strengths.push("Stays on the question rather than drifting into a generic story.");

  if (scores.metrics === 0) improve.push("Add one measurable result: before → after, or time saved.");
  if (scores.fillerHits + scores.hedgeHits > 1) improve.push("Remove filler and hedges; they make a strong answer sound unsure.");
  if (scores.words < 35) improve.push("Give the interviewer enough context to evaluate the decision, not just the outcome.");
  if (scores.signalHits < 2) improve.push("Name the specific method or trade-off the role would expect.");
  if (scores.star < 3) improve.push("Use a STAR shape so the story has a beginning and a result.");
  if (scores.problemSolving < 65) improve.push("State the constraint and one alternative you rejected.");

  const summary =
    scores.words < 15
      ? "Too thin to assess. Give one real example with an action you owned and a result."
      : scores.overall >= 78
        ? "Specific, structured and credible. Keep the context short and the result visible."
        : scores.overall >= 62
          ? "The substance is there; the close needs evidence. Land one number or trade-off."
          : "The answer stays abstract. Anchor it in one situation, your action, and a result.";

  return {
    feedback: {
      score: scores.overall,
      label: bandFor(scores.overall),
      summary,
      strengths: unique(strengths).slice(0, 3).length
        ? unique(strengths).slice(0, 3)
        : ["You engaged with the question directly."],
      improve: unique(improve).slice(0, 3).length
        ? unique(improve).slice(0, 3)
        : ["Keep this answer and tighten the final result sentence."],
    },
    scores,
  };
}

export function evaluateTurn(turn: InterviewTurn, setup: InterviewSetup): AnswerFeedback {
  return buildFeedback(turn, setup).feedback;
}

function aggregateDimensions(turns: InterviewTurn[], setup: InterviewSetup): DimensionScore[] {
  const weights: Record<DimensionKey, number> = {
    communication: 0.25,
    roleKnowledge: 0.3,
    problemSolving: 0.25,
    answerQuality: 0.2,
  };
  const labels: Record<DimensionKey, string> = {
    communication: "Communication",
    roleKnowledge: "Role knowledge",
    problemSolving: "Problem solving",
    answerQuality: "Answer quality",
  };
  const scored = turns.map((turn) => ({ turn, scores: scoreTurn(turn, setup) }));
  const weightedAverage = (key: DimensionKey) => {
    const totalWords = scored.reduce((sum, item) => sum + Math.max(item.scores.words, 12), 0);
    const value = scored.reduce(
      (sum, item) => sum + item.scores[key] * Math.max(item.scores.words, 12),
      0,
    );
    return Math.round(value / Math.max(totalWords, 1));
  };

  const evidenceFor = (key: DimensionKey): string => {
    if (key === "communication") {
      const sorted = [...turns].sort((a, b) => wordCount(b.answer) - wordCount(a.answer));
      return bestSentence(sorted[0]?.answer ?? "", [...ACTION_VERBS, "because", "so", "then"]);
    }
    if (key === "roleKnowledge") {
      const sorted = [...turns].sort((a, b) => scoreTurn(b, setup).signalHits - scoreTurn(a, setup).signalHits);
      return bestSentence(sorted[0]?.answer ?? "", sorted[0]?.signals ?? []);
    }
    if (key === "problemSolving") {
      const sorted = [...turns].sort((a, b) => scoreTurn(b, setup).problemSolving - scoreTurn(a, setup).problemSolving);
      return bestSentence(sorted[0]?.answer ?? "", PROBLEM_WORDS, true);
    }
    const sorted = [...turns].sort((a, b) => scoreTurn(b, setup).answerQuality - scoreTurn(a, setup).answerQuality);
    return bestSentence(sorted[0]?.answer ?? "", OUTCOME_WORDS, true);
  };

  return (Object.keys(weights) as DimensionKey[]).map((key) => {
    const score = weightedAverage(key);
    const combined = scored.reduce(
      (acc, item) => {
        acc.metrics += item.scores.metrics;
        acc.actionHits += item.scores.actionHits;
        acc.outcomeHits += item.scores.outcomeHits;
        acc.signalHits += item.scores.signalHits;
        acc.skillHits += item.scores.skillHits;
        acc.fillerHits += item.scores.fillerHits;
        acc.hedgeHits += item.scores.hedgeHits;
        acc.relevance += item.scores.relevance;
        acc.words += item.scores.words;
        acc.sentences += item.scores.sentences;
        return acc;
      },
      {
        metrics: 0,
        actionHits: 0,
        outcomeHits: 0,
        signalHits: 0,
        skillHits: 0,
        fillerHits: 0,
        hedgeHits: 0,
        relevance: 0,
        words: 0,
        sentences: 0,
      },
    );
    const synthetic: TurnScores = {
      ...combined,
      communication: 0,
      roleKnowledge: 0,
      problemSolving: 0,
      answerQuality: 0,
      overall: 0,
      star: 0,
      relevance: combined.relevance / Math.max(turns.length, 1),
    };
    return {
      key,
      label: labels[key],
      score,
      evidence: evidenceFor(key),
      note: dimensionNote(key, score, synthetic),
      weight: weights[key],
    };
  });
}

function buildStrengths(
  dimensions: DimensionScore[],
  turns: InterviewTurn[],
  setup: InterviewSetup,
): string[] {
  const scores = turns.map((turn) => scoreTurn(turn, setup));
  const metrics = scores.reduce((sum, item) => sum + item.metrics, 0);
  const top = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const strengths: string[] = [];

  if (top) strengths.push(`${top.label} is your strongest signal at ${top.score}/100.`);
  if (metrics > 0) strengths.push(`${metrics} measurable detail${metrics === 1 ? "" : "s"} showed up across your answers.`);
  if (scores.some((item) => item.actionHits >= 2)) strengths.push("You describe what you did, not only what the team did.");
  if (scores.some((item) => item.star >= 5)) strengths.push("At least one answer already has a complete story arc.");
  if (turns.length >= 5) strengths.push("You sustained a full five-question session without dropping the thread.");
  if (strengths.length < 3) strengths.push("You engaged with every question and gave enough material to coach.");
  return unique(strengths).slice(0, 3);
}

function buildImprovements(dimensions: DimensionScore[], turns: InterviewTurn[], setup: InterviewSetup): string[] {
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const scores = turns.map((turn) => scoreTurn(turn, setup));
  const metrics = scores.reduce((sum, item) => sum + item.metrics, 0);
  const fillers = scores.reduce((sum, item) => sum + item.fillerHits + item.hedgeHits, 0);
  const improvements: string[] = [];

  if (weakest) improvements.push(`${weakest.label} is the fastest lift: ${weakest.note}`);
  if (metrics < 2) improvements.push("Give every story one number. 'Faster' is a claim; '40% faster' is evidence.");
  if (fillers > 2) improvements.push("Cut filler and hedging. It costs you more than a short pause would.");
  if (turns.some((turn) => wordCount(turn.answer) < 30)) {
    improvements.push("At least one answer was too short to evaluate. Aim for 5–7 sentences.");
  }
  if (scores.every((item) => item.problemSolving < 70)) {
    improvements.push("Add the constraint and the rejected alternative so your reasoning is visible.");
  }
  if (improvements.length < 3) {
    improvements.push("Close each answer with the result, then stop. Do not trail off into another story.");
  }
  return unique(improvements).slice(0, 3);
}

function buildPractice(dimensions: DimensionScore[], turns: InterviewTurn[], setup: InterviewSetup): PracticeAction[] {
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const lowestTurn = [...turns].sort((a, b) => scoreTurn(a, setup).overall - scoreTurn(b, setup).overall)[0];
  const actions: PracticeAction[] = [
    {
      title: "Rebuild your weakest answer",
      detail: `Re-answer "${truncate(lowestTurn?.question ?? "the hardest question", 90)}" in 90 seconds: one sentence of context, three sentences of action, one result.`,
      minutes: 8,
    },
    {
      title: "Add evidence to every story",
      detail: "Take three answers and add a number to each: time saved, users affected, error rate, conversion, or cost. Use [X] if you need to look it up.",
      minutes: 10,
    },
  ];

  if (weakest?.key === "roleKnowledge") {
    actions.push({
      title: "Name one trade-off out loud",
      detail: `For ${setup.role}, write down two technical choices and the trade-off you accepted. Practice saying each in 20 seconds.`,
      minutes: 7,
    });
  } else if (weakest?.key === "communication") {
    actions.push({
      title: "The 60-second drill",
      detail: "Record three answers with a timer. If you pass 75 seconds, restart and cut the background, not the result.",
      minutes: 6,
    });
  } else if (weakest?.key === "problemSolving") {
    actions.push({
      title: "Constraint-first drill",
      detail: "Before answering, say the constraint, then two options, then why you chose one. Do it for three questions.",
      minutes: 9,
    });
  } else {
    actions.push({
      title: "Result-first close",
      detail: "Rewrite the final sentence of three answers so the measurable result is the last thing the interviewer hears.",
      minutes: 6,
    });
  }

  return actions;
}

function buildStarBlueprint(turns: InterviewTurn[]): StarBlueprint {
  const richest = [...turns].sort((a, b) => wordCount(b.answer) - wordCount(a.answer))[0];
  const answer = richest?.answer ?? "";
  const sentences = splitSentences(answer);
  const resultSentence = bestSentence(answer, OUTCOME_WORDS, true);
  const actionSentence = bestSentence(answer, ACTION_VERBS);
  return {
    situation:
      sentences[0] && sentences[0].length > 25
        ? truncate(sentences[0], 180)
        : "Set the scene in one sentence: where, when, and the constraint you were under.",
    task: "Name what you specifically owned. Use 'I', not 'we', for the decision.",
    action: actionSentence !== "No evidence captured." ? truncate(actionSentence, 180) : "Describe two concrete actions you took. Keep the sequence.",
    result:
      resultSentence !== "No evidence captured." && /\d/.test(resultSentence)
        ? truncate(resultSentence, 180)
        : "Add the measurable result: what changed, by how much, and why it mattered.",
  };
}

export function buildReport(
  sessionId: string,
  setup: InterviewSetup,
  turns: InterviewTurn[],
): InterviewReport {
  const clean = turns.filter((turn) => turn.answer.trim().length > 0);
  const dimensions = aggregateDimensions(clean, setup);
  const overall = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0),
  );
  const answeredMain = clean.filter((turn) => !turn.isFollowUp).length;
  const answeredWords = clean.reduce((sum, turn) => sum + wordCount(turn.answer), 0);
  const metrics = clean.reduce((sum, turn) => sum + scoreTurn(turn, setup).metrics, 0);
  const strongest = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const band = bandFor(overall);

  const summary = clean.length
    ? `Your practice estimate is ${overall}/100 (${band.toLowerCase()}). ${strongest?.label} is the strongest signal (${strongest?.score}); ${weakest?.label} is the fastest lift (${weakest?.score}). Across ${answeredMain} question${answeredMain === 1 ? "" : "s"} and ${answeredWords} words, you used ${metrics} measurable detail${metrics === 1 ? "" : "s"}. ${metrics < 2 ? "Add at least one number to each story before your next attempt." : "Keep the evidence and tighten the close."}`
    : "No answers were captured, so there is nothing to score yet. Start a session and answer at least one question.";

  const perQuestion: QuestionFeedback[] = clean.map((turn) => {
    const { feedback } = buildFeedback(turn, setup);
    return {
      question: turn.isFollowUp ? `Follow-up: ${turn.question}` : turn.question,
      answer: turn.answer,
      score: feedback.score,
      note: feedback.summary,
    };
  });

  return {
    sessionId,
    generatedAt: Date.now(),
    setup,
    overall,
    band,
    summary,
    dimensions,
    perQuestion,
    strengths: buildStrengths(dimensions, clean, setup),
    improvements: buildImprovements(dimensions, clean, setup),
    nextPractice: buildPractice(dimensions, clean, setup),
    starBlueprint: buildStarBlueprint(clean),
    answeredWords,
    source: "local",
  };
}

export function shouldFollowUp(turns: InterviewTurn[], current: InterviewTurn, totalFollowUps: number): boolean {
  if (current.isFollowUp) return false;
  if (totalFollowUps >= 2) return false;
  const words = wordCount(current.answer);
  if (words < 28) {
    const refusal = /\b(i don'?t know|no idea|not sure|can'?t think)\b/i.test(current.answer);
    return !refusal;
  }
  return false;
}

export interface AiTurnEvaluation extends AnswerFeedback {
  needsFollowUp: boolean;
  followUpProbe?: string;
}

export async function evaluateTurnAi(
  turn: InterviewTurn,
  setup: InterviewSetup,
  totalFollowUps: number,
): Promise<AiTurnEvaluation | null> {
  const role = setup.role || "Software Engineer";
  const level = setup.level || "Mid level";
  const question = turn.question;
  const answer = turn.answer;

  const prompt = `You are an elite technical & behavioral interview evaluator. Evaluate this candidate turn for a ${level} ${role} role.

Question: "${question}"
Candidate Answer: "${answer}"
${turn.competency ? `Target Competency: ${turn.competency}` : ""}
${turn.signals?.length ? `Key Signals to look for: ${turn.signals.join(", ")}` : ""}

Evaluate the answer objectively on:
1. Relevance to the question
2. Depth of technical/behavioral reasoning
3. STAR method structure & quantified impact
4. Clarity and communication

Decide if a follow-up probing question is warranted. A follow-up IS warranted if:
- The answer is thin (< 40 words) or vague
- The candidate made an unverified high-impact claim or technical assertion that needs depth
- The candidate described a situation and action but omitted the quantifiable result
(Note: Do NOT request a follow-up if candidate answered thoroughly or if they stated they do not know).

Respond ONLY with valid JSON matching this schema:
{
  "score": <number 0-100>,
  "label": <"Needs work" | "Fair start" | "Promising" | "Strong answer" | "Exceptional">,
  "summary": <concise 1-2 sentence overall feedback>,
  "strengths": [<2-3 specific bullet points praising what the candidate actually said>],
  "improve": [<1-2 specific, actionable improvements for this answer>],
  "needsFollowUp": <boolean>,
  "followUpProbe": <string or null; a sharp, context-aware 1-sentence follow-up question probing their specific claim>
}`;

  try {
    const res = await callLlmJson<{
      score: number;
      label: string;
      summary: string;
      strengths: string[];
      improve: string[];
      needsFollowUp: boolean;
      followUpProbe?: string | null;
    }>(prompt, "You are a senior hiring bar raiser. Respond only with valid JSON.", {
      maxTokens: 500,
      timeoutMs: 6500,
      temperature: 0.2,
    });

    if (!res?.data) return null;

    const data = res.data;
    const score = clamp(Math.round(Number(data.score) || 60), 10, 98);
    const label =
      typeof data.label === "string" && data.label
        ? data.label
        : score >= 85
          ? "Strong answer"
          : score >= 70
            ? "Promising"
            : score >= 50
              ? "Fair start"
              : "Needs work";

    const canFollowUp = !turn.isFollowUp && totalFollowUps < 2;

    return {
      score,
      label,
      summary: truncate(String(data.summary || ""), 240) || "Evaluated answer.",
      strengths: Array.isArray(data.strengths)
        ? data.strengths.slice(0, 3).map((s) => truncate(String(s), 140))
        : ["Engaged with the question."],
      improve: Array.isArray(data.improve)
        ? data.improve.slice(0, 2).map((s) => truncate(String(s), 140))
        : ["Provide more measurable outcomes."],
      needsFollowUp: canFollowUp && Boolean(data.needsFollowUp),
      followUpProbe:
        canFollowUp && typeof data.followUpProbe === "string" && data.followUpProbe.trim().length > 10
          ? truncate(data.followUpProbe.trim(), 200)
          : undefined,
    };
  } catch (err) {
    console.warn("[interview/engine] evaluateTurnAi failed:", (err as Error).message);
    return null;
  }
}

export async function buildReportAi(
  sessionId: string,
  setup: InterviewSetup,
  turns: InterviewTurn[],
): Promise<InterviewReport | null> {
  const clean = turns.filter((turn) => turn.answer.trim().length > 0);
  if (!clean.length) return null;

  const role = setup.role || "Software Engineer";
  const level = setup.level || "Mid level";

  const transcript = clean
    .map((turn, i) => `Q${i + 1} (${turn.isFollowUp ? "Follow-Up" : "Main"}): "${turn.question}"\nAnswer: "${turn.answer}"`)
    .join("\n\n");

  const prompt = `You are a principal hiring manager conducting an in-depth post-interview evaluation for a candidate interviewing for ${level} ${role}.

Here is the complete interview transcript:
${transcript}

Evaluate the entire session across the 4 standard rubrics:
1. Communication (weight 0.25)
2. Role knowledge (weight 0.30)
3. Problem solving (weight 0.25)
4. Answer quality (weight 0.20)

For each rubric dimension:
- Provide an objective score (0-100).
- Extract an EXACT VERBATIM quote from the candidate's answers as evidence (or empty if no evidence found).
- Provide a concise note explaining the score.

Also generate:
- Overall score (0-100) and performance band ("Developing", "Emerging", "Proficient", "Advanced", or "Mastery")
- 2-3 sentence executive summary
- Per-question scores (0-100) and 1-sentence note for each question in the transcript
- 3 overarching candidate strengths with specific references to what was said
- 3 priority improvement areas
- 3 actionable practice exercises (each with title, detail, minutes)
- Reconstruct the STAR blueprint from the candidate's best story (situation, task, action, result)

Respond ONLY with valid JSON matching this schema:
{
  "overall": <number 0-100>,
  "band": <"Developing" | "Emerging" | "Proficient" | "Advanced" | "Mastery">,
  "summary": <string>,
  "dimensions": {
    "communication": { "score": <0-100>, "evidence": <verbatim quote>, "note": <string> },
    "roleKnowledge": { "score": <0-100>, "evidence": <verbatim quote>, "note": <string> },
    "problemSolving": { "score": <0-100>, "evidence": <verbatim quote>, "note": <string> },
    "answerQuality": { "score": <0-100>, "evidence": <verbatim quote>, "note": <string> }
  },
  "perQuestion": [
    { "score": <0-100>, "note": <string> }
  ],
  "strengths": [<string>, <string>, <string>],
  "improvements": [<string>, <string>, <string>],
  "nextPractice": [
    { "title": <string>, "detail": <string>, "minutes": <number> }
  ],
  "starBlueprint": {
    "situation": <string>,
    "task": <string>,
    "action": <string>,
    "result": <string>
  }
}`;

  try {
    const res = await callLlmJson<{
      overall: number;
      band: string;
      summary: string;
      dimensions: Record<DimensionKey, { score: number; evidence: string; note: string }>;
      perQuestion: { score: number; note: string }[];
      strengths: string[];
      improvements: string[];
      nextPractice: { title: string; detail: string; minutes: number }[];
      starBlueprint: StarBlueprint;
    }>(prompt, "You are an elite interview auditor. Respond only with valid JSON.", {
      maxTokens: 1400,
      timeoutMs: 14_000,
      temperature: 0.25,
    });

    if (!res?.data) return null;
    const data = res.data;

    const weights: Record<DimensionKey, number> = {
      communication: 0.25,
      roleKnowledge: 0.3,
      problemSolving: 0.25,
      answerQuality: 0.2,
    };

    const labels: Record<DimensionKey, string> = {
      communication: "Communication",
      roleKnowledge: "Role knowledge",
      problemSolving: "Problem solving",
      answerQuality: "Answer quality",
    };

    const dimensions: DimensionScore[] = (Object.keys(weights) as DimensionKey[]).map((key) => {
      const dim = data.dimensions?.[key];
      const score = clamp(Math.round(Number(dim?.score) || 65), 10, 98);
      return {
        key,
        label: labels[key],
        score,
        evidence: truncate(String(dim?.evidence || "Demonstrated in answers."), 240),
        note: truncate(String(dim?.note || "Solid candidate performance."), 200),
        weight: weights[key],
      };
    });

    const calculatedOverall = Math.round(
      dimensions.reduce((sum, d) => sum + d.score * d.weight, 0),
    );
    const overall = clamp(Math.round(Number(data.overall) || calculatedOverall), 10, 98);
    const band = bandFor(overall);

    const perQuestion: QuestionFeedback[] = clean.map((turn, i) => {
      const qEval = data.perQuestion?.[i];
      const score = clamp(Math.round(Number(qEval?.score) || 68), 10, 98);
      const note = truncate(String(qEval?.note || "Addressed the prompt directly."), 200);
      return {
        question: turn.isFollowUp ? `Follow-up: ${turn.question}` : turn.question,
        answer: turn.answer,
        score,
        note,
      };
    });

    const answeredWords = clean.reduce((sum, turn) => sum + wordCount(turn.answer), 0);

    return {
      sessionId,
      generatedAt: Date.now(),
      setup,
      overall,
      band,
      summary: truncate(String(data.summary || ""), 360),
      dimensions,
      perQuestion,
      strengths: Array.isArray(data.strengths)
        ? data.strengths.slice(0, 3).map((s) => truncate(String(s), 160))
        : ["Clear articulation of technical concepts."],
      improvements: Array.isArray(data.improvements)
        ? data.improvements.slice(0, 3).map((s) => truncate(String(s), 160))
        : ["Add more quantifiable results to story conclusions."],
      nextPractice: Array.isArray(data.nextPractice) && data.nextPractice.length
        ? data.nextPractice.slice(0, 3).map((p) => ({
            title: truncate(String(p.title || "Practice drill"), 80),
            detail: truncate(String(p.detail || "Refine your stories."), 180),
            minutes: clamp(Math.round(Number(p.minutes) || 8), 2, 45),
          }))
        : buildPractice(dimensions, clean, setup),
      starBlueprint: {
        situation: truncate(String(data.starBlueprint?.situation || "Context established."), 200),
        task: truncate(String(data.starBlueprint?.task || "Role and ownership stated."), 200),
        action: truncate(String(data.starBlueprint?.action || "Key technical decisions explained."), 200),
        result: truncate(String(data.starBlueprint?.result || "Measurable outcome achieved."), 200),
      },
      answeredWords,
      source: "ai",
    };
  } catch (err) {
    console.warn("[interview/engine] buildReportAi failed:", (err as Error).message);
    return null;
  }
}
