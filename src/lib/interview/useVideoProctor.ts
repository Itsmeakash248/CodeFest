"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FaceStatus = "centered" | "absent" | "looking-away" | "multiple-faces";

export interface VideoProctorState {
  stream: MediaStream | null;
  cameraActive: boolean;
  micActive: boolean;
  hasPermission: boolean | null;
  error: string | null;
  faceStatus: FaceStatus;
  inFramePct: number;
  eyeContactPct: number;
  micLevel: number;
  toggleCamera: () => void;
  toggleMic: () => void;
  startVideo: () => Promise<boolean>;
  stopVideo: () => void;
}

export function useVideoProctor(enabled: boolean): VideoProctorState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("centered");
  const [inFramePct, setInFramePct] = useState(100);
  const [eyeContactPct, setEyeContactPct] = useState(96);
  const [micLevel, setMicLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const frameStatsRef = useRef({ total: 0, inFrame: 0, eyeContact: 0 });

  const stopVideo = useCallback(() => {
    if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
      videoElRef.current = null;
    }
    setStream(null);
    setMicLevel(0);
  }, []);

  const startVideo = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Webcam access is not supported by your browser.");
      setHasPermission(false);
      return false;
    }

    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      setCameraActive(true);
      setMicActive(true);

      // Create hidden video element for frame analysis
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.srcObject = mediaStream;
      videoElRef.current = video;
      await video.play().catch(() => {});

      // Setup audio analyzer for live mic level
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.5;
          analyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(mediaStream);
          audioSourceRef.current = source;
          source.connect(analyser);

          const sampleAudio = () => {
            if (!analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i += 1) sum += dataArray[i];
            const avg = sum / (dataArray.length * 255);
            setMicLevel(Math.min(1, avg * 3.5));
            animFrameRef.current = window.requestAnimationFrame(sampleAudio);
          };
          sampleAudio();
        }
      } catch {
        // Audio visualization is non-critical fallback
      }

      // Setup offscreen canvas for face & gaze detection
      if (!canvasRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 120;
        canvasRef.current = canvas;
      }

      // Start periodic face detection (every 400ms = 2.5 fps)
      const detectFaces = async () => {
        const vid = videoElRef.current;
        if (!vid || vid.readyState < 2) return;

        frameStatsRef.current.total += 1;
        let detectedStatus: FaceStatus = "centered";

        // Check if browser native FaceDetector is available
        const hasNativeDetector = typeof window !== "undefined" && "FaceDetector" in window;
        if (hasNativeDetector) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
            const faces = await detector.detect(vid);
            if (!faces || faces.length === 0) {
              detectedStatus = "absent";
            } else if (faces.length > 1) {
              detectedStatus = "multiple-faces";
            } else {
              const face = faces[0].boundingBox;
              const vW = vid.videoWidth || 640;
              const vH = vid.videoHeight || 480;
              const cx = face.x + face.width / 2;
              const cy = face.y + face.height / 2;

              // Check if face is centered
              const xDev = Math.abs(cx - vW / 2) / vW;
              const yDev = Math.abs(cy - vH / 2) / vH;

              if (xDev > 0.22 || yDev > 0.25) {
                detectedStatus = "looking-away";
              } else {
                detectedStatus = "centered";
              }
            }
          } catch {
            // Fall through to canvas analysis
          }
        }

        // Universal Canvas Skin-Centroid & Gaze Fallback
        if (!hasNativeDetector || detectedStatus === "centered") {
          const cvs = canvasRef.current;
          const ctx = cvs?.getContext("2d", { willReadFrequently: true });
          if (cvs && ctx) {
            ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);
            const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
            const data = imgData.data;

            let skinPixels = 0;
            let sumX = 0;
            let sumY = 0;
            const w = cvs.width;
            const h = cvs.height;

            // Sample every 2nd pixel for speed
            for (let y = 0; y < h; y += 2) {
              for (let x = 0; x < w; x += 2) {
                const idx = (y * w + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Standard normalized RGB skin chroma detector
                if (r > 60 && g > 35 && b > 20 && r > g && r > b && r - g > 10 && Math.abs(r - g) > 8) {
                  skinPixels += 1;
                  sumX += x;
                  sumY += y;
                }
              }
            }

            const totalSampled = (w * h) / 4;
            const skinRatio = skinPixels / totalSampled;

            if (skinRatio < 0.04) {
              detectedStatus = "absent";
            } else {
              const avgX = sumX / skinPixels;
              const avgY = sumY / skinPixels;
              const dx = Math.abs(avgX - w / 2) / (w / 2);
              const dy = Math.abs(avgY - h / 2) / (h / 2);

              if (dx > 0.35 || dy > 0.38) {
                detectedStatus = "looking-away";
              } else {
                detectedStatus = "centered";
              }
            }
          }
        }

        // Update running percentages
        if (detectedStatus !== "absent") {
          frameStatsRef.current.inFrame += 1;
        }
        if (detectedStatus === "centered") {
          frameStatsRef.current.eyeContact += 1;
        }

        const total = Math.max(1, frameStatsRef.current.total);
        setInFramePct(Math.round((frameStatsRef.current.inFrame / total) * 100));
        setEyeContactPct(Math.round((frameStatsRef.current.eyeContact / total) * 100));
        setFaceStatus(detectedStatus);
      };

      detectionIntervalRef.current = window.setInterval(detectFaces, 400);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access was denied.";
      setError(msg);
      setHasPermission(false);
      return false;
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!streamRef.current) return;
    const tracks = streamRef.current.getVideoTracks();
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCameraActive((prev) => !prev);
  }, []);

  const toggleMic = useCallback(() => {
    if (!streamRef.current) return;
    const tracks = streamRef.current.getAudioTracks();
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicActive((prev) => !prev);
  }, []);

  useEffect(() => {
    if (enabled) {
      void startVideo();
    } else {
      stopVideo();
    }
    return () => {
      stopVideo();
    };
  }, [enabled, startVideo, stopVideo]);

  return {
    stream,
    cameraActive,
    micActive,
    hasPermission,
    error,
    faceStatus,
    inFramePct,
    eyeContactPct,
    micLevel,
    toggleCamera,
    toggleMic,
    startVideo,
    stopVideo,
  };
}
