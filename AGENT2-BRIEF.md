# AGENT 2 BRIEF — Dev A: Frontend / UI

**Project:** ViewPilot Pro · CodeFest 2026 · Team Mooncraft
**Repo:** `/home/akash/Documents/CodeFest` · app root: **the repo root** (app files were moved out of `viewpilot-pro/`)
**Your role:** You are **Agent 2 (Dev A)**. Agent 1 owns API/AI/logic. You own every user-facing pixel.
**Deadline:** Oct 24, 00:00 IST. Build for the demo, not for perfection.

---

## 0. Kickoff prompt (paste this to Agent 2)

> You are Agent 2 (Dev A: Frontend/UI) for ViewPilot Pro, a CodeFest 2026 job-readiness platform. Read `/home/akash/Documents/CodeFest/BATTLEPLAN.md` (especially "LIVE EXECUTION SPLIT") and `/home/akash/Documents/CodeFest/AGENT2-BRIEF.md` completely before writing code. Work only in the files assigned to Agent 2. Do not edit `src/app/api/**`, `src/lib/**`, `src/app/globals.css`, `src/app/layout.tsx`, `src/middleware.ts`, `package.json`, or `next.config.ts`. Build the landing page, login, dashboard (3-panel chat + drag-and-drop workflow builder), interview flow, and settings with the existing "Obsidian Glass" design system. Consume the frozen API and store contracts in the brief. Run `npx tsc --noEmit` and `npm run build` before reporting. Demo quality bar: premium, dense, dark glassmorphism, no placeholder lorem ipsum, every empty state designed, no dead buttons.

---

## 0.5 Agent 1 checkpoint — 21:02 IST (all live on port 3100)

Every backend path is implemented and verified. Import these instead of writing fetch/SSE code:

```ts
// src/lib/client/api.ts
streamChat({ agent, messages, context?, signal?, onEvent })   // meta / delta / done / error
startInterview(setup)                                        // InterviewResponse
answerInterview({ sessionId, setup, turns, answer, questionId, isFollowUp? })
finalizeInterview({ sessionId, setup, turns })
runWorkflow({ runId, name, nodes, onEvent })                 // WorkflowEvent
fetchStatus()                                                // provider status for Settings
synthesizeSpeech(text, voiceId?)                             // Blob, throws on failure
fetchRobotStatus() / setRobotExpression(expression)
login(email, name?) / logout()
```

```ts
// src/lib/voice/browser.ts
speakText(text, voiceId?, { onStart })  // ElevenLabs -> browser speech fallback
stopSpeaking()
startDictation({ onTranscript, onError, onEnd })  // Web Speech STT, null if unsupported
isDictationSupported()
```

```ts
// src/lib/store/interview-store.ts
saveLatestReport(report) / readLatestReport() / clearLatestReport()
useInterviewStore()   // { latestReport, hydrated, hydrate(), clear() }
```

Notes:
- Chat stream sends **deltas only**; append each `event.text` to the active assistant message.
- `answerInterview` returns `{ evaluation, question?, isFollowUp?, questionNumber, answered, totalQuestions, done, report? }`.
- When `done` is true, persist `report` with `saveLatestReport(report)` and show the report view.
- TTS can take 1–3 s; show a speaking/loading state and never block the Next button on audio.
- `/api/status` shape: `{ gemini, openrouter, elevenlabs, robot, engine, localFallback, voice, model, interviewEngine }`.
- If `streamChat` throws, show a toast and keep the typed message — do not clear the composer.

---

## 1. Current state (do not rebuild)

