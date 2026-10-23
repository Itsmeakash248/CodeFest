const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export function createSseResponse(
  handler: (send: (payload: unknown) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          cancelled = true;
        }
      };

      try {
        await handler(send);
      } catch (error) {
        console.error("[sse]", (error as Error).message);
        send({ type: "error", message: (error as Error).message || "Stream failed." });
      } finally {
        if (!cancelled) {
          cancelled = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunksOf(text: string, target = 28): string[] {
  // Slice the original string so whitespace is never lost at a boundary.
  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    let end = Math.min(index + target, text.length);
    if (end < text.length) {
      const nextSpace = text.indexOf(" ", end);
      if (nextSpace !== -1 && nextSpace - end <= 14) end = nextSpace + 1;
    }
    chunks.push(text.slice(index, end));
    index = end;
  }
  return chunks;
}
