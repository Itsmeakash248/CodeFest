import type { InterviewQuestion, InterviewSetup } from "@/lib/types";
import { roleById } from "@/lib/data/roles";
import { hashString, seededShuffle } from "@/lib/text";

function q(
  id: string,
  text: string,
  competency: string,
  type: "Behavioral" | "Technical" | "System design",
  difficulty: "Warm-up" | "Standard" | "Stretch",
  signals: string[],
  probe: string,
  starHint: string,
): InterviewQuestion {
  return { id, text, competency, type, difficulty, signals, probe, starHint };
}

const U_SELF = q(
  "u-self",
  "Tell me about yourself and why this role interests you.",
  "Motivation & fit",
  "Behavioral",
  "Warm-up",
  ["experience", "built", "shipped", "learned", "role", "impact", "team", "project"],
  "Which part of that experience is most relevant to this role, and why?",
  "Present → one proof → why this role. Keep it to 60–90 seconds.",
);

const UNIVERSAL: InterviewQuestion[] = [
  U_SELF,
  q(
    "u-project",
    "Walk me through a project you're proud of. What was your specific contribution, and what changed because of it?",
    "Ownership & impact",
    "Behavioral",
    "Standard",
    ["built", "led", "designed", "result", "users", "metric", "deployed", "shipped", "improved", "reduced"],
    "What was the hardest constraint, and what trade-off did you choose?",
    "Context in one sentence, then your actions and the measurable result.",
  ),
  q(
    "u-conflict",
    "Tell me about a time you disagreed with a teammate or manager. How did you handle it?",
    "Collaboration & conflict",
    "Behavioral",
    "Standard",
    ["listened", "data", "trade-off", "agreed", "escalated", "compromise", "outcome", "perspective", "evidence"],
    "What would you do differently if the disagreement happened again?",
    "Show the other side fairly, then how you moved the decision forward.",
  ),
  q(
    "u-failure",
    "Describe a time something you owned failed. What did you do next?",
    "Accountability",
    "Behavioral",
    "Standard",
    ["owned", "root cause", "fixed", "learned", "prevent", "postmortem", "changed", "responsibility", "monitor"],
    "What guardrail did you add so it could not happen again?",
    "Take responsibility without theatre, then show the correction and the prevention.",
  ),
  q(
    "u-learn",
    "Tell me about a time you had to learn something quickly to deliver.",
    "Learning agility",
    "Behavioral",
    "Standard",
    ["learned", "docs", "mentor", "shipped", "deadline", "practice", "applied", "tutorial", "feedback"],
    "How did you know you had learned it well enough to trust your work?",
    "Name the gap, the method, the deadline, and the proof it worked.",
  ),
  q(
    "u-priority",
    "How do you prioritize when three urgent requests land at once?",
    "Prioritization",
    "Behavioral",
    "Standard",
    ["impact", "deadline", "stakeholder", "communicate", "trade-off", "sequence", "blocked", "risk", "effort"],
    "Tell me about a time you deliberately deprioritized something important.",
    "Explain the decision rule, then a real example where you applied it.",
  ),
  q(
    "u-complex",
    "Describe a complex problem you solved. How did you break it down?",
    "Problem solving",
    "Behavioral",
    "Standard",
    ["constraint", "hypothesis", "data", "test", "root cause", "options", "trade-off", "verified", "assumption", "scope"],
    "What assumption turned out to be wrong?",
    "Constraint → hypotheses → evidence → decision → verification.",
  ),
  q(
    "u-feedback",
    "Tell me about difficult feedback you received. What changed?",
    "Self-awareness",
    "Behavioral",
    "Standard",
    ["feedback", "listened", "changed", "improved", "practiced", "result", "asked", "reflected", "habit"],
    "How did you make sure the change stuck?",
    "Quote the feedback honestly, then show the behaviour change and its effect.",
  ),
  q(
    "u-incomplete",
    "How do you make decisions when you don't have all the information?",
    "Judgment",
    "Behavioral",
    "Standard",
    ["reversible", "risk", "assumption", "data", "decide", "review", "escalate", "option", "cost", "learn"],
    "Tell me about a decision you reversed after new evidence.",
    "Separate reversible from irreversible, state the assumption, and set a review point.",
  ),
  q(
    "u-growth",
    "Where do you want to grow in the next year, and what are you doing about it now?",
    "Growth",
    "Behavioral",
    "Warm-up",
    ["learn", "practice", "feedback", "project", "mentor", "goal", "read", "build", "measure"],
    "What is the smallest thing you could ship this month to prove that growth?",
    "Name one skill, one habit, and one piece of evidence you are building.",
  ),
  q(
    "u-process",
    "Tell me about a process you improved. What was the before and after?",
    "Initiative",
    "Behavioral",
    "Standard",
    ["manual", "automated", "time", "before", "after", "adoption", "metric", "simplified", "documented", "error"],
    "Who else had to adopt the change, and how did you get them on board?",
    "Show the old cost, the change you made, and the new number.",
  ),
  q(
    "u-explain",
    "How would you explain a technical concept to a non-technical stakeholder?",
    "Communication",
    "Behavioral",
    "Standard",
    ["audience", "analogy", "example", "why", "decision", "jargon", "clarity", "impact", "question"],
    "Give me the one-sentence version you would put in a status update.",
    "Start with the decision it affects, then use one concrete analogy.",
  ),
];

