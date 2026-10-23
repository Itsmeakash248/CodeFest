export interface RoleProfile {
  id: string;
  label: string;
  family: string;
  skills: string[];
  adjacent: string[];
  keywords: string[];
}

export const ROLES: RoleProfile[] = [
  {
    id: "frontend-engineer",
    label: "Frontend Engineer",
    family: "Engineering",
    skills: ["React", "TypeScript", "CSS architecture", "Accessibility", "Web performance", "Testing", "State management", "API integration", "Design systems", "Build tooling"],
    adjacent: ["Full-Stack Engineer", "Product Engineer", "UX Engineer", "Design Technologist"],
    keywords: ["react", "frontend", "typescript", "css", "ui", "web", "next.js", "browser"],
  },
  {
    id: "backend-engineer",
    label: "Backend Engineer",
    family: "Engineering",
    skills: ["API design", "Databases", "Caching", "Queues", "Authentication", "Observability", "Distributed systems", "Testing", "Cloud infrastructure", "Security"],
    adjacent: ["Platform Engineer", "Full-Stack Engineer", "SRE", "Data Engineer"],
    keywords: ["backend", "api", "database", "server", "sql", "node", "python", "go", "java"],
  },
  {
    id: "fullstack-engineer",
    label: "Full-Stack Engineer",
    family: "Engineering",
    skills: ["React", "TypeScript", "API design", "Databases", "Authentication", "Deployment", "Testing", "Caching", "Product thinking", "Debugging"],
    adjacent: ["Frontend Engineer", "Backend Engineer", "Product Engineer", "Founding Engineer"],
    keywords: ["fullstack", "full-stack", "react", "node", "api", "database", "typescript"],
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    family: "Data",
    skills: ["SQL", "Data cleaning", "Dashboard design", "Statistics", "Experiment analysis", "Stakeholder communication", "Spreadsheets", "Python", "Data modeling", "Data storytelling"],
    adjacent: ["Analytics Engineer", "Product Analyst", "Business Analyst", "Data Scientist"],
    keywords: ["analyst", "sql", "dashboard", "excel", "tableau", "power bi", "analytics"],
  },
  {
    id: "data-scientist",
    label: "Data Scientist",
    family: "Data",
    skills: ["Python", "Statistics", "Machine learning", "Experiment design", "Feature engineering", "Model evaluation", "SQL", "Data visualization", "Communication", "Causal inference"],
    adjacent: ["ML Engineer", "Product Data Scientist", "Analytics Engineer", "Research Scientist"],
    keywords: ["data scientist", "machine learning", "python", "statistics", "model", "experiment"],
  },
  {
    id: "product-manager",
    label: "Product Manager",
    family: "Product",
    skills: ["Discovery", "Roadmapping", "Metrics", "Prioritization", "Stakeholder management", "User research", "Analytics", "Go-to-market", "Written communication", "Experimentation"],
    adjacent: ["Product Analyst", "Program Manager", "Founder", "Product Marketing"],
    keywords: ["product manager", "product", "roadmap", "stakeholder", "prioritization", "pm"],
  },
  {
    id: "ux-designer",
    label: "UX Designer",
    family: "Design",
    skills: ["User research", "Information architecture", "Interaction design", "Visual design", "Prototyping", "Usability testing", "Accessibility", "Design systems", "Figma", "Product thinking"],
    adjacent: ["Product Designer", "UX Researcher", "Design Engineer", "Content Designer"],
    keywords: ["ux", "designer", "figma", "user research", "prototype", "usability", "design"],
  },
  {
    id: "devops-engineer",
    label: "DevOps Engineer",
    family: "Engineering",
    skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "Infrastructure as code", "Cloud platforms", "Monitoring", "Security", "Networking", "Incident response"],
    adjacent: ["SRE", "Platform Engineer", "Cloud Engineer", "Security Engineer"],
    keywords: ["devops", "kubernetes", "docker", "aws", "terraform", "ci/cd", "sre", "cloud"],
  },
  {
    id: "ml-engineer",
    label: "ML Engineer",
    family: "AI",
    skills: ["Python", "PyTorch", "Data pipelines", "Model serving", "MLOps", "Evaluation", "Distributed training", "Cloud infrastructure", "Monitoring", "Software engineering"],
    adjacent: ["Data Scientist", "AI Engineer", "Platform Engineer", "Research Engineer"],
    keywords: ["ml engineer", "machine learning", "pytorch", "tensorflow", "model", "mlops", "ai"],
  },
  {
    id: "marketing-specialist",
    label: "Marketing Specialist",
    family: "Business",
    skills: ["Positioning", "Content strategy", "SEO", "Paid acquisition", "Analytics", "Lifecycle marketing", "Brand writing", "Experimentation", "Email", "Market research"],
    adjacent: ["Product Marketing", "Growth Marketer", "Content Strategist", "Brand Manager"],
    keywords: ["marketing", "seo", "campaign", "content", "growth", "brand", "ads"],
  },
  {
    id: "business-analyst",
    label: "Business Analyst",
    family: "Business",
    skills: ["Requirements gathering", "Process mapping", "SQL", "Stakeholder management", "Spreadsheets", "Data visualization", "Agile delivery", "Documentation", "Problem framing", "Testing"],
    adjacent: ["Product Analyst", "Data Analyst", "Product Manager", "Operations Analyst"],
    keywords: ["business analyst", "requirements", "process", "stakeholder", "sql", "agile"],
  },
  {
    id: "general",
    label: "General / Behavioral",
    family: "General",
    skills: ["Communication", "Problem solving", "Teamwork", "Ownership", "Adaptability", "Planning", "Learning agility", "Conflict resolution", "Prioritization", "Self-awareness"],
    adjacent: ["Any role — choose a target function", "Internship", "Graduate program"],
    keywords: ["general", "behavioral", "internship", "graduate"],
  },
];

