"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Sparkles } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { AgentGlyph } from "@/components/ui/AgentIcon";
import Markdown from "@/components/ui/Markdown";
import { sourceLabel } from "@/components/dashboard/utils";
import { cn } from "@/components/ui/cn";

interface ChatMessageProps {
  message: ChatMessageType;
  agentId: ChatMessageType["role"] extends never ? never : Parameters<typeof AgentGlyph>[0]["agentId"];
  streaming?: boolean;
  onToast?: (message: string, tone?: "success" | "error" | "info") => void;
}

const sourceTone: Record<string, string> = {
  gemini: "chip-accent",
  openrouter: "chip-cyan",
  local: "chip-success",
  error: "chip-danger text-rose-300 border-rose-400/25 bg-rose-500/10",
  undefined: "",
};

export default function ChatMessage({ message, agentId, streaming, onToast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      onToast?.("Could not copy to the clipboard.", "error");
    }
  }

  if (message.role === "user") {
    return (
      <div className="animate-msg flex justify-end">
        <div className="max-w-[86%] sm:max-w-[76%]">
          <div className="rounded-[16px] rounded-br-[5px] border border-[#6c63ff]/20 bg-[#6c63ff]/[0.11] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap">
            {message.content}
          </div>
          <p className="mt-1 pr-1 text-right font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
            You
          </p>
        </div>
      </div>
    );
  }

  const source = message.source;

  return (
    <div className="animate-msg flex gap-2.5">
      <span className="mt-0.5 h-7 w-7 shrink-0">
        <AgentGlyph agentId={agentId} boxed size={12} boxSize="h-7 w-7" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="rounded-[16px] rounded-tl-[5px] border border-white/[0.07] bg-[var(--color-surface-container)] px-3.5 py-2.5">
          {message.content ? (
            streaming ? (
              <div>
                <Markdown content={message.content} />
                <span className="caret mt-1 inline-block h-3 align-baseline" aria-hidden="true" />
              </div>
            ) : (
              <Markdown content={message.content} />
            )
          ) : (
            <div className="flex items-center gap-1.5 py-1" aria-label="Agent is thinking">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-tertiary)]"
                  style={{ animation: `pulse-soft 1.2s ease-in-out ${dot * 0.18}s infinite` }}
                />
              ))}
              <span className="ml-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                Thinking
              </span>
            </div>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 px-0.5">
          <span
            className={cn(
              "chip !px-2 !py-[2px] !text-[7.5px] !font-mono !uppercase !tracking-[0.07em]",
              sourceTone[source ?? "undefined"],
            )}
          >
            {source === "error" ? <AlertCircle size={7} /> : source === "local" ? <Sparkles size={7} /> : null}
            {streaming ? "Streaming" : sourceLabel(source)}
          </span>
          {typeof message.latencyMs === "number" ? (
            <span className="font-mono text-[7.5px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
              {message.latencyMs}ms
            </span>
          ) : null}
          {!streaming && message.content ? (
            <button
              type="button"
              onClick={() => void copy()}
              className="ml-auto flex items-center gap-1 font-mono text-[7.5px] uppercase tracking-[0.06em] text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text-primary)]"
              aria-label="Copy reply"
            >
              {copied ? <Check size={9} /> : <Copy size={9} />}
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
