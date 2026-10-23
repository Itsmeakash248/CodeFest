import { synthesizeSpeech } from "@/lib/client/api";

export interface SpeechHandle {
  mode: "elevenlabs" | "browser";
  stop: () => void;
  finished: Promise<void>;
}

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => /en-(US|GB)/i.test(voice.lang) && /female|samantha|aria|jenny/i.test(voice.name));
    const fallback = voices.find((voice) => /^en/i.test(voice.lang));
    if (preferred ?? fallback) utterance.voice = preferred ?? fallback ?? null;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Speak a question or a sample. Prefers ElevenLabs server-side TTS and falls
 * back to the browser voice without ever blocking the interview.
 */
export async function speakText(
  text: string,
  voiceId?: string,
  options?: { onStart?: (mode: "elevenlabs" | "browser") => void },
): Promise<SpeechHandle> {
  stopSpeaking();
  const clean = text.trim();
  if (!clean) {
    return { mode: "browser", stop: () => {}, finished: Promise.resolve() };
  }

  try {
    const blob = await synthesizeSpeech(clean.slice(0, 900), voiceId);
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    const finished = new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
    });

    try {
      await audio.play();
      options?.onStart?.("elevenlabs");
      return {
        mode: "elevenlabs",
        stop: () => {
          audio.pause();
          URL.revokeObjectURL(url);
        },
        finished,
      };
    } catch {
      // Autoplay blocked or codec issue: fall back to the built-in voice.
      URL.revokeObjectURL(url);
      currentAudio = null;
      options?.onStart?.("browser");
      return {
        mode: "browser",
        stop: () => stopSpeaking(),
        finished: speakWithBrowser(clean),
      };
    }
  } catch {
    options?.onStart?.("browser");
    return {
      mode: "browser",
      stop: () => stopSpeaking(),
      finished: speakWithBrowser(clean),
    };
  }
}

/* ------------------------- dictation (Web Speech STT) ------------------------- */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

export interface DictationHandle {
  stop: () => void;
}

export interface DictationOptions {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
  lang?: string;
}

export function isDictationSupported(): boolean {
  if (typeof window === "undefined") return false;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return Boolean(scope.SpeechRecognition || scope.webkitSpeechRecognition);
}

export function startDictation(options: DictationOptions): DictationHandle | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  const Constructor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  if (!Constructor) {
    options.onError?.("Speech recognition is not supported in this browser. Type your answer instead.");
    return null;
  }

  const recognition = new Constructor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.lang ?? "en-US";
  recognition.maxAlternatives = 1;

  let finalText = "";
  let stopped = false;

  recognition.onresult = (event) => {
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (!result) continue;
      const transcript = result[0]?.transcript ?? "";
      if (result.isFinal) finalText = `${finalText} ${transcript}`.replace(/\s+/g, " ").trim();
      else interim += transcript;
    }
    options.onTranscript(`${finalText} ${interim}`.replace(/\s+/g, " ").trim(), !interim);
  };

  recognition.onerror = (event) => {
    const message =
      event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone permission was denied. Type your answer or allow the mic."
        : event.error === "no-speech"
          ? "No speech detected. Try again or type your answer."
          : `Microphone error: ${event.error}`;
    options.onError?.(message);
  };

  recognition.onend = () => {
    if (!stopped) {
      stopped = true;
      options.onTranscript(finalText.trim(), true);
      options.onEnd?.();
    }
  };

  try {
    recognition.start();
  } catch {
    options.onError?.("Could not start the microphone. Check browser permissions.");
    return null;
  }

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
      options.onTranscript(finalText.trim(), true);
      options.onEnd?.();
    },
  };
}
