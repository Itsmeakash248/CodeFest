"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  PanelRight,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
  Workflow,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import ChatPanel from "@/components/dashboard/ChatPanel";
import WorkflowBuilder from "@/components/dashboard/WorkflowBuilder";
import StatusPanel from "@/components/dashboard/StatusPanel";
import ToastStack from "@/components/ui/ToastStack";
import { useToasts } from "@/components/ui/useToasts";
import { AgentGlyph } from "@/components/ui/AgentIcon";
import { useChatStore } from "@/lib/store/chat-store";
import { fetchRobotStatus } from "@/lib/client/api";
import { AGENT_MAP } from "@/lib/agents/agents";
import { isAgentId } from "@/lib/agents/agents";
import { cn } from "@/components/ui/cn";

type Mode = "chat" | "workflow";

interface DashboardShellProps {
  user: { name: string; email: string };
  initialAgent?: string;
  initialMode?: string;
}

export default function DashboardShell({ user, initialAgent, initialMode }: DashboardShellProps) {
  const router = useRouter();
  const { toasts, push, dismiss } = useToasts();
  const [mode, setMode] = useState<Mode>(initialMode === "workflow" ? "workflow" : "chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [robotOnline, setRobotOnline] = useState<boolean | null>(null);

  const activeAgentId = useChatStore((state) => state.activeAgentId);
  const hydrated = useChatStore((state) => state.hydrated);
  const setActiveAgent = useChatStore((state) => state.setActiveAgent);
  const newSession = useChatStore((state) => state.newSession);
  const agent = AGENT_MAP[activeAgentId];

  useEffect(() => {
    if (!hydrated) return;
    if (initialAgent && isAgentId(initialAgent)) {
      if (useChatStore.getState().activeAgentId !== initialAgent) setActiveAgent(initialAgent);
    }
  }, [hydrated, initialAgent, setActiveAgent]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("viewpilot.voiceReplies") === "1") setVoiceReplies(true);
    } catch {
      // ignore private mode
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchRobotStatus()
      .then((state) => {
        if (alive) setRobotOnline(Boolean(state.configured && state.online));
      })
      .catch(() => {
        if (alive) setRobotOnline(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen && !rightOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSidebarOpen(false);
      setRightOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen, rightOpen]);

  function changeMode(next: Mode) {
    setMode(next);
    if (next === "workflow") setSidebarOpen(false);
  }

  function startNewChat() {
    setMode("chat");
    newSession(activeAgentId);
    setSidebarOpen(false);
  }

  function toggleVoice() {
    setVoiceReplies((current) => {
      const next = !current;
      try {
        window.localStorage.setItem("viewpilot.voiceReplies", next ? "1" : "0");
      } catch {
        // ignore
      }
      if (!next) {
        void import("@/lib/voice/browser").then((module) => module.stopSpeaking());
      }
      return next;
    });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0a0a0f]">
      {/* mobile scrims */}
      {(sidebarOpen || rightOpen) && (
        <button
          type="button"
          aria-label="Close open panel"
          onClick={() => {
            setSidebarOpen(false);
            setRightOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      {rightOpen ? (
        <button
          type="button"
          aria-label="Close run panel"
          onClick={() => setRightOpen(false)}
          className="fixed inset-0 z-40 hidden bg-black/60 backdrop-blur-sm lg:block xl:hidden"
        />
      ) : null}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          mode={mode}
          onModeChange={changeMode}
          onNewChat={startNewChat}
          user={user}
          robotOnline={robotOnline}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[64px] shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0a0a0f]/85 px-3 backdrop-blur-xl sm:px-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open agent and history panel"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#b8b8c9] transition-colors hover:text-white lg:hidden"
            >
              <Menu size={16} />
            </button>

            <AgentGlyph agentId={activeAgentId} boxed size={15} boxSize="h-9 w-9" />
            <div className="min-w-0 max-w-[220px]">
              <p className="truncate font-display text-[13px] font-semibold text-white">{agent.name}</p>
              <p className="hidden truncate font-mono text-[8px] uppercase tracking-[0.08em] text-[#6f7284] sm:block">
                {agent.tagline}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Workspace mode"
              className="ml-2 flex shrink-0 items-center gap-0.5 rounded-xl border border-white/[0.07] bg-black/30 p-[3px]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "chat"}
                onClick={() => changeMode("chat")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] transition-all",
                  mode === "chat"
                    ? "bg-white/[0.09] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    : "text-[#6f7284] hover:text-[#b8b8c9]",
                )}
              >
                <MessageSquare size={11} /> Chat
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "workflow"}
                onClick={() => changeMode("workflow")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] transition-all",
                  mode === "workflow"
                    ? "bg-white/[0.09] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    : "text-[#6f7284] hover:text-[#b8b8c9]",
                )}
              >
                <Workflow size={11} /> Workflow
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/[0.07] px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.08em] text-emerald-300 xl:flex">
                <span className="h-1 w-1 animate-pulse-soft rounded-full bg-emerald-400" />
                Local fallback ready
              </span>

              {mode === "chat" ? (
                <button
                  type="button"
                  onClick={toggleVoice}
                  aria-pressed={voiceReplies}
                  aria-label={voiceReplies ? "Turn spoken replies off" : "Turn spoken replies on"}
                  title={voiceReplies ? "Spoken replies on" : "Spoken replies off"}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-lg border px-2 font-mono text-[7.5px] uppercase tracking-[0.08em] transition-colors",
                    voiceReplies
                      ? "border-[#6c63ff]/30 bg-[#6c63ff]/12 text-[#c9c5ff]"
                      : "border-white/[0.07] bg-white/[0.025] text-[#8b8ba3] hover:text-white",
                  )}
                >
                  {voiceReplies ? <Volume2 size={12} /> : <VolumeX size={12} />}
                  <span className="hidden md:inline">Voice</span>
                </button>
              ) : null}

              {mode === "chat" ? (
                <button
                  type="button"
                  onClick={startNewChat}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] font-medium text-[#c5c5d4] transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Plus size={13} />
                  <span className="hidden sm:inline">New chat</span>
                </button>
              ) : (
                <span className="hidden items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[7.5px] uppercase tracking-[0.08em] text-[#8b8ba3] sm:flex">
                  <Sparkles size={10} className="text-[#a8a2ff]" /> 9 node types
                </span>
              )}

              <button
                type="button"
                onClick={() => setRightOpen(true)}
                aria-label="Open runs and report panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#b8b8c9] transition-colors hover:text-white xl:hidden"
              >
                <PanelRight size={14} />
              </button>

              <button
                type="button"
                onClick={startNewChat}
                aria-label="New chat"
                className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-[#8b8ba3] transition-colors hover:text-white sm:flex md:hidden"
              >
                <Plus size={14} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1">
            {mode === "chat" ? (
              <ChatPanel
                activeAgentId={activeAgentId}
                voiceReplies={voiceReplies}
                onToast={push}
                onOpenWorkflow={() => changeMode("workflow")}
              />
            ) : (
              <WorkflowBuilder onToast={push} onOpenRight={() => setRightOpen(true)} />
            )}
          </div>
        </main>

        <StatusPanel
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          onToast={push}
          onOpenWorkflow={() => changeMode("workflow")}
          robotOnline={robotOnline}
          onRobotStatus={setRobotOnline}
        />
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