const FRONTEND: InterviewQuestion[] = [
  q(
    "fe-perf",
    "A dashboard takes four seconds to become interactive. Walk me through how you'd diagnose and fix it.",
    "Web performance",
    "Technical",
    "Standard",
    ["lighthouse", "bundle", "network", "waterfall", "render", "lazy", "cache", "profiler", "image", "code split", "paint", "blocking"],
    "If you only had one day, which fix would you ship first and what would you measure?",
    "Measure → isolate the largest cost → fix → verify with a number.",
  ),
  q(
    "fe-state",
    "How would you architect state for a multi-step form used by 50,000 users?",
    "Frontend architecture",
    "System design",
    "Stretch",
    ["server state", "client state", "validation", "persistence", "url", "reducer", "schema", "optimistic", "recover", "draft", "autosave"],
    "What happens when a user edits the same draft on two devices?",
    "Separate server state from UI state, define the source of truth, then handle recovery.",
  ),
  q(
    "fe-a11y",
    "How would you make a data-dense dashboard usable with a keyboard and a screen reader?",
    "Accessibility",
    "Technical",
    "Standard",
    ["focus", "semantic", "aria", "contrast", "tab order", "label", "skip link", "announce", "keyboard", "test", "heading"],
    "How would you test it without an accessibility expert on the team?",
    "Semantics first, then focus order, then announcements, then contrast and testing.",
  ),
  q(
    "fe-bug",
    "Describe a UI bug that only appeared in production. How did you track it down?",
    "Debugging",
    "Behavioral",
    "Standard",
    ["reproduce", "logs", "monitoring", "browser", "race", "cache", "source map", "users", "fix", "regression", "session"],
    "What did you add so the next occurrence would be obvious?",
    "Show the reproduction, the narrowing process, the root cause, and the regression test.",
  ),
  q(
    "fe-api",
    "How do you handle a slow or failing API in a React UI?",
    "Resilience",
    "Technical",
    "Warm-up",
    ["loading", "error boundary", "retry", "skeleton", "timeout", "cache", "optimistic", "fallback", "abort", "stale"],
    "When would you choose an optimistic update over a loading state?",
    "Name the states, the user feedback for each, and the failure path.",
  ),
];

