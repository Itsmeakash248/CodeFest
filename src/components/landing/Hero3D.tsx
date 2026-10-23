"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, Bot, Check, Layers3, Sparkles } from "lucide-react";
import WorkspaceMock from "@/components/landing/WorkspaceMock";

export default function Hero3D() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const paint = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      scene.style.setProperty("--mx", currentX.toFixed(3));
      scene.style.setProperty("--my", currentY.toFixed(3));
      if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
        frame = window.requestAnimationFrame(paint);
      } else {
        frame = 0;
      }
    };

    const requestPaint = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      requestPaint();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      requestPaint();
    };

    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const value = Math.min(1, window.scrollY / Math.max(1, window.innerHeight * 0.85));
        scene.style.setProperty("--sy", value.toFixed(3));
      });
    };

    scene.addEventListener("pointermove", onPointerMove);
    scene.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className="hero-scene relative mx-auto w-full max-w-[880px] [perspective:1900px]"
    >
      {/* ambience */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[540px] w-[660px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(108,99,255,0.2),rgba(0,217,255,0.05)_42%,transparent_68%)] blur-2xl"
      />

      {/* orbit rings */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
        <span className="orbit-ring left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-70" />
        <span className="orbit-ring left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 border-dashed opacity-50 [transform:translate(-50%,-50%)_rotateX(68deg)]" />
        <span className="orbit-ring left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-80 [transform:translate(-50%,-50%)_rotateX(72deg)_rotateZ(-18deg)]" />
        <span className="absolute left-[12%] top-[16%] h-1.5 w-1.5 rounded-full bg-[#00d9ff]/80 shadow-[0_0_14px_rgba(0,217,255,0.9)]" />
        <span className="absolute right-[8%] top-[62%] h-1 w-1 rounded-full bg-[#a8a2ff]/80 shadow-[0_0_12px_rgba(168,162,255,0.9)]" />
        <span className="absolute right-[19%] top-[12%] h-1 w-1 rounded-full bg-white/50" />
      </div>

      {/* floor grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-12%] bottom-[-12%] h-[300px] opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.065)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.065)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_top,black,transparent_86%)] [transform:perspective(700px)_rotateX(62deg)]"
      />

      {/* console */}
      <div className="relative z-10 px-2 [transform-style:preserve-3d] sm:px-5">
        <div
          aria-hidden="true"
          className="absolute inset-x-10 top-8 h-full rounded-[26px] border border-white/[0.05] bg-[#101018]/60 blur-[1px]"
          style={{ transform: "translateZ(-44px) translateY(18px) scale(0.975)" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-14 top-12 h-full rounded-[26px] border border-white/[0.04] bg-[#0c0c13]/40 blur-[1.5px]"
          style={{ transform: "translateZ(-78px) translateY(44px) scale(0.95)" }}
        />

        <div
          className="relative [transform-style:preserve-3d] transition-shadow duration-500"
          style={{
            transform:
              "rotateX(calc(7deg - var(--sy, 0) * 9deg + var(--my, 0) * -2.4deg)) rotateY(calc(-11deg + var(--mx, 0) * 6.5deg)) rotateZ(calc(1.2deg + var(--my, 0) * -0.8deg)) translateY(calc(var(--sy, 0) * -34px))",
            transformOrigin: "50% 55%",
          }}
        >
          <div className="rounded-[20px] shadow-[0_60px_120px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.03)]">
            <WorkspaceMock view="chat" grand />
          </div>

          {/* glass reflection */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[20px] bg-[linear-gradient(120deg,rgba(255,255,255,0.11),transparent_24%,transparent_72%,rgba(0,217,255,0.05))] opacity-70 mix-blend-screen"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
          />
        </div>
      </div>

      {/* floating context pill */}
      <div className="absolute left-1/2 top-[2%] z-20 hidden -translate-x-1/2 [transform-style:preserve-3d] xl:block">
        <div
          className="animate-float [animation-delay:-4.4s]"
          style={{
            transform:
              "translateZ(200px) translate(calc(var(--mx, 0) * 5px), calc(var(--my, 0) * 3px))",
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-white/[0.11] bg-[#101018]/92 px-3 py-2 shadow-[0_18px_44px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#00d9ff]" />
            <span className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-[#8b8ba3]">
              Target
            </span>
            <span className="text-[10.5px] font-medium text-white">Frontend Engineer</span>
            <span className="h-3 w-px bg-white/[0.1]" />
            <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-emerald-300">
              Voice on
            </span>
          </div>
        </div>
      </div>

      {/* floating depth cards */}
      <div className="absolute -left-3 top-[16%] z-20 hidden w-[166px] [transform-style:preserve-3d] xl:block">
        <div
          className="animate-float"
          style={{
            transform:
              "translateZ(120px) translate(calc(var(--mx, 0) * -8px), calc(var(--my, 0) * -5px))",
          }}
        >
          <div className="rounded-2xl border border-white/[0.11] bg-[#101018]/92 p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#6c63ff]/25 bg-[#6c63ff]/12 text-[#b3adff]">
                <Layers3 size={13} />
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#8b8ba3]">Rubric</span>
            </div>
            <p className="mt-2 font-display text-[15px] font-semibold leading-tight text-white">4 dimensions</p>
            <div className="mt-2 space-y-1.5">
              {["Communication", "Role knowledge", "Problem solving"].map((item, index) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-[#6c63ff] to-[#00d9ff]"
                      style={{ width: `${82 - index * 7}%` }}
                    />
                  </span>
                  <span className="font-mono text-[7px] text-[#7d7f92]">{82 - index * 7}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 top-[9%] z-20 hidden w-[150px] [transform-style:preserve-3d] xl:block">
        <div
          className="animate-float [animation-delay:-2.2s]"
          style={{
            transform:
              "translateZ(80px) translate(calc(var(--mx, 0) * 6px), calc(var(--my, 0) * 4px))",
          }}
        >
          <div className="rounded-2xl border border-white/[0.11] bg-[#101018]/92 p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#8b8ba3]">Report ready</span>
            <p className="mt-1.5 font-display text-[25px] font-semibold leading-none text-white">
              48<span className="ml-0.5 text-[12px] font-normal text-[#8b8ba3]">s</span>
            </p>
            <p className="mt-1 text-[9.5px] leading-snug text-[#8d8d9f]">5 answers · 4 scores · 1 plan</p>
            <div className="mt-2 flex items-center gap-1 border-t border-white/[0.06] pt-2 font-mono text-[7.5px] uppercase tracking-[0.08em] text-emerald-300">
              <Check size={8} /> Evidence quoted
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -right-2 bottom-[13%] z-20 hidden items-center gap-2.5 rounded-2xl border border-white/[0.11] bg-[#101018]/92 px-3.5 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl xl:flex"
        style={{
          transform:
            "translateZ(150px) translate(calc(var(--mx, 0) * 10px), calc(var(--my, 0) * 7px))",
        }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#00d9ff]/20 bg-[#00d9ff]/10 text-[#7fe8ff]">
          <Bot size={15} />
        </span>
        <div>
          <p className="text-[10.5px] font-medium text-white">Robot presence</p>
          <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#6f7284]">Optional · LAN</p>
        </div>
        <span className="ml-1 h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
      </div>

      <div
        className="absolute -left-6 bottom-[6%] z-20 hidden w-[154px] xl:block"
        style={{
          transform:
            "translateZ(60px) translate(calc(var(--mx, 0) * -5px), calc(var(--my, 0) * -3px))",
        }}
      >
        <div className="rounded-2xl border border-white/[0.11] bg-[#101018]/92 p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-[#7fe8ff]">
              <Sparkles size={11} />
            </span>
            <span className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-[#8b8ba3]">Specialists</span>
          </div>
          <p className="mt-2 font-display text-[20px] font-semibold leading-none text-white">5 agents</p>
          <p className="mt-1 text-[9.5px] text-[#8d8d9f]">one workspace</p>
        </div>
      </div>

      {/* caption */}
      <div className="relative z-20 mt-5 flex items-center justify-center gap-2.5 px-4 text-center">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
        <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-[#6f7284]">
          Live workspace · move to orbit
        </p>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
        <ArrowUpRight size={10} className="text-[#6f7284]" />
      </div>
    </div>
  );
}