- Next.js **16.4.3** App Router, React 19, TypeScript strict, Tailwind CSS 4.
- Installed: `zustand`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`, `framer-motion`, `react-markdown`, `remark-gfm`.
- `src/app/globals.css` contains the **entire design system** — use its classes, do not edit it.
- `src/lib/types.ts` — import shared types from `@/lib/types`.
- `src/lib/agents/agents.ts` — `AGENTS` (5 agents), `AGENT_MAP`, `isAgentId`.
- `src/lib/data/roles.ts` — `ROLES`, `ROLE_LABELS`, `LEVELS`, `INTERVIEW_TYPES`, `DIFFICULTIES`, `detectRole`, `extractSkills`.
- `src/lib/text.ts` — helpers.
- Agent 1 is writing: API routes, engines, auth, and the three Zustand stores. If a store import does not exist yet, build the component against the documented interface and check again in 15 minutes. Do not create your own duplicate store.

**Design system classes already available:** `.glass`, `.glass-subtle`, `.glass-hover`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-soft`, `.input`, `.chip`, `.chip-accent`, `.chip-cyan`, `.chip-success`, `.chip-warning`, `.chip-danger`, `.label`, `.text-gradient`, `.text-gradient-cyan`, `.grid-bg`, `.aurora`, `.hairline`, `.orbit-ring`, `.markdown`, `.animate-float`, `.animate-pulse-soft`, `.animate-spin-slow`, `.animate-rise`, `.animate-msg`, `.animate-marquee`, `.caret`, `.reveal`, `.shimmer`, `.no-print`, `.print-plain`, `.print-break`.
**CSS vars:** `--bg-primary`, `--bg-glass`, `--border-glass`, `--accent-primary` `#6C63FF`, `--accent-secondary` `#00D9FF`, `--text-primary`, `--text-secondary`, `--text-muted`.
**Fonts:** `--font-display` (Outfit), `--font-sans` (Inter), `--font-mono` (JetBrains Mono) are wired in `layout.tsx` by Agent 1. Use `font-display`, `font-sans`, `font-mono` Tailwind utilities.

---

## 2. Non-negotiable file boundaries

**You own / create:**

```text
src/app/page.tsx
src/app/login/page.tsx
src/app/dashboard/page.tsx
src/app/interview/page.tsx
src/app/settings/page.tsx
src/components/**            (all new components)
```

**Frozen — never edit:**

```text
src/app/api/**               Agent 1
src/lib/**                   Agent 1
src/app/globals.css          Agent 1
src/app/layout.tsx           Agent 1
src/middleware.ts            Agent 1
package.json / next.config.ts
```

If an API contract seems wrong, report it — do not patch the API yourself.

---

## 3. The product in one paragraph

ViewPilot Pro is a job-readiness workspace with five specialist AI agents. Candidates either chat with an agent (ChatGPT-style) or build a custom interview-prep pipeline from drag-and-drop nodes and run it. The signature experience is a **voice mock interview**: the app asks five role-specific questions aloud, the candidate answers by text or microphone, thin answers trigger one evidence-seeking follow-up, and the session ends with a four-score report quoting the candidate's own words plus a practice plan. An ESP32 robot can optionally show presence, but the product works with no robot and no API key.

**Demo path:** Landing → demo login → dashboard → chat with Interview Coach → workflow mode → load template → run → watch node statuses → open Interview → 5 answers → report → print.

---

## 4. Design direction — "Obsidian Glass"

Premium dark product, not a generic AI dashboard.

- Background `#0a0a0f`; panels are translucent glass with 1px light borders; one accent violet + one cyan.
- Typography: huge tight display headings (Outfit), 13–14px body (Inter), mono labels for metadata.
- Density: dashboard is information-dense but breathable. Use 12–16px radii, not bubbles everywhere.
- Decorative: soft aurora blobs, 1px grid, thin orbit rings, tiny orbital dots. **No** neural-network clichés, glowing brains, circuit boards, or robot clip-art.
- Motion: 180–280ms ease-out, subtle translate/opacity. Avoid constant motion except status dots and hero float.
- Every number gets a unit or label. Every state gets a designed empty/loading/error variant.
- Copy: confident, specific, early-career focused. No "unlock your potential", no exclamation marks.
- Icons: `lucide-react` only, 16–20px, 1.7 stroke.
- Brand mark: crescent moon + orbit, built with CSS/SVG (do not use the 2MB PNG in repo root).
- Logo text: **ViewPilot** with a small `PRO` chip.

Suggested accent map: violet = coach/primary, cyan = resume/data, green = skills, amber = career, rose = communication.

