"use client";

import { useEffect, useState } from "react";
import { cn } from "@/components/ui/cn";
import { scoreColor } from "@/components/ui/Badge";

interface ScoreRingProps {
  score: number;
  label?: string;
  size?: number;
  stroke?: number;
  className?: string;
  color?: string;
  trackOpacity?: number;
}

export default function ScoreRing({
  score,
  label,
  size = 96,
  stroke = 7,
  className,
  color,
  trackOpacity = 0.08,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const [mounted, setMounted] = useState(false);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const ringColor = color ?? scoreColor(clamped);
  const fontSize = size >= 110 ? 30 : size >= 80 ? 24 : 19;

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ? `${label}: ` : ""}${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,1)"
          strokeOpacity={trackOpacity}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.7, 0.2, 1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-semibold leading-none tracking-[-0.04em] text-white"
          style={{ fontSize }}
        >
          {clamped}
        </span>
        {label ? (
          <span className="mt-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#8b8ba3]">
            {label}
          </span>
        ) : null}
      </span>
    </div>
  );
}
