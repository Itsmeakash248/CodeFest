"use client";

import Link from "next/link";
import { LayoutDashboard, Settings } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { initials } from "@/components/dashboard/utils";
import { cn } from "@/components/ui/cn";

type Screen = "setup" | "room" | "report";

const steps: { id: Screen; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "room", label: "Rehearse" },
  { id: "report", label: "Report" },
];

interface InterviewTopBarProps {
  screen: Screen;
  user: { name: string; email: string };
}

export default function InterviewTopBar({ screen, user }: InterviewTopBarProps) {
  const activeIndex = steps.findIndex((step) => step.id === screen);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--color-background)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center gap-3 px-5 sm:px-8">
        <Link href="/" aria-label="ViewPilot Pro home" className="shrink-0">
          <Logo size={24} />
        </Link>

        <span aria-hidden="true" className="hidden h-5 w-px bg-[var(--color-surface-container-high)] sm:block" />

        <div className="hidden min-w-0 sm:block">
          <p className="font-display text-[12.5px] font-semibold leading-tight text-[var(--color-text-primary)]">
            Interview room
          </p>
          <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
            Local rubric · voice optional
          </p>
        </div>

        <div className="ml-2 hidden items-center gap-1 md:flex" aria-label="Interview progress">
          {steps.map((step, index) => {
            const active = step.id === screen;
            const complete = index < activeIndex;
            return (
              <span key={step.id} className="flex items-center gap-1">
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.08em] transition-colors",
                    active
                      ? "border-[#6c63ff]/30 bg-[#6c63ff]/12 text-[var(--color-tertiary)]"
                      : complete
                        ? "border-emerald-400/15 bg-emerald-500/[0.06] text-emerald-300/80"
                        : "border-white/[0.05] text-[var(--color-text-faint)]",
                  )}
                >
                  {complete ? <span className="h-1 w-1 rounded-full bg-emerald-400/80" /> : null}
                  {step.label}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn("h-px w-3", complete ? "bg-emerald-400/20" : "bg-[var(--color-surface-container-high)]")}
                  />
                ) : null}
              </span>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] px-2.5 text-[11px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]"
          >
            <LayoutDashboard size={12} />
            <span className="hidden lg:inline">Workspace</span>
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-[var(--color-surface-container)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]"
          >
            <Settings size={13} />
          </Link>
          <span
            title={`${user.name} · ${user.email}`}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7c74ff] to-[#3c34a8] text-[9px] font-bold text-[var(--color-text-primary)]"
          >
            {initials(user.name)}
          </span>
        </div>
      </div>
    </header>
  );
}
