import type { AgentId, ChatContext, InterviewQuestion } from "@/lib/types";
import { detectRole, extractSkills, roleById, type RoleProfile } from "@/lib/data/roles";
import { buildQuestionSet } from "@/lib/interview/questions";
import { evaluateTurn } from "@/lib/interview/engine";
import { clamp, countMatches, hashString, splitSentences, truncate, unique, wordCount } from "@/lib/text";

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
  "owned",
  "delivered",
  "optimized",
  "rewrote",
];

const BUZZWORDS = ["responsible for", "worked on", "helped with", "various", "team player", "hardworking", "duties included"];

function lastUser(messages: { role: string; content: string }[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user" && messages[index].content.trim()) return messages[index].content.trim();
  }
  return "";
}

function isGreeting(text: string): boolean {
  return /^(hi|hello|hey|yo|good (morning|afternoon|evening)|what'?s up)[\s!.,]*$/i.test(text.trim());
}

function roleContext(text: string, context?: ChatContext): RoleProfile {
  return detectRole(`${text} ${context?.targetRole ?? ""}`) ?? roleById(context?.targetRole);
}

function metricCount(text: string): number {
  const matches = text.match(
    /\b\d+(?:[.,]\d+)?\s?%|\$\s?\d+(?:[.,]\d+)?|\b\d+\s?(?:users|people|customers|hours|days|weeks|months|years|x|times|ms|seconds|minutes)\b/gi,
  );
  return matches ? matches.length : 0;
}

function bulletsOf(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-–*]+/, "").trim())
    .filter((line) => line.length > 2);
}

function writingStats(text: string) {
  const words = wordCount(text);
  const sentences = splitSentences(text);
  const sentenceCount = Math.max(1, sentences.length);
  const avgSentence = words / sentenceCount;
  const fillers = countMatches(text.toLowerCase(), ["um", "uh", "like", "you know", "basically", "actually", "kind of", "sort of"]);
  const hedges = countMatches(text.toLowerCase(), ["maybe", "probably", "i think", "just", "not sure", "hopefully", "i feel like"]);
  const actions = countMatches(text.toLowerCase(), ACTION_VERBS);
  const metrics = metricCount(text);
  return { words, sentences, sentenceCount, avgSentence, fillers, hedges, actions, metrics };
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 28, 96));
}

function strongestSentence(text: string, markers: string[], numbers = false): string {
  const sentences = splitSentences(text);
  if (!sentences.length) return truncate(text, 160);
  let best = sentences[0];
  let bestScore = -1;
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let score = 0;
    for (const marker of markers) if (lower.includes(marker)) score += 2;
    if (numbers && /\d/.test(sentence)) score += 3;
    if (sentence.length > 18 && sentence.length < 180) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = sentence;
    }
  }
  return truncate(best, 200);
}

function sqrtPlan(role: RoleProfile, gaps: string[]): string {
  const first = gaps[0] ?? role.skills[0];
  const second = gaps[1] ?? role.skills[1];
  const third = gaps[2] ?? role.skills[2];
  return [
    `**Week 1 · ${first}** — learn the core, then rebuild the same small feature from scratch without a tutorial.`,
    `**Week 2 · ${second}** — add it to one portfolio project and write down the trade-off you chose.`,
    `**Week 3 · ${third}** — add tests or a measurable check, then break the feature on purpose and fix it.`,
    `**Week 4 · Proof** — ship the project, write a 5-line case study (problem, action, result, metric), and run a mock interview for ${role.label}.`,
  ].join("\n");
}

function greetingFor(agent: AgentId, role: RoleProfile): string {
  const menu: Record<AgentId, string> = {
    "interview-coach": `I can run a mock interview, critique an answer you paste, or coach a specific question.\n\nStart with one of these:\n- **"Start a warm-up for ${role.label}"**\n- **"Here's my answer to 'tell me about yourself': …"**\n- **"How do I answer 'what's your biggest weakness'?"**`,
    "resume-reviewer": `Paste your resume (or two bullets) and the role you are targeting. I'll score impact, clarity, relevance and structure, then rewrite the weakest bullet.\n\nA useful first message looks like:\n**"${role.label} — here are my bullets: …"**`,
    "skill-analyzer": `Tell me what you already know and the role you want. I'll rank the gaps by hiring impact and give you a four-week plan.\n\nTry: **"I know ${role.skills.slice(0, 2).join(" and ")}. Target: ${role.label}."**`,
    "career-advisor": `Tell me where you are now (degree, internship, current role), what you enjoy, and one constraint (time, location, money). I'll map two or three realistic next moves.\n\nTry: **"Final-year CS student, enjoy frontend, targeting ${role.label}."**`,
    "communication-trainer": `Paste an answer you would give out loud. I'll find the rambling, hedging and buried result, then rebuild it with STAR.\n\nTry: **"Here's my answer: …"**`,
  };
  return `Hello — I'm your ${agent.replace("-", " ")}. ${menu[agent]}`;
}

