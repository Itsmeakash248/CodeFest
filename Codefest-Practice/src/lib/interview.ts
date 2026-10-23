import {
  DIFFICULTIES,
  INTERVIEW_TYPES,
  LEVELS,
  ROLES,
  RUBRIC,
  RUBRIC_BY_KEY,
  type Difficulty,
  type DimensionKey,
  type InterviewType,
  type Level,
  type RoleId,
} from "@/lib/content";

export type Setup = {
  role: RoleId;
  roleLabel: string;
  level: Level;
  type: InterviewType;
  difficulty: Difficulty;
  resume?: string;
};

export type Question = {
  id: string;
  text: string;
  dimension: DimensionKey;
  isFollowUp?: boolean;
  hint?: string;
};

export type Turn = {
  question: Question;
  answer: string;
};

export type DimensionResult = {
  key: DimensionKey;
  label: string;
  score: number;
  rationale: string;
  evidence: string[];
};

export type Report = {
  overall: number;
  summary: string;
  dimensions: DimensionResult[];
  strengths: string[];
  gaps: string[];
  nextPractice: string[];
  blueprint: string;
  source: "ai" | "local";
};

export type NextResult = {
  question?: Question;
  done: boolean;
  source: "ai" | "local";
};

export const MAX_MAIN_QUESTIONS = 5;

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const words = (value: string) =>
  clean(value).split(" ").filter(Boolean).length;

export function resolveRole(role: RoleId, customLabel?: string) {
  const preset = ROLES.find((r) => r.id === role) ?? ROLES[ROLES.length - 1];
  return {
    id: preset.id,
    label:
      preset.id === "custom"
        ? clean(customLabel || "Target role") || "Target role"
        : preset.label,
    keywords: preset.keywords,
  };
}

/* ------------------------------------------------------------------ */
/*  Question banks                                                     */
/* ------------------------------------------------------------------ */

const BEHAVIORAL = [
  "Tell me about a time you delivered a project as a {role} under a tight deadline. What did you do, and what was the result?",
  "Describe a disagreement you had with a teammate about a decision in your {role} work. How did you resolve it?",
  "Tell me about a mistake you made in a project as a {role}. What did you change afterwards?",
  "Give an example of a time you had to learn something quickly for a {role} task.",
  "Describe a time you had to prioritise competing requests. How did you decide what to do first?",
  "Tell me about a time you received tough feedback on your work. What did you do with it?",
  "Describe a project you are proud of. What was your specific contribution, not the team's?",
  "Tell me about a time you had to influence someone without authority.",
];

const TECHNICAL: Record<Exclude<RoleId, "custom">, string[]> = {
  frontend: [
    "Walk me through how you would diagnose a React page that re-renders on every keystroke.",
    "How would you make a data-heavy dashboard fast and accessible on a low-end laptop?",
    "Explain how you would design a component library that stays consistent across several teams.",
    "How do you decide between server components, client components, and API routes in Next.js?",
    "Describe how you would debug a layout shift that only appears on mobile.",
    "How would you handle authentication and protected routes in a Next.js application?",
    "Explain event delegation and a case where it measurably helps.",
    "How would you test a checkout flow end to end without making the suite flaky?",
  ],
  backend: [
    "Design an API for scheduling interview sessions that must survive client retries.",
    "How would you diagnose a p95 latency spike in a Node service?",
    "Explain how you would model users, sessions, and answers in a relational database.",
    "How do you prevent duplicate writes when a client retries a request?",
    "Walk me through adding rate limiting to a public endpoint.",
    "How would you store and rotate API keys safely?",
    "Describe how you would add observability to a background job.",
    "How would you migrate a database schema with zero downtime?",
  ],
  data: [
    "How would you measure whether an interview-practice product is improving candidate outcomes?",
    "Walk me through cleaning a messy CSV of session events before analysis.",
    "How would you detect whether a drop in completed sessions is real or seasonal?",
    "Explain the dashboard you would build for a coaching team.",
    "How do you choose between a cohort analysis and an A/B test?",
    "What SQL would you write to find users who started but never finished a session?",
    "How would you handle missing data in a scoring model?",
    "How do you communicate an uncertain result to non-technical stakeholders?",
  ],
  product: [
    "How would you decide which interview feature to build next?",
    "Define the success metrics for ViewPilot's first month.",
    "How would you investigate a drop in session completion?",
    "Describe a trade-off between personalisation and privacy in this product.",
    "How would you run a discovery interview with a student?",
    "Prioritise voice mode, resume parsing, and progress tracking. Explain your order.",
    "How would you position ViewPilot against generic question banks?",
    "What evidence would make you kill a feature you championed?",
  ],
};

