# ViewPilot

**Your AI-powered interview coach.** ViewPilot turns realistic mock interviews into structured growth: role-specific questions, a visible rubric, evidence-backed feedback, and a targeted re-practice plan.

**CodeFest 2026 · Team Mooncraft · 24 October 2026**<br />
**Domain 2 — Job Readiness · AI-Powered Web Applications**

> [!IMPORTANT]
> The ESP32-S3 robot is an **optional backup interviewer**. Every interview, evaluation and report works with no robot, no API key and no network call. Unplug the robot and the product is unchanged.

---

## Why ViewPilot

Early-career applicants rarely get realistic, role-specific practice before the interview that matters. Generic question banks do not adapt, real mock interviews need a willing expert, and post-interview feedback is usually just “rejected” or “not a fit.”

ViewPilot closes that feedback loop:

```text
Prepare  →  Answer  →  Understand  →  Improve
```

1. Pick a target role, experience level, interview type and difficulty.
2. Answer five realistic questions. A thin answer can earn one evidence-seeking follow-up.
3. Read a report with four rubric scores, quotes from your own answers, strengths, gaps and an improved-answer blueprint.
4. Re-practice immediately with a specific target.

It is **text-first**. Voice input and the robot are optional extras, not dependencies.

---

## What is working today

| Area | Implementation |
| :--- | :--- |
| **Landing page** | Product story aligned with the pitch deck: problem, coaching loop, rubric, report preview, architecture, reliability, ethics, FAQ. |
| **Interview flow** | `/interview` — setup, five-question session, evaluating state, report. Fully functional. |
| **Evaluation** | Four dimensions: Communication, Role knowledge, Problem solving, Answer quality. Overall score is labelled a **practice estimate**. |
| **Evidence** | Every dimension quotes exact sentences from the candidate's transcript. |
| **Next practice** | Three micro-actions plus a Situation → Task → Action → Result blueprint. |
| **Zero-key path** | Deterministic question bank and rubric engine ship with the app. No external API required. |
| **Optional AI** | Server-side Gemini (`GEMINI_API_KEY`) generates adaptive questions and richer reports. Any failure falls back to local. |
| **Optional robot** | ESP32-S3 backup presence via `ROBOT_BASE_URL`. Offline by default; never blocks the session. |
| **Output** | Print / Save PDF, JSON export, copy summary, local practice history. |
| **Accessibility** | Keyboard-friendly controls, visible rubric, read-aloud questions, browser dictation. |

---

## 60-second demo (no keys, no robot)

```bash
git clone https://github.com/Itsmeakash248/CodeFest.git
cd CodeFest/Codefest-Practice
npm install
npm run dev
```

Open <http://localhost:3000>, press **Start practice**, keep the default Frontend Engineer / Entry / Mixed / Standard setup, and answer the five questions. The report is generated locally and immediately.

Then show the optional layers:

- Add `GEMINI_API_KEY` to `.env.local` for AI-adaptive questions and feedback.
- Add `ROBOT_BASE_URL` to the server environment and open `/robot` to test the physical backup.

---

## Architecture

```text
┌──────────────────────────── Browser ────────────────────────────┐
│  /interview                                                     │
│  setup · timer · text/voice answer · report · print/export      │
└───────────────┬─────────────────────────────────────────────────┘
                │ POST /api/interview
                ▼
┌────────────────────────── Next.js server ───────────────────────┐
│  validate setup + turns                                         │
│  ┌──────────────────────┐        ┌───────────────────────────┐  │
│  │ Gemini (optional)    │  ───►  │ schema-checked response   │  │
│  │ 22 s timeout         │        └───────────────────────────┘  │
│  └──────────┬───────────┘                                       │
│             │ failure / no key                                  │
│             ▼                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Deterministic local engine                                │  │
│  │ question bank · adaptive follow-up · heuristic rubric      │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────┬─────────────────────────────────────────────────┘
                │ GET/POST /api/robot (optional, 1.8 s timeout)
                ▼
       ESP32-S3 robot on the local network
```

- API keys stay on the server; the browser never receives one.
- The response includes `source: "ai" | "local"` and the report labels the engine.
- Resume text is optional and treated as untrusted input, never as instructions.

---

## Evaluation rubric

| Dimension | What it checks | Example coaching tip |
| :--- | :--- | :--- |
| **Communication** | Conciseness, structure, STAR clarity | Lead with the result before the background. |
| **Role knowledge** | Technical depth and role vocabulary | Name one trade-off, not just a tool. |
| **Problem solving** | Constraints, assumptions, edge cases | State the constraint before the solution. |
| **Answer quality** | Relevance, specificity, measurable evidence | Replace hypotheticals with one metric. |

Scores are **practice estimates**, not hiring decisions or employability predictions. The rubric is visible before, during and after the session.

---

## Repository layout

