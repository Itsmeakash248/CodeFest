"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Keyboard, Mic, Square, Volume2 } from "lucide-react";
import { isDictationSupported, startDictation, type DictationHandle } from "@/lib/voice/browser";
import { cn } from "@/components/ui/cn";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  streaming?: boolean;
  agentName: string;
  onToast?: (message: string, tone?: "success" | "error" | "info") => void;
}

export default function Composer({
  value,
  onChange,
  onSend,
  disabled,
  streaming,
  agentName,
  onToast,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dictationRef = useRef<DictationHandle | null>(null);
  const baseRef = useRef("");
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);

  useEffect(() => {
    setMicSupported(isDictationSupported());
    return () => {
      dictationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.min(160, Math.max(46, node.scrollHeight))}px`;
  }, [value]);

  function toggleDictation() {
    if (listening) {
      dictationRef.current?.stop();
      dictationRef.current = null;
      setListening(false);
      return;
    }
    baseRef.current = value.trim();
    const handle = startDictation({
      onTranscript: (transcript) => {
        const joined = [baseRef.current, transcript].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
        onChange(joined);
      },
      onError: (message) => {
        onToast?.(message, "error");
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
    if (handle) {
      dictationRef.current = handle;
      setListening(true);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  const characters = value.length;

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0f]/80 px-3 pb-3 pt-2.5 backdrop-blur-xl sm:px-4">
      <div
        className={cn(
          "mx-auto max-w-[860px] rounded-2xl border bg-[#0e0e15]/90 p-2 transition-colors",
          listening
            ? "border-rose-400/35 shadow-[0_0_0_3px_rgba(244,63,94,0.08)]"
            : "border-white/[0.09] focus-within:border-[#6c63ff]/45 focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Ask ${agentName} anything — or paste a resume section…`}
          rows={1}
          disabled={disabled}
          className="max-h-[160px] min-h-[46px] w-full resize-none bg-transparent px-2 py-2 text-[13px] leading-relaxed text-[#ececf5] outline-none placeholder:text-[#5f6375] disabled:opacity-60"
          aria-label={`Message ${agentName}`}
        />

        <div className="flex items-center gap-1.5 px-1 pt-1">
          {micSupported ? (
            <button
              type="button"
              onClick={toggleDictation}
              aria-pressed={listening}
              aria-label={listening ? "Stop dictation" : "Start dictation"}
              title={listening ? "Stop dictation" : "Dictate with the browser microphone"}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg border px-2 font-mono text-[7.5px] uppercase tracking-[0.08em] transition-colors",
                listening
                  ? "border-rose-400/30 bg-rose-500/12 text-rose-200"
                  : "border-white/[0.07] bg-white/[0.025] text-[#8b8ba3] hover:text-white",
              )}
            >
              {listening ? (
                <>
                  <span className="flex items-end gap-[2px]">
                    {[4, 9, 6, 11, 5].map((height, index) => (
                      <span
                        key={index}
                        className="w-[1.5px] rounded-full bg-current"
                        style={{ height, animation: `wave 0.9s ease-in-out ${index * 0.09}s infinite` }}
                      />
                    ))}
                  </span>
                  Listening
                </>
              ) : (
                <>
                  <Mic size={12} /> Dictate
                </>
              )}
            </button>
          ) : (
            <span
              title="Dictation is not supported in this browser. Type your message instead."
              className="flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.015] px-2 font-mono text-[7.5px] uppercase tracking-[0.08em] text-[#4f5262]"
            >
              <Mic size={11} /> Dictate
            </span>
          )}

          <span className="hidden items-center gap-1 font-mono text-[7px] uppercase tracking-[0.07em] text-[#4f5262] sm:flex">
            <Keyboard size={9} /> Enter to send · Shift+Enter newline
          </span>

          {characters > 600 ? (
            <span
              className={cn(
                "ml-auto font-mono text-[7.5px] tabular-nums",
                characters > 1800 ? "text-amber-300" : "text-[#6f7284]",
              )}
            >
              {characters} chars
            </span>
          ) : null}

          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            title={streaming ? "Waiting for the current reply" : "Send message"}
            className={cn(
              "ml-auto flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition-all",
              !value.trim() || disabled
                ? "bg-white/[0.05] text-[#5f6273]"
                : "bg-[#6c63ff] text-white shadow-[0_4px_16px_rgba(108,99,255,0.35)] hover:bg-[#7a72ff]",
            )}
          >
            {streaming ? <Square size={11} /> : <ArrowUp size={13} />}
            <span className="hidden sm:inline">{streaming ? "Streaming" : "Send"}</span>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-2 flex max-w-[860px] flex-wrap items-center gap-x-3 gap-y-1 px-1">
        <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#4f5262]">
          Practice estimate — not a hiring decision
        </p>
        <span className="hidden h-1 w-1 rounded-full bg-white/10 sm:block" />
        <p className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.08em] text-[#4f5262]">
          <Volume2 size={8} /> Voice replies {streaming ? "queued" : "available"}
        </p>
      </div>
    </div>
  );
}
