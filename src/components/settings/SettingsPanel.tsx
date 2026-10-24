"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  Download,
  History,
  Info,
  Laptop,
  Loader2,
  LogOut,
  Mic,
  Play,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  Volume2,
  VolumeX,
  Workflow,
} from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Logo from "@/components/ui/Logo";
import ScoreRing from "@/components/ui/ScoreRing";
import ToastStack from "@/components/ui/ToastStack";
import { useToasts } from "@/components/ui/useToasts";
import {
  PREF_KEYS,
  readPreference,
  readStoredFlag,
  removePreference,
  writePreference,
  writeStoredFlag,
} from "@/components/preferences";
import { speakText, stopSpeaking } from "@/lib/voice/browser";
import { DEFAULT_VOICE, VOICES, type VoiceOption } from "@/lib/voice/voices";
import {
  fetchCloudReports,
  fetchRobotStatus,
  fetchStatus,
  login,
  logout,
  saveCloudReport,
  setRobotExpression,
  type ProviderStatus,
  type RobotState,
} from "@/lib/client/api";
import { clearLatestReport, saveLatestReport } from "@/lib/store/interview-store";
import { useChatStore } from "@/lib/store/chat-store";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { initials } from "@/components/dashboard/utils";
import { cn } from "@/components/ui/cn";
import type { InterviewReport, InterviewSetup } from "@/lib/types";

type ConfirmKind = "history" | "workspace" | "all" | null;
type RobotExpression = "happy" | "thinking" | "listening";

interface SettingsPanelProps {
  user: { name: string; email: string };
}

const NAV = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "voice", label: "Voice", icon: Volume2 },
  { id: "workspace", label: "Workspace", icon: SlidersHorizontal },
  { id: "providers", label: "Engine status", icon: Cpu },
  { id: "data", label: "Local data", icon: Database },
  { id: "about", label: "About", icon: Info },
] as const;

const ROBOT_OPTIONS: { id: RobotExpression; label: string }[] = [
  { id: "happy", label: "Encourage" },
  { id: "thinking", label: "Evaluate" },
  { id: "listening", label: "Listen" },
];

function readJson<T>(key: string): T | null {
  const raw = readPreference(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function persistedState(key: string): Record<string, unknown> | null {
  const parsed = readJson<{ state?: unknown }>(key);
  if (!parsed || typeof parsed !== "object" || !parsed.state || typeof parsed.state !== "object") {
    return null;
  }
  return parsed.state as Record<string, unknown>;
}

function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Unknown date";
  }
}