const TECHNICAL_GENERIC = [
  "Pick a project on your resume and walk me through the hardest technical decision you made.",
  "How do you decide when a solution is good enough to ship versus when it needs more work?",
  "Describe a bug that took you unusually long to find. How did you isolate it?",
  "How would you explain a complex trade-off in your field to a non-specialist?",
  "Walk me through how you would review another person's work in this role.",
  "What is a tool or technique you rely on, and what are its limits?",
  "How do you keep your skills current without chasing every new trend?",
  "Tell me about a time you had to work with incomplete requirements.",
];

const SYSTEM_DESIGN = [
  "Design a mock-interview platform that can serve 10,000 concurrent sessions. Start with the core request flow.",
  "How would you design the evaluation pipeline so reports stay consistent and auditable?",
  "Design a resume-aware question generator without leaking personal data.",
  "How would you store session transcripts and support deletion on request?",
  "Design a fallback path for when the language model is slow or unavailable.",
  "How would you add voice interviews without breaking the text-first flow?",
  "Design an analytics pipeline for rubric scores over time.",
  "How would you protect the system against prompt injection from resume text?",
];

function roleTechnical(role: RoleId) {
  return role === "custom" ? TECHNICAL_GENERIC : TECHNICAL[role];
}

function orderForDifficulty<T>(items: T[], difficulty: Difficulty): T[] {
  if (items.length < 5) return items;
  if (difficulty === "Warm-up") {
    return [items[0], items[2], items[4], items[1], items[3], ...items.slice(5)];
  }
  if (difficulty === "Stretch") {
    const reversed = [...items].reverse();
    return [reversed[0], items[5] ?? reversed[1], reversed[1], items[6] ?? reversed[2], reversed[2]];
  }
  return items;
}

function pickType(setup: Setup, mainIndex: number): InterviewType {
  if (setup.type !== "Mixed") return setup.type;
  const loop: InterviewType[] = [
    "Behavioral",
    "Technical",
    "Behavioral",
    "System Design",
    "Technical",
  ];
  return loop[mainIndex % loop.length];
}

function bankFor(setup: Setup, type: InterviewType): string[] {
  if (type === "Behavioral") return BEHAVIORAL;
  if (type === "System Design") return SYSTEM_DESIGN;
  return roleTechnical(setup.role);
}

function dimensionFor(type: InterviewType): DimensionKey {
  if (type === "Behavioral") return "communication";
  if (type === "System Design") return "problem";
  return "role";
}

function fill(text: string, setup: Setup) {
  return text.replaceAll("{role}", setup.roleLabel);
}

export function countMainQuestions(turns: Turn[]) {
  return turns.filter((t) => !t.question.isFollowUp).length;
}

export function isThinAnswer(answer: string, setup: Setup) {
  const text = clean(answer).toLowerCase();
  const wc = words(answer);
  const hasNumber = /\d/.test(text);
  const role = resolveRole(setup.role, setup.roleLabel);
  const hasRoleWord = role.keywords.some((k) => text.includes(k));
  return wc < 26 || (!hasNumber && !hasRoleWord && wc < 45);
}

function followUpFor(setup: Setup, type: InterviewType): Question {
  const variants =
    type === "Technical"
      ? [
          "Make that concrete: which tool or trade-off did you choose, and what did you give up?",
          "What would break first if that solution had to handle ten times the load?",
          "Which assumption in your answer are you least confident about, and how would you test it?",
        ]
      : type === "System Design"
        ? [
            "What is the first component that fails under load, and how would you detect it?",
            "Which trade-off did you accept, and what would make you revisit it?",
            "What would you remove if you had to ship this in one week?",
          ]
        : [
            "Give me one concrete detail: what was the situation, what did you personally do, and what changed?",
            "What would you do differently if you ran that situation again?",
            "How did you know your action actually worked?",
          ];
  const seed = clean(setup.roleLabel).length;
  return {
    id: `follow-up-${seed}`,
    text: variants[seed % variants.length],
    dimension: dimensionFor(type),
    isFollowUp: true,
    hint: "A follow-up is a chance to add evidence, not to restart the answer.",
  };
}

