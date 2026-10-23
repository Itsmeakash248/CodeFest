# 🏆 HACKATHON BATTLE PLAN — Team Mooncraft

## ViewPilot Pro: AI-Powered Job Readiness Agent Platform

**CodeFest 2026 · Domain 2 — AI-Powered Web Applications × Job Readiness**
**Team Size:** 2 · **Deadline:** Oct 24, 12:00 AM IST · **Time Remaining:** ~4 hours

---

> [!CAUTION]
> **4 HOURS.** Every minute counts. This plan is ruthlessly prioritized.
> **Dev A** = Frontend/UI specialist · **Dev B** = API/Logic specialist
> Both work in parallel, merge every 45 minutes.

---

## ⚡ LIVE EXECUTION SPLIT — updated 20:25 IST

> This section overrides the generic split below for the remaining time.
> **Agent 1 = Dev B (API / AI / product logic) — active in this session.**
> **Agent 2 = Dev A (Frontend / UI) — separate session, same repo.**

### Repo state (already done)

The **repo root** is scaffolded with Next.js 16.4.3, React 19, Tailwind 4, TypeScript (the app was moved out of `viewpilot-pro/`).
Installed: `zustand`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`,
`lucide-react`, `framer-motion`, `react-markdown`, `remark-gfm`.

Already written and **frozen** by Agent 1:

| File | Purpose |
| :--- | :--- |
| `src/app/globals.css` | Complete "Obsidian Glass" design system + animations + print styles |
| `src/lib/types.ts` | Shared types for agents, chat, interview, workflow |
| `src/lib/agents/agents.ts` | 5 agent personas, metadata, system prompts |
| `src/lib/data/roles.ts` | 12 role profiles, skill maps, skill extraction, role detection |
| `src/lib/text.ts` | Shared text/score utilities |

### File ownership (do not cross)

| Agent 1 — API/logic | Agent 2 — UI |
| :--- | :--- |
| `src/app/api/**` | `src/app/page.tsx` (landing) |
| `src/lib/**` | `src/app/login/page.tsx` |
| `src/proxy.ts` | `src/app/dashboard/page.tsx` |
| `src/app/layout.tsx` | `src/app/interview/page.tsx` |
| `src/app/globals.css` | `src/app/settings/page.tsx` |
| `.env.example`, app `README.md` | `src/components/**` |

**Agent 2 must not edit** any file in the left column, `package.json`, or `next.config.ts`.
**Agent 1 must not edit** `src/app/page.tsx`, page routes listed for Agent 2, or `src/components/**`.
Both may read everything. If a contract must change, Agent 1 announces it in chat before editing.

### Frozen API contracts

| Endpoint | Request | Response |
| :--- | :--- | :--- |
| `POST /api/agents/chat` | `{ agent, messages: {role,content}[], context? }` | SSE: `meta {source}`, `delta {text}`, `done {source,latencyMs}` |
| `POST /api/interview/session` | `{ action:"start", setup }` | `{ sessionId, question, questionNumber:1, totalQuestions:5, answered:0, done:false, source }` |
| `POST /api/interview/session` | `{ action:"answer", sessionId, setup, turns[], answer, questionId, isFollowUp? }` | `{ evaluation, question?, isFollowUp?, questionNumber, answered, totalQuestions, done, report? }` |
| `POST /api/interview/session` | `{ action:"finalize", sessionId, setup, turns }` | `{ done:true, report }` |
| `POST /api/workflow/run` | `{ workflow: { id, name, nodes[], edges? } }` | SSE: `run-start`, `node-start`, `node-complete`, `node-error`, `run-complete` |
| `POST /api/voice/tts` | `{ text, voiceId? }` | `audio/mpeg` or `{ error }` |
| `GET /api/status` | — | `{ gemini, openrouter, elevenlabs, robot, engine }` |
| `POST /api/auth/login` | `{ email, name? }` | `{ user }` + httpOnly session cookie |
| `POST /api/auth/logout` | — | `{ ok:true }` |
| `GET /api/auth/session` | — | `{ user \| null }` |
| `GET/POST /api/robot` | `{ expression }` | `{ online, expression?, ... }` |

Interview `setup` = `{ role, level, type, difficulty, resume? }`; `turns` = `{ questionId, question, answer, isFollowUp?, competency?, signals? }[]`.
Full request/response types live in `src/lib/types.ts` (`InterviewResponse`, `InterviewReport`, `WorkflowEvent`).

### Frozen store contracts (Agent 1 writes, Agent 2 consumes)

- `useChatStore()` — `sessions`, `activeSessionId`, `activeAgentId`, `setActiveAgent`, `newSession`, `openSession`, `deleteSession`, `addMessage`, `appendToMessage`, `updateMessage`, `clearAll`, `hydrated`.
- `useWorkflowStore()` — `nodes`, `selectedNodeId`, `runs`, `isRunning`, `setNodes`, `addNode`, `removeNode`, `updateNodeConfig`, `selectNode`, `loadTemplate`, `beginRun`, `applyEvent`, `clearRuns`.
- `useInterviewStore()` — `phase`, `setup`, `current`, `turns`, `report`, `start`, `submitAnswer`, `reset` (thin wrapper; UI may keep local state instead).

### Agent 2 checklist (UI)

1. **Landing** `/` — premium scroll story, hero console mockup, 5-agent grid, workflow preview, report preview, CTA.
2. **Login** `/login` — demo login (one click), glass split layout, posts to `/api/auth/login`.
3. **Dashboard** `/dashboard` — 3 panels: left agent + history, center chat/workflow toggle, right run status.
4. **Chat** — streaming SSE consumer, markdown, starter prompts, voice input, source badge.
5. **Workflow builder** — `@dnd-kit` palette → vertical pipeline, reorder, templates, config, run → live node statuses.
6. **Interview** `/interview` — setup → 5-question session (text + mic + TTS) → report with 4 scores, evidence, practice plan, print.
7. **Settings** — voice picker + sample, engine status from `/api/status`, robot URL, clear data.
8. `npx tsc --noEmit` and `npm run build` must pass. No edits outside owned files.

### Merge / verification checkpoints

| Time | Checkpoint |
| :--- | :--- |
| 21:15 | API contract live; Agent 2 landing + login compiling |
| 22:15 | Chat + workflow API verified with curl; dashboard shell visible |
| 23:15 | Interview flow end-to-end; visual polish pass |
| 23:40 | `npm run build` green, README updated, commit + push |
| 23:55 | Backup demo recording; keys/robot off test |

### Commands

```bash
cd /home/akash/Documents/CodeFest
npm run dev -- --port 3000        # Agent 1
npm run dev -- --port 3001        # Agent 2 (avoid port clash)
npx tsc --noEmit                  # both, before handoff
npm run build                     # final gate
```

Full UI brief for Agent 2: [`AGENT2-BRIEF.md`](./AGENT2-BRIEF.md).

---

## 🎯 The Winning Concept

**ViewPilot Pro** — A job readiness platform where users interact with **specialized AI agents** through a ChatGPT-like interface, and can **visually build custom interview prep workflows** via drag-and-drop. The killer demo: a **robotic interviewer** powered by ElevenLabs voice + Gemini intelligence that conducts real interviews when the candidate can't be physically present.

### Why This Wins

| Judging Criteria | How We Nail It |
|:---|:---|
| **Problem Fit** | Directly addresses Domain 2's interview prep gap with an agent-based approach |
| **Innovation** | Drag-and-drop workflow builder for interview pipelines — nobody else will have this |
| **Technical Depth** | Multi-LLM (Gemini + OpenRouter), ElevenLabs TTS, ESP32-S3 robot, Next.js 16 |
| **UX/Design** | Premium glassmorphic dark UI, scroll-driven 3D landing, Material Expressive |
| **Demo Impact** | Physical robot conducting an interview with AI voice = jaw-drop moment |
| **Completeness** | Landing, Auth, Dashboard, Workflow Builder, Interview, Settings — full product |

---

## 🏗 Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Next.js App Router)                   │
├───────────┬──────────────────────────────────┬──────────────────────────┤
│ LEFT      │           CENTER                 │         RIGHT            │
│           │                                  │                          │
│ Chat      │  Agent Chat Interface             │  Active Workflows       │
│ History   │  ────────────────────             │  ─────────────────      │
│           │  OR                               │  • Resume Review ✅     │
│ Agent     │  Drag & Drop Workflow Builder      │  • Mock Interview 🔄   │
│ Selector  │  (Toggle between modes)           │  • Skill Analysis ⏳    │
│           │                                  │                          │
│ Quick     │  Interview Mode                   │  Workflow Logs          │
│ Actions   │  (Voice + Robot integration)     │  Status & Progress      │
│           │                                  │                          │
└───────────┴──────────────────────────────────┴──────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Next.js API Routes │
                    ├────────────────────┤
                    │ /api/agents/chat    │ ──► Gemini / OpenRouter
                    │ /api/agents/eval    │ ──► Gemini (evaluation)
                    │ /api/workflow/run   │ ──► Workflow engine
                    │ /api/interview/*    │ ──► Interview engine
                    │ /api/voice/tts      │ ──► ElevenLabs
                    │ /api/voice/stt      │ ──► Browser Web Speech
                    │ /api/robot/*        │ ──► ESP32-S3 (optional)
                    │ /api/auth/*         │ ──► NextAuth.js
                    └────────────────────┘
```

---

## 📦 Tech Stack (Locked In)

| Layer | Technology | Why |
|:---|:---|:---|
| **Framework** | Next.js 16 (App Router) | SSR, API routes, RSC |
| **Styling** | Tailwind CSS 4 + Material Expressive UI (MUI) | Rapid premium UI |
| **3D Landing** | Three.js + @react-three/fiber + @react-three/drei | Scroll-driven 3D |
| **Drag & Drop** | @dnd-kit/core | Lightweight, accessible |
| **AI (Primary)** | Gemini 2.5 Flash via @google/genai | Fast, structured output |
| **AI (Fallback)** | OpenRouter (Claude/GPT fallback) | Reliability |
| **Voice TTS** | ElevenLabs API | Natural interviewer voice |
| **Voice STT** | Browser Web Speech API | Zero-cost, instant |
| **Auth** | NextAuth.js v5 | Google OAuth + credentials |
| **State** | Zustand | Minimal, fast |
| **Storage** | localStorage + in-memory | No DB for hackathon |
| **Robot** | ESP32-S3 REST API (optional) | Physical demo wow-factor |
| **Icons** | Lucide React | Clean, consistent |

---

## 🗺 Page Map & Routes

```text
/                    → 3D Scroll-Driven Landing Page
/login               → Login / Sign Up (NextAuth)
/dashboard           → Main Agent Interface (3-panel layout)
  ├── chat mode      → Talk to AI agents (Resume, Interview, Career)
  └── workflow mode  → Drag-and-drop workflow builder
/interview           → Full interview session (voice + robot)
/settings            → API keys, preferences, voice settings
```

---

## 🎨 Design System — "Obsidian Glass"

Premium dark-mode glassmorphism. No AI clichés (no neural networks, no circuit boards, no glowing brains).

### Color Palette

| Token | Value | Usage |
|:---|:---|:---|
| `--bg-primary` | `#0a0a0f` | Page background |
| `--bg-surface` | `rgba(255,255,255,0.03)` | Card/panel surfaces |
| `--bg-glass` | `rgba(255,255,255,0.06)` | Glassmorphic elements |
| `--border-glass` | `rgba(255,255,255,0.08)` | Subtle borders |
| `--accent-primary` | `#6C63FF` | Primary actions (indigo-violet) |
| `--accent-secondary` | `#00D9FF` | Secondary highlights (cyan) |
| `--accent-success` | `#22C55E` | Success states |
| `--accent-warning` | `#F59E0B` | Warning states |
| `--accent-error` | `#EF4444` | Error states |
| `--text-primary` | `#F0F0F5` | Headings, primary text |
| `--text-secondary` | `#9CA3AF` | Secondary text |
| `--text-muted` | `#4B5563` | Disabled/muted text |

### Typography

```css
/* Google Fonts: Inter (body) + JetBrains Mono (code) + Outfit (headings) */
--font-heading: 'Outfit', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Glass Effect

