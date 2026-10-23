import { executeWorkflow, validateWorkflow } from "@/lib/workflow/engine";
import { createSseResponse } from "@/lib/sse";
import type { WorkflowEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let workflow: ReturnType<typeof validateWorkflow>;
  try {
    const payload =
      body && typeof body === "object" && "workflow" in body
        ? (body as { workflow: unknown }).workflow
        : body;
    workflow = validateWorkflow(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid workflow.";
    return Response.json({ error: message }, { status: 400 });
  }

  return createSseResponse(async (send) => {
    const emit = (event: Omit<WorkflowEvent, "runId">) => {
      send({ ...event, runId: workflow.id });
    };

    try {
      await executeWorkflow({
        runId: workflow.id,
        name: workflow.name,
        nodes: workflow.nodes,
        emit,
        fast: process.env.WORKFLOW_FAST === "1",
      });
    } catch (error) {
      send({
        type: "error",
        runId: workflow.id,
        message: error instanceof Error ? error.message : "Workflow failed.",
      });
    }
  });
}
