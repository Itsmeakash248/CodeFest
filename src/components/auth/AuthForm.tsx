"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  Cloud,
  Database,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { fetchStatus, login, signup } from "@/lib/client/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import ScoreRing from "@/components/ui/ScoreRing";
import { cn } from "@/components/ui/cn";

interface AuthFormProps {
  nextPath: string;
  mode?: "login" | "signup";
}

export default function AuthForm({ nextPath, mode = "login" }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<"form" | "demo" | "github" | "google" | null>(null);
  const [supabaseActive, setSupabaseActive] = useState<boolean>(false);
  const switchHref = `${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    let unmounted = false;
    void fetchStatus()
      .then((status) => {
        if (!unmounted && status.supabase) {
          setSupabaseActive(true);
        }
      })
      .catch(() => {});
    return () => {
      unmounted = true;
    };
  }, []);

  async function enter(
    nextEmail: string,
    nextName: string | undefined,
    modeType: "form" | "demo",
    nextPassword?: string,
  ) {
    setError(null);
    setNotice(null);
    setLoading(modeType);
    try {
      if (modeType === "demo") {
        await login(nextEmail, nextName, undefined, true);
        router.push(nextPath);
        router.refresh();
        return;
      }

      if (isSignup) {
        const res = await signup(nextEmail, nextPassword, nextName);
        if (res.needsEmailConfirmation) {
          setNotice("Check your email for a confirmation link to complete registration.");
          setLoading(null);
          return;
        }
      } else {
        await login(nextEmail, nextName, nextPassword, false);
      }

      router.push(nextPath);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the workspace. Try again.");
      setLoading(null);
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    setError(null);
    setLoading(provider);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase is not configured yet. Use the demo account below.");
      }
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not sign in with ${provider}.`);
      setLoading(null);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter an email address, or continue with the demo account.");
      return;
    }
    if (supabaseActive && password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    void enter(email.trim(), name.trim() || undefined, "form", password || undefined);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="aurora left-[-6%] top-[-8%] h-[520px] w-[520px] bg-[#6c63ff]/20" />
        <div className="aurora right-[-10%] bottom-[-12%] h-[480px] w-[480px] bg-[var(--color-info-strong)]/10" />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1400px] lg:grid-cols-[1.08fr_0.92fr]">
        {/* narrative side */}
        <div className="flex flex-col justify-between px-5 pb-10 pt-7 sm:px-10 lg:px-14 lg:py-10">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="ViewPilot Pro home">
              <Logo size={28} />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              Back to landing
              <ArrowUpRight size={10} />
            </Link>
          </div>

          <div className="my-10 max-w-[560px] lg:my-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[var(--color-surface-container)] px-3 py-1.5">
              {supabaseActive ? (
                <>
                  <Cloud size={10} className="text-emerald-400" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-emerald-300">
                    Supabase Cloud Auth & Sync Active
                  </span>
                </>
              ) : (
                <>
                  <CircleDot size={9} className="text-[var(--color-info-strong)]" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Local-first Demo Auth · Zero Setup
                  </span>
                </>
              )}
            </div>
            <h1 className="mt-6 font-display text-[46px] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-[60px]">
              Your interview
              <br />
              desk is <span className="text-gradient">ready.</span>
            </h1>
            <p className="mt-5 max-w-[430px] text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
              {isSignup
                ? "Create a free desk in one step. Five specialist agents, video proctoring with cheating detection, and persistent cloud scorecards."
                : "Five specialist agents, video proctoring with cheating detection, and full cloud scorecards. Your practice history syncs across devices."}
            </p>

            <div className="mt-7 space-y-3">
              {[
                {
                  icon: Sparkles,
                  title: "Five specialists, one session context",
                  body: "Coach, resume, skills, career, communication.",
                },
                {
                  icon: ShieldCheck,
                  title: "Video Proctoring & Integrity Audit",
                  body: "Real-time face detection, gaze tracking, tab blur & paste interceptor.",
                },
                {
                  icon: Database,
                  title: supabaseActive ? "Supabase Cloud Database" : "Works without a key or setup",
                  body: supabaseActive
                    ? "PostgreSQL persistence with Row-Level Security for scorecards and pipelines."
                    : "The local engine takes over when cloud credentials are not supplied.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[var(--color-surface-container)] text-[var(--color-tertiary)]">
                      <Icon size={13} strokeWidth={1.7} />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-medium text-[var(--color-text-primary)]">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--color-text-faint)]">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[var(--color-surface-container)] p-4 sm:max-w-[430px]">
              <div className="flex items-center gap-3">
                <ScoreRing score={88} size={62} stroke={5} label="verified" />
                <div className="min-w-0">
                  <p className="font-mono text-[7.5px] uppercase tracking-[0.13em] text-[var(--color-info)]">
                    Audit scorecard
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-primary)]">
                    &ldquo;Integrity 96% · Clean proctoring audit · Centered face attention maintained throughout.&rdquo;
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-2.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                <span>4 dimensions</span>
                <span>Proctored</span>
                <span className="ml-auto text-emerald-300">Clean</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
            <span>Team Mooncraft</span>
            <span className="h-1 w-1 rounded-full bg-white/15" />
            <span>CodeFest 2026</span>
            <span className="h-1 w-1 rounded-full bg-white/15" />
            <span>Supabase Cloud Edition</span>
          </div>
        </div>

        {/* form side */}
        <div className="flex items-center justify-center px-5 pb-14 sm:px-10 lg:border-l lg:border-white/[0.05] lg:bg-[var(--color-surface-container)] lg:px-12 lg:py-10">
          <div className="w-full max-w-[420px]">
            <div className="glass rounded-[24px] p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="label">
                    {supabaseActive ? (isSignup ? "Supabase Registration" : "Cloud Workspace") : isSignup ? "Free account" : "Workspace access"}
                  </span>
                  <h2 className="mt-3 font-display text-[26px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
                    {isSignup ? "Create your desk" : "Welcome back"}
                  </h2>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                    {supabaseActive
                      ? isSignup
                        ? "Register with email and password to secure your desk in Supabase."
                        : "Sign in with your email & password to access your cloud scorecards."
                      : isSignup
                        ? "Sign up with an email. Demo mode saves session in browser cookies."
                        : "Sign in with an email. Demo mode is zero-configuration."}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[var(--color-tertiary)]">
                  <KeyRound size={16} />
                </span>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-primary)]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
                    />
                    <input
                      id="login-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="input !pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-name" className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-primary)]">
                    Name{" "}
                    <span className="font-normal text-[var(--color-text-faint)]">
                      {isSignup ? "(recommended)" : "(optional)"}
                    </span>
                  </label>
                  <div className="relative">
                    <UserRound
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
                    />
                    <input
                      id="login-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Aarav Deshmukh"
                      className="input !pl-9"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label htmlFor="login-password" className="text-[11px] font-medium text-[var(--color-text-primary)]">
                      Password
                    </label>
                    <span className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                      {supabaseActive ? "Secured" : "Optional in Demo"}
                    </span>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={supabaseActive ? "Min 6 characters" : "Optional in demo mode"}
                    className="input"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3 py-2.5 text-[11.5px] leading-relaxed text-rose-200"
                  >
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                ) : null}

                {notice ? (
                  <div
                    role="status"
                    className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-2.5 text-[11.5px] leading-relaxed text-emerald-200"
                  >
                    <Check size={13} className="mt-0.5 shrink-0" />
                    {notice}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full !py-3 !text-[13px]"
                  loading={loading === "form"}
                  disabled={loading !== null}
                >
                  {isSignup ? "Create account" : "Enter workspace"}
                  {loading !== "form" ? <ArrowRight size={14} /> : null}
                </Button>
              </form>

              {supabaseActive ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleOAuth("github")}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[var(--color-surface-container)] px-3 py-2 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] hover:border-white/15"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOAuth("google")}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[var(--color-surface-container)] px-3 py-2 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] hover:border-white/15"
                  >
                    <Cloud size={13} />
                    Google
                  </button>
                </div>
              ) : null}

              <p className="mt-4 text-center text-[11.5px] text-[var(--color-text-secondary)]">
                {isSignup ? "Already have a desk?" : "New to ViewPilot Pro?"}{" "}
                <Link
                  href={switchHref}
                  className="font-medium text-[var(--color-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  {isSignup ? "Log in" : "Create a free account"}
                </Link>
              </p>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--color-surface-container-high)]" />
                <span className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">or</span>
                <span className="h-px flex-1 bg-[var(--color-surface-container-high)]" />
              </div>

              <Button
                variant="soft"
                onClick={() => void enter("demo@viewpilot.app", "Demo Candidate", "demo")}
                loading={loading === "demo"}
                disabled={loading !== null}
                className="w-full !py-3 !text-[12.5px]"
              >
                <Sparkles size={14} />
                Continue with demo account
              </Button>

              <div className="mt-5 rounded-xl border border-white/[0.06] bg-[var(--color-surface-container)] px-3.5 py-3">
                <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-[var(--color-text-faint)]">
                  <ShieldCheck size={12} className="mt-0.5 shrink-0 text-emerald-300/70" />
                  {supabaseActive
                    ? "Authenticated sessions are secured via Supabase JWTs with Row-Level Security."
                    : "Demo auth stores an unsigned browser cookie only. No password or database required."}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 px-1">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Back to the landing page
                <ArrowUpRight size={11} />
              </Link>
              <span className={cn("font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]")}>
                {supabaseActive ? "Supabase Cloud" : "Local-first"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