```css
.glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### Micro-Animations

- Hover: `scale(1.02)` + border glow (`box-shadow` transition)
- Page transitions: `opacity` + `translateY(12px)` fade-up
- Workflow nodes: Spring-physics drag with `@dnd-kit`
- Chat messages: Slide-in from bottom with stagger
- Status indicators: Gentle pulse animation

---

## 🤖 The Five AI Agents

Each agent is a specialized persona with a system prompt, input/output schema, and evaluation rubric.

| Agent | Icon | Role | API |
|:---|:---|:---|:---|
| **Interview Coach** | 🎯 | Conducts mock interviews, adapts questions, evaluates answers | Gemini |
| **Resume Reviewer** | 📄 | Analyzes resume text, scores sections, suggests improvements | Gemini |
| **Skill Gap Analyzer** | 📊 | Identifies missing skills for target role, creates learning path | OpenRouter |
| **Career Advisor** | 🧭 | Provides career guidance, role matching, industry insights | Gemini |
| **Communication Trainer** | 🗣️ | Evaluates answer clarity, suggests STAR formatting, tone coaching | Gemini |

---

## 🔧 Workflow Builder — Drag & Drop Nodes

Pre-built nodes that users can chain into custom pipelines:

```text
[Upload Resume] → [Resume Review] → [Skill Gap Analysis] → [Generate Questions]
                                                                      │
                                                               [Mock Interview]
                                                                      │
                                                              [Evaluate Answers]
                                                                      │
                                                          [Generate Report + Plan]
