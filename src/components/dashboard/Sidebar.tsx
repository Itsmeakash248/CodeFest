"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import Logo, { LogoMark } from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { AgentGlyph } from "@/components/ui/AgentIcon";
import { AGENTS, AGENT_MAP } from "@/lib/agents/agents";
import { useChatStore } from "@/lib/store/chat-store";
import { logout } from "@/lib/client/api";
import { initials, relativeTime } from "@/components/dashboard/utils";
import { cn } from "@/components/ui/cn";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  open: boolean;
  onClose: () => void;
  mode: "chat" | "workflow";
  onModeChange: (mode: "chat" | "workflow") => void;
  onNewChat: () => void;
  user: { name: string; email: string };
  robotOnline: boolean | null;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  open,
  onClose,
  mode,
  onModeChange,
  onNewChat,
  user,
  robotOnline,
}: SidebarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const sessions = useChatStore((state) => state.sessions);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const activeAgentId = useChatStore((state) => state.activeAgentId);
  const setActiveAgent = useChatStore((state) => state.setActiveAgent);
  const openSession = useChatStore((state) => state.openSession);
  const deleteSession = useChatStore((state) => state.deleteSession);

  const recents = useMemo(
    () => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10),
    [sessions],
  );

  async function signOut() {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      aria-label="Agents and session history"
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[276px] shrink-0 flex-col border-r border-white/[0.06] bg-[var(--color-surface)] transition-[transform,width] duration-300 ease-out lg:static lg:z-auto lg:translate-x-0",
        collapsed ? "lg:w-[76px]" : "lg:w-[276px]",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div
        className={cn(
          "flex h-[64px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-3",
          collapsed && "lg:justify-center lg:px-2",
        )}
      >
        <Link href="/" aria-label="ViewPilot home" className="min-w-0">
          {collapsed ? <LogoMark size={26} className="hidden lg:block" /> : null}
          <span className={cn(collapsed && "lg:hidden")}>
            <Logo size={24} />
          </span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)] lg:hidden"
        >
          <X size={16} />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "hidden h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text-primary)] lg:flex",
            collapsed ? "absolute -right-3 top-[52px] z-10 bg-[var(--color-surface-container)]" : "ml-auto",
          )}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-3">
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New session"
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-[#6c63ff]/30 bg-[#6c63ff]/12 px-3 py-2.5 text-[12px] font-semibold text-[var(--color-tertiary)] transition-colors hover:bg-[#6c63ff]/18",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <Plus size={14} />
          <span className={cn(collapsed && "lg:hidden")}>New session</span>
        </button>

        <div
          className={cn(
            "mt-2 grid grid-cols-2 gap-0.5 rounded-lg border border-white/[0.06] bg-[var(--color-surface-container)] p-[3px]",
            collapsed && "lg:grid-cols-1",
          )}
        >
          <button
            type="button"
            onClick={() => onModeChange("chat")}
            aria-pressed={mode === "chat"}
            title="Chat mode"
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 font-mono text-[7.5px] font-semibold uppercase tracking-[0.08em] transition-colors",
              mode === "chat" ? "bg-[var(--color-surface-container-high)] text-[var(--color-text-primary)]" : "text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)]",
            )}
          >
            <MessageSquare size={10} />
            <span className={cn(collapsed && "lg:hidden")}>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("workflow")}
            aria-pressed={mode === "workflow"}
            title="Workflow mode"
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 font-mono text-[7.5px] font-semibold uppercase tracking-[0.08em] transition-colors",
              mode === "workflow" ? "bg-[var(--color-surface-container-high)] text-[var(--color-text-primary)]" : "text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)]",
            )}
          >
            <Workflow size={10} />
            <span className={cn(collapsed && "lg:hidden")}>Flow</span>
          </button>
        </div>

        <div className={cn("mt-4", collapsed && "lg:mt-2")}>
          <div className={cn("flex items-center justify-between px-1", collapsed && "lg:justify-center")}>
            <span className={cn("label", collapsed && "lg:hidden")}>Agents</span>
            <span className="hidden font-mono text-[7px] text-[var(--color-text-faint)] lg:inline">{AGENTS.length}</span>
          </div>

          <div className="mt-1.5 space-y-0.5">
            {AGENTS.map((agent) => {
              const active = agent.id === activeAgentId;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setActiveAgent(agent.id);
                    onModeChange("chat");
                    onClose();
                  }}
                  aria-pressed={active}
                  title={collapsed ? agent.name : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
                    active
                      ? "border-white/[0.08] bg-[var(--color-surface-container-high)]"
                      : "border-transparent hover:bg-[var(--color-surface-container)]",
                    collapsed && "lg:justify-center lg:px-0",
                  )}
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-[var(--color-tertiary)]" />
                  ) : null}
                  <AgentGlyph agentId={agent.id} boxed size={12} boxSize="h-7 w-7" />
                  <span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
                    <span
                      className={cn(
                        "block truncate text-[11.5px] font-medium",
                        active ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)] group-hover:text-[var(--color-text-primary)]",
                      )}
                    >
                      {agent.shortName}
                    </span>
                    <span className="block truncate font-mono text-[7px] uppercase tracking-[0.04em] text-[var(--color-text-faint)]">
                      {agent.tagline}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn("mt-5", collapsed && "lg:hidden")}>
          <div className="flex items-center justify-between px-1">
            <span className="label">Recent</span>
            <span className="font-mono text-[7px] text-[var(--color-text-faint)]">{recents.length}</span>
          </div>

          <div className="mt-1.5 space-y-0.5">
            {recents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.07] px-3 py-4">
                <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">No rehearsals yet</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--color-text-faint)]">
                  Your sessions will appear here.
                </p>
              </div>
            ) : (
              recents.map((session) => {
                const active = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors",
                      active
                        ? "border-[#6c63ff]/20 bg-[#6c63ff]/[0.07]"
                        : "border-transparent hover:bg-[var(--color-surface-container)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        openSession(session.id);
                        onModeChange("chat");
                        onClose();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-current={active ? "true" : undefined}
                    >
                      <AgentGlyph
                        agentId={session.agentId}
                        boxed
                        size={9}
                        boxSize="h-6 w-6"
                        className="rounded-md"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[10.5px]",
                            active ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]",
                          )}
                        >
                          {session.title}
                        </span>
                        <span className="block truncate font-mono text-[6.5px] uppercase tracking-[0.05em] text-[var(--color-text-faint)]">
                          {AGENT_MAP[session.agentId].shortName} · {relativeTime(session.updatedAt)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSession(session.id)}
                      aria-label={`Delete session ${session.title}`}
                      title="Delete session"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-text-faint)] opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border border-white/[0.05] bg-[var(--color-surface-container)] px-2.5 py-2",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                robotOnline ? "bg-emerald-400" : "bg-[var(--color-text-faint)]",
              )}
            />
            <span className={cn("min-w-0 flex-1 truncate font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]", collapsed && "lg:hidden")}>
              {robotOnline === null
                ? "Robot optional · checking"
                : robotOnline
                  ? "Robot optional · online"
                  : "Robot optional · offline"}
            </span>
            <span className={cn("font-mono text-[6.5px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]", collapsed && "lg:hidden")}>
              LAN
            </span>
          </div>

          <div
            className={cn(
              "mt-2 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] p-2",
              collapsed && "lg:flex-col lg:gap-1 lg:bg-transparent lg:p-0",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c74ff] to-[#3c34a8] text-[9px] font-bold text-[var(--color-text-primary)]">
              {initials(user.name)}
            </span>
            <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <p className="truncate text-[10.5px] font-medium text-[var(--color-text-primary)]">{user.name}</p>
              <p className="truncate font-mono text-[6.5px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
                {user.email}
              </p>
            </div>
            <ThemeToggle className="!h-6 !w-6 !border-transparent !bg-transparent hover:!bg-[var(--color-surface-container)]" />
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-primary)]",
                collapsed && "lg:mt-1",
              )}
            >
              <Settings size={12} />
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={loggingOut}
              aria-label="Log out"
              title="Log out"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-faint)] transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50",
                collapsed && "lg:mt-1",
              )}
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
