import { synthesizeSpeech } from "@/lib/client/api";
import { stripMarkdown } from "@/lib/text";

export interface SpeechHandle {
  mode: "elevenlabs" | "browser";
  stop: () => void;
  finished: Promise<void>;
}

let currentAudio: HTMLAudioElement | null = null;
/**
 * Incremented every time playback is stopped or superseded. Async work checks
 * it before it is allowed to produce sound, so a slow request can never start
 * talking over a newer one.
 */
let generation = 0;
/** The line that is currently loading or playing, used to ignore duplicates. */
let activeText: string | null = null;
let activeRequest: Promise<SpeechHandle> | null = null;

const NOOP_HANDLE: SpeechHandle = {
  mode: "browser",
  stop: () => {},
  finished: Promise.resolve(),
};

function noopHandle(): SpeechHandle {
  return { ...NOOP_HANDLE, finished: Promise.resolve() };
}

function disposeAudio(audio: HTMLAudioElement): void {
  try {
    audio.pause();
  } catch {
    // already stopped
  }
  try {
    audio.removeAttribute("src");
    audio.load();
  } catch {
    // detached element
  }
}

function clearActive(text: string): void {
  if (activeText === text) {
    activeText = null;
    activeRequest = null;
  }
}

export function stopSpeaking(): void {
  generation += 1;
  activeText = null;
  activeRequest = null;
  if (currentAudio) {
    disposeAudio(currentAudio);
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function speakWithBrowser(text: string, requestedGeneration: number): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported() || requestedGeneration !== generation) {
      resolve();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    // Chrome can queue the next utterance twice when speak() runs in the same
    // task as cancel(). Let the cancel settle before speaking.
    window.setTimeout(() => {
      if (requestedGeneration !== generation) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const preferred = voices.find(
        (voice) => /en-(US|GB)/i.test(voice.lang) && /female|samantha|aria|jenny/i.test(voice.name),
      );
      const fallback = voices.find((voice) => /^en/i.test(voice.lang));
      if (preferred ?? fallback) utterance.voice = preferred ?? fallback ?? null;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    }, 120);
  });
}

/**
 * Speak a question or a sample. Prefers ElevenLabs server-side TTS and falls
 * back to the browser voice without ever blocking the interview. Only one
 * voice can be active at a time: duplicate calls for the same line share the
 * existing playback instead of restarting it.
 */
export function speakText(
  text: string,
  voiceId?: string,
  options?: { onStart?: (mode: "elevenlabs" | "browser") => void },
): Promise<SpeechHandle> {
  const clean = stripMarkdown(text).slice(0, 900);
  if (!clean) {
    stopSpeaking();
    return Promise.resolve(noopHandle());
  }

  // The same line can be requested twice by an auto-read plus a click, or by
  // React re-running an effect. Reuse the playback that is already in flight.
  if (activeRequest && activeText === clean) return activeRequest;

  stopSpeaking();
  const requestedGeneration = generation;

  const run = async (): Promise<SpeechHandle> => {
    const releaseActive = () => {
      if (activeText === clean) {
        activeText = null;
        activeRequest = null;
      }
    };

    try {
      const blob = await synthesizeSpeech(clean.slice(0, 900), voiceId);
      if (requestedGeneration !== generation) return noopHandle();

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.preload = "auto";
      currentAudio = audio;

      let urlReleased = false;
      const releaseUrl = () => {
        if (urlReleased) return;
        urlReleased = true;
        URL.revokeObjectURL(url);
      };
      const finished = new Promise<void>((resolve) => {
        audio.onended = () => {
          releaseUrl();
          if (currentAudio === audio) currentAudio = null;
          releaseActive();
          resolve();
        };
        audio.onerror = () => {
          releaseUrl();
          if (currentAudio === audio) currentAudio = null;
          releaseActive();
          resolve();
        };
      });

      const elevenLabsHandle: SpeechHandle = {
        mode: "elevenlabs",
        stop: () => {
          disposeAudio(audio);
          releaseUrl();
          if (currentAudio === audio) currentAudio = null;
          releaseActive();
        },
        finished,
      };

      try {
        await audio.play();
        if (requestedGeneration !== generation) {
          disposeAudio(audio);
          releaseUrl();
          return noopHandle();
        }
        options?.onStart?.("elevenlabs");
        return elevenLabsHandle;
      } catch {
        // Some browsers reject play() even though playback has started (for
        // example when the promise is interrupted). Never layer the built-in
        // voice on top of real audio: give the element a moment, then check.
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        if (
          requestedGeneration === generation &&
          !audio.paused &&
          audio.currentTime > 0
        ) {
          options?.onStart?.("elevenlabs");
          return elevenLabsHandle;
        }
        disposeAudio(audio);
        releaseUrl();
        if (currentAudio === audio) currentAudio = null;
        if (requestedGeneration !== generation) return noopHandle();
        options?.onStart?.("browser");
        return {
          mode: "browser",
          stop: () => stopSpeaking(),
          finished: speakWithBrowser(clean, requestedGeneration).finally(releaseActive),
        };
      }
    } catch {
      if (requestedGeneration !== generation) return noopHandle();
      options?.onStart?.("browser");
      return {
        mode: "browser",
        stop: () => stopSpeaking(),
        finished: speakWithBrowser(clean, requestedGeneration).finally(releaseActive),
      };
    }
  };

  const request = run();
  activeText = clean;
  activeRequest = request;
  return request;
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