```

### Node Types

| Node | Inputs | Outputs |
|:---|:---|:---|
| **Upload Resume** | File/text | Parsed resume data |
| **Set Target Role** | Role, level, type | Config object |
| **Resume Review** | Resume data | Scores, suggestions |
| **Skill Gap Analysis** | Resume + target role | Gap list, learning path |
| **Generate Questions** | Role + level + gaps | Question set |
| **Mock Interview** | Questions + config | Transcript |
| **Evaluate Answers** | Transcript | Rubric scores, evidence |
| **Generate Report** | All above | PDF-ready report |
| **Practice Plan** | Evaluation | Micro-actions, STAR blueprint |

### Workflow Execution

When a workflow runs, each node executes sequentially. The right panel shows:
- Node name + status (⏳ Waiting → 🔄 Running → ✅ Done → ❌ Failed)
- Elapsed time per node
- Preview of each node's output
- Overall workflow progress bar

---

## 📞 Interview Mode — The Robot Demo

This is the **wow moment**. A candidate sits in front of the laptop (or robot), and the AI conducts a full voice interview.

### Flow

```text
1. User selects role, level, type, difficulty
2. System generates 5 role-specific questions (Gemini)
3. For each question:
   a. AI speaks the question (ElevenLabs TTS)
   b. Robot shows appropriate face expression (optional)
   c. Candidate answers via microphone (Web Speech API STT)
   d. AI evaluates in real-time, decides: follow-up or next question
