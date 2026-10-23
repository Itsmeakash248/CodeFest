"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { login } from "@/lib/client/api";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import ScoreRing from "@/components/ui/ScoreRing";
import { cn } from "@/components/ui/cn";

interface AuthFormProps {
  nextPath: string;
}

export default function AuthForm({ nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"form" | "demo" | null>(null);

  async function enter(nextEmail: string, nextName: string | undefined, mode: "form" | "demo") {
    setError(null);
    setLoading(mode);
    try {
      await login(nextEmail, nextName);
      router.push(nextPath);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the workspace. Try again.");
      setLoading(null);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter an email address, or continue with the demo account.");
      return;
    }
    void enter(email.trim(), name.trim() || undefined, "form");
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="aurora left-[-6%] top-[-8%] h-[520px] w-[520px] bg-[#6c63ff]/20" />
        <div className="aurora right-[-10%] bottom-[-12%] h-[480px] w-[480px] bg-[#00d9ff]/10" />
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
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8b8ba3] transition-colors hover:text-white"
            >
              Back to landing
              <ArrowUpRight size={10} />
            </Link>
          </div>

          <div className="my-10 max-w-[560px] lg:my-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <CircleDot size={9} className="text-[#00d9ff]" />
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#a9a9ba]">
                Demo auth · no password stored
              </span>
            </div>
            <h1 className="mt-6 font-display text-[46px] font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-[60px]">
              Your interview
              <br />
              desk is <span className="text-gradient">ready.</span>
            </h1>
            <p className="mt-5 max-w-[430px] text-[13.5px] leading-relaxed text-[#a9a9ba]">
              Five specialist agents, a drag-and-drop prep loop and a voice interview room. Your
              practice history stays in this browser.
            </p>

            <div className="mt-7 space-y-3">
              {[
                { icon: Sparkles, title: "Five specialists, one session context", body: "Coach, resume, skills, career, communication." },
                { icon: ShieldCheck, title: "Visible rubric, evidence-backed scores", body: "Four weighted dimensions. Quotes from your answers." },
                { icon: Check, title: "Works without a key or a robot", body: "The local engine takes over when the model does not." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-[#b3adff]">
                      <Icon size={13} strokeWidth={1.7} />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-medium text-[#dedee9]">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-[#7d7f92]">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:max-w-[430px]">
              <div className="flex items-center gap-3">
                <ScoreRing score={74} size={62} stroke={5} label="sample" />
                <div className="min-w-0">
                  <p className="font-mono text-[7.5px] uppercase tracking-[0.13em] text-[#7fe8ff]">
                    Report fragment
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#b8b8c8]">
                    &ldquo;I named the constraint before the outcome — the next answer needs the
                    trade-off.&rdquo;
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-2.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[#5f6273]">
                <span>4 dimensions</span>
                <span>5 answers</span>
                <span className="ml-auto text-emerald-300">48s</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-[#565969]">
            <span>Team Mooncraft</span>
            <span className="h-1 w-1 rounded-full bg-white/15" />
            <span>CodeFest 2026</span>
            <span className="h-1 w-1 rounded-full bg-white/15" />
            <span>Domain 2 · Job readiness</span>
          </div>
        </div>

        {/* form side */}
        <div className="flex items-center justify-center px-5 pb-14 sm:px-10 lg:border-l lg:border-white/[0.05] lg:bg-black/10 lg:px-12 lg:py-10">
          <div className="w-full max-w-[420px]">
            <div className="glass rounded-[24px] p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="label">Workspace access</span>
                  <h2 className="mt-3 font-display text-[26px] font-semibold tracking-[-0.03em] text-white">
                    Welcome back
                  </h2>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#8d8d9f]">
                    Sign in with an email. No verification, no stored password.
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#6c63ff]/25 bg-[#6c63ff]/10 text-[#b3adff]">
                  <KeyRound size={16} />
                </span>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-[11px] font-medium text-[#c5c5d4]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6273]"
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
                      aria-describedby="login-email-note"
                    />
                  </div>
                  <p id="login-email-note" className="mt-1.5 text-[10px] text-[#6f7284]">
                    Any valid address works. Nothing is emailed.
                  </p>
                </div>

                <div>
                  <label htmlFor="login-name" className="mb-1.5 block text-[11px] font-medium text-[#c5c5d4]">
                    Name <span className="font-normal text-[#6f7284]">(optional)</span>
                  </label>
                  <div className="relative">
                    <UserRound
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6273]"
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
                    <label htmlFor="login-password" className="text-[11px] font-medium text-[#c5c5d4]">
                      Password
                    </label>
                    <span className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-[#565969]">
                      Decorative
                    </span>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Not stored or checked"
                    className="input"
                    autoComplete="off"
                  />
                  <p className="mt-1.5 text-[10px] text-[#6f7284]">
                    This field is here to look familiar. It is never sent.
                  </p>
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

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full !py-3 !text-[13px]"
                  loading={loading === "form"}
                  disabled={loading !== null}
                >
                  Enter workspace
                  {loading !== "form" ? <ArrowRight size={14} /> : null}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/[0.07]" />
                <span className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-[#565969]">or</span>
                <span className="h-px flex-1 bg-white/[0.07]" />
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

              <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 px-3.5 py-3">
                <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-[#7d7f92]">
                  <ShieldCheck size={12} className="mt-0.5 shrink-0 text-emerald-300/70" />
                  Demo auth stores an unsigned browser cookie only. No password or account database.
                  The practice routes stay protected by that same cookie.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 px-1">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-[11px] text-[#9b9cae] transition-colors hover:text-white"
              >
                Back to the landing page
                <ArrowUpRight size={11} />
              </Link>
              <span className={cn("font-mono text-[7px] uppercase tracking-[0.1em] text-[#565969]")}>
                Local-first
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
