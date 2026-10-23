# ViewPilot

**Your AI-powered interview coach.** ViewPilot turns realistic interview practice into structured growth: role-specific questions, a visible rubric, evidence-backed feedback, and a re-practice plan.

CodeFest 2026 · Team Mooncraft · Domain: **AI-Powered Web Applications × Job Readiness**

> [!IMPORTANT]
> The ESP32-S3 robot is an **optional backup interviewer**. Every interview, evaluation and report works with no robot, no API key and no network call.

---

## What is in this app

| Route | Purpose |
| :--- | :--- |
| `/` | Product story: problem, coaching loop, rubric, report preview, architecture, ethics and FAQ |
| `/interview` | The working product: setup → five-question session → evaluation → report |
| `/how` | Detailed method: session steps, adaptive follow-ups, rubric and report anatomy |
| `/stack` | Architecture, request path, fallback ladder, environment variables and safety rules |
| `/robot` | The optional ESP32-S3 backup interviewer and live bridge status |
| `/api/interview` | Server route for the first question, adaptive next question, or final report |
| `/api/robot` | Server-side proxy to the optional robot's LAN API |

### The session

1. Choose a target role, experience level, interview type and difficulty.
2. Answer up to five main questions. A thin answer can earn **one** evidence-seeking follow-up.
3. Get a report with:
   - an overall **practice estimate** (not a hiring prediction),
   - four dimension scores against the visible rubric,
   - exact quotes from the transcript as evidence,
   - strengths, gaps, three micro-actions and an improved-answer blueprint.
4. Print/save as PDF, export JSON, copy a summary, or open a previous attempt from local history.

Optional extras: browser dictation (Web Speech API), read-aloud questions, and robot presence.

---

## Quick start

Requires **Node.js 20.9+**.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No environment variables are needed for the complete flow.

```bash
npm run build
npm start
```

---

## Zero-key by design

The app ships with a deterministic local engine:

- a role-aware question bank across behavioral, technical, system-design and mixed interviews;
- an adaptive follow-up rule for thin answers;
- a four-dimension heuristic evaluator with transcript evidence;
- report generation with strengths, gaps, next practice and a blueprint.

With `GEMINI_API_KEY` set on the server, the API route uses Gemini for adaptive questions and richer feedback. If the key is absent, the request times out, the model returns invalid JSON, or the network fails, the same request falls back to the local engine. The report exposes `source: "ai" | "local"` so the UI can label which engine produced it.

### Optional environment

Copy `.env.example` to `.env.local` only if you want the optional layers.

| Variable | Effect |
| :--- | :--- |
| `GEMINI_API_KEY` | Enables Gemini questions and reports. Also accepts `GOOGLE_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`. |
| `GEMINI_MODEL` | Overrides the default `gemini-2.5-flash`. |
| `ROBOT_BASE_URL` | Enables the optional robot bridge, e.g. `http://192.168.1.42`. Leave unset to run without a robot. |

All variables are server-side. Nothing is exposed with a `NEXT_PUBLIC_` prefix.

---

## Architecture

```text
Browser
  └─ /interview (client state, timer, dictation, report/print)
       └─ POST /api/interview
            ├─ validates setup + turns
            ├─ Gemini (if configured, 22 s timeout, JSON output)
            └─ local rubric engine (always available)
       └─ GET/POST /api/robot  ──►  ESP32-S3 LAN API (optional, 1.8 s timeout)
```

- **Server route** — `src/app/api/interview/route.ts`
- **AI layer** — `src/lib/ai.ts`
- **Question bank, follow-ups, local scoring, report** — `src/lib/interview.ts`
- **Copy, roles, rubric** — `src/lib/content.ts`
- **Interview UI** — `src/components/vp/InterviewClient.tsx`
- **Robot proxy** — `src/app/api/robot/route.ts`

### API contract

`POST /api/interview`

```jsonc
{
  "action": "start" | "next" | "evaluate",
  "setup": {
    "role": "frontend",
    "roleLabel": "Frontend Engineer",
    "level": "Entry",
    "type": "Mixed",
    "difficulty": "Standard",
    "resume": "optional, treated as untrusted data"
  },
  "turns": [
    {
      "question": { "id": "…", "text": "…", "dimension": "communication" },
      "answer": "…"
    }
  ]
}
```

The response includes `question` and `done` for `start`/`next`, or `report` for `evaluate`, plus `aiEnabled`. Reports carry `source: "ai" | "local"`.

---

## Robot backup (optional)

The robot lives in the parent repository at [`../FlowPilot-esp32s3`](../FlowPilot-esp32s3). It exposes a local REST API for face emotions, actions and telemetry.

- ViewPilot calls the robot only when the candidate enables **Robot presence**.
- If the robot is offline, requests time out silently and the browser session continues.
- The robot never generates questions, scores answers or stores transcripts.
- `ROBOT_BASE_URL` is optional. The `/robot` page shows a live connection card and a “not connected” state when it is unset.

The firmware currently provides emotion/action endpoints, not a text display. The “backup interviewer” role is therefore a physical presence plus a preloaded five-question script the team can run if the demo laptop fails. **The web app does not depend on it.**

> The project rule: start the interview first and reach the report with the robot unplugged. Add the robot only as a visual layer afterwards.

---

## Design language

The UI follows the CodeFest pitch deck (`../docs/MoonCraft-Codefest.pptx`):

- cream paper background, deep navy ink;
- lilac and violet accents, coral and teal for rubric dimensions;
- Funnel Display / Funnel Sans, self-hosted through `next/font`;
- card-based sections, rounded geometry and calm motion.

The site intentionally uses light editorial layouts instead of the previous FlowPilot 3D scroll stage.

---

## Privacy and evaluation ethics

- Scores are **practice estimates** against a disclosed rubric, never hiring predictions.
- No scoring of accent, appearance, pitch, age, gender, disability or any protected trait.
- Resume text is optional and treated as untrusted data.
- With no `GEMINI_API_KEY`, answers stay in the browser session and local history.
- Local history is stored in `localStorage` and can be cleared by clearing site data.
- API keys live only in server environment variables.

---

## Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build (type-check included) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Repository note

This app directory previously hosted the **FlowPilot** robot-workflow showcase. The current tree targets ViewPilot, and the app now lives directly in the parent repository (no submodule checkout step). Earlier FlowPilot revisions remain recoverable from the preserved submodule backup.
