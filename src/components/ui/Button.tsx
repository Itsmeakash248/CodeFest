"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/components/ui/cn";

type Variant = "primary" | "ghost" | "soft" | "danger" | "plain";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  soft: "btn-soft",
  danger: "border border-rose-400/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/16",
  plain: "border-transparent bg-transparent text-[#b9b9c9] hover:bg-white/[0.05] hover:text-white",
};

const sizeStyle: Record<Size, { padding: string; fontSize: string; borderRadius?: string }> = {
  sm: { padding: "0.5rem 0.72rem", fontSize: "12.5px", borderRadius: "9px" },
  md: { padding: "0.8rem 1.15rem", fontSize: "13.5px" },
  lg: { padding: "0.95rem 1.4rem", fontSize: "14.5px" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "ghost", size = "md", loading = false, disabled, children, type = "button", style, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn("btn", variantClass[variant], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={{ ...sizeStyle[size], ...style }}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

export default Button;