function coachReply(text: string, context: ChatContext | undefined, role: RoleProfile): string {
  const lower = text.toLowerCase();
  const stats = writingStats(text);

  if (/(tell me about yourself|introduce yourself)/i.test(text)) {
    return `**The 60-second structure**\n\n1. **Now** — "I'm a ${context?.level ?? "final-year student"} focused on ${role.label.toLowerCase()} work."\n2. **Proof** — one project: what you built, the constraint, the result. One sentence each.\n3. **Why this role** — connect the proof to the work the team is hiring for.\n4. **Close** — "I'm looking for a team where I can own [specific surface] and learn from [specific practice]."\n\n**Avoid:** a chronological life story, or listing every tool you have touched.\n\nDraft it, then paste it here and I'll cut it to 60 seconds.`;
  }

  if (/(weakness|weaknesses)/i.test(text)) {
    return `**Pick a real, non-fatal weakness with a correction loop.**\n\nFormula:\n- **Name it plainly:** "I used to over-engineer before validating the problem."\n- **Show the cost:** "It made a two-day task take four."\n- **Show the system you built:** "Now I write the smallest testable version first and schedule a review before adding complexity."\n- **Evidence:** "On my last project that cut the first review from five days to two."\n\nAvoid "I'm a perfectionist" and avoid a weakness that is core to the job.`;
  }

  if (stats.words >= 32 || /(feedback|review my answer|how did i do)/i.test(lower)) {
    const signals = [...role.skills.slice(0, 6).map((skill) => skill.toLowerCase()), "result", "team", "learned", "measure"];
    const feedback = evaluateTurn(
      {
        questionId: "coach-answer",
        question: "Tell me about a relevant experience.",
        answer: text,
        competency: "General",
        signals,
      },
      { role: role.label, level: context?.level ?? "Entry level", type: "Mixed", difficulty: "Standard" },
    );
    const tighter = strongestSentence(text, [...ACTION_VERBS, "result", "because"], true);
    return `**Answer read · ${feedback.score}/100 (${feedback.label})**\n\n${feedback.summary}\n\n**What worked**\n${feedback.strengths.map((item) => `- ${item}`).join("\n")}\n\n**Fix next**\n${feedback.improve.map((item) => `- ${item}`).join("\n")}\n\n**A tighter shape**\n- Lead with the result or the constraint, not the backstory.\n- Keep the strongest line: "${truncate(tighter, 150)}"\n- Add one number you can defend.\n\nWant to rebuild this answer together? Paste a second version and I'll compare the two.`;
  }

  const setup = {
    role: role.label,
    level: context?.level ?? "Entry level",
    type: /technical|code|system/i.test(text) ? "Technical" : "Mixed",
    difficulty: "Standard",
  };
  const set = buildQuestionSet(setup, hashString(text || role.id));
  const question: InterviewQuestion = set[1] ?? set[0];
  return `**Let's practice. ${role.label} · ${setup.level}**\n\n> ${question.text}\n\n**What I'm listening for:** ${question.signals.slice(0, 4).join(", ")}.\n\n**Shape it like this:** ${question.starHint}\n\nAnswer in 5–7 sentences. I'll score it, quote your strongest line, and give you one probe.`;
}