export function localNext(setup: Setup, turns: Turn[], max = MAX_MAIN_QUESTIONS): NextResult {
  const mainCount = countMainQuestions(turns);
  if (mainCount >= max) return { done: true, source: "local" };

  const last = turns[turns.length - 1];
  const lastType = last ? pickType(setup, Math.max(0, mainCount - 1)) : pickType(setup, 0);
  const followUpsSoFar = turns.filter((t) => t.question.isFollowUp).length;

  if (
    last &&
    !last.question.isFollowUp &&
    followUpsSoFar < 1 &&
    turns.length < max + 1 &&
    isThinAnswer(last.answer, setup)
  ) {
    return { question: followUpFor(setup, lastType), done: false, source: "local" };
  }

  const type = pickType(setup, mainCount);
  const ordered = orderForDifficulty(bankFor(setup, type), setup.difficulty);
  const question = ordered[mainCount % ordered.length];
  return {
    question: {
      id: `${setup.role}-${type}-${mainCount}-${Date.now().toString(36)}`,
      text: fill(question, setup),
      dimension: dimensionFor(type),
    },
    done: false,
    source: "local",
  };
}

/* ------------------------------------------------------------------ */
/*  Local evaluation engine                                            */
/* ------------------------------------------------------------------ */

const FILLERS = [
  "um",
  "uh",
  "like",
  "basically",
  "kind of",
  "sort of",
  "you know",
  "i guess",
  "stuff",
  "things",
];

const STRUCTURE = [
  "first",
  "then",
  "next",
  "finally",
  "because",
  "however",
  "situation",
  "task",
  "action",
  "result",
  "impact",
  "so that",
  "as a result",
  "improved",
  "increased",
  "reduced",
  "led",
  "shipped",
  "delivered",
  "owned",
  "decided",
  "built",
  "launched",
  "saved",
];

const PROBLEM = [
  "assumption",
  "constraint",
  "trade-off",
  "tradeoff",
  "edge case",
  "edge-case",
  "step",
  "approach",
  "priority",
  "risk",
  "measure",
  "test",
  "because",
  "instead",
  "alternative",
  "scope",
  "deadline",
  "decision",
  "rejected",
];

const clamp = (n: number, min = 20, max = 97) =>
  Math.max(min, Math.min(max, Math.round(n)));

function sentences(value: string) {
  return clean(value)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24);
}

