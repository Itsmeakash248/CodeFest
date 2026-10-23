import type {
  InterviewQuestion,
  InterviewSetup,
  NodeRunResult,
  WorkflowEvent,
  WorkflowNode,
  WorkflowNodeType,
} from "@/lib/types";
import { extractSkills, roleById, type RoleProfile } from "@/lib/data/roles";
import { WORKFLOW_NODE_DEFS } from "@/lib/workflow/nodes";
import { buildQuestionSet } from "@/lib/interview/questions";
import { clamp, hashString, truncate, uid, wordCount } from "@/lib/text";

export interface WorkflowRequestBody {
  id?: string;
  name?: string;
  nodes: WorkflowNode[];
}

interface Context {
  role: RoleProfile;
  level: string;
  resumeText: string;
  hasResume: boolean;
  skills: string[];
  gaps: string[];
  questions: InterviewQuestion[];
  review: { impact: number; clarity: number; relevance: number; structure: number } | null;
}

type Emit = (event: Omit<WorkflowEvent, "runId">) => void;

const SAMPLE_BULLETS = (role: RoleProfile) =>
  `- Built a ${role.skills[0].toLowerCase()} project used by 40+ students, cutting a manual workflow from 20 minutes to 4.\n- Led a 3-person team to ship a dashboard in 6 weeks; adopted by 2 student clubs.\n- Automated data cleanup with a script, reducing weekly preparation time by 30%.`;

function resumeMetrics(text: string): { clutter: number; numbers: number; sections: number; coverage: number; role: RoleProfile } {
  const role = roleById();
  const lower = text.toLowerCase();
  const numbers = (text.match(/\b\d+(?:[.,]\d+)?\s?%|\b\d+\s?(?:users|people|hours|days|weeks|months|projects|minutes|x)\b/gi) ?? []).length;
  const clutter = ["responsible for", "worked on", "helped with", "various", "team player"].filter((word) => lower.includes(word)).length;
  const sections = ["experience", "education", "projects", "skills"].filter((section) => lower.includes(section)).length;
  return { clutter, numbers, sections, coverage: 0, role };
}

function buildReview(ctx: Context): { impact: number; clarity: number; relevance: number; structure: number } {
  const stats = resumeMetrics(ctx.resumeText);
  const coverage = ctx.role.skills.filter((skill) =>
    ctx.resumeText.toLowerCase().includes(skill.toLowerCase()),
  ).length;
  return {
    impact: Math.round(clamp(42 + stats.numbers * 9 + (ctx.hasResume ? 4 : 0) - stats.clutter * 4, 34, 94)),
    clarity: Math.round(clamp(72 + (ctx.hasResume ? 6 : 0) - stats.clutter * 6 + Math.min(stats.sections, 4) * 2, 34, 95)),
    relevance: Math.round(clamp(44 + (coverage / Math.max(ctx.role.skills.length, 1)) * 45, 34, 95)),
    structure: Math.round(clamp(42 + stats.sections * 11 + (ctx.hasResume ? 4 : 0), 34, 95)),
  };
}