const BACKEND: InterviewQuestion[] = [
  q(
    "be-book",
    "Design the API and data model for a booking system that must prevent double bookings.",
    "API & data modeling",
    "System design",
    "Stretch",
    ["unique constraint", "transaction", "idempotency", "lock", "race", "retry", "index", "status", "timezone", "conflict", "isolation"],
    "Two requests hit the last slot at the same millisecond. Walk me through what the database does.",
    "Start with the invariant, enforce it in the database, then handle retries idempotently.",
  ),
  q(
    "be-latency",
    "A service's p95 latency doubled after a deploy. How do you find the cause?",
    "Observability",
    "Technical",
    "Standard",
    ["metrics", "trace", "logs", "deploy", "rollback", "query", "cache", "n+1", "dashboard", "baseline", "regression"],
    "What would make you roll back immediately instead of investigating?",
    "Compare before/after, localize with traces, then decide rollback vs fix.",
  ),
  q(
    "be-rate",
    "How would you design rate limiting for a public API?",
    "System design",
    "Technical",
    "Standard",
    ["token bucket", "per-user", "redis", "window", "429", "header", "distributed", "burst", "quota", "key"],
    "How do you keep limits fair across tenants with very different traffic?",
    "Pick an algorithm, a key, a storage layer, and the response contract.",
  ),
  q(
    "be-db",
    "How do you choose between SQL and NoSQL for a new feature?",
    "Data modeling",
    "Technical",
    "Warm-up",
    ["access pattern", "consistency", "schema", "scale", "transaction", "query", "join", "migration", "flexibility"],
    "Give me a case where you would deliberately choose the less obvious option.",
    "Lead with access patterns and consistency, not with the technology label.",
  ),
  q(
    "be-incident",
    "Tell me about a production incident you handled. What was your role?",
    "Incident response",
    "Behavioral",
    "Standard",
    ["detected", "mitigated", "communicated", "root cause", "postmortem", "prevention", "customers", "rollback", "monitor"],
    "What did the postmortem change about how the team works?",
    "Detection → mitigation → communication → root cause → prevention.",
  ),
];

const FULLSTACK: InterviewQuestion[] = [
  q(
    "fs-feature",
    "Walk me through shipping a feature end to end, from schema to UI.",
    "End-to-end delivery",
    "Technical",
    "Standard",
    ["schema", "api", "validation", "ui", "test", "deploy", "monitor", "rollback", "auth", "migration"],
    "Where did you cut scope, and what did you deliberately leave out?",
    "Contract first, then data, then UI, then verification and rollout.",
  ),
  q(
    "fs-auth",
    "Design authentication and authorization for a small SaaS app.",
    "Security",
    "System design",
    "Stretch",
    ["session", "jwt", "cookie", "httpOnly", "csrf", "rbac", "expiry", "refresh", "hash", "least privilege"],
    "Where would you store the token, and what attack does that prevent?",
    "Identity → session storage → authorization model → expiry and revocation.",
  ),
  q(
    "fs-debug",
    "A user reports data saving on their machine but not on another. How do you debug it?",
    "Debugging",
    "Technical",
    "Standard",
    ["reproduce", "environment", "cache", "database", "logs", "network", "race", "session", "stale", "tenant"],
    "How do you rule out a caching problem before touching the database?",
    "Reproduce with the same identity, then follow the write path and compare environments.",
  ),
  q(
    "fs-scale",
    "Your app gets 10x traffic overnight. What breaks first and what do you do?",
    "Scalability",
    "System design",
    "Stretch",
    ["database", "cache", "queue", "cdn", "connection", "rate", "index", "load", "monitor", "bottleneck"],
    "What would you protect first, and what would you deliberately shed?",
    "Name the bottleneck, protect the critical path, and degrade gracefully.",
  ),
  q(
    "fs-tradeoff",
    "Tell me about a time you chose a simpler solution over a clever one.",
    "Judgment",
    "Behavioral",
    "Warm-up",
    ["deadline", "maintain", "trade-off", "scope", "shipped", "team", "complexity", "future", "readable"],
    "What would have justified the more complex solution?",
    "Show the options, the cost of complexity, and the outcome of the simpler choice.",
  ),
];

