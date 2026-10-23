"use client";

import { cn } from "@/components/ui/cn";

export type RobotExpression = "neutral" | "happy" | "thinking" | "listening" | "speaking";

interface RobotFaceProps {
  expression?: RobotExpression;
  /** -1..1 gaze offset, driven by pointer or animation. */
  gaze?: { x: number; y: number };
  className?: string;
  compact?: boolean;
}

const labels: Record<RobotExpression, string> = {
  neutral: "Neutral",
  happy: "Encouraging",
  thinking: "Evaluating",
  listening: "Listening",
  speaking: "Speaking",
};

export default function RobotFace({
  expression = "neutral",
  gaze = { x: 0, y: 0 },
  className,
  compact = false,
}: RobotFaceProps) {
  const happy = expression === "happy";
  const thinking = expression === "thinking";
  const listening = expression === "listening";
  const speaking = expression === "speaking";

  return (
    <div className={cn("relative select-none", className)} aria-label={`Robot expression: ${labels[expression]}`}>
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[78%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,217,255,0.2),rgba(108,99,255,0.12)_45%,transparent_70%)] blur-2xl"
      />

      <div className="relative">
        {/* antenna */}
        <div className="mx-auto flex flex-col items-center">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full border border-cyan-200/40 shadow-[0_0_14px_rgba(0,217,255,0.8)]",
              thinking ? "animate-pulse-soft bg-amber-300" : "bg-cyan-300",
            )}
          />
          <span className="h-3 w-px bg-gradient-to-b from-cyan-300/60 to-white/10" />
        </div>

        {/* head shell */}
        <div
          className={cn(
            "relative mx-auto rounded-[26%] border border-white/[0.12] bg-[linear-gradient(155deg,#24242f,#101017_55%,#08080d)] p-[6%] shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-18px_40px_rgba(0,0,0,0.5)]",
            compact ? "w-[154px]" : "w-full max-w-[290px]",
          )}
        >
          {/* side pods */}
          <span className="absolute -left-[3px] top-1/2 h-[22%] w-[5px] -translate-y-1/2 rounded-full bg-gradient-to-b from-white/15 via-white/5 to-transparent" />
          <span className="absolute -right-[3px] top-1/2 h-[22%] w-[5px] -translate-y-1/2 rounded-full bg-gradient-to-b from-white/15 via-white/5 to-transparent" />

          {/* face screen */}
          <div className="relative overflow-hidden rounded-[20%] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_0%,#101a24,#06070b_70%)] shadow-[inset_0_0_30px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between px-[8%] pt-[5%]">
              <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-cyan-200/50">
                M-01
              </span>
              <span className="flex items-center gap-1 font-mono text-[6.5px] uppercase tracking-[0.14em] text-[#5f7286]">
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    thinking ? "animate-pulse-soft bg-amber-300" : "bg-cyan-300",
                  )}
                />
                {labels[expression]}
              </span>
            </div>

            {/* eyes */}
            <div
              className={cn(
                "flex items-center justify-center gap-[14%] px-[12%]",
                compact ? "py-[9%]" : "py-[10%]",
              )}
            >
              {[0, 1].map((eye) => (
                <span
                  key={eye}
                  className={cn(
                    "relative block rounded-full bg-[linear-gradient(180deg,#e8fdff,#58e6ff_55%,#00b7e6)] shadow-[0_0_22px_rgba(0,217,255,0.75),inset_0_-2px_6px_rgba(0,80,120,0.45)] transition-all duration-300",
                    compact ? "h-[21px] w-[26px]" : "h-[37px] w-[46px]",
                    happy && "rounded-t-[80%] rounded-b-[35%]",
                  )}
                  style={{
                    transform: `translate(${gaze.x * 4}px, ${gaze.y * 2.5 + (listening ? -2 : thinking ? -3 : 0)}px) scaleY(${
                      happy ? 0.55 : thinking ? 0.7 : listening ? 1.1 : 1
                    })`,
                  }}
                >
                  <span
                    className={cn(
                      "absolute rounded-full bg-white/90 blur-[0.5px] transition-opacity",
                      compact ? "left-[7px] top-[4px] h-1 w-1" : "left-[12px] top-[7px] h-1.5 w-1.5",
                      thinking && "opacity-40",
                    )}
                  />
                </span>
              ))}
            </div>

            {/* mouth */}
            <div className={cn("flex items-end justify-center gap-[3px]", compact ? "h-4 pb-2" : "h-7 pb-3")}>
              {speaking ? (
                [5, 11, 16, 9, 14, 6].map((height, index) => (
                  <span
                    key={index}
                    className="w-[2px] rounded-full bg-cyan-300/80"
                    style={{
                      height: compact ? height * 0.55 : height,
                      animation: `wave ${0.7 + index * 0.08}s ease-in-out ${index * 0.07}s infinite`,
                    }}
                  />
                ))
              ) : thinking ? (
                [0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-[3px] w-[3px] rounded-full bg-cyan-300/55"
                    style={{ animation: `pulse-soft 1.6s ease-in-out ${dot * 0.25}s infinite` }}
                  />
                ))
              ) : listening ? (
                <span className="h-[2px] w-[26%] rounded-full bg-cyan-300/70" />
              ) : (
                <span
                  className={cn(
                    "h-[8px] rounded-b-full border-b-2 border-cyan-300/80 transition-all duration-300",
                    happy ? "w-[28%]" : "w-[17%]",
                  )}
                />
              )}
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.09),transparent_36%,transparent_62%,rgba(0,217,255,0.05))]"
            />
          </div>
        </div>

        {/* neck + base */}
        <div className="mx-auto h-2 w-[22%] rounded-b-md border-x border-b border-white/[0.08] bg-[#15151d]" />
        <div className="mx-auto h-1.5 w-[42%] rounded-[999px] bg-gradient-to-b from-[#22222c] to-[#0b0b10] shadow-[0_14px_26px_rgba(0,0,0,0.6)]" />
      </div>
    </div>
  );
}
