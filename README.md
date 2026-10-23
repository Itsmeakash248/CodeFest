# ViewPilot Pro

**Rehearse the interview. Own the feedback.**

ViewPilot Pro is a job-readiness cockpit built for CodeFest 2026 (Domain 2). It combines five specialist AI agents, a drag-and-drop preparation workflow, and a voice-enabled mock interview that scores your answers against a transparent four-part rubric — then turns the gaps into a practice plan.

Built by **Team Mooncraft**. Works with **zero API keys** and **no robot**.

---

## Why it wins

Most interview tools give a score and stop. ViewPilot Pro shows the evidence behind the score, adapts with a follow-up when an answer is thin, and leaves the candidate with a concrete next action.

- **Local-first by design.** Gemini, OpenRouter, ElevenLabs and the robot are optional accelerators. With no keys, a deterministic local engine still runs every agent, the full interview, the rubric, the report and the workflow.
- **Evidence, not vibes.** Every dimension score quotes the candidate's own words (or states plainly that no evidence was found).
- **A visible rubric.** Communication, Role Knowledge, Problem Solving and Answer Quality — each with a weight, a note and an evidence line.
- **A real workflow builder.** Chain nine preparation nodes into a custom pipeline and watch each node stream its status and output.
- **Voice without lock-in.** ElevenLabs TTS when configured; the browser voice when it is not. Speech-to-text uses the Web Speech API.

---

## Demo path (90 seconds)

1. **Landing** — the hero console shows a live interview snippet; the agent grid and workflow preview explain the product.
2. **Launch demo** — one click signs in with an httpOnly demo cookie. No OAuth, no email.
3. **Dashboard** — talk to any of the five agents, or switch to the workflow builder and run a template.
4. **Interview** — choose role, level, type and difficulty, then answer five adaptive questions by text or microphone.
5. **Report** — four rubric scores, per-question feedback, evidence quotes, strengths, improvements, a STAR blueprint and a minute-by-minute practice plan.
6. **Print / save** — the report has a print stylesheet for a clean PDF.

The app remains fully usable if every external provider is offline.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional keys
npm run dev -- --port 3000
```

Open <http://localhost:3000>. Then click **Launch demo** (or sign in at `/login` with any email).

### Production build

```bash
npx tsc --noEmit
npm run build
npm run start
```

---

## Configuration

All keys are read **server-side only** and never shipped to the browser.

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | No | Primary chat model (`gemini-3.5-flash` by default) |
| `OPENROUTER_API_KEY` | No | Fallback chat model if Gemini is unavailable |
| `ELEVENLABS_API_KEY` | No | Natural interview voice; browser TTS is the fallback |
| `ELEVENLABS_VOICE_ID` | No | Voice selection (default `XrExE9yKIg1WjnnlVkGX`) |
| `GEMINI_MODEL` | No | Override the Gemini model |
| `OPENROUTER_MODEL` | No | Override the OpenRouter model |
| `ROBOT_BASE_URL` | No | Optional LAN robot bridge for expressions |
| `NEXTAUTH_URL` | No | Base URL used in metadata |
| `WORKFLOW_FAST` | No | Set to `1` to shorten simulated workflow steps |

### Fallback order

```text
Chat:      Gemini -> OpenRouter -> local persona engine
Interview: deterministic rubric engine (always), Gemini only for optional chat
Voice:     ElevenLabs -> browser speechSynthesis
Robot:     configured bridge -> graceful offline state
```

---

## API

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/agents/chat` | POST | SSE chat: `meta`, `delta`, `done`, `error` |
| `/api/interview/session` | POST | `start`, `answer`, or `finalize` a mock interview |
| `/api/workflow/run` | POST | SSE workflow execution with per-node status |
| `/api/voice/tts` | POST | ElevenLabs MP3 proxy with in-memory cache |
| `/api/status` | GET | Provider availability and active engine |
| `/api/robot` | GET/POST | Optional robot bridge; offline-safe |
| `/api/auth/login` | POST | Demo session cookie |
| `/api/auth/logout` | POST | Clear the demo session |
| `/api/auth/session` | GET | Current demo user |

Request and response types live in [`src/lib/types.ts`](src/lib/types.ts). Client helpers live in [`src/lib/client/api.ts`](src/lib/client/api.ts).

### Interview protocol

```jsonc
// start
{ "action": "start", "setup": { "role": "Frontend Engineer", "level": "Entry level", "type": "Mixed", "difficulty": "Standard" } }

// answer
{ "action": "answer", "sessionId": "...", "setup": { ... }, "turns": [ ... ], "answer": "...", "questionId": "q1" }

// finalize
{ "action": "finalize", "sessionId": "...", "setup": { ... }, "turns": [ ... ] }
```

The engine asks five role-specific questions and inserts at most one adaptive follow-up when an answer is thin. Question sets are deterministic per session, so a refresh cannot reshuffle the interview.

---

## How the rubric works

| Dimension | What it measures | Typical signals |
| :--- | :--- | :--- |
| **Communication** | Structure and clarity | STAR language, sequencing, concision |
| **Role Knowledge** | Role-specific depth | Tools, trade-offs, domain vocabulary |
| **Problem Solving** | Reasoning quality | Diagnosis, constraints, decision rationale |
| **Answer Quality** | Specificity and evidence | Metrics, ownership, outcomes, reflection |

The overall score is a weighted blend. Each dimension includes a quoted evidence line and a coaching note. The report also produces:

- per-question scores and notes,
- three strengths and three improvements,
- a STAR blueprint built from the strongest answer,
- a prioritized practice plan with time estimates.

---

## Architecture

```text
src/
  app/
    page.tsx                 landing
    login/                   demo auth
    dashboard/               agents + workflow
    interview/               setup -> session -> report
    settings/                voice, providers, robot, data
    api/
      agents/chat/           SSE chat orchestration
      interview/session/     deterministic interview engine
      workflow/run/          SSE pipeline executor
      voice/tts/             ElevenLabs proxy + cache
      auth/                  demo cookie session
      robot/                 optional bridge
      status/                provider health
  components/                UI system (Obsidian Glass)
  lib/
    ai/                      Gemini -> OpenRouter -> local
    agents/                  personas + prompts
    interview/               questions, rubric, service
    workflow/                node registry, templates, executor
    voice/                   browser speech helpers
    client/                  fetch + SSE helpers
    store/                   Zustand stores
    data/roles.ts            12 role profiles
```

The only stateful external dependency is the optional robot. Workflow runs are held in memory for the demo; reports are persisted in `localStorage` for the dashboard.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zustand · Framer Motion · dnd-kit · React Markdown · Gemini · OpenRouter · ElevenLabs.

No database, no OAuth provider, no paid infrastructure required for the demo.

---

## Security notes

- API keys stay in `.env.local` (git-ignored, server-side routes only).
- The demo session is an httpOnly, same-site cookie for the hackathon. It is **not** production authentication.
- The robot bridge is intentionally unauthenticated and should only be exposed on a trusted LAN.
- The TTS route caps input length and caches repeated prompts in memory.

---

## Team

- **Dev A** — product design, UI system, landing, dashboard, interview and settings.
- **Dev B** — AI orchestration, interview engine, workflow runtime, voice, auth and API.

Built for **CodeFest 2026**, Domain 2: job readiness.