const DATA_ANALYST: InterviewQuestion[] = [
  q(
    "da-sql",
    "Write the logic to find the second-highest salary per department. Talk through your approach.",
    "SQL",
    "Technical",
    "Standard",
    ["window", "rank", "dense_rank", "partition", "subquery", "tie", "null", "group by", "order by", "distinct"],
    "How does your answer change if three people tie for the highest salary?",
    "State the edge case first, then the query shape, then how you'd verify it.",
  ),
  q(
    "da-metric",
    "A key metric dropped 20% week over week. How do you investigate?",
    "Analysis",
    "Technical",
    "Standard",
    ["segment", "timeframe", "data quality", "seasonality", "funnel", "hypothesis", "dashboard", "validate", "cohort", "instrumentation"],
    "How do you separate a real behaviour change from a tracking bug?",
    "Check data quality, segment the drop, form hypotheses, validate with a second source.",
  ),
  q(
    "da-dashboard",
    "Design a dashboard for a support team lead.",
    "Data storytelling",
    "System design",
    "Standard",
    ["audience", "decision", "metric", "north star", "filter", "refresh", "action", "clutter", "sla", "trend"],
    "What would you remove from your first draft?",
    "Start from the decisions they make, not from the charts you can build.",
  ),
  q(
    "da-clean",
    "How do you handle missing or duplicated data in an analysis?",
    "Data quality",
    "Technical",
    "Warm-up",
    ["source", "dedupe", "key", "null", "impute", "document", "validate", "impact", "missing", "exclude"],
    "When is dropping rows more honest than imputing them?",
    "Quantify the problem, choose a defensible rule, and document the impact.",
  ),
  q(
    "da-stakeholder",
    "A stakeholder asks for data that supports a conclusion you think is wrong. What do you do?",
    "Integrity",
    "Behavioral",
    "Standard",
    ["clarify", "evidence", "independent", "communicate", "alternative", "trust", "decision", "question", "present"],
    "How do you disagree without becoming the blocker?",
    "Separate the question from the conclusion, present the evidence, offer alternatives.",
  ),
];

const DATA_SCIENTIST: InterviewQuestion[] = [
  q(
    "ds-experiment",
    "Design an A/B test for a new onboarding flow.",
    "Experimentation",
    "System design",
    "Stretch",
    ["hypothesis", "metric", "sample", "power", "randomization", "guardrail", "duration", "significance", "segment", "baseline"],
    "The result is flat overall but positive for one segment. What do you do?",
    "Hypothesis → metric → power → randomization → guardrails → decision rule.",
  ),
  q(
    "ds-eval",
    "How do you evaluate a model when accuracy looks great but users complain?",
    "Model evaluation",
    "Technical",
    "Standard",
    ["precision", "recall", "auc", "slice", "distribution", "label", "offline", "online", "baseline", "threshold"],
    "Which slice would you inspect first, and why?",
    "Move from aggregate metrics to slices, labels and the actual user decision.",
  ),
  q(
    "ds-features",
    "How do you decide which features to engineer for a prediction problem?",
    "Feature engineering",
    "Technical",
    "Standard",
    ["domain", "leakage", "signal", "missing", "cardinality", "validation", "importance", "time", "available", "simple"],
    "How would you catch a feature that leaks the target?",
    "Start from the decision and available-at-prediction-time data, then test incrementally.",
  ),
  q(
    "ds-overfit",
    "Your model performs well in training but poorly in production. What do you check?",
    "Generalization",
    "Technical",
    "Standard",
    ["overfit", "leakage", "drift", "split", "distribution", "regularization", "validation", "monitor", "label", "temporal"],
    "How would you set up the validation so this is caught before launch?",
    "Check split integrity, leakage, drift and label delay before changing the model.",
  ),
  q(
    "ds-communicate",
    "How do you explain model uncertainty to a product team?",
    "Communication",
    "Behavioral",
    "Warm-up",
    ["confidence", "interval", "trade-off", "decision", "simple", "risk", "threshold", "calibration", "impact"],
    "What number would you put in the product spec, and what does it mean?",
    "Translate uncertainty into a decision threshold and a user-facing consequence.",
  ),
];