```text
CodeFest/
├── Codefest-Practice/                 # ViewPilot web app
│   ├── src/app/                       # /, /interview, /how, /stack, /robot
│   ├── src/app/api/                   # /api/interview, /api/robot
│   ├── src/components/vp/             # UI + interview client
│   ├── src/lib/                       # content, question bank, local engine, AI
│   └── README.md                      # detailed app documentation
├── FlowPilot-esp32s3/                 # Optional robot firmware
│   ├── main/                          # face, motors, LEDs, telemetry, Wi-Fi
│   └── docs/MOTOR_DRIVER.md           # motor wiring and API guide
├── docs/
│   ├── MoonCraft-Codefest.pptx        # CodeFest pitch deck
│   ├── ViewPilot_CodeFest_2026_Team_Playbook (1).pdf
│   └── CodeFest 2026 Ps.pdf           # official problem statements
├── esp8266-st7735-test/               # standalone display/Wi-Fi bench test
├── wifi_min_test/                     # minimal ESP32-S3 Wi-Fi bring-up
├── MIC-SPEAKER.jpg                    # robot audio add-on reference
├── CodeFest-Paid-Screenshot-Mooncraft.jpeg
└── README.md
```

The web app and firmware now live directly in this repository — no submodules, no extra clone step.

---

## Quick start

### Web app

Requires **Node.js 20.9+**.

```bash
cd Codefest-Practice
npm install
npm run dev
```

Production build:

```bash
npm run build
npm start
```

No environment variables are required. See [`Codefest-Practice/README.md`](Codefest-Practice/README.md) for the API contract and optional layers.

### Optional AI

```bash
cd Codefest-Practice
cp .env.example .env.local
# set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY)
npm run dev
```

If the key is missing or the model is slow, the local engine answers the same request. The UI continues without a dead end.

### Optional robot

```bash
# .env.local
ROBOT_BASE_URL=http://192.168.1.42
```

Flash the ESP32-S3 firmware and connect it to the same trusted LAN:

```bash
. $HOME/esp/esp-idf/export.sh
cd FlowPilot-esp32s3
idf.py set-target esp32s3
idf.py build
idf.py -p /dev/ttyACM0 flash monitor
```

Open `/robot` to see the live bridge status. The robot currently adds a physical face and a preloaded backup script; it does **not** generate questions or score answers. See [`FlowPilot-esp32s3/README.md`](FlowPilot-esp32s3/README.md).

> [!WARNING]
> The robot API is an unauthenticated LAN service. Do not expose it to the public internet. Power the motors from a separate pack, connect all grounds, and keep the robot on a stand during motor tests.

---

## Reliability ladder

The demo degrades in layers instead of showing a spinner:

1. **Gemini** — adaptive questions and richer feedback.
2. **Local rubric engine** — full session and report, no network, no key.
3. **Robot presence + preloaded script** — physical backup if the laptop fails.
4. **Recorded backup video** — last resort for the pitch.

The first two are fully implemented. The robot layer is optional by design.

---

## Why this fits Domain 2

The official brief asks for an AI-powered web application that improves **Job Readiness**. ViewPilot addresses the interview-preparation gap directly:

- role-specific practice instead of a static question list;
- transparent, rubric-based feedback instead of a mystery score;
- evidence and next actions instead of generic encouragement;
- privacy-preserving defaults and no protected-trait scoring;
- a working product that judges can use in the browser without setup.

It also avoids the common failure mode of AI demo projects: the product still works when the model does not.

---

## Safety, privacy and limits

- No account, no upload and no database are required.
- With AI disabled, answers stay in the browser session and `localStorage` history.
- API keys live only in server environment variables.
- No scoring of accent, appearance, pitch, age, gender, disability or other protected traits.
- The report is coaching guidance, not a hiring recommendation.
- Voice input depends on browser Web Speech support; text always works.
- The robot is LAN-only and optional.

---

## Documentation

| Document | Contents |
| :--- | :--- |
| [`Codefest-Practice/README.md`](Codefest-Practice/README.md) | App routes, session flow, API contract, environment, fallback design, robot bridge. |
| [`FlowPilot-esp32s3/README.md`](FlowPilot-esp32s3/README.md) | Firmware features, pinout, build/flash, local REST API. |
| [`FlowPilot-esp32s3/docs/MOTOR_DRIVER.md`](FlowPilot-esp32s3/docs/MOTOR_DRIVER.md) | Motor driver wiring and control modes. |
| [`docs/ViewPilot_CodeFest_2026_Team_Playbook (1).pdf`](docs/ViewPilot_CodeFest_2026_Team_Playbook%20%281%29.pdf) | Product playbook. |
| [`docs/MoonCraft-Codefest.pptx`](docs/MoonCraft-Codefest.pptx) | Pitch deck. |
| [`docs/CodeFest 2026 Ps.pdf`](docs/CodeFest%202026%20Ps.pdf) | Official problem statements. |

---

## A note on FlowPilot

This repository previously told the **FlowPilot** robot-workflow story. The web product has now migrated to ViewPilot, and the robot is retained in `FlowPilot-esp32s3` as an optional backup interviewer and physical demo presence, never as a dependency. Earlier FlowPilot revisions remain recoverable from the preserved submodule backup; the current tree is a single, self-contained repository.

---

## Team

**Team Mooncraft** · CodeFest 2026<br />
Built with Next.js 16, React 19, Tailwind CSS 4, and an optional ESP32-S3 companion.