4. Full evaluation report generated
5. Practice plan with STAR blueprints
```

### Robot Integration (Optional)

```text
Browser ──► /api/robot/expression ──► ESP32-S3 (face display)
Browser ──► /api/robot/status     ──► ESP32-S3 (health check)
Browser ──► /api/robot/gesture    ──► ESP32-S3 (head nod/tilt)
```

The robot adds **physical presence** — it shows facial expressions synced with the interview (thinking face while evaluating, nodding while listening, encouraging smile after a good answer).

---

## 📁 Project Structure

```text
CodeFest/ (repo root)
├── public/
│   ├── fonts/
│   └── models/                     # 3D assets for landing page
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + providers
│   │   ├── page.tsx                # 3D Landing page
│   │   ├── login/
│   │   │   └── page.tsx            # Auth page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Main 3-panel agent interface
│   │   ├── interview/
│   │   │   └── page.tsx            # Voice interview session
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings page
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       │   └── route.ts        # NextAuth config
│   │       ├── agents/
│   │       │   ├── chat/route.ts   # Agent chat endpoint
│   │       │   └── eval/route.ts   # Evaluation endpoint
│   │       ├── workflow/
│   │       │   └── run/route.ts    # Workflow execution
│   │       ├── interview/
│   │       │   └── route.ts        # Interview session
│   │       ├── voice/
│   │       │   └── tts/route.ts    # ElevenLabs proxy
│   │       └── robot/
│   │           └── route.ts        # Robot bridge
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero3D.tsx          # Three.js hero scene
│   │   │   ├── FeatureSection.tsx  # Scroll-triggered features
│   │   │   ├── WorkflowDemo.tsx    # Animated workflow preview
│   │   │   └── CTASection.tsx      # Final call-to-action
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx         # Left: history + agent selector
│   │   │   ├── ChatPanel.tsx       # Center: chat interface
│   │   │   ├── WorkflowBuilder.tsx # Center: drag-and-drop builder
│   │   │   ├── WorkflowNode.tsx    # Individual draggable node
│   │   │   └── StatusPanel.tsx     # Right: running workflows
│   │   ├── interview/
│   │   │   ├── InterviewSetup.tsx  # Role/level/type selector
│   │   │   ├── InterviewSession.tsx# Active interview with voice
│   │   │   └── InterviewReport.tsx # Post-interview evaluation
│   │   ├── auth/
│   │   │   └── AuthForm.tsx        # Login/signup form
│   │   ├── settings/
│   │   │   └── SettingsPanel.tsx   # Settings controls
│   │   └── ui/
│   │       ├── GlassCard.tsx       # Reusable glass card
│   │       ├── Button.tsx          # Styled button variants
│   │       ├── Badge.tsx           # Status badges
│   │       └── AnimatedText.tsx    # Text reveal animation
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── prompts.ts          # System prompts for each agent
│   │   │   ├── interview-engine.ts # Core interview logic
│   │   │   └── evaluator.ts        # Answer evaluation + rubric
│   │   ├── ai/
│   │   │   ├── gemini.ts           # Gemini client
│   │   │   ├── openrouter.ts       # OpenRouter client
│   │   │   └── fallback.ts         # Local deterministic fallback
│   │   ├── voice/
│   │   │   ├── elevenlabs.ts       # ElevenLabs TTS client
│   │   │   └── speech.ts           # Web Speech API wrapper
│   │   ├── workflow/
│   │   │   ├── engine.ts           # Workflow execution engine
│   │   │   ├── nodes.ts            # Node type definitions
│   │   │   └── templates.ts        # Pre-built workflow templates
│   │   ├── robot/
│   │   │   └── client.ts           # ESP32-S3 HTTP client
│   │   └── store/
│   │       ├── chat-store.ts       # Zustand: chat state
│   │       ├── workflow-store.ts   # Zustand: workflow state
│   │       └── interview-store.ts  # Zustand: interview state
│   └── styles/
│       └── globals.css             # Design tokens + global styles
├── .env.example
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚡ API Endpoints

