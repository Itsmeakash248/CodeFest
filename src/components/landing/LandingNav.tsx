"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/components/ui/cn";

interface LandingNavProps {
  user?: { name: string; email: string } | null;
}

const links = [
  { href: "#workspace", id: "workspace", label: "Workspace" },
  { href: "#agents", id: "agents", label: "Agents" },
  { href: "#workflow", id: "workflow", label: "Workflow" },
  { href: "#report", id: "report", label: "Report" },
  { href: "#robot", id: "robot", label: "Robot" },
];

export default function LandingNav({ user }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 24);
      setProgress(max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-42% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-white/[0.07] bg-[#0a0a0f]/80 backdrop-blur-2xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-[1320px] items-center gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="ViewPilot Pro home" className="shrink-0">
          <Logo size={26} />
        </Link>

        <nav className="ml-2 hidden items-center gap-0.5 lg:flex" aria-label="Landing sections">
          {links.map((link) => {
            const current = active === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setActive(link.href)}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors",
                  current
                    ? "bg-white/[0.08] text-white"
                    : "text-[#b2b3c4] hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {link.label}
                {current ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2.5 -bottom-[1px] h-px bg-gradient-to-r from-transparent via-[#a8a2ff] to-transparent"
                  />
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 sm:flex">
          {user ? (
            <>
              <Link href="/settings" className="btn btn-ghost !px-4 !py-2.5 !text-[13.5px]">
                Settings
              </Link>
              <Link href="/dashboard" className="btn btn-primary !px-4.5 !py-2.5 !text-[13.5px]">
                Open workspace
                <ArrowUpRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost !px-4 !py-2.5 !text-[13.5px]">
                Log in
              </Link>
              <Link href="/interview" className="btn btn-primary !px-4.5 !py-2.5 !text-[13.5px]">
                Start practicing
                <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto sm:hidden">
          <Link href="/interview" className="btn btn-primary !px-3.5 !py-2 !text-[12.5px]">
            Practice
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#c5c5d4] transition-colors hover:text-white lg:hidden"
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-white/[0.035]">
        <span
          className="block h-full origin-left bg-gradient-to-r from-[#6c63ff] via-[#8d86ff] to-[#00d9ff] transition-[width] duration-150 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        />
      </span>

      {open ? (
        <div
          id="landing-mobile-menu"
          className="animate-rise border-t border-white/[0.06] bg-[#0a0a0f]/96 px-5 py-4 backdrop-blur-2xl lg:hidden"
        >
          <nav className="grid gap-1" aria-label="Mobile landing sections">
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => {
                  setActive(link.href);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                  active === link.href
                    ? "bg-white/[0.055] text-white"
                    : "text-[#c5c5d4] hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <span className="font-mono text-[7.5px] text-[#565969]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {link.label}
                <ArrowUpRight size={11} className="ml-auto text-[#5f6273]" />
              </a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
            {user ? (
              <>
                <Link href="/settings" className="btn btn-ghost w-full !text-[12px]">
                  Settings
                </Link>
                <Link href="/dashboard" className="btn btn-primary w-full !text-[12px]">
                  Workspace
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost w-full !text-[12px]">
                  Log in
                </Link>
                <Link href="/interview" className="btn btn-primary w-full !text-[12px]">
                  Start practicing
                </Link>
              </>
            )}
          </div>
          <p className="mt-3 text-center font-mono text-[7px] uppercase tracking-[0.12em] text-[#565969]">
            Demo auth · no password stored
          </p>
        </div>
      ) : null}
    </header>
  );
}