---

## 5. Page-by-page spec

### 5.1 Landing `/` (server component + small client islands)

Sections, in order:

1. **Nav** (sticky, blurred): crescent logo, ViewPilot PRO; links `Agents`, `Workflow`, `How it works`, `Report`; right: `Log in` ghost + `Start practicing` primary → `/interview`.
2. **Hero** (min 88vh): mono eyebrow `CODEXFEST 2026 · DOMAIN 2 · JOB READINESS`; headline e.g. **"Rehearse the interview. Own the feedback."**; subcopy about 5 agents + adaptive mock interviews; CTAs `Run a mock interview` → `/interview`, `Explore the workspace` → `/login`; trust line "No API key or robot required". Right/below: a **product console mockup** in glass — mini chat with an agent, a live score chip, and a node pipeline fragment. Add 2–3 aurora blobs, grid, orbit rings, and small floating stat cards (`4-dimension rubric`, `<60s report`, `5 specialists`). Use CSS animation, not Three.js.
3. **Problem strip**: three cards — static question banks don't adapt; feedback is a rejection email; practice has no next step.
4. **Agents grid**: all 5 agents, each with icon, name, one-line role, 2 capability chips, hover border glow. Link `Practice with this agent` → `/login` (or `/dashboard` after login).
5. **Workflow section**: visual of a pipeline (Upload resume → Review → Skill gap → Questions → Interview → Report) with status dots and a "Run" button; copy explains drag-and-drop pipelines. Static mock, but convincing.
6. **Report preview**: a realistic report card with four scores (Communication 78, Role knowledge 71, Problem solving 66, Answer quality 74), an evidence quote, and a practice action. Label "sample report".
7. **How it works**: 4 steps, numbered, thin connecting line.
8. **Reliability**: "Works when the model doesn't" — 3 layers (Gemini, local rubric engine, robot presence). This is a differentiator; make it feel intentional.
9. **FAQ** or ethics strip: practice estimate, no protected-trait scoring, no account required for interview, robot LAN-only. Keep 3 items.
10. **Final CTA**: large glass panel, headline, `Start a free mock interview`, note "5 questions · 4 scores · 1 next step".
11. **Footer**: logo, Team Mooncraft, CodeFest 2026, links GitHub / demo / docs. No fake social icons.

Scroll reveals: use a small `Reveal` client component with `IntersectionObserver` adding `.is-visible`; respect reduced motion. Keep the landing a server component where possible; isolate client bits.

### 5.2 Login `/login`

- Split layout: left 55% brand narrative (logo, "Your interview desk is ready", 3 bullet proofs, mini quote/report fragment); right 45% glass auth card.
- Card: `Welcome back`, email, name (optional), password field (decorative, not stored), primary `Enter workspace`, divider, `Continue with demo account` (one click, no fields), tiny note "Demo auth — no password is stored. The interview works without an account."
- POST `/api/auth/login` with `{ email, name }`; on success `router.push('/dashboard')`. Handle 400/500 inline. Demo button submits `demo@viewpilot.app` / `Demo Candidate`.
- Google OAuth is **not** implemented; do not add a fake Google button. A single honest demo path is better.
- Link back to landing.

### 5.3 Dashboard `/dashboard`

Server page reads session via `getSessionFromCookies()` (Agent 1 will export from `@/lib/session`) OR simply renders the client shell and lets the client fetch `/api/auth/session`. If the import is missing, use the client fetch. Middleware redirects unauthenticated users to `/login`, so no extra guard is required.

Layout: `100dvh`, no page scroll; three columns.

**Left sidebar (280px, collapsible):**
- Brand row + collapse button.
- `+ New session` primary-soft button.
- Mode switch: `Chat` / `Workflow` (also in center header; one source of truth in page state).
- `AGENTS` label + 5 rows: icon, name, tagline (truncated), active accent bar. Selecting an agent starts/opens a session for that agent.
- `RECENT` label + history rows (title, agent icon, relative time, hover delete). Empty state: "Your rehearsals will appear here."
- Bottom: robot status dot (`Robot optional · offline`), user chip with initials/email, logout icon (POST `/api/auth/logout`, then `/`).

