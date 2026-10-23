"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/content";
import Logo from "@/components/vp/Logo";
import { ArrowRight, Close, Menu } from "@/components/vp/Icons";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:pt-4">
      <nav
        className={`mx-auto flex w-full max-w-6xl items-center gap-2 rounded-full border px-3 py-2 transition-all duration-300 sm:px-4 ${
          scrolled
            ? "border-line bg-paper/85 shadow-[0_14px_40px_-24px_rgba(16,27,52,0.55)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="ViewPilot home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-[1.08rem] font-semibold tracking-tight">
            {SITE.name}
          </span>
          <span className="hidden rounded-full bg-lilac px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-violet-deep md:inline-block">
            {SITE.team}
          </span>
        </Link>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[0.86rem] font-semibold transition-colors ${
                  active
                    ? "bg-lilac text-violet-deep"
                    : "text-muted hover:bg-cream-2 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/interview"
            className="btn btn-primary hidden px-4 py-2 text-[0.84rem] sm:inline-flex"
          >
            Start practice
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 w-full max-w-6xl rounded-3xl border border-line bg-paper/95 p-3 shadow-xl backdrop-blur-xl md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-ink hover:bg-cream-2"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/interview"
            onClick={() => setOpen(false)}
            className="btn btn-primary mt-2 w-full"
          >
            Start practice
            <ArrowRight />
          </Link>
        </div>
      )}
    </header>
  );
}
