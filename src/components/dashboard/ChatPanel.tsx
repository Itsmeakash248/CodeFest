"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, MessageSquare, RotateCcw, Sparkles, Square, Volume2 } from "lucide-react";
import type { AgentId, ChatMessage as ChatMessageType } from "@/lib/types";
import { AGENT_MAP } from "@/lib/agents/agents";
import { useChatStore } from "@/lib/store/chat-store";
import { streamChat } from "@/lib/client/api";
import { speakText, stopSpeaking, type SpeechHandle } from "@/lib/voice/browser";
import { uid } from "@/lib/text";
import ChatMessage from "@/components/dashboard/ChatMessage";
import Composer from "@/components/dashboard/Composer";
import { AgentGlyph } from "@/components/ui/AgentIcon";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/components/ui/cn";

interface ChatPanelProps {
  activeAgentId: AgentId;
  voiceReplies: boolean;
  onToast: (message: string, tone?: "success" | "error" | "info") => void;
  onOpenWorkflow: () => void;
}

interface ChatError {
  prompt: string;
  message: string;
}

export default function ChatPanel({ activeAgentId, voiceReplies, onToast, onOpenWorkflow }: ChatPanelProps) {
  const agent = AGENT_MAP[activeAgentId];
  const sessions = useChatStore((state) => state.sessions);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const hydrated = useChatStore((state) => state.hydrated);
  const addMessage = useChatStore((state) => state.addMessage);
  const appendToMessage = useChatStore((state) => state.appendToMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const newSession = useChatStore((state) => state.newSession);

  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<ChatError | null>(null);
  const [voiceMode, setVoiceMode] = useState<"elevenlabs" | "browser" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const speechRef = useRef<SpeechHandle | null>(null);
  const bootRef = useRef(false);

  const session = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );
  const messages = session?.messages ?? [];

  useEffect(() => {
    if (!hydrated) return;
    const state = useChatStore.getState();
    if (!state.activeSessionId) {
      state.newSession(state.activeAgentId);
    }
  }, [hydrated, activeAgentId]);

  useEffect(() => {
    if (!hydrated || bootRef.current) return;
    bootRef.current = true;
    const state = useChatStore.getState();
    if (!state.activeSessionId) state.newSession(state.activeAgentId);
  }, [hydrated]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    if (stickRef.current) node.scrollTop = node.scrollHeight;
  }, [messages.length, messages[messages.length - 1]?.content, streaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      speechRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (!voiceReplies) {
      speechRef.current?.stop();
      speechRef.current = null;
      setVoiceMode(null);
    }
  }, [voiceReplies]);

  function onScroll() {
    const node = listRef.current;
    if (!node) return;
    stickRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 110;
  }

  function speakReply(text: string) {
    if (!voiceReplies || !text.trim()) return;
    speechRef.current?.stop();
    void speakText(text, undefined, { onStart: (mode) => setVoiceMode(mode) })
      .then((handle) => {
        speechRef.current = handle;
        return handle.finished;
      })
      .then(() => setVoiceMode(null))
      .catch(() => setVoiceMode(null));
  }

  async function send(messageText?: string) {
    const prompt = (messageText ?? draft).trim();
    if (!prompt || streaming) return;

    const store = useChatStore.getState();
    const sessionId = store.activeSessionId ?? store.newSession(activeAgentId);
    const current = useChatStore.getState().sessions.find((item) => item.id === sessionId);
    const history = (current?.messages ?? [])
      .filter((message) => message.content.trim())
      .map((message) => ({ role: message.role, content: message.content }));

    const userMessage: ChatMessageType = {
      id: uid("msg"),
      role: "user",
      content: prompt,
      createdAt: Date.now(),
    };
    const assistantMessage: ChatMessageType = {
      id: uid("msg"),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    addMessage(sessionId, userMessage);
    addMessage(sessionId, assistantMessage);
    setDraft("");
    setChatError(null);
    setStreaming(true);
    setStreamingId(assistantMessage.id);
    stickRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;
    let received = "";
    let finalSource: "gemini" | "openrouter" | "local" | undefined;
    let finalLatency: number | undefined;
    let eventError: string | null = null;

    try {
      await streamChat({
        agent: activeAgentId,
        messages: [...history, { role: "user", content: prompt }],
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === "meta") {
            finalSource = event.source;
            updateMessage(sessionId, assistantMessage.id, { source: event.source });
          } else if (event.type === "delta") {
            received += event.text;
            appendToMessage(sessionId, assistantMessage.id, event.text);
          } else if (event.type === "done") {
            finalSource = event.source;
            finalLatency = event.latencyMs;
          } else if (event.type === "error") {
            eventError = event.message;
          }
        },
      });

      const latest =
        useChatStore.getState().sessions
          .find((item) => item.id === sessionId)
          ?.messages.find((item) => item.id === assistantMessage.id)?.content ?? received;

      if (eventError && !received) {
        updateMessage(sessionId, assistantMessage.id, {
          content: `**The reply stopped early.** ${eventError}`,
          source: "local",
          latencyMs: 0,
        });
        setChatError({ prompt, message: eventError });
        setDraft(prompt);
      } else if (!latest.trim()) {
        updateMessage(sessionId, assistantMessage.id, {
          content: "**No reply arrived.** The stream closed before the agent produced text. Try the prompt again.",
          source: "local",
          latencyMs: 0,
        });
        setChatError({ prompt, message: "The stream closed before a reply arrived." });
        setDraft(prompt);
      } else {
        updateMessage(sessionId, assistantMessage.id, {
          source: finalSource ?? "local",
          latencyMs: finalLatency,
        });
        speakReply(latest);
      }
    } catch (cause) {
      const aborted = cause instanceof DOMException && cause.name === "AbortError";
      if (!aborted) {
        const message =
          cause instanceof Error ? cause.message : "The agent could not be reached. Check the connection.";
        if (!received) {
          updateMessage(sessionId, assistantMessage.id, {
            content: `**That reply did not complete.** ${message}`,
            source: "local",
            latencyMs: 0,
          });
        }
        setChatError({ prompt, message });
        setDraft(prompt);
      }
    } finally {
      setStreaming(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  }

  function stopStream() {
    abortRef.current?.abort();
  }

  const starters = agent.starters;
  const showEmpty = messages.length === 0 && !streaming;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={listRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        <div className="mx-auto w-full max-w-[860px]">
          {session ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.018] px-3 py-2">
              <MessageSquare size={11} className="text-[#6f7284]" />
              <p className="min-w-0 flex-1 truncate text-[10.5px] text-[#9b9cae]">{session.title}</p>
              <span className="hidden font-mono text-[7px] uppercase tracking-[0.08em] text-[#565969] sm:inline">
                {messages.length} messages · saved locally
              </span>
            </div>
          ) : null}

          {showEmpty ? (
            <div className="animate-rise flex flex-col items-center px-2 pb-4 pt-6 text-center sm:pt-10">
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span className="orbit-ring inset-0" aria-hidden="true" />
                <AgentGlyph agentId={activeAgentId} boxed size={22} boxSize="h-12 w-12" />
              </span>
              <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.15em] text-[#6f7284]">
                {agent.shortName} · ready
              </p>
              <h2 className="mt-2 font-display text-[26px] font-semibold tracking-[-0.03em] text-white">
                Start with a prompt
              </h2>
              <p className="mt-2 max-w-[430px] text-[12px] leading-relaxed text-[#8d8d9f]">
                {agent.description}
              </p>

              <div className="mt-6 grid w-full max-w-[620px] gap-2 sm:grid-cols-3">
                {starters.map((starter, index) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => void send(starter)}
                    className="group flex h-full flex-col rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6c63ff]/30 hover:bg-[#6c63ff]/[0.06]"
                  >
                    <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#565969]">
                      0{index + 1}
                    </span>
                    <span className="mt-2 flex-1 text-[11.5px] leading-snug text-[#c5c5d4] group-hover:text-white">
                      {starter}
                    </span>
                    <ArrowRight
                      size={11}
                      className="mt-3 text-[#565969] transition-transform group-hover:translate-x-0.5 group-hover:text-[#c9c5ff]"
                    />
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {agent.capabilities.map((capability) => (
                  <span key={capability} className="chip !px-2 !py-1 !text-[8px]">
                    {capability}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2">
                <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[#6f7284]">
                  <Sparkles size={8} className="text-[#a8a2ff]" /> Local rubric ready
                </span>
                <span className="h-1 w-1 rounded-full bg-white/10" />
                <button
                  type="button"
                  onClick={onOpenWorkflow}
                  className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.08em] text-[#7fe8ff] transition-colors hover:text-white"
                >
                  Or run a workflow <ArrowRight size={8} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  agentId={activeAgentId}
                  streaming={message.id === streamingId}
                  onToast={onToast}
                />
              ))}

              {chatError ? (
                <div className="animate-msg flex gap-2.5" role="alert">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-400/20 bg-rose-500/[0.08] text-rose-300">
                    <AlertCircle size={13} />
                  </span>
                  <div className="min-w-0 flex-1 rounded-[16px] rounded-tl-[5px] border border-rose-400/20 bg-rose-500/[0.05] px-3.5 py-2.5">
                    <p className="text-[12px] font-medium text-rose-100">That reply did not land.</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#b8a8ad]">{chatError.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void send(chatError.prompt)}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2.5 py-1.5 text-[10.5px] font-medium text-rose-100 transition-colors hover:bg-rose-500/15"
                      >
                        <RotateCcw size={10} /> Retry that prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatError(null)}
                        className="rounded-lg px-2 py-1.5 text-[10.5px] text-[#8d8d9f] transition-colors hover:text-white"
                      >
                        Dismiss
                      </button>
                      <span className="font-mono text-[7px] uppercase tracking-[0.06em] text-[#6f7284]">
                        Your prompt was restored below
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {voiceMode ? (
        <div className="mx-auto flex w-full max-w-[860px] items-center gap-2 px-4 pb-1">
          <span className="flex items-center gap-1.5 rounded-full border border-[#6c63ff]/25 bg-[#6c63ff]/10 px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.08em] text-[#c9c5ff]">
            <Volume2 size={9} className="animate-pulse-soft" />
            {voiceMode === "elevenlabs" ? "ElevenLabs voice" : "Browser voice"}
          </span>
          <button
            type="button"
            onClick={() => {
              speechRef.current?.stop();
              stopSpeaking();
              setVoiceMode(null);
            }}
            className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-[#8b8ba3] transition-colors hover:text-white"
          >
            <Square size={7} /> Stop
          </button>
          <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#565969]">Reply audio</span>
        </div>
      ) : null}

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => void send()}
        disabled={false}
        streaming={streaming}
        agentName={agent.shortName}
        onToast={onToast}
      />
    </div>
  );
}
