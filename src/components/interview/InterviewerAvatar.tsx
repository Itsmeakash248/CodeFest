"use client";

import { useMemo } from "react";
import { Sparkles, Bot, Volume2, Mic } from "lucide-react";
import { cn } from "@/components/ui/cn";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";

interface InterviewerAvatarProps {
  state: AvatarState;
  roleTitle?: string;
  interviewerName?: string;
  micLevel?: number;
  className?: string;
}

export default function InterviewerAvatar({
  state,
  roleTitle = "Interviewer",
  interviewerName = "AI Lead Assessor",
  micLevel = 0,
  className,
}: InterviewerAvatarProps) {
  const badge = useMemo(() => {
    switch (state) {
      case "speaking":
        return {
          label: "Speaking",
          icon: Volume2,
          color: "border-[#6c63ff]/40 bg-[#6c63ff]/15 text-[#b0abff]",
          glow: "shadow-[0_0_24px_rgba(108,99,255,0.45)]",
        };
      case "listening":
        return {
          label: "Listening",
          icon: Mic,
          color: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300",
          glow: "shadow-[0_0_24px_rgba(0,217,255,0.4)]",
        };
      case "thinking":
        return {
          label: "Analyzing Answer",
          icon: Sparkles,
          color: "border-amber-400/40 bg-amber-500/15 text-amber-300",
          glow: "shadow-[0_0_24px_rgba(251,191,36,0.35)]",
        };
      default:
        return {
          label: "Live Ready",
          icon: Bot,
          color: "border-white/10 bg-white/5 text-[var(--color-text-secondary)]",
          glow: "",
        };
    }
  }, [state]);

  const BadgeIcon = badge.icon;

  return (
    <div className={cn("relative flex flex-col items-center justify-center p-4", className)}>
      {/* Outer ambient glow */}
      <div
        className={cn(
          "absolute h-36 w-36 rounded-full transition-all duration-700 blur-2xl pointer-events-none",
          state === "speaking" && "bg-gradient-to-tr from-[#6c63ff]/30 to-[#a855f7]/30 scale-125",
          state === "listening" && "bg-gradient-to-tr from-[#00d9ff]/25 to-[#06b6d4]/25 scale-110",
          state === "thinking" && "bg-gradient-to-tr from-amber-500/20 to-orange-500/20 animate-pulse",
          state === "idle" && "bg-white/[0.03]",
        )}
      />

      {/* Center Interactive Orb */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing radiating harmonic rings when speaking */}
        {state === "speaking" && (
          <>
            <span className="absolute h-28 w-28 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-[#6c63ff]/40" />
            <span className="absolute h-24 w-24 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.8s] rounded-full border border-[#9d4edd]/30" />
          </>
        )}

        {/* Dynamic mic reactive ring when listening */}
        {state === "listening" && (
          <span
            className="absolute rounded-full border border-cyan-400/50 transition-all duration-150"
            style={{
              width: `${84 + micLevel * 36}px`,
              height: `${84 + micLevel * 36}px`,
              opacity: 0.4 + micLevel * 0.6,
            }}
          />
        )}

        {/* Thinking rotating halo */}
        {state === "thinking" && (
          <div className="absolute h-24 w-24 animate-spin rounded-full border-2 border-dashed border-amber-400/50 [animation-duration:4s]" />
        )}

        {/* Central Orb Capsule */}
        <div
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-500 shadow-xl",
            badge.glow,
            state === "speaking" && "border-[#6c63ff]/60 bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#0f172a]",
            state === "listening" && "border-cyan-400/60 bg-gradient-to-br from-[#083344] via-[#0f172a] to-[#164e63]",
            state === "thinking" && "border-amber-400/60 bg-gradient-to-br from-[#451a03] via-[#1c1917] to-[#292524]",
            state === "idle" && "border-white/10 bg-gradient-to-br from-[#181824] to-[#0f0f15]",
          )}
        >
          {/* Animated waveform bars inside the orb */}
          <div className="flex items-center gap-[3px]">
            {[0, 1, 2, 3, 4].map((bar) => {
              let height = 8;
              if (state === "speaking") {
                height = bar % 2 === 0 ? 18 : 28;
              } else if (state === "listening") {
                height = Math.max(6, Math.min(32, 8 + micLevel * 40 * (bar % 2 === 0 ? 0.7 : 1.2)));
              } else if (state === "thinking") {
                height = 10 + Math.sin(bar * 1.2) * 6;
              }
              return (
                <span
                  key={bar}
                  className={cn(
                    "w-[3px] rounded-full transition-all duration-150",
                    state === "speaking" && "bg-gradient-to-t from-[#6c63ff] to-[#e0aaff] animate-[wave_1s_ease-in-out_infinite]",
                    state === "listening" && "bg-gradient-to-t from-cyan-400 to-sky-200",
                    state === "thinking" && "bg-amber-400 animate-pulse",
                    state === "idle" && "bg-white/20",
                  )}
                  style={{
                    height: `${height}px`,
                    animationDelay: `${bar * 140}ms`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* State & Role Label */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.1em] transition-colors">
          <BadgeIcon size={9} />
          <span>{badge.label}</span>
        </div>
        <p className="mt-1 font-display text-[12px] font-medium tracking-tight text-[var(--color-text-primary)]">
          {interviewerName}
        </p>
        <p className="font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
          {roleTitle}
        </p>
      </div>
    </div>
  );
}
