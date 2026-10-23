import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMOTIONS = new Set([
  "Neutral",
  "Happy",
  "Curious",
  "Surprised",
  "Focused",
  "Sleepy",
  "Wink",
  "Sad",
  "Rage",
]);

function baseUrl() {
  return (process.env.ROBOT_BASE_URL || "").replace(/\/+$/, "");
}

async function robotFetch(path: string, init?: RequestInit) {
  const base = baseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: AbortSignal.timeout(1800),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET() {
  const configured = Boolean(baseUrl());
  if (!configured) {
    return NextResponse.json({
      configured: false,
      online: false,
      message:
        "No robot configured. ViewPilot runs fully in the browser; set ROBOT_BASE_URL to enable the optional physical backup.",
    });
  }

  const status = await robotFetch("/api/status");
  return NextResponse.json({
    configured: true,
    online: Boolean(status),
    status: status ?? null,
    message: status
      ? "Backup interviewer online."
      : "Robot unreachable. The browser session continues without it.",
  });
}

export async function POST(request: Request) {
  const configured = Boolean(baseUrl());
  if (!configured) {
    return NextResponse.json({
      configured: false,
      online: false,
      ok: false,
      message: "Robot backup is not configured. Session continues in the browser.",
    });
  }

  let body: { emotion?: string; action?: string } = {};
  try {
    body = (await request.json()) as { emotion?: string; action?: string };
  } catch {
    return NextResponse.json({ configured: true, online: false, ok: false }, { status: 400 });
  }

  const emotion = body.emotion && EMOTIONS.has(body.emotion) ? body.emotion : "Curious";
  const result =
    body.action === "blink"
      ? await robotFetch("/api/action?type=blink", { method: "POST" })
      : await robotFetch(`/api/emotion?name=${encodeURIComponent(emotion)}`, {
          method: "POST",
        });

  return NextResponse.json({
    configured: true,
    online: Boolean(result),
    ok: Boolean(result),
    message: result
      ? `Robot reacted: ${emotion}.`
      : "Robot did not respond. Session continues in the browser.",
  });
}
