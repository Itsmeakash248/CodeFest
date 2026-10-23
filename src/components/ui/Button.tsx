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
  danger: "border border-[var(--color-error)]/30 bg-[var(--color-error)]/12 text-[var(--color-error)] hover:bg-[var(--color-error)]/20",
  plain: "border-transparent bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-primary)]",
};

const sizeStyle: Record<Size, { padding: string; fontSize: string; borderRadius?: string }> = {
  sm: { padding: "0.5rem 1rem", fontSize: "12.5px", borderRadius: "9999px" },
  md: { padding: "0.75rem 1.4rem", fontSize: "14px", borderRadius: "9999px" },
  lg: { padding: "0.95rem 1.75rem", fontSize: "15px", borderRadius: "9999px" },
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
