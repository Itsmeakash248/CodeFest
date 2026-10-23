import type { WorkflowNode, WorkflowNodeType, WorkflowTemplate } from "@/lib/types";
import { createWorkflowNode } from "@/lib/workflow/nodes";

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "full-loop",
    name: "Full prep loop",
    description: "Resume review, skill gaps, a mock interview, a report and a practice plan.",
    minutes: "~8 min",
    nodeTypes: [
      "upload-resume",
      "set-target-role",
      "resume-review",
      "skill-gap",
      "generate-questions",
      "mock-interview",
      "evaluate-answers",
      "generate-report",
      "practice-plan",
    ],
  },
  {
    id: "drill-30",
    name: "30-minute drill",
    description: "Target the role, generate questions, rehearse, evaluate and get next actions.",
    minutes: "~30 min",
    nodeTypes: [
      "set-target-role",
      "generate-questions",
      "mock-interview",
      "evaluate-answers",
      "practice-plan",
    ],
  },
  {
    id: "resume-sprint",
    name: "Resume sprint",
    description: "Tighten the resume against one target role and close the sharpest gaps.",
    minutes: "~20 min",
    nodeTypes: [
      "upload-resume",
      "set-target-role",
      "resume-review",
      "skill-gap",
      "practice-plan",
    ],
  },
];

export function templateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((template) => template.id === id);
}

export function nodesFromTemplate(templateId: string): WorkflowNode[] {
  const template = templateById(templateId) ?? WORKFLOW_TEMPLATES[1];
  return template.nodeTypes.map((type, index) => createWorkflowNode(type, `node_${template.id}_${index}`));
}

export function nodesFromTypes(types: WorkflowNodeType[]): WorkflowNode[] {
  return types.map((type, index) => createWorkflowNode(type, `node_${type}_${index}`));
}