**Center — Chat mode:**
- Header: agent icon + name + one-line mandate; right: `Local fallback ready` chip, voice toggle, `New chat`.
- Message list: user bubbles right-aligned with subtle violet tint; assistant messages left with agent avatar, full-width markdown, source badge (`Gemini`/`OpenRouter`/`Local rubric`), latency in mono. Streaming caret while receiving. Auto-scroll unless user scrolled up.
- Empty state: agent avatar, "Start with a prompt", 3 starter prompt cards.
- Composer: auto-growing textarea, mic button (Web Speech), send button (Enter to send, Shift+Enter newline), character count only if >600, disclaimer line.
- Streaming: POST `/api/agents/chat`, parse SSE (`meta`, `delta`, `done`). If the stream fails, show an inline retry and fall back to a non-streamed message? The API always exists; show a designed error bubble with retry.
- If no session exists, create one for the active agent automatically; do not show a blank dead screen.

**Center — Workflow mode:**
- Toolbar: `Workflow builder`, template chips (Full prep loop / 30-min drill / Resume sprint), `Clear`, `Run workflow` primary.
- Canvas: vertical pipeline of sortable nodes connected by a 1px line + small arrow. Each node card: drag handle, category dot, label, one-line output, status chip, remove. Selected node gets accent border.
- Palette (below canvas or left rail inside center): 9 draggable node types grouped Input / Analysis / Practice / Output. `@dnd-kit` drag from palette into canvas; sortable reorder inside canvas. Also provide click-to-add for accessibility (drag is not the only path).
- Selected node inspector: small inline panel with config fields: role select (ROLES), level/type/difficulty, question count, resume text (only for upload-resume). Keep it compact.
- Empty canvas: dashed drop zone, "Drag a node here or load a template".
- Run: POST `/api/workflow/run` with `{ workflow: { id, name, nodes } }`; consume SSE; update `useWorkflowStore().applyEvent`; right panel shows progress live. Disable Run while running. If no nodes, show toast/inline error.
- Template data comes from `workflowTemplates` in `@/lib/workflow/templates` (Agent 1). If not available, define local node type arrays but do not duplicate the engine.

**Right panel (320px):**
- Tabs or stacked sections: `Active run`, `Latest report`, `Robot`.
- Active run: workflow name, progress bar, per-node rows with status icon, elapsed ms, expandable output preview. Empty state with a mini checklist.
- Latest report: read `viewpilot.latestReport` from localStorage; show overall score ring, 4 mini bars, "Open report" → `/interview?report=latest` (Agent 2 may keep report in sessionStorage; coordinate with Agent 1 if URL param needed). If nothing, show "No rehearsal yet" + CTA to `/interview`.
- Robot: online dot, expression, optional `Test expression` button that POSTs `/api/robot`.
- Bottom: "Every run works offline" note.

**Responsive:** under 1200px hide/collapse right panel behind a button; under 900px left becomes a drawer; center stays usable. Do not ship horizontal overflow.

### 5.4 Interview `/interview`

Three phases in one client app; keep state in component or `useInterviewStore`.

**Setup (default):**
- Hero: "Mock interview" label, "Five questions. One honest scorecard." + note "Practice estimate, not a hiring decision."
- Form card: Role (ROLES), Level, Interview type, Difficulty (segmented controls, not all selects); optional resume paste (collapsed "Add resume context (optional)"); voice toggle `Interviewer speaks questions` (default on if browser supports audio); estimated time; `Begin interview` primary.
- Right rail: rubric card (4 dimensions + weights), "What happens" 3 steps, privacy note.
- If `?report=latest` and a stored report exists, open report phase instead.

