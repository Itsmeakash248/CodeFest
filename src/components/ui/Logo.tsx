import { cn } from "@/components/ui/cn";

interface LogoProps {
  size?: number;
  wordmark?: boolean;
  pro?: boolean;
  className?: string;
}

export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="vp-logo-gradient" x1="9" y1="6" x2="39" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4F2FF" />
          <stop offset="0.55" stopColor="#9D96FF" />
          <stop offset="1" stopColor="#00D9FF" />
        </linearGradient>
      </defs>
      <ellipse
        cx="24"
        cy="24"
        rx="21"
        ry="10"
        transform="rotate(-30 24 24)"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.1"
      />
      <circle cx="41.5" cy="14.5" r="2.1" fill="#00D9FF" />
      <circle cx="6.2" cy="33.5" r="1.25" fill="rgba(255,255,255,0.55)" />
      <path
        d="M30.4 7.2a15.4 15.4 0 1 0 11.2 25.9A17.2 17.2 0 0 1 30.4 7.2Z"
        fill="url(#vp-logo-gradient)"
      />
    </svg>
  );
}

export default function Logo({ size = 34, wordmark = true, pro = true, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {wordmark ? (
        <span className="flex items-center gap-1.5">
          <span className="font-display text-[22px] font-semibold tracking-[-0.03em] text-white">
            ViewPilot
          </span>
          {pro ? (
            <span className="rounded-[5px] border border-white/[0.12] bg-white/[0.05] px-1.5 py-[3px] font-mono text-[10px] font-semibold tracking-[0.18em] text-[#b9b3ff]">
              PRO
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