function evidenceForDimension(
  answer: string,
  setup: Setup,
  key: DimensionKey
): string[] {
  const role = resolveRole(setup.role, setup.roleLabel);
  const list = sentences(answer);
  const scored = list
    .map((s) => {
      const lower = s.toLowerCase();
      let score = 0;
      const structure = STRUCTURE.filter((k) => lower.includes(k)).length;
      const problem = PROBLEM.filter((k) => lower.includes(k)).length;
      const roleHits = role.keywords.filter((k) => lower.includes(k)).length;
      const numbers = (lower.match(/\d+(?:[.,]\d+)?%?/g) || []).length;
      const result = /result|impact|improved|reduced|increased|saved|shipped|launched|grew|cut/.test(lower);

      if (key === "communication") score = structure * 2 + (result ? 2 : 0) + (numbers ? 1 : 0);
      if (key === "role") score = roleHits * 3 + numbers * 2 + (result ? 1 : 0);
      if (key === "problem") score = problem * 3 + numbers + (structure >= 2 ? 1 : 0);
      if (key === "quality") score = numbers * 3 + (result ? 3 : 0) + roleHits;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score);
  const picks = scored.filter((x) => x.score > 0).slice(0, 2).map((x) => x.s);
  return picks.length ? picks : [clean(answer).slice(0, 180)];
}

function scoreAnswer(answer: string, setup: Setup) {
  const text = clean(answer);
  const lower = text.toLowerCase();
  const wc = words(text);
  const role = resolveRole(setup.role, setup.roleLabel);

  const structureHits = STRUCTURE.filter((k) => lower.includes(k)).length;
  const problemHits = PROBLEM.filter((k) => lower.includes(k)).length;
  const fillerHits = FILLERS.filter((k) => lower.includes(k)).length;
  const roleHits = role.keywords.filter((k) => lower.includes(k)).length;
  const numbers = (lower.match(/\d+(?:[.,]\d+)?%?/g) || []).length;
  const hasMetric = numbers > 0;
  const hasResult = /result|impact|improved|reduced|increased|saved|shipped|launched|grew|cut/.test(lower);
  const lengthFit = wc >= 45 && wc <= 220 ? 14 : wc >= 30 ? 8 : wc >= 18 ? 2 : -8;

  const communication = clamp(
    46 + structureHits * 5 + lengthFit - fillerHits * 3 + (hasResult ? 6 : 0)
  );
  const roleScore = clamp(
    44 + roleHits * 7 + (hasMetric ? 6 : 0) + (wc > 90 ? 5 : 0)
  );
  const problem = clamp(
    44 + problemHits * 6 + (numbers > 0 ? 4 : 0) + (structureHits >= 2 ? 5 : 0) + (wc > 80 ? 5 : 0)
  );
  const quality = clamp(
    46 + (hasMetric ? 12 : 0) + (hasResult ? 8 : 0) + Math.min(10, numbers * 3) + (wc > 70 ? 6 : 0) + (roleHits > 0 ? 4 : 0)
  );

  return {
    communication,
    role: roleScore,
    problem,
    quality,
    meta: {
      wc,
      structureHits,
      problemHits,
      fillerHits,
      roleHits,
      numbers,
      hasMetric,
      hasResult,
    },
  };
}

const RATIONALE: Record<DimensionKey, (n: number, meta: ReturnType<typeof scoreAnswer>["meta"]) => string> = {
  communication: (n, m) =>
    n >= 75
      ? "Clear, structured answer with a visible result. Keep it this tight."
      : m.wc < 40
        ? "The answer is too short to show structure. Use Situation → Action → Result and name the outcome."
        : "The reasoning is present but the shape is loose. Signpost the situation, your action, and the result explicitly.",
  role: (n, m) =>
    n >= 75
      ? "Strong role signal with concrete domain vocabulary and trade-offs."
      : m.roleHits === 0
        ? "No role-specific vocabulary yet. Name the tools, methods, or trade-offs a practitioner would recognise."
        : "Some role vocabulary is there. Go one level deeper on the specific trade-off you handled.",
  problem: (n, m) =>
    n >= 75
      ? "Structured problem solving with constraints or trade-offs made explicit."
      : m.problemHits < 2
        ? "State the constraint before the solution, then cover one edge case and one alternative."
        : "The approach is visible. Add the assumption you made and the edge case you checked.",
  quality: (n, m) =>
    n >= 75
      ? "Specific, evidence-led answer with a measurable result."
      : m.hasMetric
        ? "There is a number, but connect it to the result: what changed, by how much, and why it mattered."
        : "Replace hypothetical language with one concrete example, one metric, and one outcome.",
};

export function localReport(setup: Setup, turns: Turn[]): Report {
  const per = turns.map((t) => ({ turn: t, ...scoreAnswer(t.answer, setup) }));
  const avg = (key: DimensionKey) =>
    per.length
      ? clamp(per.reduce((sum, p) => sum + p[key], 0) / per.length)
      : 50;

  const scores: Record<DimensionKey, number> = {
    communication: avg("communication"),
    role: avg("role"),
    problem: avg("problem"),
    quality: avg("quality"),
  };
  const overall = clamp(
    scores.communication * 0.25 +
      scores.role * 0.25 +
      scores.problem * 0.25 +
      scores.quality * 0.25
  );

  const meta = per.reduce(
    (acc, p) => {
      acc.wc += p.meta.wc;
      acc.structureHits += p.meta.structureHits;
      acc.problemHits += p.meta.problemHits;
      acc.fillerHits += p.meta.fillerHits;
      acc.roleHits += p.meta.roleHits;
      acc.numbers += p.meta.numbers;
      acc.hasMetric = acc.hasMetric || p.meta.hasMetric;
      acc.hasResult = acc.hasResult || p.meta.hasResult;
      return acc;
    },
    {
      wc: 0,
      structureHits: 0,
      problemHits: 0,
      fillerHits: 0,
      roleHits: 0,
      numbers: 0,
      hasMetric: false,
      hasResult: false,
    }
  );

  const dimensions: DimensionResult[] = RUBRIC.map((d) => ({
    key: d.key,
    label: d.label,
    score: scores[d.key],
    rationale: RATIONALE[d.key](scores[d.key], meta),
    evidence: per
      .flatMap((p) => evidenceForDimension(p.turn.answer, setup, d.key))
      .slice(0, 3),
  }));

  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  const strengths = [
    `${top.label} is your strongest dimension — ${top.score}/100 on the practice rubric.`,
    meta.hasMetric
      ? "You used at least one concrete number, which makes the answer easier to trust."
      : "You kept the answers relevant to the questions asked.",
    meta.structureHits >= 2
      ? "You signposted the answer, so a listener can follow the thread."
      : "You gave enough context for the interviewer to follow up.",
  ];

  const gaps = [
    `${bottom.label} is the clearest next gain — ${bottom.score}/100. ${RUBRIC_BY_KEY[bottom.key].tip}`,
    meta.hasMetric
      ? "Add the baseline and the outcome for each metric, not just the number."
      : "Add one measured result (time saved, latency reduced, conversion improved).",
    meta.fillerHits > 2
      ? "Trim filler language; it slows the answer and weakens the opening."
      : "Open with the result, then support it — the first ten seconds carry the answer.",
  ];

  const nextPractice = [
    `Re-answer your weakest question using a four-line outline: situation, task, action, result.`,
    `Record a 90-second answer and cut it to 60 seconds without losing the metric.`,
    `Write down three ${setup.roleLabel.toLowerCase()} terms or trade-offs you want to use naturally next time.`,
  ];

  const blueprint = [
    `Situation — one sentence of context for a ${setup.roleLabel} ${setup.level.toLowerCase()}-level role.`,
    "Task — the specific problem you owned, not the team's.",
    "Action — two decisions you made, including one trade-off and why.",
    "Result — one metric, one outcome, and what you would change next time.",
  ].join("\n");

  const summary =
    overall >= 78
      ? `A strong practice run. ${top.label} leads at ${top.score}; ${bottom.label} is the next gain. ${RUBRIC_BY_KEY[bottom.key].tip}`
      : overall >= 60
        ? `A solid foundation. ${top.label} leads at ${top.score}; ${bottom.label} is the clearest next gain. ${RUBRIC_BY_KEY[bottom.key].tip}`
        : `This is a useful first draft. The priority is structure and evidence: make every answer a complete situation → action → result. ${RUBRIC_BY_KEY[bottom.key].tip}`;

  return {
    overall,
    summary,
    dimensions,
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    nextPractice,
    blueprint,
    source: "local",
  };
}

/* ------------------------------------------------------------------ */
/*  Sanitising AI output                                               */
/* ------------------------------------------------------------------ */

export function normalizeReport(raw: unknown, fallback: Report): Report {
  if (!raw || typeof raw !== "object") return fallback;
  const value = raw as Record<string, unknown>;
  const maybeDimensions = Array.isArray(value.dimensions) ? value.dimensions : [];

  const dimensions = RUBRIC.map((rubric) => {
    const found = maybeDimensions.find(
      (d) => d && typeof d === "object" && (d as Record<string, unknown>).key === rubric.key
    ) as Record<string, unknown> | undefined;
    const fallbackDim = fallback.dimensions.find((d) => d.key === rubric.key)!;
    const score = Number(found?.score);
    return {
      key: rubric.key,
      label: rubric.label,
      score: Number.isFinite(score) ? clamp(score) : fallbackDim.score,
      rationale:
        typeof found?.rationale === "string" && found.rationale.trim()
          ? found.rationale.trim().slice(0, 360)
          : fallbackDim.rationale,
      evidence: Array.isArray(found?.evidence)
        ? (found.evidence as unknown[])
            .filter((e): e is string => typeof e === "string" && e.trim().length > 0)
            .slice(0, 3)
        : fallbackDim.evidence,
    } satisfies DimensionResult;
  });

  const arr = (key: string, fb: string[]) => {
    const v = value[key];
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 4)
      : fb;
  };

  const overall = Number(value.overall);
  return {
    overall: Number.isFinite(overall) ? clamp(overall) : fallback.overall,
    summary:
      typeof value.summary === "string" && value.summary.trim()
        ? value.summary.trim().slice(0, 500)
        : fallback.summary,
    dimensions,
    strengths: arr("strengths", fallback.strengths),
    gaps: arr("gaps", fallback.gaps),
    nextPractice: arr("nextPractice", fallback.nextPractice),
    blueprint:
      typeof value.blueprint === "string" && value.blueprint.trim()
        ? value.blueprint.trim().slice(0, 900)
        : fallback.blueprint,
    source: "ai",
  };
}

/* ------------------------------------------------------------------ */
/*  Small client-side helpers                                          */
/* ------------------------------------------------------------------ */

export function setupIsValid(setup: Partial<Setup>): setup is Setup {
  return Boolean(
    setup.role &&
      setup.roleLabel &&
      LEVELS.some((l) => l.id === setup.level) &&
      INTERVIEW_TYPES.some((t) => t.id === setup.type) &&
      DIFFICULTIES.some((d) => d.id === setup.difficulty)
  );
}

export function defaultSetup(): Setup {
  return {
    role: "frontend",
    roleLabel: "Frontend Engineer",
    level: "Entry",
    type: "Mixed",
    difficulty: "Standard",
    resume: "",
  };
}

export function scoreTone(score: number) {
  if (score >= 78) return { label: "Strong", color: "#2eaa96" };
  if (score >= 62) return { label: "Solid", color: "#6c4de6" };
  if (score >= 48) return { label: "Developing", color: "#c9972b" };
  return { label: "Needs work", color: "#ef7a63" };
}
