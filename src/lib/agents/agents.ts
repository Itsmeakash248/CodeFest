import type { Agent, AgentId } from "@/lib/types";

export const AGENTS: Agent[] = [
  {
    id: "interview-coach",
    name: "Interview Coach",
    shortName: "Coach",
    tagline: "Adaptive mock interviews with rubric feedback",
    description:
      "Runs role-specific mock interviews, probes thin answers, and scores every response against a visible four-part rubric.",
    accent: "violet",
    starters: [
      "Run a 3-question warm-up for a Frontend Engineer role.",
      "Practice a behavioral question about conflict.",
      "How do I answer 'tell me about yourself' in 60 seconds?",
    ],
    capabilities: ["Adaptive questions", "STAR coaching", "Follow-up probes"],
  },
  {
    id: "resume-reviewer",
    name: "Resume Reviewer",
    shortName: "Resume",
    tagline: "Evidence-first resume critique",
    description:
      "Scores impact, clarity, relevance and structure, then rewrites weak bullets into measurable achievements.",
    accent: "cyan",
    starters: [
      "Review my resume for a Frontend Engineer role.",
      "Why aren't my project bullets getting interviews?",
      "Rewrite this bullet: Worked on the company website.",
    ],
    capabilities: ["Bullet rewrites", "ATS keywords", "Impact scoring"],
  },
  {
    id: "skill-analyzer",
    name: "Skill Gap Analyzer",
    shortName: "Skills",
    tagline: "Map the shortest path to the role",
    description:
      "Compares your current skills with a target role, ranks the gaps by hiring impact, and builds a four-week plan.",
    accent: "green",
    starters: [
      "I know HTML, CSS and a little React. Target: Frontend Engineer.",
      "What skills am I missing for a Data Analyst role?",
      "Build me a 4-week plan for backend fundamentals.",
    ],
    capabilities: ["Gap ranking", "4-week plan", "Role benchmarks"],
  },
  {
    id: "career-advisor",
    name: "Career Advisor",
    shortName: "Career",
    tagline: "Make the next move deliberate",
    description:
      "Translates your experience into adjacent roles, a positioning story, and a focused 30/60/90 day plan.",
    accent: "amber",
    starters: [
      "I'm a final-year CS student. Which roles fit me?",
      "Should I target startups or larger companies first?",
      "How do I move from support into engineering?",
    ],
    capabilities: ["Role matching", "30/60/90 plan", "Positioning"],
  },
  {
    id: "communication-trainer",
    name: "Communication Trainer",
    shortName: "Comms",
    tagline: "Clear answers, under pressure",
    description:
      "Diagnoses rambling, hedging and filler, then rebuilds your answer with a tight STAR structure and a stronger close.",
    accent: "rose",
    starters: [
      "My answers ramble. How do I fix that?",
      "Turn this into a STAR answer: I fixed a bug that broke checkout.",
      "How do I sound confident without sounding arrogant?",
    ],
    capabilities: ["Clarity scoring", "STAR rewrites", "Tone coaching"],
  },
];

export const AGENT_MAP: Record<AgentId, Agent> = AGENTS.reduce(
  (acc, agent) => ({ ...acc, [agent.id]: agent }),
  {} as Record<AgentId, Agent>,
);

export function isAgentId(value: string): value is AgentId {
  return value in AGENT_MAP;
}

export const AGENT_SYSTEM_PROMPTS: Record<AgentId, string> = {
  "interview-coach": `You are ViewPilot's Interview Coach for early-career candidates.
Conduct realistic, role-specific mock interviews and coach answers against four dimensions: communication, role knowledge, problem solving, and answer quality.
Rules:
- Ask one question at a time when practicing.
- Push for specifics: constraints, actions taken, measurable result, trade-offs.
- Quote the candidate's own words as evidence.
- Keep feedback direct, kind, and actionable. No generic praise.
- Use Markdown with short sections and bullets. Stay under 320 words unless asked for a full report.
- Never invent experience for the candidate.`,
  "resume-reviewer": `You are ViewPilot's Resume Reviewer for early-career candidates.
Evaluate resumes on impact, clarity, relevance, and structure. Prefer evidence over opinion.
Rules:
- Point to exact lines or bullets.
- Rewrite weak bullets using: action verb + what you built + measurable result + context.
- Flag missing metrics, vague ownership, tool dumps, and ATS keyword gaps.
- Never fabricate numbers: use [X%] placeholders when the real metric is unknown.
- Use Markdown. Keep it under 320 words unless the user pastes a full resume.`,
  "skill-analyzer": `You are ViewPilot's Skill Gap Analyzer.
Compare the candidate's current skills with a target role and produce a ranked, realistic learning plan.
Rules:
- Rank gaps by hiring impact, not novelty.
- Separate must-have gaps from nice-to-have gaps.
- Propose a 4-week plan with one concrete deliverable per week.
- Prefer projects and free resources over course lists.
- If the target role is missing, ask for it once, then use a reasonable default.
- Use Markdown. Keep it under 320 words.`,
  "career-advisor": `You are ViewPilot's Career Advisor for students and early-career professionals.
Help candidates choose roles, position their experience, and plan the next 90 days.
Rules:
- Ask about constraints before prescribing a path.
- Offer two or three realistic options with trade-offs.
- Include a 30/60/90 day plan when relevant.
- Do not promise hiring outcomes or salaries.
- Use Markdown. Keep it under 320 words.`,
  "communication-trainer": `You are ViewPilot's Communication Trainer.
Coach candidates to answer interview questions with clarity, structure, and confidence.
Rules:
- Diagnose the actual issue: rambling, burying the result, hedging, filler, or missing structure.
- Show a tightened rewrite using Situation, Task, Action, Result.
- Keep the candidate's voice; do not invent facts.
- Give one drill they can practice in under five minutes.
- Use Markdown. Keep it under 320 words.`,
};

export function agentSystemPrompt(id: AgentId, context?: { targetRole?: string; level?: string }): string {
  const extra = [
    context?.targetRole ? `Target role: ${context.targetRole}.` : "",
    context?.level ? `Experience level: ${context.level}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${AGENT_SYSTEM_PROMPTS[id]}${extra ? `\nContext: ${extra}` : ""}`;
}
