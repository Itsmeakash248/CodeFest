/**
 * ViewPilot content — the single source of truth for site copy, interview
 * options and the evaluation rubric. Mirrors `docs/MoonCraft-Codefest.pptx`.
 */

export const SITE = {
  name: "ViewPilot",
  tagline: "Your AI-powered interview coach",
  promise: "Turn realistic interview practice into structured growth.",
  team: "Team Mooncraft",
  event: "CodeFest 2026",
  domain: "AI-Powered Web Applications × Job Readiness",
  repo: "https://github.com/Itsmeakash248/CodeFest",
  live: "/interview",
} as const;

export const NAV = [
  { href: "/how", label: "How it works" },
  { href: "/stack", label: "Under the hood" },
  { href: "/robot", label: "Robot backup" },
] as const;

export type RoleId = "frontend" | "backend" | "data" | "product" | "custom";

export type Role = {
  id: RoleId;
  label: string;
  short: string;
  blurb: string;
  keywords: string[];
};

export const ROLES: Role[] = [
  {
    id: "frontend",
    label: "Frontend Engineer",
    short: "Frontend",
    blurb: "React, UI systems, accessibility",
    keywords: [
      "react",
      "next",
      "javascript",
      "typescript",
      "css",
      "component",
      "render",
      "state",
      "accessibility",
      "browser",
      "api",
      "performance",
      "layout",
      "hook",
      "design system",
    ],
  },
  {
    id: "backend",
    label: "Backend Engineer",
    short: "Backend",
    blurb: "APIs, data, reliability",
    keywords: [
      "api",
      "database",
      "sql",
      "node",
      "cache",
      "queue",
      "latency",
      "auth",
      "index",
      "transaction",
      "retry",
      "rate limit",
      "observability",
      "schema",
      "idempot",
    ],
  },
  {
    id: "data",
    label: "Data Analyst",
    short: "Data",
    blurb: "SQL, metrics, experiments",
    keywords: [
      "sql",
      "metric",
      "cohort",
      "experiment",
      "a/b",
      "dashboard",
      "pipeline",
      "cleaning",
      "missing data",
      "segmentation",
      "funnel",
      "retention",
      "statistical",
      "hypothesis",
    ],
  },
  {
    id: "product",
    label: "Product Manager",
    short: "Product",
    blurb: "Discovery, priorities, trade-offs",
    keywords: [
      "user",
      "metric",
      "discovery",
      "priorit",
      "roadmap",
      "trade-off",
      "stakeholder",
      "experiment",
      "impact",
      "scope",
      "retention",
      "north star",
      "hypothesis",
      "interview",
    ],
  },
  {
    id: "custom",
    label: "Custom role",
    short: "Custom",
    blurb: "Type any target role",
    keywords: [],
  },
];

export type Level = "Intern" | "Entry" | "Mid" | "Senior";
export const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: "Intern", label: "Intern", desc: "First internship" },
  { id: "Entry", label: "Entry", desc: "0–2 years" },
  { id: "Mid", label: "Mid", desc: "2–5 years" },
  { id: "Senior", label: "Senior", desc: "5+ years" },
];

export type InterviewType = "Behavioral" | "Technical" | "System Design" | "Mixed";
export const INTERVIEW_TYPES: {
  id: InterviewType;
  label: string;
  desc: string;
}[] = [
  { id: "Behavioral", label: "Behavioral", desc: "STAR stories & collaboration" },
  { id: "Technical", label: "Technical", desc: "Role-specific depth" },
  { id: "System Design", label: "System design", desc: "Architecture & trade-offs" },
  { id: "Mixed", label: "Mixed", desc: "A realistic blend" },
];

export type Difficulty = "Warm-up" | "Standard" | "Stretch";
export const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  desc: string;
}[] = [
  { id: "Warm-up", label: "Warm-up", desc: "Build confidence" },
  { id: "Standard", label: "Standard", desc: "Realistic loop" },
  { id: "Stretch", label: "Stretch", desc: "Push the edges" },
];

export type DimensionKey =
  | "communication"
  | "role"
  | "problem"
  | "quality";

export type Dimension = {
  key: DimensionKey;
  label: string;
  short: string;
  color: string;
  tint: string;
  criteria: string;
  tip: string;
};

export const RUBRIC: Dimension[] = [
  {
    key: "communication",
    label: "Communication",
    short: "Comm.",
    color: "#6c4de6",
    tint: "#eee8ff",
    criteria: "Conciseness, structure, and STAR clarity.",
    tip: "Lead with the result before diving into the background.",
  },
  {
    key: "role",
    label: "Role knowledge",
    short: "Role",
    color: "#2eaa96",
    tint: "#e2f6f1",
    criteria: "Technical depth and appropriate domain terminology.",
    tip: "Name specific trade-offs, like latency vs. storage cost.",
  },
  {
    key: "problem",
    label: "Problem solving",
    short: "Problem",
    color: "#ef7a63",
    tint: "#fdebe7",
    criteria: "Structured logic, assumptions, and edge-case handling.",
    tip: "State constraints explicitly before proposing a solution.",
  },
  {
    key: "quality",
    label: "Answer quality",
    short: "Quality",
    color: "#c9972b",
    tint: "#fcf3d9",
    criteria: "Relevance to the prompt and depth of concrete evidence.",
    tip: "Replace hypothetical answers with one concrete metric.",
  },
];

export const RUBRIC_BY_KEY = Object.fromEntries(
  RUBRIC.map((d) => [d.key, d])
) as Record<DimensionKey, Dimension>;

export const FAQ = [
  {
    q: "Is this a real interview?",
    a: "No. ViewPilot is practice. Scores are estimates against a visible rubric, never a hiring decision or a prediction of employability.",
  },
  {
    q: "Do I need an API key?",
    a: "No. The app ships with a deterministic local rubric engine. Add a server-side Gemini key to enable adaptive AI questions and richer feedback.",
  },
  {
    q: "Do I need the robot?",
    a: "No. The robot is an optional backup interviewer and physical presence. Every session works in the browser without it.",
  },
  {
    q: "What happens to my answers?",
    a: "By default they stay in your browser session and local history. Nothing is sent to a server unless you enable AI mode with your own deployment key.",
  },
] as const;