**Session:**
- Top bar: role/level/type chips, question progress `2 / 5` + segmented progress, timer, `End session` ghost (confirm).
- Main: interviewer card with agent avatar/voice waveform, question text large; `Replay question` speaker button; question type/competency chips; follow-up badge when applicable.
- Answer area: textarea with placeholder "Answer as you would out loud…", word count, mic button with recording state ("Listening", animated bars), `Submit answer` primary; keyboard shortcut Cmd/Ctrl+Enter.
- Side: live rubric reminder and "coach cue" for current competency; robot status if configured.
- Flow: `action:"start"` on begin. On submit, POST answer with accumulated `turns`; append evaluation feedback subtly (e.g., "Answer captured · 42s · 128 words"), then set next question or show report. Show inline thinking state while evaluating (max ~2s).
- Voice: TTS via `/api/voice/tts`; on error or no key, fall back to `speechSynthesis`. STT via `webkitSpeechRecognition`; if unsupported, hide mic with a tooltip, never break the form. Stop audio on unmount/next question.
- Follow-up: render normally with a `Follow-up` chip; progress bar should not count it as a new main question.
- Guard: if API fails, keep the typed answer, show retry, allow "Skip and continue" only if a question exists. Do not lose state.
- `End session` with <5 answers: call finalize with current turns; if 0 answers, return to setup. If finalize fails, show a toast.

**Report:**
- Header: `Session complete`, band label, overall score ring, one-paragraph summary, `Print / Save PDF`, `Export JSON`, `Copy summary`, `Practice again`.
- Four dimension cards: score, weight, note, evidence quote. Color by score: >=80 green, >=65 cyan/violet, >=50 amber, else rose.
- Per-question breakdown: question, answer excerpt, score, coaching note.
- Strengths (3) and improvements (3), then `Next practice` 3 actions with minutes, then STAR blueprint (4 blocks) from report.
- Footer: "Practice estimate — not a hiring decision. No protected traits were scored." plus session date/setup.
- Make the report print beautifully using `.print-plain` / `.no-print`; use `window.print()`.
- Persist report to `localStorage` key `viewpilot.latestReport` (JSON) for dashboard right panel. Clear on "Practice again".

### 5.5 Settings `/settings`

- Back to workspace link + page title.
- Sections in glass cards:
  1. **Interviewer voice** — select from a small hardcoded list of ElevenLabs voice IDs/names (Matilda default, Daniel, Alice, George, Sarah), `Play sample` (POST TTS, fallback speechSynthesis), speed/tone not supported by API contract — skip rather than fake.
  2. **AI engine** — fetch `/api/status`; show rows Gemini / OpenRouter / ElevenLabs / Robot with `Ready` or `Local fallback`, no key values. Explain local rubric always works.
  3. **Robot (optional)** — URL is server env only; show status and a `Test expression` button (happy / thinking / neutral) if online. Note LAN-only.
  4. **Practice data** — clear chat history, clear workflow, clear latest report (localStorage); confirm inline.
  5. **About** — version, Team Mooncraft, demo auth note.
- Use a sticky section index on desktop; simple stack on mobile.

---

## 6. Shared components to build

Create these under `src/components/ui` and reuse everywhere (adjust as needed):

- `Logo.tsx` — crescent + orbit SVG, size prop, optional wordmark.
- `Reveal.tsx` — client IntersectionObserver wrapper (`delay` prop).
- `Button.tsx` — optional wrapper over `.btn` classes; if used, support `variant`, `size`, `loading`.
- `Badge.tsx` — status/score chips.
- `ScoreRing.tsx` — SVG circular score, animated stroke, label.
- `ScoreBar.tsx` — horizontal dimension bar.
- `Markdown.tsx` — `react-markdown` + `remark-gfm` with `.markdown` wrapper; external links `target=_blank rel=noreferrer`.
- `EmptyState.tsx` — icon, title, body, action.
- `Modal.tsx` — accessible dialog (focus trap optional; Escape closes).
- `Toast` / inline status — keep dependency-free.
- `ConfirmDialog.tsx` — for destructive actions.

Dashboard-specific: `DashboardShell`, `Sidebar`, `ChatPanel`, `ChatMessage`, `Composer`, `WorkflowBuilder`, `WorkflowNodeCard`, `NodePalette`, `StatusPanel`.
Interview-specific: `InterviewApp`, `InterviewSetup`, `InterviewSession`, `InterviewReport`.
Auth: `AuthForm`.
Settings: `SettingsPanel`.
Landing: `Landing` sections or one page + client islands (`HeroConsole`, `WorkflowPreview`, `ReportPreview`).

