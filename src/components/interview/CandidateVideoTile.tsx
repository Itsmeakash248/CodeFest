"use client";

import { useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import type { FaceStatus } from "@/lib/interview/useVideoProctor";
import { cn } from "@/components/ui/cn";

interface CandidateVideoTileProps {
  stream: MediaStream | null;
  cameraActive: boolean;
  micActive: boolean;
  faceStatus: FaceStatus;
  integrityScore: number;
  eyeContactPct: number;
  micLevel: number;
  candidateName?: string;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  className?: string;
}

export default function CandidateVideoTile({
  stream,
  cameraActive,
  micActive,
  faceStatus,
  integrityScore,
  eyeContactPct,
  micLevel,
  candidateName = "Candidate",
  onToggleCamera,
  onToggleMic,
  className,
}: CandidateVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const statusConfig = {
    centered: {
      color: "border-emerald-500/50 text-emerald-300",
      bg: "bg-emerald-500/10",
      label: "Face Centered · Eye Contact Good",
      icon: UserCheck,
    },
    "looking-away": {
      color: "border-amber-400/50 text-amber-300",
      bg: "bg-amber-500/10",
      label: "Gaze Shifted · Looking Away",
      icon: AlertTriangle,
    },
    absent: {
      color: "border-rose-500/50 text-rose-300",
      bg: "bg-rose-500/10",
      label: "Face Not in Frame",
      icon: UserX,
    },
    "multiple-faces": {
      color: "border-rose-500/60 text-rose-200",
      bg: "bg-rose-500/20",
      label: "Multiple Faces Detected",
      icon: Users,
    },
  }[faceStatus];

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md shadow-2xl transition-all",
        className,
      )}
    >
      {/* Video element or camera off placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0c0c14]">
        {stream && cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-text-faint)]">
            <CameraOff size={28} className="opacity-40" />
            <p className="font-mono text-[9px] uppercase tracking-[0.1em]">Camera Inactive</p>
          </div>
        )}

        {/* Futuristic Face Tracking Reticle Overlay */}
        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div
              className={cn(
                "relative h-44 w-36 rounded-2xl border-2 transition-all duration-300",
                faceStatus === "centered" && "border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.2)]",
                faceStatus === "looking-away" && "border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse",
                (faceStatus === "absent" || faceStatus === "multiple-faces") &&
                  "border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse",
              )}
            >
              {/* Corner targeting reticles */}
              <span className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-white/80" />
              <span className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-white/80" />
              <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-white/80" />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-white/80" />

              {/* Crosshair target mark */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/20" />
            </div>
          </div>
        )}

        {/* Top Status HUD overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          {/* Integrity Score Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur-md">
            <ShieldCheck size={11} className={integrityScore >= 80 ? "text-emerald-400" : "text-amber-400"} />
            <span className="font-mono text-[7.5px] uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
              {integrityScore}% Integrity
            </span>
          </div>

          {/* Eye Contact Pill */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-1 backdrop-blur-md font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
            <span>Eye Contact:</span>
            <span className="font-semibold text-emerald-300">{eyeContactPct}%</span>
          </div>
        </div>

        {/* Bottom Face Status Banner */}
        <div className="absolute bottom-11 left-2.5 right-2.5">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[8px] font-medium backdrop-blur-md transition-all",
              statusConfig.color,
              statusConfig.bg,
            )}
          >
            <StatusIcon size={10} className="shrink-0" />
            <span className="truncate">{statusConfig.label}</span>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between border-t border-white/[0.08] bg-black/75 px-3 py-1.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-primary)]">
              {candidateName}
            </span>
            {/* Live Mic volume visualizer */}
            {micActive && (
              <div className="flex h-2.5 items-end gap-[1.5px]">
                {[0, 1, 2, 3].map((b) => (
                  <span
                    key={b}
                    className="w-[2px] rounded-full bg-emerald-400 transition-all duration-100"
                    style={{
                      height: `${Math.max(2, Math.min(10, micLevel * 14 * (b + 1) * 0.4))}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleCamera}
              aria-label={cameraActive ? "Turn off camera" : "Turn on camera"}
              className={cn(
                "rounded-md border p-1 transition-colors",
                cameraActive
                  ? "border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:text-white"
                  : "border-rose-500/40 bg-rose-500/20 text-rose-300",
              )}
            >
              {cameraActive ? <Camera size={11} /> : <CameraOff size={11} />}
            </button>
            <button
              type="button"
              onClick={onToggleMic}
              aria-label={micActive ? "Mute microphone" : "Unmute microphone"}
              className={cn(
                "rounded-md border p-1 transition-colors",
                micActive
                  ? "border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:text-white"
                  : "border-rose-500/40 bg-rose-500/20 text-rose-300",
              )}
            >
              {micActive ? <Mic size={11} /> : <MicOff size={11} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
