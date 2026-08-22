#!/usr/bin/env node
import crypto from "node:crypto";
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_ROOT = path.join(ROOT, "skills");
const CACHE_DIR = path.join(ROOT, ".engineer-flow");
const CACHE_FILE = path.join(CACHE_DIR, "registry.json");
const MAX_SPECIALISTS = 2;
const EXTERNAL_EVIDENCE_GATE_POLICY = "external-evidence-gate";
const FAMILY_CANDIDATE_ISOLATION_POLICY = "family-candidate-isolation";
const PRIMARY_FAMILY_EVIDENCE_POLICY = "primary-family-evidence";
const GENERIC_PRIMARY_FAMILY_EVIDENCE_POLICY = "generic-primary-family-evidence";
const ACTION_OBJECT_PRIMARY_FAMILY_POLICY = "action-object-primary-family";
const IDENTITY_RANKED_PRIMARY_SKILL_POLICY = "identity-ranked-primary-skill";
const NEED_EVIDENCE_GATE_POLICY = "need-evidence-gate";

const FAMILY_KEYWORDS = {
  debugging: ["debug", "bug", "error", "failure", "stack trace", "exception", "crash", "failing"],
  testing: ["test", "tests", "testing", "assert", "regression", "unit", "integration", "e2e", "pytest", "jest"],
  security: ["security", "auth", "authorization", "permission", "csrf", "xss", "injection", "secret", "oauth"],
  architecture: ["architecture", "boundary", "module", "design", "interface", "adapter", "service", "dependency"],
  database: ["database", "query", "sql", "postgres", "mysql", "schema", "migration", "transaction", "n+1", "index"],
  performance: ["performance", "optimize", "slow", "latency", "cache", "memory", "throughput", "n+1", "bottleneck"],
  "api-integration": ["api", "http", "endpoint", "webhook", "client", "retry", "pagination", "oauth", "integration"],
  "frontend-ui": ["frontend", "ui", "component", "css", "html", "browser", "responsive", "flutter", "react", "view"],
  "infrastructure-devops": ["deploy", "ci", "docker", "kubernetes", "queue", "cloud", "server", "pipeline", "env"],
  "data-processing": ["data", "etl", "csv", "jsonl", "batch", "stream", "transform", "dataset", "chunk"],
  "code-quality-refactoring": ["refactor", "cleanup", "complexity", "rename", "duplicate", "lint", "quality"],
  "planning-execution": ["plan", "roadmap", "sequence", "steps", "proposal", "execution"],
  documentation: ["docs", "documentation", "readme", "release notes", "runbook", "guide"],
  "dependency-tooling": ["dependency", "package", "upgrade", "npm", "composer", "pip", "cargo", "tooling", "build"],
  "ai-llm-engineering": ["llm", "ai", "agent", "prompt", "eval", "embedding", "model", "routing", "tool calling"],
  "version-control-review": ["git", "commit", "pr", "pull request", "review", "diff", "merge", "branch"]
};

const FALLBACK_BY_FAMILY = {
  debugging: "debugging",
  testing: "testing",
  security: "security",
  architecture: "architecture",
  database: "database",
  performance: "performance",
  "api-integration": "api-integration",
  "frontend-ui": "frontend-ui",
  "infrastructure-devops": "infrastructure-devops",
  "data-processing": "data-processing",
  "code-quality-refactoring": "refactoring",
  "planning-execution": "planning",
  documentation: "documentation",
  "dependency-tooling": "dependency-tooling",
  "ai-llm-engineering": "ai-llm-engineering",
  "version-control-review": "code-review"
};

const SUPPORT_COMPATIBILITY = {
  debugging: ["testing", "code-quality-refactoring", "security"],
  testing: ["debugging", "database", "api-integration", "security"],
  security: ["testing", "api-integration", "infrastructure-devops"],
  architecture: ["testing", "security", "database", "api-integration"],
  database: ["performance", "testing", "security", "data-processing"],
  performance: ["database", "testing", "infrastructure-devops"],
  "api-integration": ["testing", "security", "performance"],
  "frontend-ui": ["testing", "security", "api-integration"],
  "infrastructure-devops": ["security", "testing", "performance"],
  "data-processing": ["database", "testing", "performance"],
  "code-quality-refactoring": ["testing", "architecture"],
  "planning-execution": ["documentation", "architecture"],
  documentation: ["code-quality-refactoring"],
  "dependency-tooling": ["testing", "security", "infrastructure-devops"],
  "ai-llm-engineering": ["testing", "data-processing", "api-integration"],
  "version-control-review": ["testing", "security", "code-quality-refactoring"]
};

const ACTION_OBJECT_FAMILY_MODEL = {
  debugging: {
    actions: /\b(trace|diagnose|debug|investigate|find|fix|resolve|repair)\b/,
    objects: /\b(error|exception|failure|failing|crash|stuck|bug|stack trace|root cause|missing context|lost context|lost state|not reset|null)\b/,
    modifiers: /\b(intermittent|where|why|after)\b/
  },
  testing: {
    actions: /\b(add|write|create|cover|assert|prove|exercise)\b/,
    objects: /\b(test|tests|testing|coverage|spec|checks|regression test|regression suite|negative cases|test suite)\b/,
    modifiers: /\b(proves|lock|focused)\b/
  },
  security: {
    actions: /\b(review|audit|check|secure|harden)\b/,
    objects: /\b(auth|authentication|authorization|permission|token|issuer|credential|secret|access|bypass|risk|signature|csrf|injection|mass-assignment)\b/,
    modifiers: /\b(cannot|reject|wrong|leak|boundary|posture)\b/
  },
  architecture: {
    actions: /\b(design|introduce|split|decouple|isolate|wrap)\b/,
    objects: /\b(boundary|interface|adapter|ports|domain layer|data layer|presentation layer|service boundary|module|decision record)\b/,
    modifiers: /\b(without changing|vendor|third-party)\b/
  },
  database: {
    actions: /\b(design|sketch|optimize|alter|populate)\b/,
    objects: /\b(schema|migration|transaction|index|query|queries|table|tables|row|rows|column|read model|time-window|live writes|cutover)\b/,
    modifiers: /\b(small chunks|duplicate|per-row|nullable)\b/
  },
  performance: {
    actions: /\b(profile|optimize|reduce|measure|speed up|improve|diagnose)\b/,
    objects: /\b(slow|slowest|latency|cache|caching|throughput|bottleneck|stampede|warmup|p95|re-render|memoization)\b/,
    modifiers: /\b(heavy|around|path)\b/
  },
  "api-integration": {
    actions: /\b(add|build|implement|create|integrate|connect|handle)\b/,
    objects: /\b(api|endpoint|webhook|client|callback handler|callback route|mutation|rate limiting|retry|retries|request\/response|receiver)\b/,
    modifiers: /\b(compatibility|unchanged|handler)\b/
  },
  "frontend-ui": {
    actions: /\b(fix|repair|improve|adjust|render|wrap|verify|inspect)\b/,
    objects: /\b(layout|modal|component|form|field|button|sidebar|footer|menu|keyboard|focus|ui|screen|mobile|overlap|off-screen|accessibility)\b/,
    modifiers: /\b(sticky|browser|submit)\b/
  },
  "infrastructure-devops": {
    actions: /\b(add|configure|deploy|publish|run|reduce|clean|consolidate|set up|upload)\b/,
    objects: /\b(workflow|ci|container|deployment|pipeline|health-check|worker queue|environment variables|artifact|upload step|model card|tokenizer files)\b/,
    modifiers: /\b(background|entrypoint|release)\b/
  },
  "data-processing": {
    actions: /\b(export|process|transform|parse|chunk|stream|normalize|build|validate)\b/,
    objects: /\b(dataset|data|batch|pipeline|records|events|manifest|schema|export|metadata|file|files|training)\b/,
    modifiers: /\b(generated|normalized)\b/
  },
  "code-quality-refactoring": {
    actions: /\b(refactor|extract|replace|simplify|deduplicate|cleanup|tighten)\b/,
    objects: /\b(duplicated|workflow branch|nested|mapping|method|validation|persistence|response formatting|status code|legacy behavior)\b/,
    modifiers: /\b(without broad|without changing|same)\b/
  },
  "planning-execution": {
    actions: /\b(plan|propose|break|write|draft|capture)\b/,
    objects: /\b(steps|task list|roadmap|rollout|rollback|checklist|migration plan|upgrade checklist|implementation|verification steps)\b/,
    modifiers: /\b(phased|ordered|release night|support can follow)\b/
  },
  documentation: {
    actions: /\b(write|update|draft|document|add)\b/,
    objects: /\b(readme|docs|documentation|guide|runbook|release notes|setup notes|notes)\b/,
    modifiers: /\b(without changing code)\b/
  },
  "dependency-tooling": {
    actions: /\b(upgrade|install|remove|trim|review)\b/,
    objects: /\b(package|dependency|provider|sdk|config file discovery|explicit registration|build|tooling|bootstrap changes)\b/,
    modifiers: /\b(moved from|setup)\b/
  },
  "ai-llm-engineering": {
    actions: /\b(design|integrate|prepare|build|evaluate|compare|tune)\b/,
    objects: /\b(evaluation dataset|frozen prompts|expected outputs|ai sdk|llm|agent|prompt|model|fine-tuning|training config|embedding)\b/,
    modifiers: /\b(request\/response|experiment|small)\b/
  },
  "version-control-review": {
    actions: /\b(address|review|merge|rebase|commit)\b/,
    objects: /\b(review comments|pull request|diff|branch|version control|pr)\b/,
    modifiers: /\b(without broad)\b/
  }
};

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const [command, ...argv] = process.argv.slice(2);
  const args = parseArgs(argv);
  if (!command || command === "help" || args.help) return printHelp();
  if (command === "discover") return commandDiscover(args);
  if (command === "route") return commandRoute(args);
  if (command === "refresh") return commandRefresh(args);
  if (command === "status") return commandStatus(args);
  if (command === "self-test") return commandSelfTest();
  throw new Error(`unknown command "${command}"`);
}

