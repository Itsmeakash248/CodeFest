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
