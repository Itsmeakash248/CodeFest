export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  voiceId: string;
}

export const VOICES: VoiceOption[] = [
  {
    id: "matilda",
    name: "Matilda",
    description: "Professional, clear, reassuring",
    voiceId: "XrExE9yKIg1WjnnlVkGX",
  },
  {
    id: "daniel",
    name: "Daniel",
    description: "Steady broadcaster, neutral",
    voiceId: "onwK4e9ZLuTAKqWW03F9",
  },
  {
    id: "alice",
    name: "Alice",
    description: "Clear, engaging educator",
    voiceId: "Xb7hH8MSUJpSbSDYk0k2",
  },
  {
    id: "george",
    name: "George",
    description: "Warm storyteller",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
  },
  {
    id: "sarah",
    name: "Sarah",
    description: "Mature, confident",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  },
  {
    id: "brian",
    name: "Brian",
    description: "Deep, resonant, comforting",
    voiceId: "nPczCjzI2devNBz1zQrb",
  },
];

export const DEFAULT_VOICE = VOICES[0];
export const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE.voiceId;

export function resolveVoiceId(input: unknown): string {
  if (typeof input === "string") {
    const match = VOICES.find((voice) => voice.id === input || voice.voiceId === input);
    if (match) return match.voiceId;
  }
  return DEFAULT_VOICE_ID;
}

export function voiceName(voiceId: string): string {
  return VOICES.find((voice) => voice.voiceId === voiceId)?.name ?? "Interviewer";
}