function nodeOutput(
  type: WorkflowNodeType,
  node: WorkflowNode,
  ctx: Context,
  runId: string,
): { output: string; metrics: Record<string, string | number>; next: Context } {
  switch (type) {
    case "upload-resume": {
      const configured = typeof node.config.resume === "string" ? node.config.resume.trim() : "";
      const hasResume = configured.length > 40;
      const text = hasResume ? configured : SAMPLE_BULLETS(ctx.role);
      const skills = hasResume ? extractSkills(text) : ctx.role.skills.slice(0, 5);
      const next = { ...ctx, resumeText: text, hasResume, skills };
      const output = hasResume
        ? `**Profile parsed**\n${wordCount(text)} words · ${skills.length} skills detected · ${(text.match(/\b\d+[%,]?\b/g) ?? []).length} metrics\n\nTop signals: ${skills.slice(0, 6).join(", ")}.`
        : `**No resume attached — sample profile loaded.**\nThis preview uses a representative ${ctx.role.label} profile so the pipeline can run. Attach a resume in the node settings to personalise every downstream artifact.\n\nSample skills: ${skills.slice(0, 6).join(", ")}.`;
      return {
        output,
        metrics: { Profile: hasResume ? "attached" : "sample", Skills: skills.length },
        next,
      };
    }

    case "set-target-role": {
      const role = roleById(String(node.config.role ?? ctx.role.label));
      const level = String(node.config.level ?? ctx.level ?? "Entry level");
      const next = { ...ctx, role, level };
      const output = `**Target frozen**\n\nRole: **${role.label}**\nLevel: ${level}\nFamily: ${role.family}\n\nDownstream nodes will optimise for this role's must-have skills: ${role.skills.slice(0, 4).join(", ")}.`;
      return { output, metrics: { Role: role.label, Level: level }, next };
    }

    case "resume-review": {
      const review = buildReview(ctx);
      const next = { ...ctx, review };
      const sampleNote = ctx.hasResume ? "" : "\n\n> Preview only: no resume was attached, so these scores use a sample profile.";
      const output = `**Resume review · ${ctx.role.label}**\n\n- Impact **${review.impact}/100**\n- Clarity **${review.clarity}/100**\n- Relevance **${review.relevance}/100**\n- Structure **${review.structure}/100**\n\n**Fastest fix:** add one measurable result to every bullet, then mirror the role's vocabulary: ${ctx.role.skills.slice(0, 3).join(", ")}.${sampleNote}`;
      return {
        output,
        metrics: {
          Impact: review.impact,
          Clarity: review.clarity,
          Relevance: review.relevance,
          Structure: review.structure,
        },
        next,
      };
    }

    case "skill-gap": {
      const gaps = ctx.role.skills.filter(
        (skill) => !ctx.skills.some((known) => known.toLowerCase() === skill.toLowerCase()),
      );
      const next = { ...ctx, gaps };
      const output = `**Skill gap · ${ctx.role.label}**\n\n${gaps.length ? gaps.slice(0, 4).map((gap, index) => `${index + 1}. **${gap}** — ${index < 2 ? "must-have" : "differentiator"}`).join("\n") : "No must-have gaps detected. Depth and proof are the next differentiator."}\n\n**Week 1:** build one small artifact using ${gaps[0] ?? ctx.role.skills[0]}.\n**Week 2:** integrate ${gaps[1] ?? ctx.role.skills[1]} and write the trade-off down.\n**Week 3:** test it, break it, fix it.\n**Week 4:** ship it with a measurable case study.`;
      return { output, metrics: { Gaps: gaps.length, MustHave: Math.min(gaps.length, 2) }, next };
    }

    case "generate-questions": {
      const count = Number(node.config.count ?? 5);
      const setup: InterviewSetup = {
        role: ctx.role.label,
        level: ctx.level,
        type: String(node.config.type ?? "Mixed"),
        difficulty: String(node.config.difficulty ?? "Standard"),
      };
      const questions = buildQuestionSet(setup, hashString(`${runId}:${ctx.role.id}`)).slice(0, Math.min(Math.max(count, 1), 5));
      const next = { ...ctx, questions };
      const output = `**Question set · ${ctx.role.label}**\n\n${questions.map((question, index) => `${index + 1}. ${question.text}`).join("\n")}\n\nEach prompt includes a competency signal and a follow-up probe.`;
      return { output, metrics: { Questions: questions.length, Format: setup.type }, next };
    }

    case "mock-interview": {
      const first = ctx.questions[0];
      const output = `**Live interview ready**\n\n> ${first ? first.text : "Tell me about a project you're proud of."}\n\n5 questions · ${ctx.level} · ${ctx.role.label}\nVoice is optional. The session will adapt with a follow-up when an answer is thin.\n\nOpen **Interview** to run it with the timer, microphone and TTS.`;
      return { output, metrics: { Questions: 5, Voice: "optional" }, next: ctx };
    }

    case "evaluate-answers": {
      const output = `**Evaluation engine armed**\n\nRubric weights: Communication 25 · Role knowledge 30 · Problem solving 25 · Answer quality 20.\n\nEach score will quote evidence from the transcript. No score is generated until a real answer exists — this node defines the rubric, it does not invent results.`;
      return { output, metrics: { Dimensions: 4, Evidence: "required" }, next: ctx };
    }

    case "generate-report": {
      const review = ctx.review ?? buildReview(ctx);
      const output = `**Report shell · ${ctx.role.label}**\n\nSections ready: overall practice estimate, 4 dimension scores, per-question evidence, strengths, gaps, STAR blueprint.\n\nResume baseline: impact ${review.impact}, clarity ${review.clarity}, relevance ${review.relevance}.\nExport: print / PDF and JSON.\n\nRun the interview to replace the rubric baseline with scored answers.`;
      return {
        output,
        metrics: { Sections: 7, Export: "PDF / JSON" },
        next: ctx,
      };
    }

    case "practice-plan": {
      const gaps = ctx.gaps.length ? ctx.gaps : ctx.role.skills.slice(0, 2);
      const output = `**Next practice · ${ctx.role.label}**\n\n1. **8 min** — Re-answer your weakest story with a measurable result.\n2. **10 min** — Add one number to every project bullet: ${gaps[0]}.\n3. **6 min** — Record a 60-second answer; cut the background, keep the result.\n\n**STAR blueprint:** Situation (one line) → Task (owned by you) → Action (two decisions) → Result (one number).`;
      return { output, metrics: { Actions: 3, Minutes: 24 }, next: ctx };
    }

    default:
      return { output: "Unknown node.", metrics: {}, next: ctx };
  }
}