export default function SettingsPanel({ user }: SettingsPanelProps) {
  const router = useRouter();
  const { toasts, push, dismiss } = useToasts();

  const [activeSection, setActiveSection] = useState<string>("profile");
  const [name, setName] = useState(user.name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [voiceId, setVoiceId] = useState("");
  const [interviewVoice, setInterviewVoice] = useState(false);
  const [chatVoice, setChatVoice] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const previewToken = useRef(0);

  const [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [robot, setRobot] = useState<RobotState | null>(null);
  const [robotSending, setRobotSending] = useState<RobotExpression | null>(null);
  const [robotNote, setRobotNote] = useState<string | null>(null);

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [lastSetup, setLastSetup] = useState<InterviewSetup | null>(null);
  const [chatCount, setChatCount] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const refreshLocalData = useCallback(() => {
    const storedReport = readJson<InterviewReport>(PREF_KEYS.latestReport);
    setReport(
      storedReport &&
        typeof storedReport.overall === "number" &&
        Array.isArray(storedReport.dimensions)
        ? storedReport
        : null,
    );

    const storedSetup = readJson<InterviewSetup>(PREF_KEYS.lastSetup);
    setLastSetup(storedSetup && typeof storedSetup.role === "string" ? storedSetup : null);

    const chatState = persistedState("viewpilot.chat.v1");
    setChatCount(Array.isArray(chatState?.sessions) ? chatState.sessions.length : 0);

    const workflowState = persistedState("viewpilot.workflow.v1");
    setRunCount(Array.isArray(workflowState?.runs) ? workflowState.runs.length : 0);
    setNodeCount(Array.isArray(workflowState?.nodes) ? workflowState.nodes.length : 0);
  }, []);

  const loadProviders = useCallback(async () => {
    setStatusBusy(true);
    setStatusError(false);
    try {
      const nextProvider = await fetchStatus();
      setProvider(nextProvider);
    } catch {
      setStatusError(true);
    }
    try {
      const nextRobot = await fetchRobotStatus();
      setRobot(nextRobot);
    } catch {
      setRobot({ configured: false, online: false });
    } finally {
      setStatusBusy(false);
    }
  }, []);

  useEffect(() => {
    setInterviewVoice(readStoredFlag(PREF_KEYS.interviewVoice));
    setChatVoice(readStoredFlag(PREF_KEYS.chatVoice));
    const storedVoice = readPreference(PREF_KEYS.voiceId);
    setVoiceId(storedVoice && VOICES.some((voice) => voice.voiceId === storedVoice) ? storedVoice : "");
    refreshLocalData();
    void loadProviders();
  }, [loadProviders, refreshLocalData]);

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  useEffect(() => {
    const sections = NAV.map((item) => document.getElementById(item.id)).filter(
      (element): element is HTMLElement => Boolean(element),
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      previewToken.current += 1;
      stopSpeaking();
    };
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      push("Enter a name with at least two characters.", "error");
      return;
    }
    if (clean === user.name) {
      push("Your profile is already up to date.", "info");
      return;
    }
    setSavingProfile(true);
    try {
      await login(user.email, clean);
      setName(clean);
      push("Display name updated.", "success");
      router.refresh();
    } catch (cause) {
      push(cause instanceof Error ? cause.message : "Could not update the profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    stopSpeaking();
    try {
      await logout();
      router.push("/");
      router.refresh();
    } catch {
      push("Could not sign out. Try again.", "error");
      setSigningOut(false);
    }
  }

  function chooseVoice(voice: VoiceOption) {
    setVoiceId(voice.voiceId);
    writePreference(PREF_KEYS.voiceId, voice.voiceId);
    push(`${voice.name} is now your interviewer voice.`, "success");
  }

  async function previewVoice(voice: VoiceOption) {
    if (previewing === voice.id) {
      previewToken.current += 1;
      stopSpeaking();
      setPreviewing(null);
      return;
    }
    previewToken.current += 1;
    const token = previewToken.current;
    stopSpeaking();
    setPreviewing(voice.id);
    const handle = await speakText(
      `Hi, I'm ${voice.name}. Let's rehearse your next interview.`,
      voice.voiceId,
    );
    if (token !== previewToken.current) {
      handle.stop();
      return;
    }
    if (handle.mode === "browser") {
      push("Playing with the browser voice — ElevenLabs is not configured.", "info");
    }
    try {
      await handle.finished;
    } finally {
      if (token === previewToken.current) setPreviewing(null);
    }
  }

  function toggleInterviewVoice() {
    const next = !interviewVoice;
    setInterviewVoice(next);
    writeStoredFlag(PREF_KEYS.interviewVoice, next);
    if (!next) {
      previewToken.current += 1;
      stopSpeaking();
      setPreviewing(null);
    }
    push(next ? "Interview questions will be read aloud." : "Question audio is off.", "success");
  }

  function toggleChatVoice() {
    const next = !chatVoice;
    setChatVoice(next);
    writeStoredFlag(PREF_KEYS.chatVoice, next);
    if (!next) stopSpeaking();
    push(next ? "Agent replies can be spoken in the workspace." : "Spoken agent replies are off.", "success");
  }

  async function sendRobot(expression: RobotExpression) {
    if (robotSending) return;
    setRobotSending(expression);
    setRobotNote(null);
    try {
      const next = await setRobotExpression(expression);
      setRobot((current) => ({
        ...(current ?? { configured: false, online: false }),
        ...next,
        online: Boolean(next.sent || next.online),
      }));
      setRobotNote(
        next.sent
          ? `“${expression}” sent to the presence robot.`
          : "No robot bridge on this network. The interview works without it.",
      );
    } catch {
      setRobotNote("The robot did not acknowledge. The local interview is unaffected.");
    } finally {
      setRobotSending(null);
    }
  }

  function exportLocalData() {
    const payload = {
      app: "ViewPilot Pro",
      version: "0.1.0",
      exportedAt: new Date().toISOString(),
      account: { name: user.name, email: user.email },
      preferences: {
        interviewerVoice: voiceId || DEFAULT_VOICE.voiceId,
        readQuestionsAloud: interviewVoice,
        spokenAgentReplies: chatVoice,
      },
      practice: {
        latestReport: readJson<InterviewReport>(PREF_KEYS.latestReport),
        lastSetup: readJson<InterviewSetup>(PREF_KEYS.lastSetup),
      },
      chat: persistedState("viewpilot.chat.v1"),
      workflow: persistedState("viewpilot.workflow.v1"),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `viewpilot-local-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    push("Local data exported as JSON.", "success");
  }

  function clearPracticeHistory() {
    clearLatestReport();
    removePreference(PREF_KEYS.lastSetup);
    previewToken.current += 1;
    stopSpeaking();
    setPreviewing(null);
    refreshLocalData();
    push("Practice report and saved setup cleared.", "success");
  }

  function clearWorkspaceData() {
    useChatStore.getState().clearAll();
    useWorkflowStore.getState().clearRuns();
    useWorkflowStore.getState().clearNodes();
    refreshLocalData();
    push("Chat sessions and workflow runs cleared.", "success");
  }

  function resetAllData() {
    clearLatestReport();
    removePreference(PREF_KEYS.lastSetup);
    removePreference(PREF_KEYS.voiceId);
    removePreference(PREF_KEYS.interviewVoice);
    removePreference(PREF_KEYS.chatVoice);
    useChatStore.getState().clearAll();
    useWorkflowStore.getState().clearRuns();
    useWorkflowStore.getState().clearNodes();
    try {
      window.localStorage.removeItem("viewpilot.chat.v1");
      window.localStorage.removeItem("viewpilot.workflow.v1");
    } catch {
      // Storage may be unavailable in private mode.
    }
    setVoiceId("");
    setInterviewVoice(false);
    setChatVoice(false);
    previewToken.current += 1;
    stopSpeaking();
    setPreviewing(null);
    refreshLocalData();
    push("All local practice data has been reset.", "success");
  }

  const [syncingCloud, setSyncingCloud] = useState(false);
  const [pullingCloud, setPullingCloud] = useState(false);

  async function syncLocalToCloud() {
    if (!report) {
      push("No local interview report found to sync.", "info");
      return;
    }
    setSyncingCloud(true);
    try {
      const res = await saveCloudReport(report);
      if (res.ok) {
        push(
          res.source === "supabase"
            ? "Report successfully synced to Supabase Cloud!"
            : "Report cached locally (Demo mode).",
          "success",
        );
      } else {
        push("Could not sync report to cloud.", "error");
      }
    } catch (err) {
      push(err instanceof Error ? err.message : "Sync failed.", "error");
    } finally {
      setSyncingCloud(false);
    }
  }

  async function pullFromCloud() {
    setPullingCloud(true);
    try {
      const reports = await fetchCloudReports();
      if (reports.length > 0) {
        saveLatestReport(reports[0]);
        refreshLocalData();
        push(`Pulled latest report from Supabase Cloud (${reports.length} available).`, "success");
      } else {
        push("No cloud reports found for your account.", "info");
      }
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not fetch cloud reports.", "error");
    } finally {
      setPullingCloud(false);
    }
  }

  const selectedVoiceId = voiceId || DEFAULT_VOICE.voiceId;
  const robotOnline = Boolean(robot?.configured && robot.online);
  const elevenLabsReady = provider?.elevenlabs === true;

  const confirmCopy =
    confirm === "history"
      ? {
          title: "Clear practice history?",
          body: "This removes the latest report and the saved interview setup from this browser. It does not touch your conversations or workflows.",
          confirmLabel: "Clear practice history",
        }
      : confirm === "workspace"
        ? {
            title: "Clear workspace data?",
            body: `This removes ${chatCount} saved conversation${chatCount === 1 ? "" : "s"} and ${runCount} workflow run${runCount === 1 ? "" : "s"} from this browser.`,
            confirmLabel: "Clear workspace data",
          }
        : {
            title: "Reset all local data?",
            body: "This removes your report, saved setup, voice preferences, conversations and workflow runs. Your demo sign-in stays active.",
            confirmLabel: "Reset everything",
          };

  return (
    <div id="top" className="relative min-h-dvh overflow-x-hidden bg-[var(--color-background)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="aurora left-[-8%] top-[-12%] h-[520px] w-[520px] bg-[#6c63ff]/[0.12]" />
        <div className="aurora bottom-[-16%] right-[-10%] h-[480px] w-[480px] bg-[var(--color-info-strong)]/[0.07]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--color-background)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1220px] items-center gap-3 px-5 sm:px-8">
          <Link href="/" aria-label="ViewPilot Pro home" className="shrink-0">
            <Logo size={24} />
          </Link>
          <span aria-hidden="true" className="hidden h-5 w-px bg-[var(--color-surface-container-high)] sm:block" />
          <div className="hidden sm:block">
            <p className="font-display text-[12.5px] font-semibold leading-tight text-[var(--color-text-primary)]">Settings</p>
            <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              Local-first preferences
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/interview"
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2.5 text-[11px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)] sm:flex"
            >
              <Mic size={12} />
              New interview
            </Link>
            <Link href="/dashboard" className="btn btn-primary !px-3 !py-2 !text-[11.5px]">
              Workspace
              <ArrowUpRight size={12} />
            </Link>
            <span
              title={`${name} · ${user.email}`}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7c74ff] to-[#3c34a8] text-[9px] font-bold text-[var(--color-text-primary)]"
            >
              {initials(name)}
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1220px] px-5 pb-16 pt-9 sm:px-8 lg:pt-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="label">Preferences</span>
            <h1 className="mt-3 font-display text-[40px] font-semibold leading-[0.96] tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-[52px]">
              Set up your <span className="text-gradient">room.</span>
            </h1>
            <p className="mt-3 max-w-[520px] text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              Voice, workspace and local data. Everything here stays in this browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip chip-success">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Local-first
            </span>
            <span className="chip">Demo session</span>
            <span className="chip">No password stored</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-9">
          <aside className="min-w-0">
            <nav
              aria-label="Settings sections"
              className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:block lg:overflow-visible lg:pb-0"
            >
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    aria-current={active ? "true" : undefined}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "group flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[11.5px] transition-colors lg:mb-0.5 lg:w-full",
                      active
                        ? "border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[var(--color-text-primary)]"
                        : "border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-primary)]",
                    )}
                  >
                    <Icon size={13} className={active ? "text-[var(--color-tertiary)]" : "text-[var(--color-text-faint)]"} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    <ChevronRight
                      size={11}
                      className={cn(
                        "ml-auto hidden lg:block",
                        active ? "text-[var(--color-tertiary)]" : "text-[var(--color-text-faint)]",
                      )}
                    />
                  </a>
                );
              })}
            </nav>

            <div className="mt-5 hidden rounded-2xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3.5 lg:block">
              <p className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.12em] text-emerald-300">
                <ShieldCheck size={10} /> Private by default
              </p>
              <p className="mt-2 text-[10.5px] leading-relaxed text-[var(--color-text-faint)]">
                Reports, conversations and preferences live in localStorage. Nothing here is uploaded.
              </p>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {/* profile */}
            <Panel
              id="profile"
              icon={UserRound}
              eyebrow="Account"
              title="Profile"
              description="The identity used in the workspace and on exported reports."
            >
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7c74ff] to-[#3c34a8] text-[14px] font-bold text-[var(--color-text-primary)]">
                  {initials(name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">{name}</p>
                  <p className="truncate font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                    {user.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip chip-success">Demo</span>
                  <span className="chip">No password</span>
                </div>
              </div>

              <form onSubmit={saveProfile} className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-name" className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-primary)]">
                    Display name
                  </label>
                  <input
                    id="settings-name"
                    type="text"
                    value={name}
                    maxLength={80}
                    autoComplete="name"
                    onChange={(event) => setName(event.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="settings-email" className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-primary)]">
                    Email
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    value={user.email}
                    readOnly
                    className="input cursor-not-allowed !text-[var(--color-text-faint)]"
                    aria-describedby="settings-email-note"
                  />
                  <p id="settings-email-note" className="mt-1.5 text-[10px] text-[var(--color-text-faint)]">
                    Demo identity. Switch accounts from the sign-out action.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 sm:col-span-2">
                  <Button type="submit" variant="primary" size="sm" loading={savingProfile}>
                    Save profile
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void signOut()}
                    loading={signingOut}
                  >
                    <LogOut size={12} />
                    Sign out
                  </Button>
                  <span className="text-[10px] text-[var(--color-text-faint)]">
                    An unsigned, httpOnly demo cookie keeps the session.
                  </span>
                </div>
              </form>
            </Panel>

            {/* voice */}
            <Panel
              id="voice"
              icon={Volume2}
              eyebrow="Interview"
              title="Interviewer voice"
              description="Used when questions are read aloud. Saved as soon as you choose."
              action={
                <span className={cn("chip", elevenLabsReady ? "chip-success" : "chip-cyan")}>
                  <Volume2 size={9} />
                  {provider ? (elevenLabsReady ? "ElevenLabs ready" : "Browser fallback") : "Checking voice"}
                </span>
              }
            >
              <ToggleRow
                icon={interviewVoice ? Volume2 : VolumeX}
                title="Read questions aloud"
                description="Every new prompt speaks automatically. You can still mute mid-session."
                checked={interviewVoice}
                onChange={toggleInterviewVoice}
                label="Read interview questions aloud"
              />

              <div className="mt-4 flex items-center justify-between px-0.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                  Voice profile
                </p>
                <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                  {VOICES.length} voices
                </span>
              </div>

              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {VOICES.map((voice) => {
                  const selected = selectedVoiceId === voice.voiceId;
                  const playing = previewing === voice.id;
                  return (
                    <div
                      key={voice.id}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border p-2 transition-colors",
                        selected
                          ? "border-[#6c63ff]/35 bg-[#6c63ff]/[0.08]"
                          : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => chooseVoice(voice)}
                        aria-pressed={selected}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff]/50"
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold",
                            selected
                              ? "border-[#6c63ff]/35 bg-[#6c63ff]/20 text-[var(--color-tertiary)]"
                              : "border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-faint)]",
                          )}
                        >
                          {selected ? <Check size={11} /> : voice.name.slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-medium text-[var(--color-text-primary)]">
                            {voice.name}
                          </span>
                          <span className="block truncate text-[9.5px] text-[var(--color-text-faint)]">
                            {voice.description}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void previewVoice(voice)}
                        aria-label={playing ? `Stop ${voice.name} sample` : `Preview ${voice.name}`}
                        title={playing ? "Stop sample" : "Play sample"}
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff]/50",
                          playing
                            ? "border-[var(--color-info-strong)]/30 bg-[var(--color-info-strong)]/12 text-[var(--color-info)]"
                            : "border-white/[0.06] bg-[var(--color-surface-container)] text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)]",
                        )}
                      >
                        {playing ? <Square size={8} /> : <Play size={10} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-[var(--color-text-faint)]">
                <ShieldCheck size={11} className="mt-0.5 shrink-0 text-emerald-300/70" />
                Voice choice and the read-aloud flag stay in localStorage. Browser speech takes over if
                ElevenLabs is unavailable.
              </p>
            </Panel>

            {/* workspace */}
            <Panel
              id="workspace"
              icon={SlidersHorizontal}
              eyebrow="Workspace"
              title="Workspace"
              description="Small defaults for the agent desk and workflow builder."
            >
              <div className="grid gap-2">
                <ToggleRow
                  icon={chatVoice ? Volume2 : VolumeX}
                  title="Spoken agent replies"
                  description="Read new agent messages aloud in the workspace."
                  checked={chatVoice}
                  onChange={toggleChatVoice}
                  label="Speak agent replies in the workspace"
                />
              </div>

              <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
                <QuickLink href="/dashboard" icon={Laptop} title="Agent desk" detail="Five specialists" />
                <QuickLink
                  href="/dashboard?mode=workflow"
                  icon={Workflow}
                  title="Workflow"
                  detail={`${nodeCount} saved node${nodeCount === 1 ? "" : "s"}`}
                />
                <QuickLink href="/interview" icon={Mic} title="Interview" detail="Five questions" />
              </div>

              <p className="mt-3 text-[10px] leading-relaxed text-[var(--color-text-faint)]">
                Conversation history is local. Clearing it below cannot be undone.
              </p>
            </Panel>

            {/* providers */}
            <Panel
              id="providers"
              icon={Cpu}
              eyebrow="Runtime"
              title="Engine status"
              description="AI API connection required for agents, robot optional."
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadProviders()}
                  loading={statusBusy}
                  className="!px-2.5 !py-1.5 !text-[10.5px]"
                >
                  {!statusBusy ? <RefreshCw size={11} /> : null}
                  Refresh
                </Button>
              }
            >
              {statusError ? (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-rose-200"
                >
                  <Info size={12} className="mt-0.5 shrink-0 text-rose-300" />
                  Provider status is unavailable. Could not verify API connection.
                </div>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  <StatusTile
                    icon={Sparkles}
                    label="AI Agent API"
                    value={
                      !provider
                        ? "Checking…"
                        : provider.connected
                          ? "Connected"
                          : "Not connected (Error)"
                    }
                    tone={provider?.connected ? "violet" : "rose"}
                  />
                  <StatusTile
                    icon={ShieldCheck}
                    label="Interview rubric"
                    value={provider ? "Deterministic · active" : "Checking…"}
                    tone="emerald"
                  />
                  <StatusTile
                    icon={Sparkles}
                    label="Gemini"
                    value={!provider ? "Checking…" : provider.gemini ? "Connected" : "Not connected"}
                    tone={provider?.gemini ? "violet" : "rose"}
                  />
                  <StatusTile
                    icon={Cloud}
                    label="OpenRouter"
                    value={!provider ? "Checking…" : provider.openrouter ? "Connected" : "Not connected"}
                    tone={provider?.openrouter ? "cyan" : "muted"}
                  />
                  <StatusTile
                    icon={Volume2}
                    label="ElevenLabs"
                    value={!provider ? "Checking…" : elevenLabsReady ? "Voice ready" : "Not connected"}
                    tone={elevenLabsReady ? "cyan" : "muted"}
                  />
                  <StatusTile
                    icon={Database}
                    label="Supabase Cloud"
                    value={
                      !provider
                        ? "Checking…"
                        : provider.supabase
                          ? "Connected · RLS active"
                          : "Demo mode · Local-first"
                    }
                    tone={provider?.supabase ? "emerald" : "muted"}
                  />
                  <StatusTile
                    icon={Bot}
                    label="Presence robot"
                    value={
                      !robot
                        ? "Checking…"
                        : robotOnline
                          ? "Linked on LAN"
                          : robot.configured
                            ? "Configured · offline"
                            : "Optional · not set"
                    }
                    tone={robotOnline ? "emerald" : "muted"}
                  />
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/[0.05] bg-[var(--color-surface-container)] px-3 py-2 font-mono text-[7.5px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                <span className="flex items-center gap-1">
                  <Cpu size={9} /> {provider?.model ?? "Model pending"}
                </span>
                <span className="flex items-center gap-1">
                  <Check size={9} /> Score in under a minute
                </span>
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11.5px] font-medium text-[var(--color-text-primary)]">Test the presence robot</p>
                    <p className="mt-0.5 text-[10px] text-[var(--color-text-faint)]">
                      Sends one expression over the local network. Never required.
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.08em]",
                      robotOnline ? "text-emerald-300" : "text-[var(--color-text-faint)]",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        robotOnline ? "animate-pulse-soft bg-emerald-400" : "bg-[var(--color-text-faint)]",
                      )}
                    />
                    {robotOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Test robot expression">
                  {ROBOT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => void sendRobot(option.id)}
                      disabled={robotSending !== null}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[var(--color-surface-container)] px-2.5 py-1.5 text-[10.5px] text-[var(--color-text-primary)] transition-colors hover:border-white/[0.16] hover:text-[var(--color-text-primary)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-info-strong)]/40"
                    >
                      {robotSending === option.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Bot size={10} />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
                {robotNote ? (
                  <p className="animate-rise mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--color-text-secondary)]">
                    <Check size={10} className="mt-0.5 shrink-0 text-[var(--color-info)]" />
                    {robotNote}
                  </p>
                ) : null}
              </div>
            </Panel>

            {/* local data */}
            <Panel
              id="data"
              icon={Database}
              eyebrow="Storage"
              title="Local data"
              description="Reports, conversations and workflow state never leave this browser."
            >
              <div className="grid gap-2 lg:grid-cols-[1.12fr_0.88fr]">
                <div className="rounded-2xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                      Latest report
                    </span>
                    {report ? (
                      <Link
                        href="/interview?report=latest"
                        className="flex items-center gap-1 text-[10.5px] font-medium text-[var(--color-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
                      >
                        Open report <ArrowRight size={10} />
                      </Link>
                    ) : null}
                  </div>
                  {report ? (
                    <div className="mt-2.5 flex items-center gap-3">
                      <ScoreRing score={report.overall} size={58} stroke={5} />
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-[var(--color-text-primary)]">{report.setup.role}</p>
                        <p className="mt-0.5 truncate font-mono text-[7.5px] uppercase tracking-[0.07em] text-[var(--color-text-faint)]">
                          {report.band} · {formatDate(report.generatedAt)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[var(--color-text-secondary)]">
                          {report.summary}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 rounded-xl border border-dashed border-white/[0.08] px-3 py-3">
                      <p className="text-[11px] text-[var(--color-text-secondary)]">No report saved on this browser.</p>
                      <Link
                        href="/interview"
                        className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-[var(--color-tertiary)] hover:text-[var(--color-text-primary)]"
                      >
                        Run the first interview <ArrowRight size={10} />
                      </Link>
                    </div>
                  )}

                  {lastSetup ? (
                    <div className="mt-3 flex flex-wrap gap-1 border-t border-white/[0.05] pt-2.5">
                      <span className="chip !px-2 !py-0.5 !text-[8px]">{lastSetup.role}</span>
                      <span className="chip !px-2 !py-0.5 !text-[8px]">{lastSetup.level}</span>
                      <span className="chip !px-2 !py-0.5 !text-[8px]">{lastSetup.difficulty}</span>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                    On this device
                  </p>
                  <div className="mt-2.5 space-y-1.5">
                    {[
                      { label: "Conversations", value: chatCount },
                      { label: "Workflow runs", value: runCount },
                      { label: "Saved nodes", value: nodeCount },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[var(--color-surface-container)] px-2.5 py-1.5"
                      >
                        <span className="text-[10.5px] text-[var(--color-text-secondary)]">{item.label}</span>
                        <span className="font-mono text-[10px] tabular-nums text-[var(--color-text-primary)]">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void syncLocalToCloud()}
                  loading={syncingCloud}
                  className="!text-[11px]"
                >
                  <Cloud size={12} className="text-emerald-400" />
                  Sync to Cloud
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void pullFromCloud()}
                  loading={pullingCloud}
                  className="!text-[11px]"
                >
                  <RefreshCw size={12} className="text-cyan-400" />
                  Pull Cloud Reports
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={exportLocalData}>
                  <Download size={12} />
                  Export JSON
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm("history")}>
                  <History size={12} />
                  Clear practice history
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm("workspace")}>
                  <Workflow size={12} />
                  Clear workspace
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirm("all")}
                  className="!ml-auto"
                >
                  <Trash2 size={12} />
                  Reset local data
                </Button>
              </div>

              <p className="mt-2.5 flex items-start gap-2 text-[10px] leading-relaxed text-[var(--color-text-faint)]">
                <ShieldCheck size={11} className="mt-0.5 shrink-0 text-emerald-300/70" />
                Clearing local data is immediate. Export a JSON copy first if you want a record.
              </p>
            </Panel>

            {/* about */}
            <Panel
              id="about"
              icon={Info}
              eyebrow="About"
              title="ViewPilot Pro"
              description="A job-readiness workspace from Team Mooncraft."
            >
              <div className="grid gap-1.5 sm:grid-cols-3">
                {[
                  { label: "Version", value: "0.1.0" },
                  { label: "Built for", value: "CodeFest 2026" },
                  { label: "Engine", value: "Local-first" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] px-3 py-2.5">
                    <p className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[11.5px] font-medium text-[var(--color-text-primary)]">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link href="/" className="btn btn-ghost !px-3 !py-2 !text-[11px]">
                  Landing page
                  <ArrowUpRight size={11} />
                </Link>
                <Link href="/dashboard" className="btn btn-ghost !px-3 !py-2 !text-[11px]">
                  <Laptop size={11} /> Workspace
                </Link>
                <Link href="/interview" className="btn btn-primary !px-3 !py-2 !text-[11px]">
                  <Mic size={11} /> Start practicing
                </Link>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-[var(--color-text-faint)]">
                Scores are a practice estimate, not a hiring decision. No protected traits are scored.
              </p>
            </Panel>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        body={confirmCopy.body}
        confirmLabel={confirmCopy.confirmLabel}
        tone="danger"
        onConfirm={() => {
          if (confirm === "history") clearPracticeHistory();
          if (confirm === "workspace") clearWorkspaceData();
          if (confirm === "all") resetAllData();
          setConfirm(null);
        }}
        onClose={() => setConfirm(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function Panel({
  id,
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  id: string;
  icon: typeof UserRound;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="glass scroll-mt-24 rounded-[22px] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[var(--color-tertiary)]">
            <Icon size={15} strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">{eyebrow}</p>
            <h2 className="mt-0.5 font-display text-[19px] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
              {title}
            </h2>
            <p className="mt-1 max-w-[520px] text-[11px] leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  label,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-secondary)]">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--color-text-faint)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63ff]/50",
          checked ? "border-[#6c63ff]/40 bg-[#6c63ff]/40" : "border-white/[0.09] bg-[var(--color-surface-container-high)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 flex items-center justify-center rounded-full bg-white text-[#1a1a24] shadow transition-[left] duration-200",
            checked ? "left-[22px]" : "left-0.5",
          )}
          style={{ height: 18, width: 18 }}
        >
          {checked ? <Volume2 size={9} /> : <VolumeX size={9} />}
        </span>
      </button>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: typeof Laptop;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] p-2.5 transition-colors hover:border-white/[0.13] hover:bg-[var(--color-surface-container)]"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-tertiary)]">
        <Icon size={12} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-medium text-[var(--color-text-primary)]">{title}</span>
        <span className="block truncate font-mono text-[7px] uppercase tracking-[0.07em] text-[var(--color-text-faint)]">
          {detail}
        </span>
      </span>
      <ArrowUpRight
        size={11}
        className="shrink-0 text-[var(--color-text-faint)] transition-colors group-hover:text-[var(--color-tertiary)]"
      />
    </Link>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  tone: "emerald" | "violet" | "cyan" | "muted" | "rose";
}) {
  const tones = {
    emerald: "text-emerald-300 border-emerald-400/15 bg-emerald-500/[0.06]",
    violet: "text-[var(--color-tertiary)] border-[#6c63ff]/20 bg-[#6c63ff]/[0.08]",
    cyan: "text-[var(--color-info)] border-[var(--color-info-strong)]/20 bg-[var(--color-info-strong)]/[0.07]",
    muted: "text-[var(--color-text-secondary)] border-white/[0.06] bg-[var(--color-surface-container)]",
    rose: "text-rose-300 border-rose-400/20 bg-rose-500/[0.08]",
  } as const;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] p-2.5">
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", tones[tone])}>
        <Icon size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">{label}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-[var(--color-text-primary)]">{value}</p>
      </div>
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "emerald"
            ? "bg-emerald-400"
            : tone === "violet"
              ? "bg-[var(--color-tertiary)]"
              : tone === "cyan"
                ? "bg-[var(--color-info-strong)]"
                : tone === "rose"
                  ? "bg-rose-400"
                  : "bg-[var(--color-text-faint)]",
        )}
      />
    </div>
  );
}
