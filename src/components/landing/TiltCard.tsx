"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Maximum rotation in degrees. Keep it subtle for large panels. */
  maxTilt?: number;
}

/**
 * Pointer-reactive 3D wrapper. It writes CSS variables straight to the node so
 * movement never triggers a React render. Depth children can use translateZ.
 */
export default function TiltCard({
  children,
  className,
  innerClassName,
  maxTilt = 7,
}: TiltCardProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const paint = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      inner.style.setProperty("--tilt-x", `${currentX.toFixed(3)}deg`);
      inner.style.setProperty("--tilt-y", `${currentY.toFixed(3)}deg`);
      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        frame = window.requestAnimationFrame(paint);
      } else {
        frame = 0;
      }
    };

    const requestPaint = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = outer.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      const py = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      targetY = px * maxTilt;
      targetX = py * -maxTilt;
      requestPaint();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      requestPaint();
    };

    outer.addEventListener("pointermove", onPointerMove);
    outer.addEventListener("pointerleave", onPointerLeave);
    return () => {
      outer.removeEventListener("pointermove", onPointerMove);
      outer.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [maxTilt]);

  return (
    <div
      ref={outerRef}
      className={cn("relative [perspective:1400px]", className)}
    >
      <div
        ref={innerRef}
        className={cn(
          "relative h-full [transform-style:preserve-3d] will-change-transform",
          innerClassName,
        )}
        style={{
          transform: "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))",
          transition: "transform 160ms cubic-bezier(0.2, 0.7, 0.2, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