export async function executeWorkflow(args: {
  runId: string;
  name: string;
  nodes: WorkflowNode[];
  emit: Emit;
  fast?: boolean;
}): Promise<void> {
  const { runId, name, nodes, emit, fast } = args;
  const total = nodes.length;
  let ctx: Context = {
    role: roleById(),
    level: "Entry level",
    resumeText: "",
    hasResume: false,
    skills: [],
    gaps: [],
    questions: [],
    review: null,
  };

  emit({
    type: "run-start",
    progress: 0,
    status: "running",
    summary: `${name} · ${total} nodes queued`,
  });

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const def = WORKFLOW_NODE_DEFS[node.type];
    if (!def) {
      emit({
        type: "node-error",
        nodeId: node.id,
        nodeType: node.type,
        status: "failed",
        message: `Unknown node type: ${node.type}`,
        progress: Math.round((index / total) * 100),
      });
      throw new Error(`Unknown node type: ${node.type}`);
    }

    emit({
      type: "node-start",
      nodeId: node.id,
      nodeType: node.type,
      label: def.label,
      status: "running",
      progress: Math.round((index / total) * 100),
    });

    const startedAt = Date.now();
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, fast ? 90 : Math.min(def.estimatedMs, 850)),
      );
      const result = nodeOutput(node.type, node, ctx, runId);
      ctx = result.next;
      emit({
        type: "node-complete",
        nodeId: node.id,
        nodeType: node.type,
        label: def.label,
        status: "complete",
        output: result.output,
        metrics: result.metrics,
        elapsedMs: Date.now() - startedAt,
        progress: Math.round(((index + 1) / total) * 100),
      });
    } catch (error) {
      emit({
        type: "node-error",
        nodeId: node.id,
        nodeType: node.type,
        label: def.label,
        status: "failed",
        message: (error as Error).message,
        elapsedMs: Date.now() - startedAt,
        progress: Math.round(((index + 1) / total) * 100),
      });
      throw error;
    }
  }

  emit({
    type: "run-complete",
    status: "complete",
    progress: 100,
    summary: `${total} nodes complete · ${ctx.role.label} prep pack ready`,
  });
}

export function validateWorkflow(raw: unknown): { name: string; id: string; nodes: WorkflowNode[] } {
  if (!raw || typeof raw !== "object") throw new Error("A workflow object is required.");
  const body = raw as Record<string, unknown>;
  if (!Array.isArray(body.nodes)) throw new Error("workflow.nodes must be an array.");
  if (body.nodes.length === 0) throw new Error("Add at least one node before running.");
  if (body.nodes.length > 12) throw new Error("Workflows are limited to 12 nodes.");

  const nodes: WorkflowNode[] = body.nodes.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Node ${index + 1} is invalid.`);
    const node = item as Record<string, unknown>;
    const type = String(node.type ?? "");
    if (!(type in WORKFLOW_NODE_DEFS)) throw new Error(`Unknown node type at position ${index + 1}.`);
    const configRaw =
      node.config && typeof node.config === "object" ? (node.config as Record<string, unknown>) : {};
    const config: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(configRaw)) {
      if (typeof value === "string") config[key] = value.slice(0, 8000);
      else if (typeof value === "number" && Number.isFinite(value)) config[key] = value;
    }
    return {
      id: typeof node.id === "string" && node.id ? node.id.slice(0, 120) : `node_${index}_${uid("n")}`,
      type: type as WorkflowNodeType,
      config,
    };
  });

  const id =
    typeof body.runId === "string"
      ? body.runId
      : typeof body.id === "string" && body.id
        ? body.id
        : uid("run");
  const name = typeof body.name === "string" && body.name ? body.name.slice(0, 100) : "Prep workflow";
  return { name, id: id.slice(0, 120), nodes };
}

export function summarizeRun(nodes: NodeRunResult[]): string {
  const complete = nodes.filter((node) => node.status === "complete").length;
  return `${complete}/${nodes.length} nodes complete`;
}

export function preview(text: string, max = 140): string {
  return truncate(text.replace(/[*#>`-]/g, " ").replace(/\s+/g, " ").trim(), max);
}
