import { DEFAULT_VOICE_ID, resolveVoiceId } from "@/lib/voice/voices";

export const runtime = "nodejs";
export const maxDuration = 60;

const cache = new Map<string, { audio: ArrayBuffer; contentType: string }>();
const MAX_CACHE = 24;

function remember(key: string, value: { audio: ArrayBuffer; contentType: string }) {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, 900) : "";
  if (!text) return Response.json({ error: "text is required." }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "ElevenLabs is not configured on this server.",
        fallback: "browser-speech",
      },
      { status: 503 },
    );
  }

  const voiceId = resolveVoiceId(body.voiceId);
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5";
  const cacheKey = `${voiceId}:${modelId}:${text}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return new Response(cached.audio, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Voice-Cache": "hit",
      },
    });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.12,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[tts] ElevenLabs ${response.status}: ${detail.slice(0, 200)}`);
      const status = response.status === 401 || response.status === 429 ? response.status : 502;
      return Response.json(
        {
          error:
            response.status === 429
              ? "Voice quota reached. Using browser speech instead."
              : "Voice synthesis is unavailable. Using browser speech instead.",
          fallback: "browser-speech",
        },
        { status },
      );
    }

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    const audio = await response.arrayBuffer();
    if (audio.byteLength === 0) throw new Error("Empty audio response");
    remember(cacheKey, { audio, contentType });

    return new Response(audio, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Voice-Id": voiceId,
        "X-Voice-Cache": "miss",
      },
    });
  } catch (error) {
    console.warn("[tts] failed:", (error as Error).message);
    return Response.json(
      { error: "Voice synthesis timed out. Using browser speech instead.", fallback: "browser-speech" },
      { status: 502 },
    );
  }
}

export async function GET() {
  return Response.json({
    configured: Boolean(process.env.ELEVENLABS_API_KEY),
    defaultVoiceId: DEFAULT_VOICE_ID,
  });
}
