import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "@/components/vp/Icons";

export default function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-32 sm:px-8 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" aria-hidden />
      <div className="blob -left-24 top-8 h-64 w-64 bg-lilac/70" aria-hidden />
      <div className="relative mx-auto max-w-4xl">
        <span className="chip chip-violet">{eyebrow}</span>
        <h1 className="display-l mt-5 max-w-3xl text-ink">{title}</h1>
        <p className="lede mt-5 max-w-2xl">{lede}</p>
        {children ?? (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/interview" className="btn btn-primary">
              Start a mock interview
              <ArrowRight />
            </Link>
            <Link href="/" className="btn btn-ghost">
              Back to overview
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