const PRODUCT: InterviewQuestion[] = [
  q(
    "pm-priority",
    "You have five requests and room for one. How do you decide?",
    "Prioritization",
    "Technical",
    "Standard",
    ["impact", "effort", "goal", "user", "data", "stakeholder", "trade-off", "strategy", "confidence", "cost"],
    "Who would you disappoint, and how would you explain it?",
    "Tie the decision to a goal, estimate impact and confidence, then communicate the trade-off.",
  ),
  q(
    "pm-discovery",
    "How do you validate a feature idea before building it?",
    "Discovery",
    "Technical",
    "Standard",
    ["interview", "prototype", "survey", "data", "hypothesis", "experiment", "signal", "usability", "willingness", "cheap"],
    "What is the cheapest test that could kill the idea?",
    "Hypothesis → riskiest assumption → cheapest evidence → decision.",
  ),
  q(
    "pm-metric",
    "Pick a product you use. What is its north-star metric and why?",
    "Metrics",
    "Technical",
    "Warm-up",
    ["user", "value", "retention", "frequency", "quality", "guardrail", "business", "habit", "outcome", "segment"],
    "What would that metric miss or encourage badly?",
    "Connect the metric to delivered user value, then name a guardrail.",
  ),
  q(
    "pm-launch",
    "Walk me through launching a feature to 10% of users.",
    "Delivery",
    "Technical",
    "Standard",
    ["rollout", "flag", "monitoring", "success", "support", "rollback", "feedback", "segment", "guardrail", "comms"],
    "What signal would make you stop the rollout?",
    "Define success and rollback before launch, then instrument and communicate.",
  ),
  q(
    "pm-conflict",
    "Engineering says a commitment is impossible. What do you do?",
    "Stakeholder management",
    "Behavioral",
    "Standard",
    ["scope", "constraint", "options", "data", "escalate", "communicate", "trade-off", "deadline", "risk", "align"],
    "How do you tell the customer without losing trust?",
    "Surface the constraint, re-cut scope, and make the trade-off explicit.",
  ),
];

const UX: InterviewQuestion[] = [
  q(
    "ux-research",
    "How would you plan research for a new onboarding flow?",
    "User research",
    "Technical",
    "Standard",
    ["question", "method", "recruit", "prototype", "bias", "sample", "insight", "action", "observe", "assumption"],
    "What would you do with a one-week deadline and no budget?",
    "Start from the decision, pick the method, recruit the right users, then define how insights change the design.",
  ),
  q(
    "ux-test",
    "A usability test shows users miss the primary action. How do you respond?",
    "Usability",
    "Technical",
    "Standard",
    ["observe", "why", "prototype", "hierarchy", "copy", "iterate", "measure", "task", "context", "fix"],
    "How do you avoid over-fitting the design to five users?",
    "Diagnose why, change one variable, and retest the same task.",
  ),
  q(
    "ux-a11y",
    "How do you design an accessible color and focus system?",
    "Accessibility",
    "Technical",
    "Standard",
    ["contrast", "focus", "token", "keyboard", "motion", "screen reader", "test", "color", "state", "scale"],
    "Which accessibility issue is most often missed in design handoff?",
    "Design tokens for contrast and focus, then test with a keyboard and a screen reader.",
  ),
  q(
    "ux-system",
    "When does a design system help, and when does it get in the way?",
    "Design systems",
    "Behavioral",
    "Stretch",
    ["consistency", "scale", "exception", "governance", "adoption", "component", "flexibility", "documentation", "contribution"],
    "How would you handle a team that keeps forking components?",
    "Show the scale benefit, the exception process, and how adoption is measured.",
  ),
  q(
    "ux-tradeoff",
    "Tell me about a design decision you changed after evidence.",
    "Evidence-based design",
    "Behavioral",
    "Warm-up",
    ["research", "data", "prototype", "changed", "user", "outcome", "test", "assumption", "iterate"],
    "What did you originally believe, and what changed your mind?",
    "Name the assumption, the evidence, the change, and the outcome.",
  ),
];