export const ROLE_LABELS = ROLES.map((role) => role.label);

export const LEVELS = ["Student / Intern", "Entry level", "Mid level", "Senior"];

export const INTERVIEW_TYPES = ["Mixed", "Behavioral", "Technical", "System design"];

export const DIFFICULTIES = ["Warm-up", "Standard", "Stretch"];

export function roleById(idOrLabel?: string): RoleProfile {
  if (!idOrLabel) return ROLES[ROLES.length - 1];
  const needle = idOrLabel.toLowerCase();
  return (
    ROLES.find((role) => role.id === needle || role.label.toLowerCase() === needle) ??
    ROLES.find((role) => needle.includes(role.label.toLowerCase().replace(" engineer", ""))) ??
    ROLES[ROLES.length - 1]
  );
}

export function detectRole(text: string): RoleProfile | null {
  const lower = text.toLowerCase();
  const ranked = ROLES.filter((role) => role.id !== "general")
    .map((role) => {
      let score = 0;
      if (lower.includes(role.label.toLowerCase())) score += 6;
      for (const keyword of role.keywords) {
        if (lower.includes(keyword)) score += keyword.includes(" ") ? 3 : 2;
      }
      return { role, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.role ?? null;
}

export const ALL_SKILLS: string[] = Array.from(
  new Set(ROLES.flatMap((role) => role.skills)),
).sort((a, b) => a.localeCompare(b));

const SKILL_ALIASES: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  reactjs: "React",
  react: "React",
  nextjs: "Next.js",
  "next.js": "Next.js",
  node: "Node.js",
  nodejs: "Node.js",
  python: "Python",
  sql: "SQL",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mongo: "MongoDB",
  mongodb: "MongoDB",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  figma: "Figma",
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  pandas: "Pandas",
  numpy: "NumPy",
  tailwind: "Tailwind CSS",
  accessibility: "Accessibility",
  a11y: "Accessibility",
  seo: "SEO",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  terraform: "Terraform",
};

export function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    if (new RegExp(`(^|[^a-z0-9])${alias.replace(/[.+]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(lower)) {
      found.add(canonical);
    }
  }
  for (const skill of ALL_SKILLS) {
    if (lower.includes(skill.toLowerCase())) found.add(skill);
  }
  return Array.from(found);
}