### `POST /api/agents/chat`

```json
// Request
{
  "agent": "interview-coach" | "resume-reviewer" | "skill-analyzer" | "career-advisor" | "communication-trainer",
  "messages": [{ "role": "user" | "assistant", "content": "..." }],
  "context": { "targetRole": "Frontend Engineer", "level": "Entry" }
}
// Response (streaming)
{
  "role": "assistant",
  "content": "...",
  "source": "gemini" | "openrouter" | "local",
  "metadata": { "tokens": 142, "latency_ms": 890 }
}
```

### `POST /api/workflow/run`

```json
// Request
{
  "workflow": {
    "id": "wf_123",
    "nodes": [
      { "type": "set-target-role", "config": { "role": "Frontend Engineer", "level": "Entry" } },
      { "type": "generate-questions", "config": { "count": 5, "type": "mixed" } },
      { "type": "mock-interview", "config": { "voice": true } }
    ],
    "edges": [["node_0", "node_1"], ["node_1", "node_2"]]
  }
}
// Response (SSE stream)
{ "nodeId": "node_0", "status": "running" }
{ "nodeId": "node_0", "status": "complete", "output": { ... } }
{ "nodeId": "node_1", "status": "running" }
...
```

### `POST /api/interview/session`

```json
// Request
{
  "action": "start" | "answer" | "next" | "evaluate",
  "sessionId": "sess_abc",
  "setup": { "role": "...", "level": "...", "type": "...", "difficulty": "..." },
  "answer": "My experience with React includes..."
}
// Response
{
  "question": "Tell me about a challenging project...",
  "questionNumber": 2,
  "totalQuestions": 5,
  "followUp": false,
  "evaluation": null | { "scores": {...}, "evidence": [...], "nextPractice": [...] }
}
```

