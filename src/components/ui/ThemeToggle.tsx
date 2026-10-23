"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme } from "@/components/preferences";
import { cn } from "@/components/ui/cn";

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-container)] opacity-60",
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-container)] text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-container-high)] hover:border-[var(--color-primary)] active:scale-95",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun size={15} className="text-[#F0C078]" aria-hidden="true" />
      ) : (
        <Moon size={15} className="text-[#B9573D]" aria-hidden="true" />
      )}
    </button>
  );
}
