"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AgentId, ChatMessage, ChatSession } from "@/lib/types";
import { AGENT_MAP } from "@/lib/agents/agents";
import { truncate, uid } from "@/lib/text";

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeAgentId: AgentId;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setActiveAgent: (agentId: AgentId) => void;
  newSession: (agentId?: AgentId) => string;
  openSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  appendToMessage: (sessionId: string, messageId: string, delta: string) => void;
  updateMessage: (sessionId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  clearAll: () => void;
}

function createSession(agentId: AgentId): ChatSession {
  const now = Date.now();
  return {
    id: uid("chat"),
    agentId,
    title: "New session",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      activeAgentId: "interview-coach",
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      setActiveAgent: (agentId) => {
        const existing = get()
          .sessions.filter((session) => session.agentId === agentId)
          .sort((a, b) => b.updatedAt - a.updatedAt)[0];
        if (existing) {
          set({ activeAgentId: agentId, activeSessionId: existing.id });
          return;
        }
        const session = createSession(agentId);
        set((state) => ({
          activeAgentId: agentId,
          activeSessionId: session.id,
          sessions: [session, ...state.sessions],
        }));
      },

      newSession: (agentId) => {
        const target = agentId ?? get().activeAgentId;
        const session = createSession(target);
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          activeAgentId: target,
        }));
        return session.id;
      },

      openSession: (id) => {
        const session = get().sessions.find((item) => item.id === id);
        if (!session) return;
        set({ activeSessionId: id, activeAgentId: session.agentId });
      },

      deleteSession: (id) => {
        set((state) => {
          const sessions = state.sessions.filter((session) => session.id !== id);
          const activeSessionId =
            state.activeSessionId === id ? sessions[0]?.id ?? null : state.activeSessionId;
          const activeAgentId =
            state.activeSessionId === id
              ? sessions[0]?.agentId ?? state.activeAgentId
              : state.activeAgentId;
          return { sessions, activeSessionId, activeAgentId };
        });
      },

      renameSession: (id, title) => {
        const clean = title.trim().slice(0, 80);
        if (!clean) return;
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, title: clean, updatedAt: Date.now() } : session,
          ),
        }));
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            const shouldTitle =
              session.title === "New session" && message.role === "user" && message.content.trim();
            return {
              ...session,
              title: shouldTitle
                ? truncate(message.content, 46)
                : session.title,
              messages: [...session.messages, message],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      appendToMessage: (sessionId, messageId, delta) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? { ...message, content: message.content + delta }
                      : message,
                  ),
                  updatedAt: Date.now(),
                }
              : session,
          ),
        }));
      },

      updateMessage: (sessionId, messageId, patch) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId ? { ...message, ...patch } : message,
                  ),
                  updatedAt: Date.now(),
                }
              : session,
          ),
        }));
      },

      clearAll: () => set({ sessions: [], activeSessionId: null }),
    }),
    {
      name: "viewpilot.chat.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        activeAgentId: state.activeAgentId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function agentLabel(agentId: AgentId): string {
  return AGENT_MAP[agentId]?.name ?? "Agent";
}
