# ViewPilot Pro — CodeFest 2026 Pitch Deck & Live Demo Script

> **Product**: ViewPilot Pro  
> **Team**: Mooncraft  
> **Event**: CodeFest 2026  
> **Live Production URL**: [https://codefest-zeta.vercel.app](https://codefest-zeta.vercel.app)  
> **GitHub Repository**: [https://github.com/Itsmeakash248/CodeFest](https://github.com/Itsmeakash248/CodeFest)  
> **Category**: AI / Developer Tools / EdTech  

---

## 1. Executive Summary

**The Problem**:
Technical job interviews are high-stakes, high-stress, and conducted live on video with conversational back-and-forth. Yet, 95% of candidates prepare using static text prompts in ChatGPT, and universities/enterprises struggle to scale human interview pre-screening due to cost ($150–$300/hour per interviewer) and lack of standardized proctoring.

**The Solution**:
**ViewPilot Pro** is a full-stack, conversational AI interview rehearsal platform with **in-browser edge proctoring**, real-time **voice synchronization**, a **4-part STAR rubric grading engine**, and an **agentic practice workspace**. It delivers human-grade rehearsal with machine-grade precision.

---

## 2. Slide-by-Slide Presentation Outline (For PDF / Slide Deck)

### Slide 1: Title & Hook
* **Headline**: ViewPilot Pro
* **Tagline**: Rehearse the Interview. Own the Feedback.
* **Key Visual**: Glowing cybernetic AI avatar orb side-by-side with Candidate Video HUD.
* **Footnote**: Built by Team Mooncraft for CodeFest 2026.

### Slide 2: The Core Problem
* **The Prep Gap**: Reading LeetCode solutions or chatting with ChatGPT does not prepare you for speaking under camera pressure, managing tone, or answering live follow-ups.
* **The Enterprise Bottleneck**: Companies spend thousands of engineering hours conducting redundant initial-round screeners with zero objective grading rubrics.
* **The Privacy Concern**: Traditional online proctoring services stream invasive raw video to third-party offshore cloud servers.

### Slide 3: Our Solution — ViewPilot Pro
* **Conversational AI Interviewer**: Ultra-low-latency Gemini 3.5 Flash + OpenRouter failover + ElevenLabs neural voice synthesis.
* **Privacy-First Edge Proctoring**: Native client-side face, gaze, tab-blur, and paste detection running locally at 60 FPS — **0 raw video frames leave the user's device**.
* **Objective STAR Rubric**: Automated scorecard evaluating Technical Accuracy, Problem Solving, Communication, and Delivery with timestamped evidence.
* **Multi-Agent Prep Hub**: 5 specialist agents and a visual drag-and-drop workflow canvas to practice targeted drills.

### Slide 4: Real-Time Live Architecture
* **Frontend**: Next.js 16.4 (Turbopack), React 19, Tailwind CSS v4, Framer Motion.
* **Edge Intelligence**: Web Audio API volume visualizer + browser-native `FaceDetector` API with chroma-centroid canvas fallback.
* **AI Orchestration**: Multi-key round-robin failover pool for Gemini 3.5 Flash & OpenRouter models.
* **Persistence & Security**: Supabase SSR authentication with HTTP-only secure cookie proxies and PostgreSQL Row-Level Security (RLS).
* **Reliability Net**: Zero-downtime offline fallback (Demo Desk mode) ensuring 100% pitch stability.

### Slide 5: The Scoring Matrix & Proctoring Audit
* **Candidate Scorecard**:
  * Overall performance percentage & competency band (*Exceptional*, *Competent*, *Needs Practice*).
  * 4 core radar dimensions with quoted candidate speech excerpts.
* **Integrity Audit Ledger**:
  * Real-time dynamic Session Integrity Score (0–100%).
  * Timestamped violation log (e.g., `-12% Window blur / Tab switch`, `-8% Gaze averted > 5s`).

### Slide 6: Multi-Agent Workspace & Workflows
* **5 Specialist Agents**:
  1. *System Design Architect*: High-level distributed systems challenges.
  2. *Behavioral Coach*: Amazon leadership principles & STAR formulation.
  3. *Algorithmic Drillmaster*: Time/space complexity & optimization questions.
  4. *Resume & Experience Analyst*: Resume parsing and project-based drills.
  5. *Offer & Negotiation Strategist*: Compensation benchmarking and counter-offers.
* **Visual Workflow Canvas**: Connect and chain automated prep runs in a drag-and-drop node graph.

### Slide 7: Business Model & Market Opportunity
* **B2C (Candidates)**: Freemium model with Pro Tier ($19/mo) for unlimited conversational sessions and custom role blueprints.
* **B2B (Bootcamps & Universities)**: Enterprise licensing for student cohorts with institutional benchmark analytics.
* **B2B (Recruitment & Talent Teams)**: Automated, bias-free first-round video screening with tamper-proof proctoring audits.

### Slide 8: What We Built During the Hackathon
* Full production deployment on Vercel with custom sub-second API routes.
* Native browser face/gaze tracker and anti-cheating proctoring engine.
* Multi-key round-robin failover architecture preventing API rate limits.
* Next.js 16 server-side authentication and Supabase PostgreSQL persistence with RLS.
* Complete dark-mode cybernetic design system with 0 lint or build errors.

---

## 3. The 3-Minute Live Demo Script (Word-for-Word)

> **Setup**: Have `https://codefest-zeta.vercel.app` open in full screen. Camera and microphone permissions already granted.

### [0:00 - 0:35] Hook & Problem
*(Speak with energy and confidence)*
> "Judges, every candidate in this room knows the sheer anxiety of a live technical interview. When you're on camera, under pressure, your mind freezes. 
> 
> Right now, everyone tries to practice by typing prompts into ChatGPT. But typing text into a chatbot doesn't prepare you for real video interviews, where tone, concise speech, and presence matter. 
> 
> That's why we built **ViewPilot Pro** — an AI-powered conversational interview studio with live edge proctoring, realistic voice intelligence, and objective rubric scoring."

---

### [0:35 - 1:40] The Core Demo (The "Wow" Moment)
*(Click "Start Free Rehearsal" or navigate to `/interview`)*
> "Let's jump straight into a live interview as a Full Stack Engineer.
>
> Notice what happens immediately:
> 1. On the left is our **Conversational Interviewer Orb**. It listens to my voice, pulsates with ambient frequency, and speaks back using neural ElevenLabs voice powered by Gemini 3.5 Flash.
> 2. On the right is my **Live Candidate Video HUD**. Look at the reticle: our browser-native computer vision tracks face position and gaze angle in real-time. 
> 
> And here's the best part: **Privacy-First Edge AI**. Zero video frames are streamed to any external server — the entire computer vision pipeline runs locally in WebAssembly and Canvas at 60 frames per second."

*(Trigger a proctor alert for the judges)*
> "Watch what happens if a candidate tries to cheat during a screen-proctored assessment. If I look away from the camera or switch tabs..." 
> *(Switch tab or look away for 3 seconds)*
> "...the proctor engine instantly catches it, fires a toast alert, and registers a timestamped penalty on my session integrity score. It's completely objective and impossible to game."

---

### [1:40 - 2:20] The Scorecard & Cloud Persistence
*(Conclude the question and advance to the Report View)*
> "Once the interview concludes, ViewPilot Pro generates an instant, executive-grade scorecard:
> 
> - It grades my answers against the official **STAR rubric**: Technical Accuracy, Problem Solving, Communication, and Delivery.
> - It quotes **exact transcripts** of what I said well and where I was vague.
> - And here is the **Session Integrity & Proctoring Audit**, logging every focus loss or tab blur with microsecond timestamps.
> - All of this data is encrypted and saved into our **Supabase PostgreSQL** cloud database with Row-Level Security."

---

### [2:20 - 2:45] The Multi-Agent Workspace
*(Click "Workspace" / Dashboard)*
> "Beyond mock interviews, ViewPilot Pro provides a complete career command center:
> 
> - **Five Specialist AI Agents**: System Design Architect, Behavioral Coach, Algorithmic Drillmaster, Resume Analyst, and Offer Strategist.
> - **Visual Workflow Engine**: A drag-and-drop canvas that lets candidates chain customized prep steps — from resume roast to technical drill — into an automated pipeline."

---

### [2:45 - 3:00] The Close
*(Face the judges)*
> "ViewPilot Pro is not a mockup or a Figma concept — it is live in production right now on Vercel, fortified with multi-key failovers, edge proctoring, and cloud database persistence. 
> 
> We are leveling the playing field for every candidate in tech. Thank you, and we'd love to take your questions!"

---

## 4. Judges' Q&A Preparation (Tough Questions & Strong Answers)

#### Q1: "How is this different from existing tools like Interview Warmup by Google or generic ChatGPT?"
> **Answer**: 
> "Most existing tools are asynchronous audio recorders with static NLP transcripts. ViewPilot Pro is **conversational and dynamic** — the AI adapts its follow-up questions based on the candidate's specific previous answers. Furthermore, we include **in-browser edge proctoring** (gaze tracking, tab-blur tracking, paste detection), a 4-part STAR rubric with quoted evidence, and a full multi-agent prep workspace."

#### Q2: "Isn't streaming video to AI models expensive and a massive privacy violation?"
> **Answer**: 
> "That's exactly why we engineered a **privacy-first edge architecture**. We do **not** stream video frames to the cloud. All face detection, gaze bounding, and integrity calculations run entirely on the client's browser hardware using native browser APIs and Web Audio API. Only the lightweight text transcript is sent to the LLM, making our infrastructure 99% cheaper to run and 100% privacy-compliant."

#### Q3: "What happens if Gemini or OpenRouter hits rate limits or goes down during an interview?"
> **Answer**: 
> "ViewPilot Pro features a **multi-provider round-robin failover pool**. If the primary Gemini 3.5 Flash engine times out or errors, the platform instantly fails over to OpenRouter without dropping the user's connection. And if an offline user wants to practice, our zero-downtime local fallback engine continues running seamlessly."

#### Q4: "How do you plan to monetize this?"
> **Answer**: 
> "We have a two-pronged business model:
> 1. **B2C Subscription**: $19/month for unlimited conversational sessions, advanced system design scenarios, and detailed resume analysis.
> 2. **B2B Enterprise / University API**: Charging educational institutions and hiring teams $5 per proctored screening assessment to eliminate human recruiter hours."

---

## 5. Technical Stack Summary

```
┌────────────────────────────────────────────────────────┐
│                      VIEWPILOT PRO                     │
├──────────────────────────┬─────────────────────────────┤
│ Frontend Framework       │ Next.js 16.4.3 (Turbopack)   │
│ Client UI & Styling      │ React 19, Tailwind CSS v4   │
│ Animations & Motion      │ Framer Motion, Lucide Icons │
│ Speech Synthesis (TTS)   │ ElevenLabs (Matilda) + Web  │
│ LLM Engine               │ Gemini 3.5 Flash / OpenRouter│
│ Edge Computer Vision     │ Native FaceDetector API     │
│ Audio Signal Analysis    │ Web Audio API AnalyzerNode  │
│ Database & Cloud Auth    │ Supabase SSR + Postgres RLS │
│ Deployment Host          │ Vercel Edge Network         │
└──────────────────────────┴─────────────────────────────┘
```

---
*Created for Team Mooncraft — CodeFest 2026. Ready to Pitch!*