const DEVOPS: InterviewQuestion[] = [
  q(
    "do-pipeline",
    "Design a CI/CD pipeline for a small team shipping daily.",
    "CI/CD",
    "System design",
    "Standard",
    ["lint", "test", "build", "artifact", "staging", "canary", "rollback", "secret", "gate", "deploy"],
    "Where do you put the human gate, and why?",
    "Fast feedback first, then artifacts, environments, rollout strategy and rollback.",
  ),
  q(
    "do-incident",
    "A deploy causes errors in production. Walk me through your response.",
    "Incident response",
    "Technical",
    "Standard",
    ["rollback", "alert", "dashboard", "logs", "communicate", "mitigate", "root cause", "postmortem", "monitor", "blast"],
    "How do you decide between rollback and roll-forward?",
    "Mitigate first, communicate early, then diagnose and prevent.",
  ),
  q(
    "do-iac",
    "Why use infrastructure as code, and what are the risks?",
    "Infrastructure",
    "Technical",
    "Warm-up",
    ["reproducible", "review", "drift", "state", "secret", "version", "plan", "module", "permission", "lock"],
    "How do you stop a bad plan from reaching production?",
    "Reproducibility and review, plus state, drift and secret risks.",
  ),
  q(
    "do-cost",
    "Cloud costs doubled in a month. How do you investigate and reduce them?",
    "Cost",
    "Technical",
    "Standard",
    ["tag", "usage", "idle", "storage", "rightsize", "budget", "anomaly", "commitment", "egress", "owner"],
    "What would you cut first without hurting reliability?",
    "Attribute the spend, find idle or oversized resources, then set a guardrail.",
  ),
  q(
    "do-security",
    "How do you keep secrets and access under control?",
    "Security",
    "Technical",
    "Standard",
    ["vault", "rotation", "least privilege", "env", "audit", "ci", "scan", "mfa", "scope", "revoke"],
    "What happens when a secret leaks despite the controls?",
    "Least privilege, managed secrets, rotation, audit and a rehearsed leak response.",
  ),
];

const ML: InterviewQuestion[] = [
  q(
    "ml-serve",
    "Design serving for a model that must respond in 100ms.",
    "Model serving",
    "System design",
    "Stretch",
    ["batch", "cache", "gpu", "latency", "queue", "fallback", "autoscale", "precompute", "monitor", "batch size"],
    "What do you return when the model is unavailable?",
    "Precompute where possible, bound the request path, and design a fallback.",
  ),
  q(
    "ml-drift",
    "How do you detect and respond to model drift?",
    "MLOps",
    "Technical",
    "Standard",
    ["distribution", "metric", "monitor", "retrain", "threshold", "label", "alert", "shadow", "delay", "baseline"],
    "What do you do when labels arrive two weeks late?",
    "Monitor inputs, outputs and delayed outcomes; set thresholds and a retrain playbook.",
  ),
  q(
    "ml-pipeline",
    "Walk me through a training pipeline from raw data to deployment.",
    "ML engineering",
    "Technical",
    "Standard",
    ["ingest", "validate", "feature", "train", "evaluate", "register", "deploy", "monitor", "version", "reproduce"],
    "Which step is most likely to silently corrupt the model?",
    "Data → features → training → evaluation → registry → deploy → monitor, with versions.",
  ),
  q(
    "ml-eval",
    "How do you choose an evaluation metric for an imbalanced problem?",
    "Evaluation",
    "Technical",
    "Standard",
    ["precision", "recall", "f1", "auc", "cost", "threshold", "class", "baseline", "false positive", "false negative"],
    "Which error is more expensive for the business, and how does that change the threshold?",
    "Start from the cost of each error, then pick the metric and threshold.",
  ),
  q(
    "ml-project",
    "Tell me about an ML project that didn't work. What did you learn?",
    "Research judgment",
    "Behavioral",
    "Warm-up",
    ["hypothesis", "data", "failed", "diagnose", "learned", "changed", "baseline", "signal", "scope"],
    "What would you test first if you started again?",
    "Show the hypothesis, the failed evidence, and the decision you changed.",
  ),
];

