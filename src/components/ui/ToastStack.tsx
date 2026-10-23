"use client";

import { AlertCircle, CheckCircle2, Sparkles, X } from "lucide-react";
import type { ToastItem } from "@/components/ui/useToasts";
import { cn } from "@/components/ui/cn";

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toneStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-400/20 bg-[#0f1b16]/95 text-emerald-100",
    iconClass: "text-emerald-300",
  },
  error: {
    icon: AlertCircle,
    className: "border-rose-400/20 bg-[#1b1014]/95 text-rose-100",
    iconClass: "text-rose-300",
  },
  info: {
    icon: Sparkles,
    className: "border-white/10 bg-[#121219]/95 text-[#dedeea]",
    iconClass: "text-[#a8a2ff]",
  },
};

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (!toasts.length) return null;
  return (
    <div
      className="fixed bottom-5 right-5 z-[110] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = toneStyles[toast.tone];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              "animate-msg flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-2xl backdrop-blur-xl",
              style.className,
            )}
          >
            <Icon size={15} className={cn("mt-0.5 shrink-0", style.iconClass)} aria-hidden="true" />
            <p className="flex-1 text-[12px] leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="mt-0.5 text-white/50 transition-colors hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
