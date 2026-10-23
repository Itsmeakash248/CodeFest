import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "ViewPilot Pro — Rehearse the interview. Own the feedback.",
    template: "%s · ViewPilot Pro",
  },
  description:
    "Five specialist AI agents, adaptive mock interviews, a visible four-part rubric and a practice plan built from your own answers. Works without an API key or a robot.",
  applicationName: "ViewPilot Pro",
  authors: [{ name: "Team Mooncraft" }],
  keywords: [
    "interview practice",
    "job readiness",
    "AI interview coach",
    "resume review",
    "career preparation",
  ],
  openGraph: {
    title: "ViewPilot Pro — Rehearse the interview. Own the feedback.",
    description:
      "Adaptive mock interviews with evidence-backed feedback, five AI specialists and a drag-and-drop prep workflow builder.",
    type: "website",
    siteName: "ViewPilot Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "ViewPilot Pro",
    description:
      "Rehearse the interview. Own the feedback. Built by Team Mooncraft for CodeFest 2026.",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F3EC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("viewpilot.theme")||"light";document.documentElement.setAttribute("data-theme",t);if(t==="dark")document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="noise min-h-dvh bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
