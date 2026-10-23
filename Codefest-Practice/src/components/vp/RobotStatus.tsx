"use client";

import { useEffect, useState } from "react";
import { Robot } from "@/components/vp/Icons";

type State = {
  configured: boolean;
  online: boolean;
  message?: string;
  status?: Record<string, unknown> | null;
};

export default function RobotStatus() {
  const [state, setState] = useState<State | null>(null);
  const [testing, setTesting] = useState(false);
  const [reaction, setReaction] = useState("");

  async function check() {
    try {
      const res = await fetch("/api/robot", { cache: "no-store" });
      setState((await res.json()) as State);
    } catch {
      setState({
        configured: false,
        online: false,
        message: "Could not reach the robot bridge. Browser flow is unaffected.",
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/robot", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: State) => {
        if (!cancelled) setState(data);
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            configured: false,
            online: false,
            message: "Could not reach the robot bridge. Browser flow is unaffected.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function testReaction() {
    setTesting(true);
    setReaction("");
    try {
      const res = await fetch("/api/robot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion: "Curious" }),
      });
      const data = (await res.json()) as { message?: string; online?: boolean };
      setReaction(data.message || "No response.");
      setState((prev) => (prev ? { ...prev, online: Boolean(data.online) } : prev));
    } catch {
      setReaction("Robot did not respond. The session continues in the browser.");
    } finally {
      setTesting(false);
    }
  }

  const tone = !state
    ? "bg-cream-2 text-muted"
    : state.online
      ? "bg-[#e2f6f1] text-teal"
      : "bg-[#fdebe7] text-coral";

  return (
    <div className="card-solid p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lilac text-violet">
            <Robot />
          </span>
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-violet">
              Robot bridge
            </p>
            <h3 className="text-base font-semibold text-ink">Backup interviewer</h3>
          </div>
        </div>
        <span className={`chip ${tone}`}>
          {!state ? "checking…" : state.online ? "online" : "not connected"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {state?.message ||
          "Checking whether a robot is configured. The web interview never waits for it."}
      </p>

      {state?.configured && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={testReaction}
            disabled={testing || !state.online}
            className="btn btn-soft px-4 py-2 text-[0.8rem]"
          >
            {testing ? "Sending…" : "Send a curious face"}
          </button>
          <button
            type="button"
            onClick={check}
            className="btn btn-ghost px-4 py-2 text-[0.8rem]"
          >
            Re-check
          </button>
        </div>
      )}

      {reaction && (
        <p className="mt-3 text-[0.74rem] font-semibold text-ink-soft">{reaction}</p>
      )}

      <p className="mt-4 border-t border-line pt-3 text-[0.68rem] font-semibold text-muted">
        Optional by design. No robot is required for any interview or report.
      </p>
    </div>
  );
}
