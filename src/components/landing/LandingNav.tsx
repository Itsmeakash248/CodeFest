"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { logout } from "@/lib/client/api";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
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
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

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
          ? "border-[var(--color-outline)] bg-[var(--color-surface)]/90 shadow-sm backdrop-blur-2xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[70px] w-full max-w-[1360px] items-center gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="ViewPilot Pro home" className="shrink-0">
          <Logo size={28} />
        </Link>

        <nav className="ml-3 hidden items-center gap-1.5 rounded-full border border-[var(--color-outline)]/60 bg-[var(--color-surface-container)]/70 p-1 lg:flex" aria-label="Landing sections">
          {links.map((link) => {
            const current = active === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setActive(link.href)}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-all duration-200",
                  current
                    ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] shadow-sm font-semibold"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text-primary)]",
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden max-w-[140px] truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] xl:block">
                {user.email}
              </span>
              <Link href="/settings" className="btn btn-ghost !px-4.5 !py-2.5 !text-[13.5px]">
                Settings
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="btn btn-ghost !px-4.5 !py-2.5 !text-[13.5px] disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
              <Link href="/dashboard" className="btn btn-primary !px-5 !py-2.5 !text-[13.5px]">
                Open workspace
                <ArrowUpRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost !px-4.5 !py-2.5 !text-[13.5px]">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary !px-5 !py-2.5 !text-[13.5px]">
                Sign up free
                <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className="btn btn-primary !px-3.5 !py-2 !text-[12.5px]">
              Workspace
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost !px-3 !py-2 !text-[12px]">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary !px-3.5 !py-2 !text-[12px]">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-container)] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-container-high)] lg:hidden"
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--color-outline)]/40">
        <span
          className="block h-full origin-left bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-tertiary)] to-[var(--color-secondary)] transition-[width] duration-150 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        />
      </span>

      {open ? (
        <div
          id="landing-mobile-menu"
          className="animate-rise border-t border-[var(--color-outline)] bg-[var(--color-surface)] px-5 py-4 shadow-lg backdrop-blur-2xl lg:hidden"
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
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-[13.5px] transition-colors",
                  active === link.href
                    ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-semibold"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-primary)]",
                )}
              >
                <span className="font-mono text-[9px] text-[var(--color-text-secondary)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {link.label}
                <ArrowUpRight size={13} className="ml-auto text-[var(--color-text-secondary)]" />
              </a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--color-outline)] pt-3">
            {user ? (
              <>
                <Link href="/settings" className="btn btn-ghost w-full !text-[12px]">
                  Settings
                </Link>
                <Link href="/dashboard" className="btn btn-primary w-full !text-[12px]">
                  Workspace
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="btn btn-ghost col-span-2 w-full !text-[12px] disabled:opacity-60"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost w-full !text-[12px]">
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-primary w-full !text-[12px]">
                  Sign up free
                </Link>
              </>
            )}
          </div>
          <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Demo auth · no password stored
          </p>
        </div>
      ) : null}
    </header>
  );
}
