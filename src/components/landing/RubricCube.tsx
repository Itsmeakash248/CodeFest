import { cn } from "@/components/ui/cn";

interface RubricCubeProps {
  className?: string;
}

const SIDE = 138;

const faces = [
  {
    label: "Overall",
    value: "74",
    transform: `translateZ(${SIDE / 2}px)`,
    accent: true,
  },
  {
    label: "Role knowledge",
    value: "71",
    transform: `rotateY(90deg) translateZ(${SIDE / 2}px)`,
  },
  {
    label: "Problem solving",
    value: "66",
    transform: `rotateY(180deg) translateZ(${SIDE / 2}px)`,
  },
  {
    label: "Communication",
    value: "78",
    transform: `rotateY(-90deg) translateZ(${SIDE / 2}px)`,
  },
  {
    label: "Answer quality",
    value: "74",
    transform: `rotateX(90deg) translateZ(${SIDE / 2}px)`,
  },
  {
    label: "Local rubric",
    value: "48s",
    transform: `rotateX(-90deg) translateZ(${SIDE / 2}px)`,
  },
];

export default function RubricCube({ className }: RubricCubeProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "vp-cube-wrap pointer-events-auto relative mx-auto h-[170px] w-[170px] [perspective:900px]",
        className,
      )}
    >
      <style>{`
        @keyframes vp-cube-turn {
          from { transform: rotateX(-18deg) rotateY(-24deg); }
          to { transform: rotateX(-18deg) rotateY(336deg); }
        }
        .vp-cube-scene {
          transform-style: preserve-3d;
          animation: vp-cube-turn 26s linear infinite;
          will-change: transform;
        }
        .vp-cube-wrap:hover .vp-cube-scene { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .vp-cube-scene { animation: none; transform: rotateX(-18deg) rotateY(-24deg); }
        }
      `}</style>

      <span className="absolute left-1/2 top-1/2 h-[164px] w-[164px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.2),rgba(0,217,255,0.05)_54%,transparent_72%)] blur-xl" />
      <span className="orbit-ring left-1/2 top-1/2 h-[166px] w-[166px] -translate-x-1/2 -translate-y-1/2 opacity-70" />
      <span className="absolute left-1/2 top-[calc(50%+62px)] h-5 w-[96px] -translate-x-1/2 rounded-[50%] bg-black/60 blur-lg" />

      <div className="absolute left-1/2 top-1/2 h-[138px] w-[138px] -translate-x-1/2 -translate-y-1/2">
        <div className="vp-cube-scene relative h-full w-full">
          {faces.map((face) => (
            <div
              key={face.label}
              className={cn(
                "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[10px] border p-3 [backface-visibility:hidden]",
                face.accent
                  ? "border-[#6c63ff]/35 bg-[linear-gradient(145deg,rgba(48,43,94,0.98),rgba(13,12,20,0.99))]"
                  : "border-white/[0.11] bg-[linear-gradient(145deg,rgba(28,28,40,0.98),rgba(11,11,17,0.99))]",
              )}
              style={{ transform: face.transform }}
            >
              <span className="font-mono text-[6.5px] uppercase leading-tight tracking-[0.12em] text-[var(--color-text-secondary)]">
                {face.label}
              </span>
              <span
                className={cn(
                  "font-display text-[30px] font-semibold leading-none tracking-[-0.05em]",
                  face.accent ? "text-gradient" : "text-[var(--color-text-primary)]",
                )}
              >
                {face.value}
              </span>
              <span className="h-px w-full bg-gradient-to-r from-white/15 to-transparent" />
              <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08),transparent_38%,transparent_70%,rgba(0,217,255,0.04))]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