const MARKETING: InterviewQuestion[] = [
  q(
    "mk-campaign",
    "Plan a launch campaign for a student productivity app with a small budget.",
    "Campaign strategy",
    "Technical",
    "Standard",
    ["audience", "channel", "message", "budget", "test", "metric", "landing", "retention", "creative", "referral"],
    "What would you measure in week one to decide whether to continue?",
    "Audience → message → channel → budget → test → decision metric.",
  ),
  q(
    "mk-seo",
    "How would you grow organic traffic for a new site?",
    "SEO",
    "Technical",
    "Standard",
    ["keyword", "intent", "content", "technical", "backlink", "cluster", "measure", "crawl", "authority", "conversion"],
    "What would you not write about, even if it has volume?",
    "Search intent, content clusters, technical health, then measurement.",
  ),
  q(
    "mk-attribution",
    "How do you measure which channel actually drives signups?",
    "Analytics",
    "Technical",
    "Stretch",
    ["utm", "attribution", "cohort", "incrementality", "pixel", "last-click", "experiment", "holdout", "multi-touch", "signup"],
    "Why is last-click usually wrong, and what would you use instead?",
    "Define the event, compare models, and move to incrementality when the stakes justify it.",
  ),
  q(
    "mk-content",
    "How do you decide what content to produce next?",
    "Content strategy",
    "Technical",
    "Warm-up",
    ["audience", "intent", "data", "gap", "keyword", "format", "distribution", "conversion", "repurpose", "proof"],
    "How do you stop content from becoming a volume exercise?",
    "Start from audience intent and a distribution plan, not from a content calendar.",
  ),
  q(
    "mk-budget",
    "A paid channel has a high click rate but poor conversion. What do you do?",
    "Growth",
    "Technical",
    "Standard",
    ["landing", "intent", "audience", "funnel", "test", "pause", "creative", "message", "tracking", "offer"],
    "How do you tell a bad audience from a bad landing page?",
    "Audit message match, landing experience and tracking before spending more.",
  ),
];

const BUSINESS_ANALYST: InterviewQuestion[] = [
  q(
    "ba-req",
    "How do you turn a vague stakeholder request into requirements?",
    "Requirements",
    "Technical",
    "Standard",
    ["clarify", "outcome", "user", "scope", "acceptance", "workshop", "prioritize", "document", "constraint", "stakeholder"],
    "What do you do when two stakeholders want different outcomes?",
    "Outcome → users → scope → acceptance criteria → validation with the stakeholder.",
  ),
  q(
    "ba-process",
    "Walk me through mapping a broken business process.",
    "Process analysis",
    "Technical",
    "Standard",
    ["as-is", "stakeholder", "bottleneck", "data", "to-be", "measure", "validate", "handoff", "waste", "owner"],
    "How do you know the new process is actually better?",
    "Observe the as-is, quantify the bottleneck, design the to-be, then measure.",
  ),
  q(
    "ba-sql",
    "How would you validate a report that a stakeholder says is wrong?",
    "Data validation",
    "Technical",
    "Standard",
    ["source", "query", "filter", "duplicate", "join", "reconcile", "timestamp", "communicate", "definition", "sample"],
    "Where do you check first: the query, the source, or the definition?",
    "Agree the definition, trace the query to source, reconcile a sample, then explain.",
  ),
  q(
    "ba-conflict",
    "Two teams define a metric differently. How do you resolve it?",
    "Alignment",
    "Behavioral",
    "Standard",
    ["definition", "source", "workshop", "document", "agree", "governance", "impact", "consumer", "decision", "version"],
    "Who owns the final definition, and how is it enforced?",
    "Bring the consumers together, agree on one definition and source, document it.",
  ),
  q(
    "ba-agile",
    "How do you keep requirements clear in an agile team?",
    "Agile delivery",
    "Technical",
    "Warm-up",
    ["story", "acceptance", "backlog", "refine", "small", "test", "feedback", "example", "priority", "definition"],
    "Show me a story that was too big, and how you split it.",
    "Small stories with examples and acceptance criteria, refined before planning.",
  ),
];

const GENERAL: InterviewQuestion[] = [
  q(
    "gen-team",
    "Tell me about a time you helped a team succeed without being asked.",
    "Teamwork",
    "Behavioral",
    "Standard",
    ["noticed", "volunteered", "helped", "impact", "team", "result", "learned", "ownership", "communication"],
    "What did you sacrifice to make that happen?",
    "Show what you noticed, what you did, and what changed for the team.",
  ),
  q(
    "gen-pressure",
    "Describe a deadline that forced you to cut scope. How did you decide?",
    "Prioritization",
    "Behavioral",
    "Standard",
    ["scope", "must-have", "stakeholder", "communicate", "deadline", "trade-off", "quality", "risk", "shipped"],
    "What did you protect, and what did you deliberately drop?",
    "Name the non-negotiable, the cut, and the communication that made it safe.",
  ),
  q(
    "gen-ambiguity",
    "Tell me about a time you had to start without clear instructions.",
    "Initiative",
    "Behavioral",
    "Standard",
    ["asked", "clarified", "assumption", "plan", "small", "feedback", "delivered", "adjusted", "owner"],
    "How did you check you were solving the right problem?",
    "Show how you framed the problem, found a first step, and adjusted with feedback.",
  ),
];

