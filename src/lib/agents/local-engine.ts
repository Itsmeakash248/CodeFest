import type { AgentId, ChatContext } from "@/lib/types";

/**
 * Hardcoded responses have been removed.
 * If external AI APIs are not connected, the application will display errors
 * instead of returning canned / mock responses.
 */
export function localAgentReply(
  agent: AgentId,
  messages: { role: string; content: string }[],
  context?: ChatContext,
): string {
  throw new Error(
    "Hardcoded agent responses have been removed. AI API connection required.",
  );
}