function resumeReply(text: string, context: ChatContext | undefined, role: RoleProfile): string {
  const stats = writingStats(text);
  const skills = extractSkills(text);
  const sections = ["experience", "education", "projects", "skills", "summary"].filter((section) =>
    text.toLowerCase().includes(section),
  );
  const bullets = bulletsOf(text).filter((line) => line.length > 25);
  const buzzwords = BUZZWORDS.reduce((total, word) => total + (text.toLowerCase().includes(word) ? 1 : 0), 0);
  const relevanceHits = role.skills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase())).length;

  if (stats.words < 25) {
    return `**Paste the resume, not the summary.**\n\nSend 5–10 bullets (or the whole document) plus the role you are targeting. I'll return:\n- a score for **impact, clarity, relevance and structure**\n- the three fixes that matter most\n- one rewritten bullet you can paste back in\n\nUseful starting point: **"${role.label} — here are my bullets: …"**`;
  }

  const impact = clampScore(34 + stats.metrics * 8 + stats.actions * 3 + (stats.words > 180 ? 6 : 0) - buzzwords * 4);
  const clarity = clampScore(66 + (stats.avgSentence < 22 ? 8 : 0) - buzzwords * 5 + Math.min(bullets.length, 8) * 1.5);
  const relevance = clampScore(40 + relevanceHits * 7 + (text.toLowerCase().includes(role.label.toLowerCase()) ? 8 : 0));
  const structure = clampScore(38 + sections.length * 9 + Math.min(bullets.length, 10) * 2);
  const overall = Math.round((impact + clarity + relevance + structure) / 4);

  const weakLine =
    bullets.find((line) => BUZZWORDS.some((word) => line.toLowerCase().includes(word))) ??
    bullets.find((line) => !/\d/.test(line)) ??
    bullets[0] ??
    "Worked on the company website.";
  const cleaned = weakLine
    .replace(/^(responsible for|worked on|helped with|duties included)\s*/i, "")
    .replace(/^[a-z]/, (char) => char.toUpperCase());

  const fixes: string[] = [];
  if (stats.metrics < 2) fixes.push("Add a number to at least half your bullets. Recruiters cannot infer impact.");
  if (buzzwords > 0) fixes.push(`Replace ${buzzwords} passive phrase${buzzwords === 1 ? "" : "s"} ("responsible for", "worked on") with an action verb.`);
  if (relevanceHits < 3) fixes.push(`Add the role's vocabulary: ${role.skills.slice(0, 4).join(", ")}.`);
  if (sections.length < 3) fixes.push("Add clear sections: experience, projects, skills, education.");
  while (fixes.length < 3) fixes.push("Lead every bullet with the result, then the action that produced it.");

  return `**Resume scan · ${role.label}**\n\n${stats.words} words · ${bullets.length} bullets · ${stats.metrics} metrics · ${skills.length} skills detected\n\n- **Impact ${impact}/100** — ${stats.metrics >= 2 ? "measurable evidence is present" : "mostly responsibilities, not outcomes"}.\n- **Clarity ${clarity}/100** — ${buzzwords ? `${buzzwords} passive phrase${buzzwords === 1 ? "" : "s"} weakening the scan` : "readable and direct"}.\n- **Relevance ${relevance}/100** — ${relevanceHits} target-role signals found.\n- **Structure ${structure}/100** — ${sections.length ? `${sections.length} sections detected` : "no clear section structure"}.\n\n**Practice estimate: ${overall}/100.**\n\n**Fix these three things**\n${fixes.slice(0, 3).map((fix, index) => `${index + 1}. ${fix}`).join("\n")}\n\n**Rewrite this bullet**\n> ${truncate(weakLine, 150)}\n\n→ **${cleaned.split(" ").slice(0, 12).join(" ")} — [result: X% / N users / $Y] by [specific action].**\n\nPaste your revised bullet and I'll check whether it survives a six-second scan.`;
}

function skillsReply(text: string, context: ChatContext | undefined, role: RoleProfile): string {
  const skills = extractSkills(`${text} ${context?.resume ?? ""}`);
  const known = role.skills.filter((skill) =>
    skills.some((item) => item.toLowerCase() === skill.toLowerCase() || skill.toLowerCase().includes(item.toLowerCase())),
  );
  const gaps = role.skills.filter((skill) => !known.includes(skill));
  const effectiveGaps = gaps.length ? gaps : role.skills.slice(-3);

  return `**Target: ${role.label}**\n\n${skills.length ? `You named: ${skills.slice(0, 8).join(", ")}.` : "I couldn't detect current skills yet, so I'm assuming fundamentals."}\n\n**Already covered (${known.length}/${role.skills.length})**\n${known.length ? known.map((skill) => `- ${skill}`).join("\n") : "- Nothing detected yet — that's useful information, not a failure."}\n\n**Gaps ranked by hiring impact**\n${effectiveGaps.slice(0, 5).map((gap, index) => `${index + 1}. **${gap}** — ${index < 2 ? "must-have; interviewers will probe it" : "differentiator; proves depth"}`).join("\n")}\n\n**Your shortest path**\n${sqrtPlan(role, effectiveGaps)}\n\n**Proof over courses:** one project that uses the top two gaps beats five certificates. If you tell me your available hours per week, I'll resize the plan.`;
}