export const ROLE_QUESTIONS: Record<string, InterviewQuestion[]> = {
  "frontend-engineer": FRONTEND,
  "backend-engineer": BACKEND,
  "fullstack-engineer": FULLSTACK,
  "data-analyst": DATA_ANALYST,
  "data-scientist": DATA_SCIENTIST,
  "product-manager": PRODUCT,
  "ux-designer": UX,
  "devops-engineer": DEVOPS,
  "ml-engineer": ML,
  "marketing-specialist": MARKETING,
  "business-analyst": BUSINESS_ANALYST,
  general: GENERAL,
};

function difficultyRank(question: InterviewQuestion, difficulty: string): number {
  if (difficulty === "Warm-up") {
    return question.difficulty === "Warm-up" ? 0 : question.difficulty === "Standard" ? 1 : 2;
  }
  if (difficulty === "Stretch") {
    return question.difficulty === "Stretch" ? 0 : question.difficulty === "Standard" ? 1 : 2;
  }
  return question.difficulty === "Standard" ? 0 : question.difficulty === "Warm-up" ? 1 : 2;
}

function ranked(list: InterviewQuestion[], setup: InterviewSetup, seed: number): InterviewQuestion[] {
  return seededShuffle(list, seed).sort(
    (a, b) => difficultyRank(a, setup.difficulty) - difficultyRank(b, setup.difficulty),
  );
}

export function buildQuestionSet(setup: InterviewSetup, seed: number): InterviewQuestion[] {
  const role = roleById(setup.role);
  const roleBank = ROLE_QUESTIONS[role.id] ?? GENERAL;
  const all = [...roleBank, ...UNIVERSAL, ...GENERAL];
  const used = new Set<string>();
  const picks: InterviewQuestion[] = [];

  const add = (pool: InterviewQuestion[], count: number) => {
    for (const question of ranked(pool, setup, seed + picks.length * 31)) {
      if (picks.length >= 5 || count <= 0) break;
      if (used.has(question.id) || question.id === U_SELF.id) continue;
      picks.push(question);
      used.add(question.id);
      count -= 1;
    }
  };

  // A human warm-up that works in every interview format.
  picks.push(U_SELF);
  used.add(U_SELF.id);

  const technical = all.filter((question) => question.type !== "Behavioral");
  const system = all.filter((question) => question.type === "System design");
  const behavioral = all.filter((question) => question.type === "Behavioral");
  const problem = [...UNIVERSAL, ...roleBank].filter((question) =>
    ["Problem solving", "Judgment", "Prioritization", "Analysis"].includes(question.competency),
  );

  if (setup.type === "Behavioral") {
    add(behavioral, 4);
  } else if (setup.type === "Technical") {
    add(technical, 3);
    add(problem.length ? problem : technical, 1);
  } else if (setup.type === "System design") {
    add(system, 2);
    add(technical, 1);
    add(behavioral, 1);
  } else {
    add(technical, 2);
    add(behavioral, 1);
    add(problem, 1);
  }

  if (picks.length < 5) add(technical.length ? technical : behavioral, 5 - picks.length);
  if (picks.length < 5) add(behavioral.length ? behavioral : technical, 5 - picks.length);
  if (picks.length < 5) add(all, 5 - picks.length);

  return picks.slice(0, 5);
}

export function buildQuestionSetForSession(setup: InterviewSetup, sessionId: string): InterviewQuestion[] {
  const role = roleById(setup.role);
  return buildQuestionSet(setup, hashString(`${sessionId}:${role.id}:${setup.type}:${setup.difficulty}`));
}

export function followUpFor(question: InterviewQuestion): InterviewQuestion {
  return {
    ...question,
    id: `${question.id}-fu`,
    text: question.probe,
    competency: `${question.competency} · follow-up`,
    type: "Behavioral",
    difficulty: "Standard",
  };
}
