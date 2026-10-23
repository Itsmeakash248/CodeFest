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
          <stop stopColor="#F4D8CC" />
          <stop offset="0.55" stopColor="#B9573D" />
          <stop offset="1" stopColor="#686B4E" />
        </linearGradient>
      </defs>
      <ellipse
        cx="24"
        cy="24"
        rx="21"
        ry="10"
        transform="rotate(-30 24 24)"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.2"
        className="text-[var(--color-outline)]"
      />
      <circle cx="41.5" cy="14.5" r="2.2" fill="#B9573D" />
      <circle cx="6.2" cy="33.5" r="1.3" fill="#686B4E" />
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
        <span className="flex items-center gap-2">
          <span className="font-display text-[22px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
            ViewPilot
          </span>
          {pro ? (
            <span className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary-container)] px-2 py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.16em] text-[var(--color-on-primary-container)]">
              PRO
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
