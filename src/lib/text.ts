export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

export function truncate(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function countMatches(text: string, terms: string[]): number {
  const lower = ` ${text.toLowerCase()} `;
  return terms.reduce((total, term) => {
    const needle = term.toLowerCase();
    if (!needle) return total;
    return total + (lower.split(needle).length - 1);
  }, 0);
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function formatSeconds(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function bandFor(score: number): string {
  if (score >= 85) return "Interview ready";
  if (score >= 72) return "Strong foundation";
  if (score >= 58) return "Developing";
  return "Early practice";
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function percent(value: number, max: number): number {
  if (max <= 0) return 0;
  return clamp(Math.round((value / max) * 100), 0, 100);
}

/**
 * Strips Markdown formatting, code blocks, bullet markers, and decorative
 * symbols to produce clean, natural text suitable for text-to-speech audio.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";

  return text
    // Remove fenced code blocks completely
    .replace(/```[\s\S]*?```/g, " ")
    // Remove inline code ticks but preserve the code content
    .replace(/`([^`]+)`/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
    // Replace links with their text content
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Remove HTML tags
    .replace(/<[^>]*>/g, " ")
    // Remove blockquote markers
    .replace(/^>\s+/gm, "")
    // Remove header hashes
    .replace(/^#{1,6}\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, " ")
    // Remove bullet markers at line starts
    .replace(/^[\s]*[-*+]\s+/gm, "")
    // Remove bold, italic, strikethrough delimiters
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    // Remove table pipes
    .replace(/\|/g, " ")
    // Remove decorative bullet characters & symbols
    .replace(/[•·▪▫►▸★☆✓✔✕✖]/g, " ")
    // Remove decorative emojis
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
    // Convert newlines to sentence pauses if not already punctuated with . ! ? or :
    .replace(/([^.!?:\n])\n+/g, "$1. ")
    // Otherwise collapse newlines to a space
    .replace(/\n+/g, " ")
    // Clean up duplicate punctuation and whitespace
    .replace(/([:;?!])\s*\./g, "$1")
    .replace(/\s*\.\s*\./g, ".")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