---

## 7. Frozen API + store contracts

Full types: `@/lib/types`. Full table: `BATTLEPLAN.md` → "Frozen API contracts".

**Chat SSE** (`POST /api/agents/chat`):
```
data: {"type":"meta","source":"local","agent":"interview-coach"}
data: {"type":"delta","text":"Here is "}
data: {"type":"done","source":"local","latencyMs":820}
```
Parse line-by-line, ignore blank/comment lines; on `done`, finalize the assistant message.

**Interview** (`POST /api/interview/session`): see `InterviewResponse` in `@/lib/types`.
Start returns the first question. Answer request must include **all prior turns plus the current answer** in `turns`; `answer` and `questionId` identify the current one. Response may return `question` (next), or `done:true` + `report`. Follow-ups are flagged. `finalize` returns a report from whatever turns exist.

**Workflow SSE** (`POST /api/workflow/run`): event objects match `WorkflowEvent`. Apply `node-start` / `node-complete` / `node-error` / `run-complete` to the store; use `progress` for the bar.

**Stores:** import exactly as documented in `BATTLEPLAN.md`. If TypeScript says a method is missing, wait for Agent 1's next checkpoint rather than editing the store. You can build UI with local React state first and wire the store later.

**Auth:** cookie session; `POST /api/auth/login {email,name}`; `POST /api/auth/logout`; `GET /api/auth/session → {user|null}`. Middleware protects `/dashboard` and `/settings`. `/interview` stays public on purpose.

**Status:** `GET /api/status → { gemini:boolean, openrouter:boolean, elevenlabs:boolean, robot:boolean, engine:"ai"|"local" }`.

**TTS:** `POST /api/voice/tts {text, voiceId?}` → `audio/mpeg`. On non-2xx, JSON `{error}`. Always fall back to `speechSynthesis`.

---

## 8. Quality bar / acceptance

- `npx tsc --noEmit` clean; `npm run build` clean.
- No `any` unless unavoidable; no unused imports; no ESLint errors that block build.
- No horizontal scroll at 1440×900, 1280×800, 390×844.
- Keyboard: all controls reachable; modal Escape closes; Enter sends chat; labels on icon buttons.
- Loading, empty, error, and success states exist for chat, workflow, interview, settings status.
- Every button either works or is clearly disabled with a reason. No dead links to nonexistent routes (use `/login` or `/interview`).
- Text contrast: secondary text at least `#9CA3AF`; never gray-on-gray below 4.5:1.
- No secrets in client code. No calls to Gemini/ElevenLabs directly from the browser.
- Print: report fits A4, no clipped scores, controls hidden.
- Mobile: interview and login must be genuinely usable; dashboard may collapse panels but not break.

---

## 9. Suggested build order (UI)

1. `Logo`, `Reveal`, `Markdown`, `ScoreRing`, `ScoreBar`, `Badge`, `EmptyState` primitives.
2. Landing page (biggest demo surface) — get hero + agents + report preview done first.
3. Login page + auth POST.
4. Dashboard shell + sidebar + chat (static first, then SSE).
5. Workflow builder + run status.
6. Interview setup → session → report (wire API as soon as Agent 1 announces it).
7. Settings.
8. Responsive + print + empty/error polish.

**Do not wait for the API to start.** Build with realistic local mock data inside the component, then swap to fetch/SSE when the endpoint lands. Announce which page is ready at each checkpoint.

---

## 10. Coordination rules

- Agent 1 will post a checkpoint message when `/api/agents/chat`, `/api/interview/session`, `/api/workflow/run`, `/api/voice/tts`, stores, and auth are live.
- If you need a type or field changed, ask first; do not silently fork it.
- Run on port **3001** to avoid clashing with Agent 1's dev server on 3000.
- Commit only your owned files if asked; do not reset or reformat the repo.
- Keep the app runnable at all times: no half-written page that crashes the root layout.