function printHelp() {
  console.log(`Engineer Flow

Commands:
  engineer-flow discover [--cwd <project>] [--skill-root <path>] [--json]
  engineer-flow route "<task>" [--cwd <project>] [--skill-root <path>] [--policy external-evidence-gate|family-candidate-isolation|primary-family-evidence|generic-primary-family-evidence|action-object-primary-family|identity-ranked-primary-skill|need-evidence-gate] [--external-evidence-margin <n>] [--json]
  engineer-flow refresh [--cwd <project>] [--skill-root <path>]
  engineer-flow status
  engineer-flow self-test`);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

async function commandDiscover(args) {
  const registry = await discover(args);
  await writeCache(registry);
  if (args.json) console.log(JSON.stringify(registry, null, 2));
  else {
    console.log(`SKILLS_DISCOVERED=${registry.skills.length}`);
    console.log(`SOURCES=${registry.sources.length}`);
    console.log(`CACHE=${CACHE_FILE}`);
  }
}

async function commandRefresh(args) {
  const registry = await discover(args);
  await writeCache(registry);
  console.log(`REGISTRY_REFRESHED=YES`);
  console.log(`SKILLS_DISCOVERED=${registry.skills.length}`);
  console.log(`CACHE=${CACHE_FILE}`);
}

async function commandStatus() {
  const cached = await readCache().catch(() => null);
  const skillCount = cached?.skills?.length || 0;
  console.log(JSON.stringify({
    root: ROOT,
    cache: CACHE_FILE,
    cache_exists: Boolean(cached),
    cached_skills: skillCount,
    bundled_skills: (await listSkillDirs(SKILLS_ROOT)).length,
    max_specialists: MAX_SPECIALISTS
  }, null, 2));
}

async function commandRoute(args) {
  const task = args._.join(" ").trim();
  if (!task) throw new Error("route requires a task string");
  const registry = await discover(args);
  const result = routeTask({
    task,
    cwd: path.resolve(String(args.cwd || process.cwd())),
    registry,
    explicit: parseCsv(args.skill),
    routingPolicy: parseRoutingPolicy(args)
  });
  validateRoute(result);
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else console.log(JSON.stringify(result, null, 2));
}

function parseRoutingPolicy(args) {
  if (![EXTERNAL_EVIDENCE_GATE_POLICY, FAMILY_CANDIDATE_ISOLATION_POLICY, PRIMARY_FAMILY_EVIDENCE_POLICY, GENERIC_PRIMARY_FAMILY_EVIDENCE_POLICY, ACTION_OBJECT_PRIMARY_FAMILY_POLICY, IDENTITY_RANKED_PRIMARY_SKILL_POLICY, NEED_EVIDENCE_GATE_POLICY].includes(args.policy)) return { name: "default" };
  const margin = Number(args["external-evidence-margin"] ?? 0.05);
  return {
    name: args.policy,
    externalEvidenceMargin: Number.isFinite(margin) ? Math.max(0, margin) : 0.05
  };
}

async function discover(args = {}) {
  const cwd = path.resolve(String(args.cwd || process.cwd()));
  const roots = await discoveryRoots(cwd, args);
  const diagnostics = [];
  const skills = [];
  for (const source of roots) {
    const discovered = await readSkillsFromRoot(source).catch((error) => {
      diagnostics.push({ source: source.root, warning: error.message });
      return [];
    });
    skills.push(...discovered);
  }
  const normalized = normalizeDuplicates(skills);
  return {
    generated_at: new Date().toISOString(),
    version: "0.1.0",
    cwd,
    sources: roots.map((item) => ({ root: item.root, source: item.source, scope: item.scope, priority: item.priority })),
    diagnostics,
    skills: normalized
  };
}

async function discoveryRoots(cwd, args) {
  const roots = [];
  const add = async (root, source, scope, priority) => {
    if (!root) return;
    const full = path.resolve(root);
    if (await exists(full)) roots.push({ root: full, source, scope, priority });
  };
  for (const item of parseCsv(args["skill-root"])) await add(item, "explicit", "explicit", 90);
  await add(path.join(cwd, "skills"), "project-local", "project", 100);
  await add(path.join(cwd, ".agents", "skills"), "project-local", "project", 100);
  await add(path.join(cwd, ".claude", "skills"), "project-local", "project", 100);
  if (!args.noGlobal && !args["no-global"]) {
    await add(path.join(os.homedir(), ".agents", "skills"), "installed", "global", 70);
    await add(path.join(os.homedir(), ".claude", "skills"), "installed", "global", 70);
  }
  await add(SKILLS_ROOT, "bundled", "bundled", 40);
  for (const root of await manifestSkillRoots(cwd)) await add(root.root, root.source, root.scope, root.priority);
  return uniqueRoots(roots);
}

async function manifestSkillRoots(cwd) {
  const roots = [];
  const candidates = [
    path.join(cwd, "agent-skills.json"),
    path.join(cwd, ".codex-plugin", "plugin.json"),
    path.join(cwd, ".claude-plugin", "plugin.json"),
    path.join(cwd, ".claude-plugin", "marketplace.json"),
    path.join(ROOT, "agent-skills.json"),
    path.join(ROOT, ".codex-plugin", "plugin.json")
  ];
  for (const file of candidates) {
    if (!await exists(file)) continue;
    const dir = path.dirname(file);
    const json = await readJson(file).catch(() => null);
    if (!json) continue;
    if (json.skillsPath) roots.push({ root: path.resolve(dir, json.skillsPath), source: "manifest", scope: "manifest", priority: 65 });
    if (typeof json.skills === "string") roots.push({ root: path.resolve(dir, json.skills), source: "manifest", scope: "manifest", priority: 65 });
    if (Array.isArray(json.plugins)) {
      for (const plugin of json.plugins) {
        if (plugin.skillsPath) roots.push({ root: path.resolve(dir, plugin.skillsPath), source: "manifest", scope: "manifest", priority: 65 });
        if (Array.isArray(plugin.skills)) {
          for (const skillPath of plugin.skills) {
            if (typeof skillPath === "string") roots.push({ root: path.resolve(dir, skillPath, ".."), source: "manifest", scope: "manifest", priority: 65 });
          }
        }
      }
    }
  }
  return roots;
}

function uniqueRoots(roots) {
  const seen = new Set();
  const out = [];
  for (const root of roots) {
    const key = root.root.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(root);
  }
  return out;
}

async function readSkillsFromRoot(source) {
  const entries = await fs.readdir(source.root, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillDir = path.join(source.root, entry.name);
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!await exists(skillFile)) continue;
    const text = await fs.readFile(skillFile, "utf8").catch(() => "");
    const parsed = parseSkill(text);
    if (!parsed.name || !parsed.description) continue;
    skills.push(normalizeSkill({ ...source, path: skillFile, folder: entry.name, ...parsed }));
  }
  return skills;
}