### `POST /api/voice/tts`

```json
// Request
{ "text": "Tell me about your experience...", "voiceId": "interviewer_professional" }
// Response: audio/mpeg stream
```

### `GET /api/robot/status`

```json
// Response
{ "online": true, "battery": 85, "expression": "neutral", "ip": "192.168.1.42" }
```

---

## ⏱ EXECUTION TIMELINE — 4 Hours

### Phase 0: Setup (0:00 – 0:15) — BOTH

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --no-turbopack --import-alias "@/*"
npm install @mui/material @emotion/react @emotion/styled
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install three @react-three/fiber @react-three/drei
npm install @google/genai
npm install next-auth@beta
npm install lucide-react
npm install framer-motion
```

- Set up `.env.local` with API keys
- Create base `globals.css` with design tokens
- Create `layout.tsx` with fonts + providers

---

### Phase 1: Core Foundation (0:15 – 1:15) — PARALLEL

#### Dev A: Landing Page + Auth UI

| Time | Task |
|:---|:---|
| 0:15 – 0:45 | **3D Landing Page** — Hero with Three.js scene (floating geometric shapes — dodecahedrons, torus knots, spheres — with glassmorphic panels overlaid). Scroll-driven animations with Framer Motion. Feature sections, workflow preview animation, CTA. |
| 0:45 – 1:00 | **Login/Signup Page** — Glass card with email/password form, Google OAuth button, animated background. |
| 1:00 – 1:15 | **Global Layout** — Navigation bar, page transitions, responsive breakpoints. |

#### Dev B: API Layer + AI Integration

| Time | Task |
|:---|:---|
| 0:15 – 0:35 | **Gemini client** (`lib/ai/gemini.ts`) — Structured output, streaming, system prompts for all 5 agents. |
| 0:35 – 0:50 | **OpenRouter client** (`lib/ai/openrouter.ts`) — Fallback LLM, same interface. |
| 0:50 – 1:00 | **ElevenLabs client** (`lib/voice/elevenlabs.ts`) — TTS proxy endpoint. |
| 1:00 – 1:15 | **Agent chat API** (`/api/agents/chat`) — Streaming endpoint, agent routing, context handling. |

---

### Phase 2: Dashboard (1:15 – 2:30) — PARALLEL

#### Dev A: Dashboard UI (The 3-Panel Layout)

| Time | Task |
|:---|:---|
| 1:15 – 1:35 | **Left Sidebar** — Agent selector (5 agents with icons), chat history list, collapsible panel. |
| 1:35 – 2:00 | **Center: Chat Interface** — Message bubbles (glass style), typing indicator, markdown rendering, input bar with voice toggle. |
| 2:00 – 2:15 | **Center: Workflow Builder** — Toggle between Chat/Workflow mode. Drag-and-drop canvas with `@dnd-kit`. Node palette + drop zone. |
| 2:15 – 2:30 | **Right Panel** — Active workflows list with status badges (⏳🔄✅❌), expand to see node-level progress. |

#### Dev B: Workflow Engine + Interview API

| Time | Task |
|:---|:---|
| 1:15 – 1:40 | **Workflow engine** (`lib/workflow/engine.ts`) — Sequential node executor, SSE streaming status updates. |
| 1:40 – 2:00 | **Node definitions** (`lib/workflow/nodes.ts`) — All 9 node types with execute functions. |
| 2:00 – 2:15 | **Workflow API** (`/api/workflow/run`) — SSE endpoint, workflow validation, execution. |
| 2:15 – 2:30 | **Interview API** (`/api/interview/session`) — 5-question session, follow-up logic, evaluation. |

---

### Phase 3: Interview Page + Polish (2:30 – 3:30) — PARALLEL

#### Dev A: Interview UI + Settings

| Time | Task |
|:---|:---|
| 2:30 – 2:50 | **Interview Setup** — Role/level/type/difficulty selectors with Material Expressive styling. |
| 2:50 – 3:15 | **Interview Session** — Live question display, voice recording indicator, real-time transcript, timer, robot status indicator. Question progress bar. |
| 3:15 – 3:30 | **Settings Page** — API key inputs, voice preferences, robot URL config, theme toggle placeholder. |

#### Dev B: Voice Integration + Robot Bridge + Evaluation

| Time | Task |
|:---|:---|
| 2:30 – 2:50 | **Web Speech integration** — STT wrapper, real-time transcription in interview. |
| 2:50 – 3:10 | **ElevenLabs TTS integration** — Speak questions aloud, audio playback management. |
| 3:10 – 3:20 | **Robot bridge** (`/api/robot/*`) — Expression sync, status polling. |
| 3:20 – 3:30 | **Evaluation engine** — 4-dimension rubric scoring, evidence extraction, practice plan generation. |

---

### Phase 4: Final Integration + Demo Prep (3:30 – 4:00) — BOTH

| Time | Task |
|:---|:---|
| 3:30 – 3:40 | **Integration testing** — Full workflow: Landing → Login → Dashboard → Chat → Workflow → Interview → Report. |
| 3:40 – 3:50 | **Polish** — Fix layout breaks, add loading states, error boundaries, smooth transitions. |
| 3:50 – 3:55 | **Environment check** — Verify all API keys work, test with/without robot. |
| 3:55 – 4:00 | **Git push** — Clean commit, update README, verify build. |

---

## 🎤 Demo Script (3 minutes)

### Minute 1: The Problem + Landing Page
> "Students never get real interview practice with adaptive feedback. They use static question banks and get no structured improvement path."
>
> *[Show the landing page — smooth 3D scroll, feature reveals, architecture diagram]*

### Minute 2: The Platform
> "ViewPilot Pro gives you 5 specialized AI agents — chat with them like ChatGPT, or build custom interview prep workflows with drag-and-drop."
>
> *[Show dashboard — chat with Interview Coach, switch to Workflow Builder, drag nodes, run a workflow, show right panel status]*

### Minute 3: The Robot Interview (Wow Moment)
> "And for candidates who can't physically attend — our AI robot conducts the interview for them. Real voice. Real evaluation. Real feedback."
>
> *[Start interview — AI speaks question via ElevenLabs, candidate answers, robot shows expressions, evaluation report appears]*
>
> "Four rubric scores. Evidence from your own words. A practice plan. All in 30 seconds."

---

## 🛡 Risk Mitigation

| Risk | Mitigation |
|:---|:---|
| **API rate limits** | Local fallback engine for all agents — app works with zero API keys |
| **ElevenLabs quota** | Fall back to browser `speechSynthesis` API |
| **Robot offline** | Robot is always optional — interview works without it |
| **3D performance** | Lightweight geometry only (no heavy models), `Suspense` fallback |
| **Time crunch** | If behind: skip Settings page, simplify workflow builder to pre-built templates only |

---

## 🔑 Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id

# Optional
ROBOT_BASE_URL=http://192.168.1.42
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

---

## 📋 Priority Tiers (If Time Runs Short)

### 🔴 MUST HAVE (First 2.5 hours)
- [x] Landing page (even simplified — 2D with animations is fine if 3D takes too long)
- [x] Login page (working auth form, can skip OAuth)
- [x] Dashboard with chat interface (at least 1 working agent)
- [x] Interview page with text input (basic flow)
- [x] API routes for chat + interview

### 🟡 SHOULD HAVE (Next 1 hour)
- [ ] Workflow builder with drag-and-drop
- [ ] Right panel with workflow status
- [ ] ElevenLabs voice in interview
- [ ] Multiple working agents
- [ ] Evaluation report with rubric

### 🟢 NICE TO HAVE (Final 30 min)
- [ ] 3D elements on landing page
- [ ] Robot integration
- [ ] Settings page
- [ ] Pre-built workflow templates
- [ ] Smooth page transitions
- [ ] Print/export report

---

> [!IMPORTANT]
> **Key Principle:** Every feature should work without external APIs. Build the local fallback first, then layer AI on top. The judges should never see a loading spinner or error screen.

---

## Ready to Execute?

Click **Proceed** below and I will start scaffolding the entire project — Next.js app, all pages, components, API routes, design system — in the optimal build order for 2 developers working in parallel.
