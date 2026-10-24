"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  CircleDot,
  Ear,
  Loader2,
  MessageSquare,
  Radio,
  Sparkles,
  Smile,
  Waves,
} from "lucide-react";
import RobotFace, { type RobotExpression } from "@/components/landing/RobotFace";
import TiltCard from "@/components/landing/TiltCard";
import { fetchRobotStatus, setRobotExpression } from "@/lib/client/api";
import { cn } from "@/components/ui/cn";

const options: { id: RobotExpression; label: string; icon: typeof Smile }[] = [
  { id: "happy", label: "Encouraging", icon: Smile },
  { id: "thinking", label: "Evaluating", icon: Sparkles },
  { id: "listening", label: "Listening", icon: Ear },
  { id: "neutral", label: "Neutral", icon: MessageSquare },
];

export default function RobotDemo() {
  const [expression, setExpression] = useState<RobotExpression>("thinking");
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [online, setOnline] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;
    fetchRobotStatus()
      .then((state) => {
        if (alive) setOnline(Boolean(state.configured && state.online));
      })
      .catch(() => {
        if (alive) setOnline(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reducedRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setGaze({
      x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
      y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)),
    });
  }

  async function choose(next: RobotExpression) {
    setExpression(next);
    setNote(null);
    if (online !== true) {
      setNote("Local preview — robot bridge offline. The interview still runs with voice only.");
      return;
    }
    setSending(true);
    try {
      await setRobotExpression(next);
      setNote(`Expression “${next}” sent over the local network.`);
    } catch {
      setNote("Robot did not acknowledge. Expression kept locally.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <TiltCard className="relative mx-auto w-full max-w-[430px]" maxTilt={4}>
        <div
          ref={stageRef}
          onPointerMove={onPointerMove}
          className="relative [transform-style:preserve-3d]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-6 h-64 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.14),transparent_70%)] blur-2xl"
          />
          <div className="glass relative overflow-hidden rounded-[32px] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-text-faint)]">
                <Bot size={12} /> Presence dock
              </span>
              <span className="chip chip-cyan" style={{ fontSize: "8px" }}>
                <span className="h-1 w-1 animate-pulse-soft rounded-full bg-current" />
                {online === null ? "Checking" : online ? "Linked" : "Optional"}
              </span>
            </div>

            <div className="relative mt-7 flex justify-center pb-2">
              <span aria-hidden="true" className="orbit-ring left-1/2 top-4 h-[230px] w-[230px] -translate-x-1/2" />
              <span
                aria-hidden="true"
                className="orbit-ring left-1/2 top-1 h-[290px] w-[290px] -translate-x-1/2 border-dashed opacity-60"
              />
              <RobotFace expression={expression} gaze={gaze} className="relative z-10 w-full max-w-[280px]" />
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-1/2 h-5 w-44 -translate-x-1/2 rounded-full bg-black/70 blur-xl"
              />
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
              {[
                { label: "Link", value: online ? "LAN" : "Local" },
                { label: "Expression", value: expression },
                { label: "Latency", value: online ? "~40ms" : "—" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-[var(--color-text-faint)]">{item.label}</p>
                  <p className="mt-1 truncate font-mono text-[10.5px] capitalize text-[var(--color-text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute -right-2 top-8 z-20 hidden items-center gap-1.5 rounded-full border border-white/[0.1] bg-[var(--color-surface-container)] px-2.5 py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:flex"
            style={{ transform: "translateZ(60px)" }}
          >
            <span className="h-1 w-1 rounded-full bg-[var(--color-info-strong)]" />
            <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">ESP32-S3</span>
          </div>

          <div
            className="glass-subtle mt-3 flex items-center gap-2.5 px-3.5 py-3"
            style={{ transform: "translateZ(30px)" }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-info-strong)]/20 bg-[var(--color-info-strong)]/10 text-[var(--color-info)]">
              <Radio size={13} />
            </span>
            <p className="flex-1 text-[11px] leading-snug text-[var(--color-text-secondary)]">
              Optional face. Same rubric.
            </p>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">LAN only</span>
          </div>
        </div>
      </TiltCard>

      <div>
        <span className="label">Optional hardware</span>
        <h2 className="mt-4 max-w-[520px] font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-[46px]">
          The interviewer can <span className="text-gradient-cyan">have a face.</span>
        </h2>
        <p className="mt-5 max-w-[480px] text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
          An ESP32-S3 face over LAN. Optional — browser voice needs no hardware.
        </p>

        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Preview robot expressions">
          {options.map((option) => {
            const Icon = option.icon;
            const active = expression === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-all duration-200",
                  active
                    ? "border-[var(--color-info-strong)]/40 bg-[var(--color-info-strong)]/12 text-[var(--color-info)] shadow-[0_0_24px_rgba(0,217,255,0.12)]"
                    : "border-white/[0.08] bg-[var(--color-surface-container)] text-[var(--color-text-secondary)] hover:border-white/[0.16] hover:text-[var(--color-text-primary)]",
                )}
              >
                <Icon size={13} strokeWidth={1.7} />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex min-h-[38px] items-center gap-2.5">
          {sending ? (
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-info)]">
              <Loader2 size={12} className="animate-spin" /> Sending expression
            </span>
          ) : note ? (
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
              <CircleDot size={11} className="mt-0.5 shrink-0 text-[var(--color-info-strong)]" />
              {note}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-[11px] text-[var(--color-text-faint)]">
              <Waves size={12} className="text-[var(--color-text-secondary)]" />
              Pick an expression. Gaze follows your pointer.
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/interview" className="btn btn-primary">
            Try the interview room
            <ArrowUpRight size={15} />
          </Link>
          <span className="text-[11px] leading-relaxed text-[var(--color-text-faint)]">
            Five questions · four scores · no robot required.
          </span>
        </div>
      </div>
    </div>
  );
}
