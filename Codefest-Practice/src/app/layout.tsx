import type { Metadata, Viewport } from "next";
import { Funnel_Display, Funnel_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/vp/Nav";
import Footer from "@/components/vp/Footer";

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel-display",
  display: "swap",
});

const funnelSans = Funnel_Sans({
  subsets: ["latin"],
  variable: "--font-funnel-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ViewPilot — Your AI-powered interview coach",
  description:
    "ViewPilot turns realistic interview practice into structured growth: role-specific questions, a visible rubric, evidence-backed feedback and a targeted next-practice plan. CodeFest 2026 · Team Mooncraft.",
  keywords: [
    "ViewPilot",
    "AI interview coach",
    "mock interview",
    "CodeFest 2026",
    "Job Readiness",
    "interview practice",
    "Gemini",
    "Next.js",
  ],
  openGraph: {
    title: "ViewPilot — Your AI-powered interview coach",
    description:
      "Role-specific mock interviews with evidence-backed feedback and a visible rubric.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#faf4ea",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${funnelDisplay.variable} ${funnelSans.variable}`}>
      <body>
        <Nav />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
