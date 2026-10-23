export const PREF_KEYS = {
  voiceId: "viewpilot.voiceId",
  interviewVoice: "viewpilot.voiceInterview",
  chatVoice: "viewpilot.voiceReplies",
  lastSetup: "viewpilot.lastSetup",
  latestReport: "viewpilot.latestReport",
  theme: "viewpilot.theme",
} as const;

export function readPreference(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or a full quota: the choice simply does not persist.
  }
}

export function removePreference(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function readStoredFlag(key: string): boolean {
  return readPreference(key) === "1";
}

export function writeStoredFlag(key: string, value: boolean): void {
  writePreference(key, value ? "1" : "0");
}

export function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const stored = readPreference(PREF_KEYS.theme);
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(theme: "light" | "dark"): void {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
  writePreference(PREF_KEYS.theme, theme);
}