function parseSkill(text) {
  const frontmatter = String(text || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return {};
  const name = (frontmatter[1].match(/^name:\s*(.+)$/m)?.[1] || "").replace(/^["']|["']$/g, "").trim();
  const description = (frontmatter[1].match(/^description:\s*(.+)$/m)?.[1] || "").replace(/^["']|["']$/g, "").trim();
  const tags = [];
  const inline = frontmatter[1].match(/^tags:\s*\[(.*?)\]/m);
  if (inline) tags.push(...inline[1].split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")));
  const block = frontmatter[1].match(/^tags:\s*\r?\n((?:\s*-\s*.+\r?\n?)+)/m);
  if (block) tags.push(...block[1].split(/\r?\n/).map((line) => line.match(/^\s*-\s*(.+)$/)?.[1]).filter(Boolean));
  return { name, description, tags: tags.map((tag) => tag.toLowerCase()) };
}

function normalizeSkill(raw) {
  const text = `${raw.name} ${raw.description} ${(raw.tags || []).join(" ")}`.toLowerCase();
  const frameworks = detectFrameworks(text);
  const family = inferSkillFamily(raw.name, raw.description, raw.tags);
  const infrastructure = /\b(memory|mcp|orchestrator|entrypoint|standards|runner-selection|daily-workflow)\b/.test(text) ||
    ["engineer-flow", "memory-management", "using-laravel-standards", "laravel-specialist"].includes(raw.name);
  const meta = infrastructure || /\b(prompt|context|planning|workflow)\b/.test(text) && /skill|agent|prompt|context/.test(text);
  const installedSpecific = raw.source !== "bundled" && (frameworks.length > 0 || !["other", "code-quality-refactoring"].includes(family));
  let priority = raw.priority || 50;
  if (raw.source === "project-local") priority = 100;
  else if (raw.source === "explicit") priority = 90;
  else if (raw.source === "bundled") priority = 40;
  else if (installedSpecific) priority = 70;
  else priority = 60;
  return {
    name: raw.name,
    description: raw.description,
    path: raw.path,
    source: raw.source,
    scope: raw.scope,
    family,
    tags: raw.tags || [],
    languages: detectLanguages(text),
    frameworks,
    domains: [family],
    infrastructure,
    meta,
    primaryEligible: !infrastructure,
    supportEligible: !infrastructure,
    priority,
    hash: crypto.createHash("sha256").update(`${raw.path}:${raw.description}`).digest("hex").slice(0, 12)
  };
}

function normalizeDuplicates(skills) {
  const byName = new Map();
  for (const skill of skills) {
    const existing = byName.get(skill.name);
    if (!existing || skill.priority > existing.priority) {
      const next = { ...skill };
      if (existing?.source === "bundled" && isFallbackSkill(existing)) next.bundledFallbackShadow = shadowSkill(existing);
      byName.set(skill.name, next);
    } else if (skill.source === "bundled" && isFallbackSkill(skill)) {
      existing.bundledFallbackShadow = shadowSkill(skill);
    }
  }
  return [...byName.values()].sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
}

function isFallbackSkill(skill) {
  return Object.values(FALLBACK_BY_FAMILY).includes(skill.name);
}

function shadowSkill(skill) {
  return {
    name: skill.name,
    description: skill.description,
    path: skill.path,
    source: skill.source,
    scope: skill.scope,
    family: skill.family,
    tags: skill.tags,
    languages: skill.languages,
    frameworks: skill.frameworks,
    domains: skill.domains,
    infrastructure: skill.infrastructure,
    meta: skill.meta,
    primaryEligible: skill.primaryEligible,
    supportEligible: skill.supportEligible,
    priority: skill.priority,
    hash: skill.hash
  };
}

function detectFrameworks(text) {
  const pairs = {
    laravel: ["laravel", "eloquent", "blade", "livewire", "horizon", "artisan", "php"],
    flutter: ["flutter", "dart", "bloc", "riverpod", "widget"],
    react: ["react", "next.js", "nextjs", "jsx"],
    vue: ["vue", "nuxt"],
    python: ["python", "django", "flask", "pytest"],
    node: ["node", "npm", "typescript", "javascript", "express"],
    go: ["golang", "go.mod"],
    rust: ["rust", "cargo"],
    odoo: ["odoo", "qweb"]
  };
  return Object.entries(pairs).filter(([, terms]) => terms.some((term) => text.includes(term))).map(([name]) => name);
}

function detectLanguages(text) {
  const pairs = {
    php: ["php", "laravel"],
    dart: ["dart", "flutter"],
    python: ["python"],
    javascript: ["javascript", "typescript", "node", "react", "vue"],
    go: ["golang", "go.mod"],
    rust: ["rust", "cargo"],
    sql: ["sql", "database", "query"]
  };
  return Object.entries(pairs).filter(([, terms]) => terms.some((term) => text.includes(term))).map(([name]) => name);
}

function inferSkillFamily(name, description, tags = []) {
  const text = `${name} ${description} ${tags.join(" ")}`.toLowerCase();
  const scores = familyScores(text);
  const top = scores[0];
  return top && top.score > 0 ? top.family : "other";
}

function routeTask({ task, cwd, registry, explicit = [], routingPolicy = { name: "default" } }) {
  const project = detectProject(cwd);
  const taskText = `${task} ${project.frameworks.join(" ")} ${project.languages.join(" ")}`.toLowerCase();
  const scores = familyScores(taskText);
  const top = scores[0] || { family: "other", score: 0 };
  const second = scores[1] || { family: "other", score: 0 };
  const primaryFamilySelection = selectPrimaryFamily({ taskText, scores, routingPolicy });
  const selectedFamily = primaryFamilySelection.selected || top;
  const genericSufficiency = clamp(genericScore(taskText));
  const risk = clamp(riskScore(taskText));
  const knowledgeNeed = clamp((top.score / 8) + risk * 0.25 + (genericSufficiency < 0.5 ? 0.2 : 0));
  const specialistMarginalValue = clamp(knowledgeNeed * (1 - genericSufficiency) + Math.min(0.25, top.score / 20));
  const crossCutting = clamp(crossSignal(taskText, scores));
  const confidence = clamp(top.score > 0 ? 0.48 + Math.min(0.35, top.score / 20) + Math.min(0.12, Math.max(0, top.score - second.score) / 10) : 0.2);
  const family = selectedFamily.score > 0 ? selectedFamily.family : "other";
  if (memoryOnlyTask(taskText)) {
    const result = {
      task_family: "memory-infrastructure",
      task_subtype: "preflight",
      knowledge_need: 0.2,
      confidence: 0.85,
      risk: round(risk),
      generic_sufficiency: 0.9,
      cross_cutting_signal: 0,
      specialist_marginal_value: 0,
      need_evidence: null,
      mode: 0,
      primary: null,
      support: null,
      specialist_count: 0,
      project_context: project,
      diagnostics: {
        top_families: scores.slice(0, 4),
        max_specialists: MAX_SPECIALISTS,
        memory_infrastructure: "excluded from specialist slots"
      }
    };
    validateRoute(result);
    return result;
  }
  const primarySelection = choosePrimary({
    registry,
    family,
    taskText,
    project,
    explicit,
    routingPolicy: downstreamRoutingPolicy(routingPolicy),
    familyAmbiguous: top.score > 0 && top.score === second.score
  });
  const primary = primarySelection.skill;
  const needEvidence = routingPolicy?.name === NEED_EVIDENCE_GATE_POLICY ? needEvidenceScore(taskText, family) : null;
  let mode = 0;
  let selectedPrimary = null;
  const needEvidencePass = needEvidence === null || needEvidence >= 0.4;
  if (primary && knowledgeNeed >= 0.35 && confidence >= 0.4 && genericSufficiency < 0.82 && needEvidencePass) {
    mode = 1;
    selectedPrimary = primary;
  }
  const support = mode === 1 && crossCutting >= 0.55
    ? chooseSupport({ registry, primary: selectedPrimary, family, taskText, project })
    : null;
  if (support) mode = 2;
  const result = {
    task_family: family,
    task_subtype: subtype(family, taskText),
    knowledge_need: round(knowledgeNeed),
    confidence: round(confidence),
    risk: round(risk),
    generic_sufficiency: round(genericSufficiency),
    cross_cutting_signal: round(crossCutting),
    specialist_marginal_value: round(specialistMarginalValue),
    need_evidence: round(needEvidence),
    mode,
    primary: selectedPrimary ? publicSkill(selectedPrimary) : null,
    support: support ? publicSkill(support) : null,
    specialist_count: [selectedPrimary, support].filter(Boolean).length,
    project_context: project,
    diagnostics: {
      top_families: scores.slice(0, 4),
      max_specialists: MAX_SPECIALISTS,
      ...(primaryFamilySelection.diagnostics ? { primary_family_selection: primaryFamilySelection.diagnostics } : {}),
      ...(primarySelection.diagnostics ? { primary_selection: primarySelection.diagnostics } : {})
    }
  };
  if (result.specialist_count > MAX_SPECIALISTS) throw new Error("hard cap exceeded");
  return result;
}

function familyScores(text) {
  return Object.entries(FAMILY_KEYWORDS).map(([family, terms]) => ({
    family,
    score: terms.reduce((sum, term) => sum + (text.includes(term) ? (term.includes(" ") ? 2 : 1) : 0), 0)
  })).sort((a, b) => b.score - a.score || a.family.localeCompare(b.family));
}

function selectPrimaryFamily({ taskText, scores, routingPolicy }) {
  if (routingPolicy?.name === IDENTITY_RANKED_PRIMARY_SKILL_POLICY) {
    return selectActionObjectPrimaryFamily({ taskText, scores, policyName: IDENTITY_RANKED_PRIMARY_SKILL_POLICY });
  }
  if (routingPolicy?.name === ACTION_OBJECT_PRIMARY_FAMILY_POLICY) {
    return selectActionObjectPrimaryFamily({ taskText, scores });
  }
  if (routingPolicy?.name === NEED_EVIDENCE_GATE_POLICY) {
    return selectActionObjectPrimaryFamily({ taskText, scores });
  }
  if (routingPolicy?.name === GENERIC_PRIMARY_FAMILY_EVIDENCE_POLICY) {
    return selectGenericPrimaryFamily({ taskText, scores });
  }
  if (routingPolicy?.name !== PRIMARY_FAMILY_EVIDENCE_POLICY) return { selected: scores[0] || null, diagnostics: null };
  const evidenceRows = familyEvidenceScores(taskText, scores);
  const selected = evidenceRows[0] || scores[0] || null;
  const baseTop = scores[0] || { family: "other", score: 0 };
  const second = evidenceRows[1] || null;
  const margin = selected && second ? Number((selected.final_score - second.final_score).toFixed(3)) : null;
  const weak = selected && selected.final_score <= 0;
  const tied = margin === 0;
  const conservative = weak || tied;
  const finalSelected = conservative ? baseTop : { family: selected.family, score: selected.final_score };
  return {
    selected: finalSelected,
    diagnostics: {
      policy: PRIMARY_FAMILY_EVIDENCE_POLICY,
      base_selected_family: baseTop.family,
      selected_family: finalSelected.family,
      selected_by: conservative ? "base_family_preserved" : "primary_family_evidence",
      conservative_reason: weak ? "weak_evidence" : tied ? "ambiguous_tie" : null,
      margin,
      candidates: evidenceRows.slice(0, 8)
    }
  };
}

function selectGenericPrimaryFamily({ taskText, scores }) {
  const evidenceRows = genericFamilyEvidenceScores(taskText);
  const selected = evidenceRows[0] || null;
  const second = evidenceRows[1] || null;
  const margin = selected && second ? Number((selected.final_score - second.final_score).toFixed(3)) : null;
  const weak = !selected || selected.final_score <= 0;
  const tied = margin === 0;
  const conservative = weak || tied;
  const finalSelected = conservative ? { family: "other", score: 0 } : { family: selected.family, score: selected.final_score };
  const baseTop = scores[0] || { family: "other", score: 0 };
  return {
    selected: finalSelected,
    diagnostics: {
      policy: GENERIC_PRIMARY_FAMILY_EVIDENCE_POLICY,
      base_selected_family: baseTop.family,
      selected_family: finalSelected.family,
      selected_by: conservative ? "generic_evidence_insufficient" : "generic_task_intent_evidence",
      conservative_reason: weak ? "weak_evidence" : tied ? "ambiguous_tie" : null,
      margin,
      candidates: evidenceRows.slice(0, 8)
    }
  };
}

function selectActionObjectPrimaryFamily({ taskText, scores, policyName = ACTION_OBJECT_PRIMARY_FAMILY_POLICY }) {
  const evidenceRows = actionObjectFamilyScores(taskText);
  const selected = evidenceRows[0] || null;
  const second = evidenceRows[1] || null;
  const margin = selected && second ? Number((selected.final_score - second.final_score).toFixed(3)) : null;
  const weak = !selected || selected.final_score <= 0;
  const tied = margin === 0;
  const conservative = weak || tied;
  const finalSelected = conservative ? { family: "other", score: 0 } : { family: selected.family, score: selected.final_score };
  const baseTop = scores[0] || { family: "other", score: 0 };
  return {
    selected: finalSelected,
    diagnostics: {
      policy: ACTION_OBJECT_PRIMARY_FAMILY_POLICY,
      family_policy: ACTION_OBJECT_PRIMARY_FAMILY_POLICY,
      requested_policy: policyName,
      base_selected_family: baseTop.family,
      selected_family: finalSelected.family,
      selected_by: conservative ? "action_object_evidence_insufficient" : "generic_action_object_intent",
      conservative_reason: weak ? "weak_evidence" : tied ? "ambiguous_tie" : null,
      margin,
      candidates: evidenceRows.slice(0, 8)
    }
  };
}

function actionObjectFamilyScores(taskText) {
  const genericRowsByFamily = new Map(genericFamilyEvidenceScores(taskText).map((row) => [row.family, row]));
  const relationsByFamily = actionObjectRelations(taskText);
  return Object.keys(FAMILY_KEYWORDS).map((family) => {
    const generic = genericRowsByFamily.get(family) || {};
    const relation = relationsByFamily.get(family) || emptyActionObjectRelation();
    const evidenceStrength = Number((
      (generic.evidence_strength || 0) +
      relation.primary_action +
      relation.primary_object +
      relation.context_objects +
      relation.secondary_actions +
      relation.modifiers_purpose
    ).toFixed(3));
    return {
      family,
      base_score: 0,
      direct_intent_evidence: generic.direct_intent_evidence || 0,
      explicit_action_evidence: generic.explicit_action_evidence || 0,
      object_evidence: generic.object_evidence || 0,
      incidental_cross_cutting_evidence: generic.incidental_cross_cutting_evidence || 0,
      primary_action: relation.primary_action,
      primary_object: relation.primary_object,
      context_objects: relation.context_objects,
      secondary_actions: relation.secondary_actions,
      modifiers_purpose: relation.modifiers_purpose,
      evidence_strength: evidenceStrength,
      final_score: evidenceStrength,
      reasons: [...(generic.reasons || []), ...relation.reasons]
    };
  }).sort((a, b) => b.final_score - a.final_score || b.primary_action - a.primary_action || b.primary_object - a.primary_object || a.family.localeCompare(b.family));
}

function actionObjectRelations(taskText) {
  const normalized = taskText.toLowerCase();
  const clauses = splitIntentClauses(normalized);
  const firstClause = clauses[0] || normalized;
  const firstActionIndex = firstIntentActionIndex(normalized);
  const relations = new Map(Object.keys(FAMILY_KEYWORDS).map((family) => [family, emptyActionObjectRelation()]));
  for (const [family, model] of Object.entries(ACTION_OBJECT_FAMILY_MODEL)) {
    const relation = relations.get(family);
    const primaryAction = model.actions.test(firstClause) || (firstActionIndex >= 0 && model.actions.test(normalized.slice(firstActionIndex, firstActionIndex + 96)));
    const primaryObject = model.objects.test(firstClause);
    const contextObject = clauses.slice(1).some((clause) => model.objects.test(clause));
    const secondaryAction = clauses.slice(1).some((clause) => model.actions.test(clause));
    const modifier = model.modifiers.test(normalized);

    if (primaryAction) addActionObjectEvidence(relation, "primary_action", 3.5, `PRIMARY_ACTION:${family}`);
    if (primaryObject) addActionObjectEvidence(relation, "primary_object", 2.5, `PRIMARY_OBJECT:${family}`);
    if (primaryAction && primaryObject) addActionObjectEvidence(relation, "primary_object", 1.5, `ACTION_OBJECT_RELATION:${family}`);
    if (contextObject) addActionObjectEvidence(relation, "context_objects", 0.75, `CONTEXT_OBJECTS:${family}`);
    if (secondaryAction) addActionObjectEvidence(relation, "secondary_actions", -1.25, `SECONDARY_ACTIONS:${family}`);
    if (modifier) addActionObjectEvidence(relation, "modifiers_purpose", 0.75, `MODIFIERS_PURPOSE:${family}`);
  }
  applyPrimaryActionPrecedence(relations);
  return relations;
}

function splitIntentClauses(text) {
  return text
    .split(/\b(?:and|then|also|plus|while|with|include|including|before|after|but)\b|[.;]/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function firstIntentActionIndex(text) {
  const indexes = Object.values(ACTION_OBJECT_FAMILY_MODEL)
    .map((model) => text.search(model.actions))
    .filter((index) => index >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

function applyPrimaryActionPrecedence(relations) {
  const primaryFamilies = [...relations.entries()]
    .filter(([, relation]) => relation.primary_action > 0 && relation.primary_object > 0)
    .map(([family]) => family);
  if (primaryFamilies.length !== 1) return;
  const primary = primaryFamilies[0];
  for (const [family, relation] of relations.entries()) {
    if (family === primary) {
      addActionObjectEvidence(relation, "modifiers_purpose", 1, `PRIMARY_RELATION_PRECEDENCE:${family}`);
    } else if (relation.context_objects > 0 || relation.secondary_actions < 0) {
      addActionObjectEvidence(relation, "context_objects", -1, `PRIMARY_RELATION_PRECEDENCE:${primary}`);
    }
  }
}

function emptyActionObjectRelation() {
  return {
    primary_action: 0,
    primary_object: 0,
    context_objects: 0,
    secondary_actions: 0,
    modifiers_purpose: 0,
    reasons: []
  };
}

function addActionObjectEvidence(relation, field, score, reason) {
  relation[field] = Number((relation[field] + score).toFixed(3));
  relation.reasons.push(reason);
}

function genericFamilyEvidenceScores(taskText) {
  return Object.keys(FAMILY_KEYWORDS).map((family) => {
    const evidence = genericFamilyEvidence(family, taskText);
    const evidenceStrength = evidence.direct_intent + evidence.explicit_action + evidence.object_evidence - evidence.incidental;
    return {
      family,
      base_score: 0,
      direct_intent_evidence: evidence.direct_intent,
      explicit_action_evidence: evidence.explicit_action,
      object_evidence: evidence.object_evidence,
      incidental_cross_cutting_evidence: evidence.incidental,
      evidence_strength: evidenceStrength,
      final_score: Number(evidenceStrength.toFixed(3)),
      reasons: evidence.reasons
    };
  }).sort((a, b) => b.final_score - a.final_score || b.evidence_strength - a.evidence_strength || a.family.localeCompare(b.family));
}

function genericFamilyEvidence(family, text) {
  const lower = text.toLowerCase();
  const evidence = { direct_intent: 0, explicit_action: 0, object_evidence: 0, incidental: 0, reasons: [] };
  const add = (field, score, reason) => {
    evidence[field] += score;
    evidence.reasons.push(reason);
  };
  const has = (pattern) => pattern.test(lower);
  const hasFailure = has(/\b(error|exception|failure|failing|crash|returns 500|500|bug|missing validation|runtime fault)\b/);
  if (family === "debugging") {
    if (has(/\b(trace|diagnose|debug|investigate)\b/)) add("explicit_action", 4, "debug_action");
    if (has(/\b(fix|resolve|repair)\b/) && hasFailure) add("direct_intent", 5, "fix_failure_intent");
    if (has(/\b(raises an exception|returns 500|stack trace|runtime error|runtime fault)\b/)) add("object_evidence", 3, "failure_object");
  }
  if (family === "testing") {
    if (has(/^\s*(add|write|create)\s+(?:[a-z0-9+#._-]+\s+){0,3}(test|tests|testing)\b/)) add("explicit_action", 5, "test_creation_action");
    if (has(/\b(component tests|unit tests|integration tests|end-to-end tests|regression tests|test suite|test coverage)\b/)) add("object_evidence", 2, "test_object");
    if (!has(/^\s*(add|write|create)\s+(?:[a-z0-9+#._-]+\s+){0,3}(test|tests|testing)\b/) && has(/\b(and|then|also)\b[^.]*\b(test|tests|testing)\b/)) add("incidental", 2, "secondary_test_concern");
  }
  if (family === "security") {
    if (has(/\b(review|audit|secure|harden)\b/) && has(/\b(auth|authentication|authorization|permission|secret|credential|token|signature|injection|leakage|bypass|access control)\b/)) add("direct_intent", 5, "security_review_intent");
    if (has(/\b(add|implement|build|create)\b/) && has(/\b(auth flow|authorization|token exchange|access control)\b/)) add("direct_intent", 5, "security_implementation_intent");
    if (has(/\b(auth flow|token exchange|credential|secret|signature|signatures|authentication|authorization|access control|injection|leakage|bypass)\b/)) add("object_evidence", 3, "security_object");
    if (has(/^\s*(add|write|create)\s+(?:[a-z0-9+#._-]+\s+){0,3}(test|tests|testing)\b/)) add("incidental", 4, "test_creation_as_primary_intent");
    if (!has(/\b(review|audit|secure|harden)\b/) && has(/\b(validates signatures|signature validation)\b/)) add("incidental", 1, "signature_as_supporting_detail");
  }
  if (family === "architecture") {
    if (has(/\b(introduce|design|split|decouple|isolate|refactor)\b/) && has(/\b(action class|boundary|interface|adapter|dependency inversion|dependency injection|module|service boundary|pattern)\b/)) add("direct_intent", 6, "architecture_boundary_intent");
    if (has(/\b(boundary|interface|adapter|dependency inversion|dependency injection|action class|pattern)\b/)) add("object_evidence", 2, "architecture_object");
  }
  if (family === "database") {
    if (has(/\b(schema|migration|transaction|index|indexes)\b/) && has(/\b(add|change|alter|create|fix)\b/)) add("direct_intent", 4, "database_change_intent");
    if (has(/\b(optimize)\b/) && has(/\b(query|join|joins|table|tables|row|rows|index|indexes)\b/)) add("direct_intent", 6, "query_optimization_intent");
    if (has(/\b(query|database|join|joins|table|tables|row|rows|index|indexes|schema|migration|transaction)\b/)) add("object_evidence", 3, "database_object");
    if (has(/\b(plan|task list|steps|rollout|profile|cache|caching)\b/)) add("incidental", 2, "database_as_supporting_detail");
  }
  if (family === "performance") {
    if (has(/\b(profile|optimize|reduce|speed up|improve latency|benchmark)\b/)) add("explicit_action", 5, "performance_action");
    if (has(/\b(slow|slowest|memoization|re-render|re-renders|caching|cache|latency|throughput|bottleneck)\b/)) add("object_evidence", 3, "performance_object");
  }
  if (family === "api-integration") {
    if (has(/\b(build|add|implement|create)\b/) && has(/\b(webhook|receiver|api|endpoint|client|retry|retries|token exchange|refresh endpoint)\b/)) add("direct_intent", 5, "api_build_intent");
    if (has(/\b(webhook|receiver|endpoint|api|http client|retry|retries|pagination|token exchange|refresh endpoint)\b/)) add("object_evidence", 2, "api_object");
    if (has(/\b(trace|diagnose|review|test|tests|security|auth|authentication|plan|steps)\b/)) add("incidental", 2, "api_as_context");
  }
  if (family === "frontend-ui") {
    if (has(/\b(fix|improve|adjust|render|wrap)\b/) && has(/\b(layout|modal|component|form|field|cell|card|screen-reader|keyboard|focus|dashboard|view)\b/)) add("direct_intent", hasFailure ? 2 : 5, "ui_repair_intent");
    if (has(/\b(layout|modal|component|form|field|cell|card|screen-reader|keyboard|focus|accessibility tree|dashboard|view)\b/)) add("object_evidence", hasFailure ? 1 : 2, "ui_object");
    if (hasFailure) add("incidental", 2, "failure_as_primary_intent");
    if (has(/\b(profile|memoization|re-render|re-renders|tests|testing)\b/)) add("incidental", 2, "ui_as_context");
  }
  if (family === "infrastructure-devops") {
    if (has(/\b(add|configure|deploy|publish|run|reduce|clean|consolidate)\b/) && has(/\b(workflow|ci|container|restart policy|health check|host|deployment|pipeline|build artifact)\b/)) add("direct_intent", 6, "infrastructure_action");
    if (has(/\b(workflow|ci|container|restart policy|health check|host|deployment|pipeline|build artifact)\b/)) add("object_evidence", 2, "infrastructure_object");
  }
  if (family === "data-processing") {
    if (has(/\b(process|transform|parse|chunk|stream|normalize)\b/) && has(/\b(data|dataset|batch|pipeline|events|table|records|transformation|file|files)\b/)) add("direct_intent", 4, "data_processing_action");
    if (has(/\b(dataset|batch|pipeline|transformation|records|events|file|files)\b/)) add("object_evidence", 2, "data_processing_object");
    if (has(/\b(profile|slow|slowest|layout|table)\b/)) add("incidental", 2, "data_as_context");
  }
  if (family === "code-quality-refactoring") {
    if (has(/\b(refactor|extract|replace|simplify|deduplicate|cleanup)\b/)) add("explicit_action", 5, "refactoring_action");
    if (has(/\b(duplicated|deeply nested|if-else|shared validator|strategy object map|serializer|validator|validation logic)\b/)) add("object_evidence", 3, "refactoring_object");
  }
  if (family === "planning-execution") {
    if (has(/\b(plan|propose|break)\b/) && has(/\b(steps|task list|roadmap|phased rollout|rollout|rollback|ordered implementation|verification steps)\b/)) add("direct_intent", 6, "planning_action");
    if (has(/\b(task list|steps|phased rollout|rollout|rollback|roadmap|verification steps|ordered implementation)\b/)) add("object_evidence", 2, "planning_object");
  }
  if (family === "documentation") {
    if (has(/\b(write|update|draft|document)\b/) && has(/\b(readme|docs|documentation|guide|runbook|release notes)\b/)) add("direct_intent", 5, "documentation_action");
  }
  if (family === "dependency-tooling") {
    if (has(/\b(upgrade|install|remove|trim)\b/) && has(/\b(package|dependency|tooling|build)\b/)) add("direct_intent", 5, "dependency_action");
  }
  if (family === "version-control-review") {
    if (has(/\b(review|merge|rebase|commit)\b/) && has(/\b(pull request|diff|branch|version control)\b/)) add("direct_intent", 5, "version_control_action");
  }
  if (family === "ai-llm-engineering") {
    if (has(/\b(eval|prompt|embedding|model|llm|agent|routing)\b/) && has(/\b(build|tune|evaluate|compare|implement)\b/)) add("direct_intent", 5, "ai_engineering_action");
  }
  return evidence;
}

function familyEvidenceScores(taskText, scores) {
  const baseByFamily = new Map(scores.map((item) => [item.family, item.score]));
  return Object.keys(FAMILY_KEYWORDS).map((family) => {
    const evidence = familyEvidence(family, taskText);
    const baseScore = baseByFamily.get(family) || 0;
    const evidenceAdjustment = evidence.direct_intent + evidence.explicit_action + evidence.object_evidence - evidence.incidental;
    return {
      family,
      base_score: baseScore,
      direct_intent_evidence: evidence.direct_intent,
      explicit_action_evidence: evidence.explicit_action,
      object_evidence: evidence.object_evidence,
      incidental_cross_cutting_evidence: evidence.incidental,
      evidence_strength: evidenceAdjustment,
      final_score: Number((baseScore + evidenceAdjustment).toFixed(3)),
      reasons: evidence.reasons
    };
  }).sort((a, b) => b.final_score - a.final_score || b.evidence_strength - a.evidence_strength || b.base_score - a.base_score || a.family.localeCompare(b.family));
}

function familyEvidence(family, text) {
  const lower = text.toLowerCase();
  const evidence = { direct_intent: 0, explicit_action: 0, object_evidence: 0, incidental: 0, reasons: [] };
  const add = (field, score, reason) => {
    evidence[field] += score;
    evidence.reasons.push(reason);
  };
  const has = (pattern) => pattern.test(lower);
  if (family === "debugging") {
    if (has(/\b(trace|diagnose|debug|investigate)\b/)) add("explicit_action", 4, "debug_action");
    if (has(/\b(fix|resolve|repair)\b/) && has(/\b(error|exception|failure|failing|crash|returns 500|500|bug|missing validation)\b/)) add("direct_intent", 4, "fix_failure_intent");
    if (has(/\b(raises an exception|returns 500|stack trace|runtime error)\b/)) add("object_evidence", 3, "failure_object");
  }
  if (family === "testing") {
    if (has(/^\s*(add|write|create)\s+(?:[a-z0-9+#._-]+\s+){0,3}(test|tests|testing)\b/)) add("explicit_action", 5, "test_creation_action");
    if (has(/\b(component tests|unit tests|integration tests|e2e tests|regression tests|pytest|jest|phpunit)\b/)) add("object_evidence", 2, "test_object");
    if (!has(/^\s*(add|write|create)\s+(?:[a-z0-9+#._-]+\s+){0,3}(test|tests|testing)\b/) && has(/\b(and|then|also)\b[^.]*\b(test|tests|testing)\b/)) add("incidental", 2, "secondary_test_concern");
  }
  if (family === "security") {
    if (has(/\b(review|audit|secure|harden)\b/) && has(/\b(auth|authentication|authorization|permission|secret|token|signature|csrf|xss|injection|leakage|timing-attack|pkce|oauth)\b/)) add("direct_intent", 5, "security_review_intent");
    if (has(/\b(add|implement|build|create)\b/) && has(/\b(oauth2|oauth|pkce|authentication|authorization|token exchange)\b/)) add("direct_intent", 5, "security_implementation_intent");
    if (has(/\b(oauth2|oauth|pkce|bearer-token|timing-attack|signature|signatures|authentication|authorization|injection|csrf|xss)\b/)) add("object_evidence", 3, "security_object");
    if (!has(/\b(review|audit|secure|harden)\b/) && has(/\b(validates signatures|signature validation)\b/)) add("incidental", 1, "signature_as_supporting_detail");
  }
  if (family === "architecture") {
    if (has(/\b(introduce|design|split|decouple|isolate|refactor)\b/) && has(/\b(action class|boundary|interface|adapter|ports-and-adapters|dependency injection|module|service boundary|pattern)\b/)) add("direct_intent", 6, "architecture_boundary_intent");
    if (has(/\b(boundary|interface|adapter|ports-and-adapters|dependency injection|action class|pattern)\b/)) add("object_evidence", 2, "architecture_object");
  }
  if (family === "database") {
    if (has(/\b(schema|migration|transaction|index|indexes)\b/) && has(/\b(add|change|alter|create|fix)\b/)) add("direct_intent", 3, "database_change_intent");
    if (has(/\b(optimize)\b/) && has(/\b(query|join|joins|tables|duplicate rows)\b/)) add("direct_intent", 3, "query_optimization_intent");
    if (has(/\b(sql|query|postgresql|postgres|mysql|database|join|joins|tables|duplicate rows|indexes)\b/)) add("object_evidence", 2, "database_object");
    if (has(/\b(plan|task list|steps|rollout|profile|slow|cache|caching)\b/)) add("incidental", 2, "database_as_supporting_detail");
  }
  if (family === "performance") {
    if (has(/\b(profile|optimize|reduce|speed up|improve latency|benchmark)\b/)) add("explicit_action", 5, "performance_action");
    if (has(/\b(slow|slowest|memoization|re-render|re-renders|caching|cache|latency|throughput|bottleneck)\b/)) add("object_evidence", 3, "performance_object");
  }
  if (family === "api-integration") {
    if (has(/\b(build|add|implement|create)\b/) && has(/\b(webhook|receiver|api|endpoint|client|retry|retries|oauth|token exchange|refresh endpoint)\b/)) add("direct_intent", 5, "api_build_intent");
    if (has(/\b(webhook|receiver|endpoint|api|http client|retry|retries|pagination|token exchange|refresh endpoint)\b/)) add("object_evidence", 2, "api_object");
    if (has(/\b(trace|diagnose|review|test|tests|security|auth|authentication|plan|steps)\b/)) add("incidental", 2, "api_as_context");
  }
  if (family === "frontend-ui") {
    if (has(/\b(fix|improve|adjust|render|wrap)\b/) && has(/\b(layout|modal|component|form|field|cell|card|screen-reader|keyboard|focus|dashboard|view)\b/)) add("direct_intent", 5, "ui_repair_intent");
    if (has(/\b(layout|modal|component|form|field|cell|card|screen-reader|keyboard|focus|accessibility tree|dashboard|view)\b/)) add("object_evidence", 2, "ui_object");
    if (has(/\b(profile|memoization|re-render|re-renders|tests|testing)\b/)) add("incidental", 2, "ui_as_context");
  }
  if (family === "infrastructure-devops") {
    if (has(/\b(add|configure|deploy|publish|run|reduce|cleaning|consolidating)\b/) && has(/\b(workflow|ci|github actions|container|dockerized|docker image|image layer|restart policy|health check|host|coverage report|run commands|apt caches)\b/)) add("direct_intent", 6, "infrastructure_action");
    if (has(/\b(workflow|ci|github actions|dockerized|docker image|image layer|container|restart policy|health check|host|coverage report|pipeline|run commands|apt caches)\b/)) add("object_evidence", 2, "infrastructure_object");
  }
  if (family === "data-processing") {
    if (has(/\b(process|transform|parse|chunk|etl|stream)\b/) && has(/\b(csv|jsonl|dataset|data|batch|pipeline)\b/)) add("direct_intent", 4, "data_processing_action");
    if (has(/\b(csv|jsonl|dataset|etl|batch|pipeline|transformation)\b/)) add("object_evidence", 2, "data_processing_object");
    if (has(/\b(profile|slow|slowest|layout|table)\b/)) add("incidental", 2, "data_as_context");
  }
  if (family === "code-quality-refactoring") {
    if (has(/\b(refactor|extract|replace|simplify|deduplicate|cleanup)\b/)) add("explicit_action", 5, "refactoring_action");
    if (has(/\b(duplicated|deeply nested|if-else|shared validator|strategy object map|serializer|form request|validation logic)\b/)) add("object_evidence", 3, "refactoring_object");
  }
  if (family === "planning-execution") {
    if (has(/\b(plan|propose|break)\b/) && has(/\b(steps|task list|roadmap|phased rollout|rollout|rollback|ordered implementation|verification steps)\b/)) add("direct_intent", 6, "planning_action");
    if (has(/\b(task list|steps|phased rollout|rollout|rollback|roadmap|verification steps|ordered implementation)\b/)) add("object_evidence", 2, "planning_object");
  }
  if (family === "documentation") {
    if (has(/\b(write|update|draft|document)\b/) && has(/\b(readme|docs|documentation|guide|runbook|release notes)\b/)) add("direct_intent", 5, "documentation_action");
  }
  if (family === "dependency-tooling") {
    if (has(/\b(upgrade|install|remove|trim)\b/) && has(/\b(package|dependency|npm|composer|pip|cargo|build)\b/)) add("direct_intent", 5, "dependency_action");
  }
  if (family === "version-control-review") {
    if (has(/\b(review|merge|rebase|commit)\b/) && has(/\b(git|pull request|pr|diff|branch)\b/)) add("direct_intent", 5, "version_control_action");
  }
  if (family === "ai-llm-engineering") {
    if (has(/\b(eval|prompt|embedding|model|llm|agent|routing)\b/) && has(/\b(build|tune|evaluate|compare|implement)\b/)) add("direct_intent", 5, "ai_engineering_action");
  }
  return evidence;
}

function downstreamRoutingPolicy(routingPolicy) {
  if (routingPolicy?.name === IDENTITY_RANKED_PRIMARY_SKILL_POLICY) {
    return {
      name: IDENTITY_RANKED_PRIMARY_SKILL_POLICY,
      externalEvidenceMargin: routingPolicy.externalEvidenceMargin
    };
  }
  if (![PRIMARY_FAMILY_EVIDENCE_POLICY, GENERIC_PRIMARY_FAMILY_EVIDENCE_POLICY, ACTION_OBJECT_PRIMARY_FAMILY_POLICY, NEED_EVIDENCE_GATE_POLICY].includes(routingPolicy?.name)) return routingPolicy;
  return {
    name: EXTERNAL_EVIDENCE_GATE_POLICY,
    externalEvidenceMargin: routingPolicy.externalEvidenceMargin
  };
}

function choosePrimary({ registry, family, taskText, project, explicit, routingPolicy, familyAmbiguous = false }) {
  const compatible = candidateSkills(registry, family, taskText, project, explicit);
  if (!compatible.length) {
    const fallbackName = FALLBACK_BY_FAMILY[family];
    return {
      skill: registry.skills.find((skill) => skill.name === fallbackName && skill.primaryEligible) || null,
      diagnostics: null
    };
  }
  if (![EXTERNAL_EVIDENCE_GATE_POLICY, FAMILY_CANDIDATE_ISOLATION_POLICY].includes(routingPolicy?.name)) {
    if (routingPolicy?.name === IDENTITY_RANKED_PRIMARY_SKILL_POLICY) {
      return applyIdentityRankedPrimarySkill({ compatible, registry, family, taskText, project, explicit, routingPolicy });
    }
    return { skill: compatible[0].skill, diagnostics: null };
  }
  if (routingPolicy?.name === IDENTITY_RANKED_PRIMARY_SKILL_POLICY) {
    return applyIdentityRankedPrimarySkill({ compatible, registry, family, taskText, project, explicit, routingPolicy });
  }
  return applyExternalEvidenceGate({ compatible, registry, family, taskText, project, explicit, routingPolicy, familyAmbiguous });
}

function chooseSupport({ registry, primary, family, taskText, project }) {
  const compatibleFamilies = new Set(SUPPORT_COMPATIBILITY[family] || []);
  const ranked = registry.skills
    .filter((skill) => skill.primaryEligible && skill.name !== primary.name && compatibleFamilies.has(skill.family))
    .map((skill) => ({
      skill,
      score: scoreSkill(skill, skill.family, taskText, project, []) +
        (skill.name === "testing" && /\b(test|tests|testing|regression)\b/.test(taskText) ? 10 : 0)
    }))
    .filter((item) => item.score >= 10)
    .sort((a, b) => b.score - a.score || b.skill.priority - a.skill.priority || a.skill.name.localeCompare(b.skill.name));
  return ranked[0]?.skill || null;
}

function candidateSkills(registry, family, taskText, project, explicit) {
  return registry.skills
    .filter((skill) => skill.primaryEligible)
    .filter((skill) => primaryCompatible(skill, family, taskText, project, explicit))
    .map((skill) => ({ skill, score: scoreSkill(skill, family, taskText, project, explicit) }))
    .filter((item) => item.score >= 8)
    .sort((a, b) => b.score - a.score || b.skill.priority - a.skill.priority || a.skill.name.localeCompare(b.skill.name));
}

function applyIdentityRankedPrimarySkill({ compatible, registry, family, taskText, project, explicit, routingPolicy }) {
  const fallbackName = FALLBACK_BY_FAMILY[family];
  const sameFamilyCompatible = compatible.filter((item) => item.skill.family === family || item.skill.name === fallbackName);
  const bundledAnchor = compatible.find((item) => item.skill.name === fallbackName) ||
    anchorCandidate(registry, fallbackName, family, taskText, project, explicit);
  const ranked = sameFamilyCompatible
    .map((item) => {
      const identity = identityEvidence(item.skill, taskText, project, explicit);
      const identityBonus = (identity.strength === "strong" ? 8 : identity.strength === "medium" ? 4 : identity.strength === "weak" ? 1.5 : 0) +
        Math.min(4, identity.specificity / 2);
      const score = item.score + identityBonus;
      return {
        ...item,
        identity,
        score,
        base_score: item.score,
        identity_bonus: identityBonus
      };
    })
    .sort((a, b) =>
      identityRank(b.identity) - identityRank(a.identity) ||
      b.identity.specificity - a.identity.specificity ||
      b.score - a.score ||
      b.base_score - a.base_score ||
      a.skill.name.localeCompare(b.skill.name)
    );
  if (!ranked.length && bundledAnchor) {
    return {
      skill: bundledAnchor.skill,
      diagnostics: {
        policy: IDENTITY_RANKED_PRIMARY_SKILL_POLICY,
        family_locked_from_policy: ACTION_OBJECT_PRIMARY_FAMILY_POLICY,
        candidate_scope: "same_family_only",
        out_of_family_candidates_excluded: compatible.length,
        margin_threshold: routingPolicy.externalEvidenceMargin,
        bundled_anchor: publicIdentityScoredSkill(bundledAnchor, taskText, project, explicit, bundledAnchor.score),
        top_candidate: publicIdentityScoredSkill(bundledAnchor, taskText, project, explicit, bundledAnchor.score),
        candidates: [],
        decision: "bundled_anchor_retained_no_same_family_candidate"
      }
    };
  }
  if (!ranked.length) return { skill: null, diagnostics: { policy: IDENTITY_RANKED_PRIMARY_SKILL_POLICY, candidate_scope: "same_family_only", decision: "no_same_family_candidate" } };
  const top = ranked[0];
  const diagnostics = {
    policy: IDENTITY_RANKED_PRIMARY_SKILL_POLICY,
    family_locked_from_policy: ACTION_OBJECT_PRIMARY_FAMILY_POLICY,
    candidate_scope: "same_family_only",
    out_of_family_candidates_excluded: compatible.length - sameFamilyCompatible.length,
    margin_threshold: routingPolicy.externalEvidenceMargin,
    bundled_anchor: bundledAnchor ? publicIdentityScoredSkill(bundledAnchor, taskText, project, explicit, bundledAnchor.score) : null,
    top_candidate: publicIdentityScoredSkill(top, taskText, project, explicit, top.score, top.base_score, top.identity_bonus, top.identity),
    candidates: ranked.slice(0, 10).map((item) => publicIdentityScoredSkill(item, taskText, project, explicit, item.score, item.base_score, item.identity_bonus, item.identity))
  };

  if (!bundledAnchor || top.skill.name === fallbackName) {
    diagnostics.decision = "existing_top";
    return { skill: top.skill, diagnostics };
  }

  const margin = normalizedMargin(top.score, bundledAnchor.score);
  diagnostics.selected_candidate_identity = top.identity;
  diagnostics.selected_candidate_margin = margin;
  diagnostics.selected_candidate_margin_passed = margin >= routingPolicy.externalEvidenceMargin;
  if (identityRank(top.identity) >= identityRank({ strength: "medium" }) && margin >= routingPolicy.externalEvidenceMargin) {
    diagnostics.decision = "identity_external_override_allowed";
    return { skill: top.skill, diagnostics };
  }

  diagnostics.decision = "bundled_anchor_retained";
  return { skill: bundledAnchor.skill, diagnostics };
}

function identityEvidence(skill, taskText, project, explicit) {
  const sources = [];
  if (explicit.includes(skill.name)) sources.push({ strength: "strong", source: "explicit_skill_request", value: skill.name });
  for (const framework of skill.frameworks) {
    if (project.frameworks.includes(framework)) sources.push({ strength: "strong", source: "project_framework", value: framework });
    else if (hasIdentityPhrase(taskText, framework)) sources.push({ strength: "strong", source: "request_framework", value: framework });
  }
  for (const language of skill.languages) {
    if (project.languages.includes(language)) sources.push({ strength: "strong", source: "project_language", value: language });
    else if (hasIdentityPhrase(taskText, language)) sources.push({ strength: "strong", source: "request_language", value: language });
  }
  for (const phrase of skillIdentityPhrases(skill)) {
    if (hasIdentityPhrase(taskText, phrase)) sources.push({ strength: "strong", source: "skill_identity_phrase", value: phrase });
  }
  for (const phrase of descriptionIdentityPhrases(skill)) {
    if (hasIdentityPhrase(taskText, phrase)) sources.push({ strength: "medium", source: "description_identity_phrase", value: phrase });
  }
  const tokens = distinctiveIdentityTokensFromSkill(skill);
  const matchedTokens = tokens.filter((token) => hasIdentityPhrase(taskText, token));
  if (matchedTokens.length >= 2) sources.push({ strength: "medium", source: "identity_token_overlap", value: matchedTokens.slice(0, 6).join(",") });
  else if (matchedTokens.length === 1) sources.push({ strength: "weak", source: "identity_token_overlap", value: matchedTokens[0] });

  const strongest = sources.reduce((best, item) => identityRank(item) > identityRank(best) ? item : best, { strength: "none" });
  return {
    strength: strongest.strength,
    specificity: Number(identitySpecificity(sources).toFixed(3)),
    sources: sources.map((item) => `${item.source}:${item.value}`),
    matched_values: [...new Set(sources.map((item) => item.value))]
  };
}

function identitySpecificity(sources) {
  let score = 0;
  for (const source of sources) {
    const tokens = identityTokens(source.value);
    const width = Math.max(1, tokens.length);
    if (source.source === "explicit_skill_request") score += 8;
    else if (source.source === "skill_identity_phrase") score += 2 + width;
    else if (source.source === "description_identity_phrase") score += width > 1 ? 1.5 + width : 0.5;
    else if (source.source.includes("framework") || source.source.includes("language")) score += 1;
    else if (source.source === "identity_token_overlap") score += Math.min(2, String(source.value).split(",").length * 0.5);
  }
  return score;
}

function skillIdentityPhrases(skill) {
  const values = [
    skill.name,
    ...(skill.tags || []),
    ...(skill.frameworks || []),
    ...(skill.languages || [])
  ];
  return distinctIdentityPhrases(values);
}

function descriptionIdentityPhrases(skill) {
  const text = normalizeIdentityText(skill.description || "");
  const tokens = identityTokens(text);
  const phrases = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const one = tokens[i];
    if (!isGenericIdentityTerm(one)) phrases.push(one);
    const two = `${tokens[i]} ${tokens[i + 1] || ""}`.trim();
    if (tokens[i + 1] && two.split(" ").every((token) => !isGenericIdentityTerm(token))) phrases.push(two);
  }
  return distinctIdentityPhrases(phrases);
}

function distinctIdentityPhrases(values) {
  const phrases = new Set();
  for (const value of values) {
    const normalized = normalizeIdentityText(value);
    if (!normalized) continue;
    const tokens = identityTokens(normalized);
    if (!tokens.length || tokens.every((token) => isGenericIdentityTerm(token))) continue;
    if (tokens.length === 1 && isGenericIdentityTerm(tokens[0])) continue;
    phrases.add(tokens.join(" "));
    if (tokens.length === 2 && tokens[1].endsWith("s")) phrases.add(`${tokens[0]} ${tokens[1].slice(0, -1)}`);
    if (tokens.length === 1 && tokens[0].endsWith("s")) phrases.add(tokens[0].slice(0, -1));
  }
  return [...phrases].filter((phrase) => phrase.length >= 3);
}

function distinctiveIdentityTokensFromSkill(skill) {
  return [...new Set([
    ...identityTokens(skill.name),
    ...identityTokens((skill.tags || []).join(" ")),
    ...identityTokens((skill.frameworks || []).join(" ")),
    ...identityTokens((skill.languages || []).join(" ")),
    ...identityTokens(skill.description || "")
  ].filter((token) => token.length >= 3 && !isGenericIdentityTerm(token)))];
}

function normalizeIdentityText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#._-]+/g, " ")
    .replace(/[-_/.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function identityTokens(value) {
  return normalizeIdentityText(value).split(" ").filter(Boolean);
}

function isGenericIdentityTerm(token) {
  return new Set([
    "skill", "specialist", "general", "fallback", "test", "tests", "testing", "security",
    "database", "api", "controller", "query", "service", "deployment", "deploy", "debug",
    "debugging", "performance", "architecture", "frontend", "backend", "data", "processing",
    "review", "code", "quality", "refactoring", "tooling", "integration", "request", "response",
    "workflow", "guide", "checks", "check", "validation", "authorization", "permission",
    "component", "layout", "model", "package", "dependency", "configuration",
    "config", "routing", "prompt", "agent", "framework", "language", "library", "platform",
    "fixture", "use", "when", "with", "and", "for", "the", "that", "this", "from"
  ]).has(token);
}

function hasIdentityPhrase(text, phrase) {
  const normalizedText = ` ${normalizeIdentityText(text)} `;
  const normalizedPhrase = normalizeIdentityText(phrase);
  if (!normalizedPhrase || normalizedPhrase.split(" ").some((token) => isGenericIdentityTerm(token))) return false;
  return normalizedText.includes(` ${normalizedPhrase} `);
}

function identityRank(identity) {
  return { none: 0, weak: 1, medium: 2, strong: 3 }[identity?.strength || "none"] || 0;
}

function publicIdentityScoredSkill(item, taskText, project, explicit, score = item.score, baseScore = item.score, identityBonus = 0, identity = null) {
  const evidence = identity || identityEvidence(item.skill, taskText, project, explicit);
  return {
    name: item.skill.name,
    source: item.skill.source,
    family: item.skill.family,
    score: Number(score.toFixed(3)),
    base_score: Number(baseScore.toFixed(3)),
    identity_bonus: Number(identityBonus.toFixed(3)),
    identity_strength: evidence.strength,
    identity_specificity: evidence.specificity,
    identity_sources: evidence.sources,
    identity_matched_values: evidence.matched_values
  };
}

function applyExternalEvidenceGate({ compatible, registry, family, taskText, project, explicit, routingPolicy, familyAmbiguous = false }) {
  const top = compatible[0];
  const fallbackName = FALLBACK_BY_FAMILY[family];
  const bundledAnchor = compatible.find((item) => item.skill.name === fallbackName) ||
    anchorCandidate(registry, fallbackName, family, taskText, project, explicit);
  const familyIsolation = routingPolicy.name === FAMILY_CANDIDATE_ISOLATION_POLICY;
  const diagnostics = {
    policy: routingPolicy.name,
    margin_threshold: routingPolicy.externalEvidenceMargin,
    family_isolation: familyIsolation,
    family_isolation_active: familyIsolation && Boolean(bundledAnchor) && family !== "other" && !familyAmbiguous,
    family_ambiguous: familyAmbiguous,
    bundled_anchor: bundledAnchor ? publicScoredSkill(bundledAnchor) : null,
    top_candidate: publicScoredSkill(top),
    challengers: compatible
      .filter((item) => item.skill.source !== "bundled")
      .slice(0, 8)
      .map((item) => {
        const evidence = explicitExternalEvidence(item.skill, family, taskText, project, explicit);
        const compatibility = familyCompatibility(item.skill, family, fallbackName, explicit, {
          familyIsolation,
          familyAmbiguous,
          bundledAnchor
        });
        const candidateBPassed = bundledAnchor
          ? evidence.matched && normalizedMargin(item.score, bundledAnchor.score) >= routingPolicy.externalEvidenceMargin
          : true;
        return {
          ...publicScoredSkill(item),
          explicit_evidence: evidence.matched,
          evidence_sources: evidence.sources,
          normalized_margin_over_anchor: bundledAnchor ? normalizedMargin(item.score, bundledAnchor.score) : null,
          gate_passed: candidateBPassed,
          ...(familyIsolation ? {
            family_compatible: compatibility.state,
            compatibility_sources: compatibility.sources,
            candidate_c_eligible: candidateBPassed && compatibility.eligible
          } : {})
        };
      })
  };
  if (!bundledAnchor || top.skill.name === fallbackName) {
    diagnostics.decision = "existing_top";
    return { skill: top.skill, diagnostics };
  }
  const evidence = explicitExternalEvidence(top.skill, family, taskText, project, explicit);
  const margin = normalizedMargin(top.score, bundledAnchor.score);
  const compatibility = familyCompatibility(top.skill, family, fallbackName, explicit, {
    familyIsolation,
    familyAmbiguous,
    bundledAnchor
  });
  diagnostics.selected_candidate_explicit_evidence = evidence.matched;
  diagnostics.selected_candidate_evidence_sources = evidence.sources;
  diagnostics.selected_candidate_margin = margin;
  if (familyIsolation) {
    diagnostics.selected_candidate_family_compatible = compatibility.state;
    diagnostics.selected_candidate_compatibility_sources = compatibility.sources;
    diagnostics.selected_candidate_candidate_c_eligible = evidence.matched && margin >= routingPolicy.externalEvidenceMargin && compatibility.eligible;
  }
  if (evidence.matched && margin >= routingPolicy.externalEvidenceMargin && (!familyIsolation || compatibility.eligible)) {
    diagnostics.decision = "external_override_allowed";
    return { skill: top.skill, diagnostics };
  }
  if (familyIsolation && evidence.matched && margin >= routingPolicy.externalEvidenceMargin && !compatibility.eligible) {
    diagnostics.decision = "bundled_anchor_retained_family_isolation";
    return { skill: bundledAnchor.skill, diagnostics };
  }
  diagnostics.decision = "bundled_anchor_retained";
  return { skill: bundledAnchor.skill, diagnostics };
}

function familyCompatibility(skill, family, fallbackName, explicit, { familyIsolation, familyAmbiguous, bundledAnchor }) {
  if (!familyIsolation) return { state: "unknown", eligible: true, sources: ["policy_not_active"] };
  if (!bundledAnchor || family === "other" || familyAmbiguous) {
    return { state: "unknown", eligible: true, sources: ["candidate_b_behavior_preserved"] };
  }
  if (skill.name === fallbackName) return { state: "yes", eligible: true, sources: ["bundled_anchor"] };
  if (explicit.includes(skill.name)) return { state: "yes", eligible: true, sources: ["explicit_skill_request"] };
  if (skill.family === family) return { state: "yes", eligible: true, sources: [`same_family:${family}`] };
  return { state: "no", eligible: false, sources: [`candidate_family:${skill.family}`, `detected_family:${family}`] };
}

function anchorCandidate(registry, fallbackName, family, taskText, project, explicit) {
  if (!fallbackName) return null;
  const skill = registry.skills.find((item) => item.name === fallbackName && item.primaryEligible);
  if (!skill) return null;
  const anchor = skill.bundledFallbackShadow || skill;
  const score = scoreSkill(anchor, family, taskText, project, explicit);
  return score >= 8 ? { skill: anchor, score } : null;
}

function explicitExternalEvidence(skill, family, taskText, project, explicit) {
  const sources = [];
  if (explicit.includes(skill.name)) sources.push("explicit_skill_request");
  for (const framework of skill.frameworks) {
    if (project.frameworks.includes(framework)) sources.push(`project_framework:${framework}`);
    else if (hasToken(taskText, framework)) sources.push(`request_framework:${framework}`);
  }
  for (const language of skill.languages) {
    if (project.languages.includes(language)) sources.push(`project_language:${language}`);
    else if (hasToken(taskText, language)) sources.push(`request_language:${language}`);
  }
  const identityTokens = distinctiveIdentityTokens(skill);
  const matchedTokens = identityTokens.filter((token) => hasToken(taskText, token));
  if (matchedTokens.length >= 2 || matchedTokens.some((token) => token.length >= 6)) {
    sources.push(`identity_tokens:${matchedTokens.join(",")}`);
  }
  if (skill.family === family && sources.length > 0) sources.push("same_family");
  const samePrimaryRole = skill.family === family || explicit.includes(skill.name) || matchedTokens.length >= 2;
  return { matched: samePrimaryRole && sources.length > 0, sources };
}

function distinctiveIdentityTokens(skill) {
  const generic = new Set([
    "skill", "specialist", "general", "fallback", "testing", "security", "database", "api",
    "integration", "debugging", "performance", "architecture", "frontend", "backend",
    "data", "processing", "review", "code", "quality", "refactoring", "tooling"
  ]);
  const raw = `${skill.name} ${(skill.tags || []).join(" ")}`.toLowerCase();
  return [...new Set(raw.split(/[^a-z0-9+#._-]+|-/).filter((token) => token.length >= 3 && !generic.has(token)))];
}

function hasToken(text, token) {
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#._-])${escaped}([^a-z0-9+#._-]|$)`, "i").test(text);
}

function normalizedMargin(candidateScore, anchorScore) {
  return Number(((candidateScore - anchorScore) / Math.max(1, Math.abs(anchorScore))).toFixed(4));
}

function publicScoredSkill(item) {
  return {
    name: item.skill.name,
    source: item.skill.source,
    family: item.skill.family,
    score: Number(item.score.toFixed(3))
  };
}

function primaryCompatible(skill, family, taskText, project, explicit) {
  if (explicit.includes(skill.name)) return true;
  if (skill.family === family) return true;
  if (skill.name === FALLBACK_BY_FAMILY[family]) return true;
  return skill.frameworks.some((fw) => project.frameworks.includes(fw) || taskText.includes(fw));
}

function scoreSkill(skill, family, taskText, project, explicit) {
  const text = `${skill.name} ${skill.description}`.toLowerCase();
  let score = skill.priority / 10;
  if (skill.family === family) score += 10;
  for (const word of importantWords(taskText)) {
    if (text.includes(word)) score += 1;
  }
  for (const fw of project.frameworks) {
    if (skill.frameworks.includes(fw)) score += 12;
    else if (text.includes(fw)) score += 8;
  }
  if (skill.frameworks.length && !skill.frameworks.some((fw) => project.frameworks.includes(fw) || taskText.includes(fw))) {
    score -= 18;
  }
  for (const narrowDomain of ["marketing", "campaign", "sales", "finance", "legal", "medical"]) {
    if (text.includes(narrowDomain) && !taskText.includes(narrowDomain)) score -= 12;
  }
  for (const selected of explicit) {
    if (skill.name === selected) score += 25;
  }
  if (skill.name === FALLBACK_BY_FAMILY[skill.family]) score += 3;
  if (skill.source === "bundled" && project.frameworks.length) score -= 2;
  if (skill.infrastructure || skill.meta) score = -100;
  return score;
}

function importantWords(text) {
  return [...new Set(text.split(/[^a-z0-9+#._-]+/).filter((word) => word.length > 2 && !["the", "and", "with", "this", "that", "for"].includes(word)))];
}

function detectProject(cwd) {
  const files = safeReaddirSync(cwd);
  const frameworks = [];
  const languages = [];
  if (files.includes("composer.json")) {
    languages.push("php");
    const composer = safeJson(path.join(cwd, "composer.json"));
    if (JSON.stringify(composer).toLowerCase().includes("laravel")) frameworks.push("laravel");
  }
  if (files.includes("pubspec.yaml")) {
    languages.push("dart");
    const pubspec = safeRead(path.join(cwd, "pubspec.yaml")).toLowerCase();
    if (pubspec.includes("flutter")) frameworks.push("flutter");
  }
  if (files.includes("package.json")) {
    languages.push("javascript");
    const pkg = safeJson(path.join(cwd, "package.json"));
    const text = JSON.stringify(pkg).toLowerCase();
    if (text.includes("react") || text.includes("next")) frameworks.push("react");
    if (text.includes("vue") || text.includes("nuxt")) frameworks.push("vue");
    frameworks.push("node");
  }
  if (files.includes("pyproject.toml") || files.includes("requirements.txt")) languages.push("python");
  if (files.includes("go.mod")) languages.push("go");
  if (files.includes("Cargo.toml")) languages.push("rust");
  return { cwd, frameworks: [...new Set(frameworks)], languages: [...new Set(languages)] };
}

function safeReaddirSync(dir) {
  try {
    return fsSync.readdirSync(dir);
  } catch {
    return [];
  }
}

function safeRead(file) {
  try {
    return fsSync.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function safeJson(file) {
  try {
    return JSON.parse(safeRead(file));
  } catch {
    return {};
  }
}

function subtype(family, text) {
  if (family === "database" && (text.includes("n+1") || text.includes("query"))) return "query-performance";
  if (family === "api-integration" && text.includes("webhook")) return "webhook";
  if (family === "testing" && text.includes("e2e")) return "end-to-end";
  if (family === "security" && text.includes("auth")) return "authorization";
  return "general";
}

function genericScore(text) {
  const phrases = ["rename variable", "typo", "readme sentence", "plain string", "comment only", "format text", "alphabetize"];
  return phrases.some((phrase) => text.includes(phrase)) ? 0.9 : 0.2;
}

function needEvidenceScore(text, family) {
  const lower = text.toLowerCase();
  const lowScopePatterns = [
    /\brename\b.*\b(variable|helper|local)\b/,
    /\btypo\b/,
    /\bspelling\b/,
    /\bwhitespace\b/,
    /\bblank line\b/,
    /\balphabetize\b/,
    /\bcomment placement\b/,
    /\bsuggest.*name\b/,
    /\bexplain.*two sentences\b/,
    /\bcopy clarification\b/,
    /\bformat text\b/,
    /\bshort commit message\b/,
    /\bsanity checklist\b/,
    /\bquick sanity\b/,
    /\btwo bullets\b/,
    /\bjust say\b/,
    /\bplain indonesian\b/,
    /\bmore friendly user\b/,
    /\bless absolute\b/,
    /\brewrite.*sentence\b/,
    /\bsummarize.*tiny\b/,
    /\bwhether.*clearer parameter name\b/,
    /\breplace.*stale todo\b/,
    /\bplaceholder heading\b/,
    /\btiny helper name\b/,
    /\bnama yang lebih jelas\b/,
    /\btulis ulang\b/,
    /\brapikan satu kalimat\b/,
    /\bcuma\b.*\btulis\b/,
    /\bnggak usah bongkar kode\b/,
    /\bsupuya lebih ramah user\b/,
    /\bkata dua\b/,
    /\btiga kata\b/,
    /\bsatu kalimat\b/,
    /\bdua kalimat\b/
  ];
  if (lowScopePatterns.some((pattern) => pattern.test(lower))) return 0;
  let score = 0;
  const strongActions = ["implement", "design", "optimize", "build", "create", "refactor", "review", "audit", "secure", "harden"];
  score += strongActions.filter((action) => lower.includes(action)).length * 0.5;
  const moderateActions = ["add", "write", "update", "fix", "debug", "investigate", "repair", "improve", "adjust", "trace", "diagnose"];
  score += moderateActions.filter((action) => lower.includes(action)).length * 0.25;
  const model = ACTION_OBJECT_FAMILY_MODEL[family];
  if (model) {
    if (model.objects.test(lower)) score += 0.5;
    if (model.actions.test(lower)) score += 0.3;
  }
  const riskTerms = ["security", "production", "migration", "database", "payment", "auth", "deploy", "concurrent", "secret", "bypass", "token"];
  score += riskTerms.filter((term) => lower.includes(term)).length * 0.15;
  if (/\b(step|steps|plan|roadmap|rollout|rollback|phased|checklist)\b/.test(lower)) score += 0.3;
  if (/\b(regression|coverage|assert|exercise)\b/.test(lower)) score += 0.3;
  return Math.min(2, score);
}

function memoryOnlyTask(text) {
  return /\b(memory-management|memory preflight|recall previous|recall context|checkpoint durable|project memory)\b/.test(text) &&
    !/\b(fix|implement|debug|test|secure|deploy|api|database|ui|refactor|performance|optimize)\b/.test(text);
}

function riskScore(text) {
  let risk = 0.25;
  for (const term of ["security", "production", "migration", "database", "payment", "auth", "deploy", "concurrent", "secret"]) {
    if (text.includes(term)) risk += 0.1;
  }
  return risk;
}

function crossSignal(text, scores) {
  let score = 0;
  if (/\b(and|also|plus|while|with tests|must also)\b/.test(text)) score += 0.25;
  if (text.includes("test")) score += 0.25;
  if (text.includes("security") || text.includes("auth")) score += 0.2;
  if (text.includes("performance") || text.includes("n+1")) score += 0.15;
  if (scores[1] && scores[1].score > 0 && scores[0].score - scores[1].score <= 2) score += 0.2;
  return score;
}

function publicSkill(skill) {
  return { name: skill.name, source: skill.source, path: skill.path, family: skill.family };
}

function validateRoute(result) {
  const numeric = ["knowledge_need", "confidence", "risk", "generic_sufficiency", "cross_cutting_signal", "specialist_marginal_value", "need_evidence"];
  for (const field of numeric) {
    if (typeof result[field] !== "number" || !Number.isFinite(result[field]) || result[field] < 0 || result[field] > 1) {
      if (field === "need_evidence" && result[field] === null) continue;
      throw new Error(`invalid numeric routing signal: ${field}`);
    }
  }
  if (![0, 1, 2].includes(result.mode)) throw new Error("invalid mode");
  if (result.specialist_count > MAX_SPECIALISTS) throw new Error("specialist count exceeds cap");
  for (const skill of [result.primary, result.support].filter(Boolean)) {
    if (skill.name === "memory-management" || skill.family === "memory-infrastructure") {
      throw new Error("memory-management selected as specialist");
    }
  }
}

async function writeCache(registry) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function readCache() {
  return readJson(CACHE_FILE);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function listSkillDirs(root) {
  return (await fs.readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function parseCsv(value) {
  if (!value) return [];
  return String(value).split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function round(value) {
  return Number(clamp(value).toFixed(3));
}

async function commandSelfTest() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "engineer-flow-test-"));
  try {
    const fixtures = await createFixtures(temp);
    const tests = [
      {
        id: "A_LARAVEL_SPECIALIST_INSTALLED",
        task: "Fix N+1 queries in this Laravel project.",
        cwd: fixtures.laravel,
        roots: [fixtures.installed],
        expect: { mode: 1, primary: "laravel-database-optimization" }
      },
      {
        id: "B_LARAVEL_NO_SPECIALIST",
        task: "Fix N+1 queries in this Laravel project.",
        cwd: fixtures.laravel,
        roots: [],
        expect: { mode: 1, primary: "database" }
      },
      {
        id: "C_FLUTTER_SPECIALIST",
        task: "Fix Flutter widget state handling.",
        cwd: fixtures.flutter,
        roots: [fixtures.flutterSkills],
        expect: { mode: 1, primary: "flutter-state-management" }
      },
      {
        id: "D_GENERIC_PYTHON_BUG",
        task: "Debug a failing Python parser and add regression tests.",
        cwd: fixtures.python,
        roots: [],
        expect: { mode: 2, primary: "debugging", support: "testing" }
      },
      {
        id: "E_PROJECT_LOCAL_PRECEDENCE",
        task: "Update tests using the project test policy.",
        cwd: fixtures.projectLocal,
        roots: [fixtures.installed],
        expect: { mode: 1, primary: "testing" }
      },
      {
        id: "F_MEMORY_INFRASTRUCTURE_ONLY",
        task: "Use memory-management to recall previous context before work.",
        cwd: fixtures.python,
        roots: [fixtures.installed],
        expect: { forbidden: "memory-management" }
      },
      {
        id: "G_UNRELATED_KEYWORD_OVERLAP",
        task: "Optimize API latency and retries.",
        cwd: fixtures.node,
        roots: [fixtures.installed],
        expect: { notPrimary: "marketing-performance", primary: "performance" }
      },
      {
        id: "H_NO_RELEVANT_SPECIALIST",
        task: "Alphabetize a README sentence.",
        cwd: fixtures.node,
        roots: [fixtures.installed],
        expect: { mode: 0 }
      },
      {
        id: "I_CROSS_CUTTING_SUPPORT",
        task: "Build an API client with retries and tests.",
        cwd: fixtures.node,
        roots: [],
        expect: { mode: 2, primary: "api-integration", support: "testing" }
      },
      {
        id: "J_HUNDREDS_BOUNDED",
        task: "Review a security-sensitive API change and add tests.",
        cwd: fixtures.node,
        roots: [fixtures.hundreds],
        expect: { maxSpecialists: 2 }
      }
    ];
    const results = [];
    for (const test of tests) {
      const registry = await discover({ cwd: test.cwd, "skill-root": test.roots.join(";"), noGlobal: true });
      const result = routeTask({ task: test.task, cwd: test.cwd, registry, explicit: [] });
      validateRoute(result);
      assertScenario(test, result);
      results.push({ id: test.id, mode: result.mode, primary: result.primary?.name || null, support: result.support?.name || null, specialist_count: result.specialist_count });
    }
    console.log("SELF_TEST_PASS=YES");
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

function assertScenario(test, result) {
  const expected = test.expect;
  if ("mode" in expected && result.mode !== expected.mode) throw new Error(`${test.id}: expected mode ${expected.mode}, got ${result.mode}`);
  if (expected.primary && result.primary?.name !== expected.primary) throw new Error(`${test.id}: expected primary ${expected.primary}, got ${result.primary?.name || "null"}`);
  if (expected.support && result.support?.name !== expected.support) throw new Error(`${test.id}: expected support ${expected.support}, got ${result.support?.name || "null"}`);
  if (expected.notPrimary && result.primary?.name === expected.notPrimary) throw new Error(`${test.id}: unrelated skill selected`);
  if (expected.forbidden) {
    const names = [result.primary?.name, result.support?.name].filter(Boolean);
    if (names.includes(expected.forbidden)) throw new Error(`${test.id}: forbidden skill selected`);
  }
  if (expected.maxSpecialists && result.specialist_count > expected.maxSpecialists) throw new Error(`${test.id}: exceeded specialist cap`);
}

async function createFixtures(temp) {
  const installed = path.join(temp, "installed");
  const flutterSkills = path.join(temp, "flutter-skills");
  const hundreds = path.join(temp, "hundreds");
  const laravel = path.join(temp, "laravel-app");
  const flutter = path.join(temp, "flutter-app");
  const python = path.join(temp, "python-app");
  const node = path.join(temp, "node-app");
  const projectLocal = path.join(temp, "project-local");
  await fs.mkdir(installed, { recursive: true });
  await fs.mkdir(flutterSkills, { recursive: true });
  await fs.mkdir(hundreds, { recursive: true });
  await fs.mkdir(path.join(projectLocal, "skills"), { recursive: true });
  await fs.mkdir(laravel, { recursive: true });
  await fs.mkdir(flutter, { recursive: true });
  await fs.mkdir(python, { recursive: true });
  await fs.mkdir(node, { recursive: true });
  await fs.writeFile(path.join(laravel, "composer.json"), JSON.stringify({ require: { "laravel/framework": "^12.0" } }), "utf8");
  await fs.writeFile(path.join(flutter, "pubspec.yaml"), "dependencies:\n  flutter:\n    sdk: flutter\n", "utf8");
  await fs.writeFile(path.join(python, "pyproject.toml"), "[project]\nname='demo'\n", "utf8");
  await fs.writeFile(path.join(node, "package.json"), JSON.stringify({ dependencies: { express: "^4.0.0" } }), "utf8");
  await writeSkill(installed, "laravel-database-optimization", "Laravel database performance specialist for N+1 query optimization, indexes, Eloquent queries, and query performance.");
  await writeSkill(installed, "memory-management", "Project memory infrastructure for recall and checkpointing. Infrastructure only.");
  await writeSkill(installed, "marketing-performance", "Marketing copy performance specialist for campaign wording and unrelated growth content.");
  await writeSkill(flutterSkills, "flutter-state-management", "Flutter and Dart state management specialist for widgets, BLoC, Riverpod, and UI state bugs.");
  await writeSkill(path.join(projectLocal, "skills"), "testing", "Project-local testing policy specialist for this repository.");
  await fs.writeFile(path.join(installed, "malformed", "SKILL.md"), "not frontmatter", "utf8").catch(async () => {
    await fs.mkdir(path.join(installed, "malformed"), { recursive: true });
    await fs.writeFile(path.join(installed, "malformed", "SKILL.md"), "not frontmatter", "utf8");
  });
  for (let i = 0; i < 250; i += 1) {
    await writeSkill(hundreds, `dummy-skill-${i}`, `Placeholder skill number ${i} with no relevant domain metadata.`);
  }
  return { installed, flutterSkills, hundreds, laravel, flutter, python, node, projectLocal };
}

async function writeSkill(root, name, description) {
  const dir = path.join(root, name);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\nUse this skill when selected.\n`, "utf8");
}
