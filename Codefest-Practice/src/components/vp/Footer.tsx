import Link from "next/link";
import { SITE } from "@/lib/content";
import Logo from "@/components/vp/Logo";
import { ArrowUpRight, Shield } from "@/components/vp/Icons";

export default function Footer() {
  return (
    <footer className="no-print px-5 pb-10 pt-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="card relative overflow-hidden px-6 py-10 sm:px-10">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-lilac/70 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">Practice with purpose</p>
              <h2 className="display-m mt-3 max-w-xl text-ink">
                Walk in prepared, not hopeful.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
                A complete mock interview, a visible rubric, and evidence you can act
                on — in under fifteen minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/interview" className="btn btn-primary">
                Start a mock interview
                <ArrowUpRight />
              </Link>
              <a
                href={SITE.repo}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-ghost"
              >
                View source
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <p className="font-display text-sm font-semibold text-ink">
                {SITE.name}
              </p>
              <p className="text-[0.72rem] font-semibold text-muted">
                {SITE.event} · {SITE.team} · {SITE.domain}
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.78rem] font-semibold text-muted">
            <Link href="/" className="hover:text-ink">Home</Link>
            <Link href="/interview" className="hover:text-ink">Practice</Link>
            <Link href="/how" className="hover:text-ink">How it works</Link>
            <Link href="/stack" className="hover:text-ink">Under the hood</Link>
            <Link href="/robot" className="hover:text-ink">Robot backup</Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-[0.68rem] font-semibold text-muted/80">
            Practice guidance, not a hiring decision. Scores are estimates against a
            disclosed rubric.
          </p>
          <p className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-muted/80">
            <Shield className="h-3.5 w-3.5" />
            No protected-trait scoring · zero client-side API keys
          </p>
        </div>
      </div>
    </footer>
  );
}