function careerReply(text: string, context: ChatContext | undefined, role: RoleProfile): string {
  const detected = detectRole(`${text} ${context?.targetRole ?? ""}`);
  if (!detected && !context?.targetRole) {
    return `**Let's narrow it before prescribing a path.**\n\nAnswer these three:\n1. What work do you lose track of time doing?\n2. What proof do you already have — projects, internships, a portfolio?\n3. What constraint is real: time, location, money, or visa?\n\n**Three families to compare meanwhile**\n- **Build:** ${role.label}, Backend Engineer, Full-Stack Engineer.\n- **Analyze:** Data Analyst, Business Analyst, Product Analyst.\n- **Shape:** Product Manager, UX Designer, Marketing Specialist.\n\nGive me one sentence on each question and I'll map two realistic moves with a 30/60/90 plan.`;
  }
  const target = detected ?? role;
  return `**A realistic next move from here: ${target.label}**\n\n**Adjacent options**\n${target.adjacent.slice(0, 3).map((item, index) => `- **${item}** — ${index === 0 ? "closest skill overlap; fastest transition" : index === 1 ? "broader surface; stronger generalist story" : "narrower depth; better if you enjoy the specialist work"}`).join("\n")}\n\n**Positioning line**\n> "I'm an early-career ${target.label.toLowerCase()} who turns [specific problem] into [measurable outcome]. I've done it through [project], and I'm looking for a team where [specific scope] matters."\n\n**30 / 60 / 90**\n- **30 days:** close the first gap (${target.skills[0]}) and rebuild one project around it.\n- **60 days:** ship a second artifact with a measurable result and get one critique from someone doing the job.\n- **90 days:** run three mock interviews, apply to 10 calibrated roles, and track which stage rejects you.\n\n**One caution:** don't optimize for a title you haven't tested. A two-week project is cheaper than a two-year detour.\n\nWhat is your current degree or role? I'll make the plan concrete.`;
}

function communicationReply(text: string, context: ChatContext | undefined, role: RoleProfile): string {
  const stats = writingStats(text);
  if (stats.words < 20) {
    return `**Paste the answer you would actually say.**\n\nA sentence or two is enough to start. I'll look for:\n- the **buried result** (most candidates put it last, or omit it)\n- **hedging** ("I think", "just", "kind of")\n- **rambling** (more than one story in one answer)\n- missing **STAR** structure\n\nTry: **"Here's my answer to 'tell me about a time you handled pressure': …"**`;
  }

  const issues: string[] = [];
  if (stats.words > 170) issues.push("You have more than one answer inside this answer. Keep the story that proves the point and cut the rest.");
  if (stats.hedges > 0) issues.push(`${stats.hedges} hedge${stats.hedges === 1 ? "" : "s"} ("I think", "just", "maybe") make the claim sound optional.`);
  if (stats.fillers > 0) issues.push(`${stats.fillers} filler phrase${stats.fillers === 1 ? "" : "s"} add noise without meaning.`);
  if (stats.metrics === 0) issues.push("There is no number, so the result is a claim rather than evidence.");
  if (stats.avgSentence > 28) issues.push("Sentences average over 28 words. Break them; short sentences sound certain.");
  if (!issues.length) issues.push("The writing is clean. The remaining lift is delivery: land the result and stop.");

  const situation = stats.sentences[0] ? truncate(stats.sentences[0], 150) : "One sentence of context.";
  const action = strongestSentence(text, ACTION_VERBS);
  const result = strongestSentence(text, ["result", "impact", "improved", "reduced", "increased", "saved"], true);
  const clarity = clampScore(84 - stats.hedges * 5 - stats.fillers * 4 - (stats.avgSentence > 30 ? 10 : 0) - (stats.words > 180 ? 8 : 0) + (stats.metrics ? 5 : 0));

  return `**Clarity read · ${clarity}/100**\n\n${issues.slice(0, 3).map((issue) => `- ${issue}`).join("\n")}\n\n**Rebuild it with STAR**\n- **Situation:** ${situation}\n- **Task:** What did you specifically own? Use "I", not "we".\n- **Action:** ${action !== "No evidence captured." ? truncate(action, 160) : "Two concrete actions, in order."}\n- **Result:** ${result !== "No evidence captured." && /\d/.test(result) ? truncate(result, 160) : "Add the number: what changed, by how much, and why it mattered."}\n\n**Say it like this**\n> "When [situation], I owned [task]. I [action], which [result]."\n\n**5-minute drill:** record the 45-second version three times. Each take, remove one sentence of background and add one number.\n\nFor a ${role.label} interview, the result should connect to the work the team actually cares about. What role are you preparing for?`;
}

export function localAgentReply(
  agent: AgentId,
  messages: { role: string; content: string }[],
  context?: ChatContext,
): string {
  const text = lastUser(messages);
  const role = roleContext(text, context);
  if (!text || isGreeting(text)) return greetingFor(agent, role);
  const lower = text.toLowerCase();

  if (agent === "resume-reviewer") return resumeReply(text, context, role);
  if (agent === "skill-analyzer") return skillsReply(text, context, role);
  if (agent === "career-advisor") return careerReply(text, context, role);
  if (agent === "communication-trainer") return communicationReply(text, context, role);

  // Interview coach
  if (/(resume|cv)/i.test(lower) && text.length > 420) return resumeReply(text, context, role);
  if (/(job|career|switch|promotion)/i.test(lower) && /(should i|advice|path)/i.test(lower)) {
    return careerReply(text, context, role);
  }
  return coachReply(text, context, role);
}
