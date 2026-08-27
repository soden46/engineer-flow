#!/usr/bin/env node
/*
 * Test-only calibration-v8 simulator.
 *
 * Reimplements production resolver logic exactly, with an injectable
 * confidence-gated fallback mechanism. No production code is modified.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const PRODUCTION_RESOLVER = path.join(REPO_ROOT, "skills", "engineer-flow", "scripts", "engineer-flow.mjs");
const CALIBRATION_FILE = path.join(REPO_ROOT, "tests", "routing-calibration-v8.json");
const BASELINE_FILE = path.join(REPO_ROOT, "benchmark-results", "calibration-v8-baseline.json");

const FALLBACK_ENABLED = false;
const FALLBACK_SOURCE = "description";
const WEAK_GATE = (topScore, secondScore) => topScore < 2;
const AMBIGUOUS_GATE = (topScore, secondScore) => topScore >= 2 && topScore === secondScore;
const STRONG_GATE = (topScore, secondScore) => topScore >= 2 && topScore > secondScore;

const MAX_SPECIALISTS = 2;
const MAX_INTENT_ANCHORS = 2;
const EVIDENCE_IDENTITY_AFFINITY = 3;
const MAX_PROJECT_EVIDENCE_FILES = 16;
const MAX_BYTES_PER_EVIDENCE_FILE = 65536;
const MAX_TOTAL_EVIDENCE_BYTES = 262144;
const MAX_EVIDENCE_TOKENS = 4096;
const MAX_RETRIEVAL_DIAGNOSTICS = 16;

const PROJECT_EVIDENCE_MANIFEST_NAMES = new Set([
  "package.json", "composer.json", "pyproject.toml", "pom.xml",
  "build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts",
  "go.mod", "Cargo.toml", "pubspec.yaml", "Gemfile"
]);

const STOP = new Set([
  "the","a","an","and","or","to","of","for","in","on",
  "with","using","use","this","that","from","into","by",
  "be","is","are","was","were","project","application",
  "engineering","principles","framework","language",
  "technology","skill","skills"
]);

const EXTERNAL_GENERIC_ANCHORS = new Set([
  "api","app","application","architecture","auth","authentication",
  "authorization","best","build","code","config","configuration",
  "data","database","development","design","e2e","error","errors",
  "feature","framework","integration","model","models","performance",
  "project","report","reports","review","security","service","services",
  "storage","test","testing","training","ui","web","workflow"
]);

function words(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#._:-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => word.length >= 2)
    .filter((word) => !STOP.has(word));
}

function frontmatter(text) {
  const match = String(text || "").match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return {};
  const result = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const colonIndex = line.indexOf(":");
    if (colonIndex < 0) continue;
    const key = line.slice(0, colonIndex).trim();
    if (!key) continue;
    let value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "routing_terms" && value === "") {
      const terms = [];
      for (let termIndex = index + 1; termIndex < lines.length; termIndex++) {
        const trimmed = lines[termIndex].trim();
        if (!trimmed.startsWith("- ")) break;
        const termValue = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
        if (termValue) terms.push(termValue);
        index = termIndex;
      }
      result[key] = terms;
      continue;
    }
    result[key] = value;
  }
  return result;
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeComparableName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-_:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function discoverInternalSkills() {
  const manifestPath = path.join(REPO_ROOT, "skills", "engineer-flow", "core", "core-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const names = manifest.cores || [];
  return names.map((name) => {
    const file = path.join(REPO_ROOT, "skills", "engineer-flow", "core", name, "SKILL.md");
    const text = fs.readFileSync(file, "utf8");
    const meta = frontmatter(text);
    return {
      name: meta.name || name,
      description: meta.description || "",
      path: file,
      text,
      meta,
      source: "engineer-flow",
      internal: true
    };
  });
}

function externalRoots() {
  const roots = [path.join(os.homedir(), ".agents", "skills")];
  const configured = process.env.ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS;
  if (configured) {
    for (const value of configured.split(path.delimiter)) {
      const cleaned = value.trim();
      if (cleaned) roots.push(path.resolve(cleaned));
    }
  }
  return [...new Set(roots.map((r) => path.resolve(r)))];
}

function walkSkillFiles(root) {
  const result = [];
  if (!fs.existsSync(root)) return result;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch { continue; }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "migration") continue;
        stack.push(full);
        continue;
      }
      if (entry.isFile() && entry.name === "SKILL.md") result.push(full);
    }
  }
  return result;
}

function isInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function discoverExternalSkills() {
  const skills = [];
  for (const root of externalRoots()) {
    for (const file of walkSkillFiles(root)) {
      if (isInside(REPO_ROOT, file)) continue;
      let text = "";
      try { text = fs.readFileSync(file, "utf8"); }
      catch { continue; }
      const meta = frontmatter(text);
      const fallbackName = path.basename(path.dirname(file));
      const name = meta.name || fallbackName;
      if (!name) continue;
      skills.push({
        name,
        description: meta.description || "",
        path: file,
        text,
        meta,
        source: "external",
        external_root: root,
        internal: false
      });
    }
  }
  return skills;
}

function buildCapabilityPool() {
  const internal = discoverInternalSkills();
  const external = discoverExternalSkills();
  const result = [];
  const seen = new Set();
  for (const skill of [...internal, ...external]) {
    const key = normalizeName(skill.name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(skill);
  }
  return { internal, external, capabilities: result };
}

function skillTerms(skill) {
  const meta = skill.meta || {};
  const routingTerms = Array.isArray(meta.routing_terms) ? meta.routing_terms : null;
  if (routingTerms && routingTerms.length) {
    return new Set(words([skill.name, ...routingTerms].join(" ")));
  }
  const headings = skill.text.match(/^#{1,3}\s+.+$/gm) || [];
  const material = [skill.name, skill.description, ...headings].join(" ");
  return new Set(words(material));
}

function scoreSkill(task, skill) {
  const taskWords = new Set(words(task));
  const terms = skillTerms(skill);
  let score = 0;
  for (const word of taskWords) {
    if (terms.has(word)) score += 1;
  }
  const normalizedTask = normalizeComparableName(task);
  const normalizedName = normalizeComparableName(skill.name);
  if (normalizedName.length >= 3 && normalizedTask.includes(normalizedName)) {
    score += 1;
  }
  return score;
}

function externalSkillAnchored(task, skill) {
  if (skill.internal) return true;
  const taskTokens = new Set(words(task));
  const nameTokens = words(String(skill.name).replace(/[-_:]+/g, " "));
  const normalizedTask = String(task).toLowerCase().replace(/[-_:]+/g, " ").replace(/\s+/g, " ").trim();
  const normalizedName = String(skill.name).toLowerCase().replace(/[-_:]+/g, " ").replace(/\s+/g, " ").trim();
  if (normalizedName.length >= 3 && normalizedTask.includes(normalizedName)) return true;
  const specificTokens = nameTokens.filter((token) => token.length >= 3 && !EXTERNAL_GENERIC_ANCHORS.has(token));
  if (specificTokens.some((token) => taskTokens.has(token))) return true;
  const matched = nameTokens.filter((token) => token.length >= 3 && taskTokens.has(token));
  return nameTokens.length >= 2 && matched.length >= 2;
}

function evidenceTokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length >= 2)
    .filter((token) => !STOP.has(token));
}

function collectProjectEvidence(cwd) {
  const result = { files_considered: [], tokens: new Set() };
  let entries = [];
  try { entries = fs.readdirSync(cwd, { withFileTypes: true }); }
  catch { return result; }
  let totalBytes = 0;
  for (const entry of entries) {
    if (result.files_considered.length >= MAX_PROJECT_EVIDENCE_FILES || totalBytes >= MAX_TOTAL_EVIDENCE_BYTES) break;
    if (!entry.isFile()) continue;
    const isManifest = PROJECT_EVIDENCE_MANIFEST_NAMES.has(entry.name) || /^requirements(\..+)?\.txt$/.test(entry.name);
    if (!isManifest) continue;
    const file = path.join(cwd, entry.name);
    let text = "";
    try {
      const stats = fs.statSync(file);
      if (stats.size <= 0) continue;
      const length = Math.min(stats.size, MAX_BYTES_PER_EVIDENCE_FILE);
      const handle = fs.openSync(file, "r");
      try {
        const buffer = Buffer.alloc(length);
        fs.readSync(handle, buffer, 0, length, 0);
        text = buffer.toString("utf8");
      } finally { fs.closeSync(handle); }
    } catch { continue; }
    result.files_considered.push(entry.name);
    totalBytes += text.length;
    for (const token of evidenceTokens(text)) {
      if (result.tokens.size >= MAX_EVIDENCE_TOKENS) break;
      result.tokens.add(token);
    }
  }
  return result;
}

function skillIdentityTerms(skill) {
  if (skill.internal) return [];
  return words(String(skill.name).replace(/[-_:]+/g, " "))
    .filter((token) => token.length >= 3 && !EXTERNAL_GENERIC_ANCHORS.has(token));
}

function buildRetrievalContext({ task, cwd, internalSkills, externalSkills }) {
  const evidence = collectProjectEvidence(cwd);
  const intent = internalSkills
    .map((skill) => ({ name: skill.name, score: scoreSkill(task, skill) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, MAX_INTENT_ANCHORS)
    .map((item) => item.name);

  const affinityByPath = new Map();
  const externalMatches = [];
  if (intent.length && evidence.tokens.size) {
    const normalizedEvidence = ` ${[...evidence.tokens].join(" ")} `;
    for (const skill of externalSkills) {
      const identity = skillIdentityTerms(skill);
      if (!identity.length) continue;
      const matched = identity.filter((term) => evidence.tokens.has(term) || normalizedEvidence.includes(` ${term} `));
      if (!matched.length) continue;
      affinityByPath.set(skill.path, matched.length * EVIDENCE_IDENTITY_AFFINITY);
      if (externalMatches.length < MAX_RETRIEVAL_DIAGNOSTICS) {
        externalMatches.push({ name: skill.name, matched_identity_terms: matched.slice(0, MAX_RETRIEVAL_DIAGNOSTICS) });
      }
    }
  }
  return { diagnostics: { intent, project_evidence: { files_considered: evidence.files_considered, token_count: evidence.tokens.size }, external_matches: externalMatches }, affinityByPath };
}

function chooseSpecialists(task, capabilities, retrieval = null) {
  const affinity = retrieval && retrieval.affinityByPath instanceof Map ? retrieval.affinityByPath : new Map();
  const ranked = capabilities
    .map((skill) => ({
      skill,
      score: scoreSkill(task, skill) + (skill.internal ? 0 : (affinity.get(skill.path) || 0))
    }))
    .filter((item) => item.score > 0 && (item.skill.internal || externalSkillAnchored(task, item.skill) || affinity.has(item.skill.path)))
    .sort((a, b) => b.score - a.score || Number(b.skill.internal) - Number(a.skill.internal) || a.skill.name.localeCompare(b.skill.name));

  if (!ranked.length) return [];

  const selected = [ranked[0]];
  const second = ranked[1];
  if (second && second.score >= 2 && second.score >= Math.max(2, ranked[0].score * 0.60)) {
    selected.push(second);
  }
  return selected.slice(0, MAX_SPECIALISTS);
}

function materializeSpecialist(item, role) {
  const skill = item.skill;
  return { role, name: skill.name, score: item.score, source: skill.source, skill: skill.path };
}

function resolveWithFallback(task, cwd, fallbackEnabled = false) {
  const pool = buildCapabilityPool();
  const retrieval = buildRetrievalContext({ task, cwd, internalSkills: pool.internal, externalSkills: pool.external });

  let selected = chooseSpecialists(task, pool.capabilities, retrieval);

  if (fallbackEnabled) {
    const scores = pool.capabilities
      .map((skill) => ({ skill, score: scoreSkill(task, skill) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));

    const top = scores[0];
    const second = scores[1];
    const topScore = top ? top.score : 0;
    const secondScore = second ? second.score : 0;

    let fallbackCandidate = null;
    if (WEAK_GATE(topScore, secondScore)) {
      for (const skill of pool.capabilities) {
        if (!skill.internal) continue;
        const desc = (skill.description || "").toLowerCase();
        const taskLower = task.toLowerCase();
        const descWords = new Set(words(desc));
        const taskWords = new Set(words(task));
        let matchCount = 0;
        for (const w of taskWords) { if (descWords.has(w)) matchCount++; }
        if (matchCount >= 2) {
          fallbackCandidate = skill;
          break;
        }
      }
    } else if (AMBIGUOUS_GATE(topScore, secondScore)) {
      for (const skill of pool.capabilities) {
        if (!skill.internal) continue;
        const desc = (skill.description || "").toLowerCase();
        const taskLower = task.toLowerCase();
        const descWords = new Set(words(desc));
        const taskWords = new Set(words(task));
        let matchCount = 0;
        for (const w of taskWords) { if (descWords.has(w)) matchCount++; }
        if (matchCount >= 2) {
          fallbackCandidate = skill;
          break;
        }
      }
    }

    if (fallbackCandidate && (!selected.length || selected[0].skill.name !== fallbackCandidate.name)) {
      selected = [{ skill: fallbackCandidate, score: topScore + 1 }];
    }
  }

  const specialists = selected.map((item, index) => materializeSpecialist(item, index === 0 ? "primary" : "support"));
  return {
    specialist_count: specialists.length,
    primary: specialists[0] || null,
    support: specialists[1] || null,
    max_specialists: MAX_SPECIALISTS
  };
}

function evaluateCase(scenario, outcome) {
  const id = scenario.id;
  const expected = scenario.expected;

  if (outcome.crashed) {
    return {
      id, group: scenario.group, family: scenario.family, crashed: true,
      crash_reason: outcome.reason, pass: false, expected, actual: {
        mode: -1, primary: null, support: null, specialist_count: -1,
        primary_source: null, support_source: null, external_used: false
      },
      failures: [`RESOLVER_CRASH: ${outcome.reason}`], classes: ["RESOLVER_CRASH"],
      response_max_specialists: null
    };
  }

  const response = outcome.response || outcome;
  const primary = response.primary ? response.primary.name : null;
  const support = response.support ? response.support.name : null;
  const primarySource = response.primary ? response.primary.source : null;
  const supportSource = response.support ? response.support.source : null;

  const actual = {
    mode: response.specialist_count,
    primary,
    support,
    specialist_count: response.specialist_count,
    primary_source: primarySource,
    support_source: supportSource,
    external_used: primarySource === "external" || supportSource === "external"
  };

  const failures = [];
  if (actual.specialist_count !== expected.mode) failures.push(`MODE_MISMATCH: expected ${expected.mode}, got ${actual.specialist_count}`);
  if (actual.primary !== expected.primary) failures.push(`PRIMARY_MISMATCH: expected ${JSON.stringify(expected.primary)}, got ${JSON.stringify(actual.primary)}`);
  if (actual.support !== expected.support) failures.push(`SUPPORT_MISMATCH: expected ${JSON.stringify(expected.support)}, got ${JSON.stringify(actual.support)}`);
  if (actual.external_used !== expected.external_required) failures.push(`EXTERNAL_REQUIRED_MISMATCH: expected ${expected.external_required}, got ${actual.external_used}`);

  const selectedNames = [primary, support].filter(Boolean);
  for (const forbidden of expected.must_not_select) {
    if (selectedNames.includes(forbidden)) failures.push(`MUST_NOT_SELECT_VIOLATION: ${forbidden} was selected`);
  }

  return { id, group: scenario.group, family: scenario.family, crashed: false, pass: failures.length === 0, expected, actual, failures, classes: [], response_max_specialists: outcome.max_specialists };
}

function round4(value) { return Math.round(value * 10000) / 10000; }
function ratio(cases, predicate) { if (!cases.length) return null; return round4(cases.filter(predicate).length / cases.length); }
function live(cases) { return cases.filter((item) => !item.crashed); }
function groupCases(cases, group) { return live(cases).filter((item) => item.group === group); }
function exactRoute(item) {
  return item.actual.specialist_count === item.expected.mode &&
    item.actual.primary === item.expected.primary &&
    item.actual.support === item.expected.support &&
    item.actual.external_used === item.expected.external_required;
}

function computeMetrics(cases) {
  const liveCases = live(cases);
  const maxSpecialistsObserved = liveCases.reduce((max, item) => Math.max(max, item.actual.specialist_count), 0);

  function selected(item, name) {
    return item.actual.primary === name || item.actual.support === name;
  }
  function expectedSelected(item, name) {
    return item.expected.primary === name || item.expected.support === name;
  }

  return {
    scenarios: cases.length,
    mode_accuracy: ratio(cases, (item) => item.actual.specialist_count === item.expected.mode),
    primary_accuracy: ratio(cases, (item) => item.actual.primary === item.expected.primary),
    support_accuracy: ratio(cases, (item) => item.actual.support === item.expected.support),
    exact_route_accuracy: ratio(cases, exactRoute),
    internal_primary_accuracy: ratio(liveCases.filter((item) => !item.expected.external_required), (item) => item.actual.primary === item.expected.primary),
    false_frontend_ui_activation_count: liveCases.filter((item) => selected(item, "frontend-ui") && !expectedSelected(item, "frontend-ui")).length,
    false_testing_activation_count: liveCases.filter((item) => selected(item, "testing") && !expectedSelected(item, "testing")).length,
    false_security_activation_count: liveCases.filter((item) => selected(item, "security") && !expectedSelected(item, "security")).length,
    false_external_activation_count: liveCases.filter((item) => item.actual.external_used && !item.expected.external_required).length,
    must_not_select_violations: liveCases.filter((item) => item.failures.some((f) => f.startsWith("MUST_NOT_SELECT_VIOLATION"))).length,
    max_specialists_observed: maxSpecialistsObserved,
    resolver_crash_count: cases.filter((item) => item.crashed).length
  };
}

function materializeScenarioEnvironment(tmpRoot, scenario) {
  const fakeHome = path.join(tmpRoot, "home");
  const projectDir = path.join(tmpRoot, "project");
  const extRoot = path.join(tmpRoot, "external-skills");
  fs.mkdirSync(path.join(fakeHome, ".agents", "skills"), { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(extRoot, { recursive: true });
  for (const [relativePath, content] of Object.entries(scenario.project_files || {})) {
    const target = path.resolve(projectDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  }
  for (const definition of scenario.external_skills || []) {
    const content = definition.raw_content !== undefined ? definition.raw_content :
      `---\nname: ${definition.name || definition.directory}\ndescription: ${definition.description || ""}\n---\n\n${definition.body || ""}\n`;
    fs.mkdirSync(path.join(extRoot, definition.directory), { recursive: true });
    fs.writeFileSync(path.join(extRoot, definition.directory, "SKILL.md"), content, "utf8");
  }
  return { fakeHome, projectDir, extRoot };
}

function runBaselineResolver(task, projectDir, extRoot, fakeHome) {
  const env = { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome, ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot };
  const result = spawnSync(process.execPath, [PRODUCTION_RESOLVER, "resolve", "--task", task, "--cwd", projectDir], {
    encoding: "utf8", env, cwd: REPO_ROOT, timeout: 180000, windowsHide: true
  });
  if (result.error) return { crashed: true, reason: `failed to start: ${result.error.message}` };
  if (result.status !== 0) return { crashed: true, reason: `exit ${result.status}: ${result.stderr || "(no output)"}` };
  try { return { crashed: false, response: JSON.parse(result.stdout) }; }
  catch (error) { return { crashed: true, reason: `unparseable output: ${error.message}` }; }
}

function main() {
  const fixtures = JSON.parse(fs.readFileSync(CALIBRATION_FILE, "utf8"));
  const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
  const cases = [];

  for (const scenario of fixtures.scenarios) {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ef-sim-v8-"));
    try {
      const { fakeHome, projectDir, extRoot } = materializeScenarioEnvironment(tmpRoot, scenario);

      if (!FALLBACK_ENABLED) {
        const outcome = runBaselineResolver(scenario.task, projectDir, extRoot, fakeHome);
        const evaluated = evaluateCase(scenario, outcome);
        cases.push(evaluated);
      } else {
        const previousHome = process.env.HOME || "";
        const previousUserProfile = process.env.USERPROFILE || "";
        const previousRoots = process.env.ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS || "";
        process.env.HOME = fakeHome;
        process.env.USERPROFILE = fakeHome;
        process.env.ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS = extRoot;
        try {
          const outcome = resolveWithFallback(scenario.task, projectDir, true);
          const evaluated = evaluateCase(scenario, outcome);
          cases.push(evaluated);
        } finally {
          process.env.HOME = previousHome;
          process.env.USERPROFILE = previousUserProfile;
          process.env.ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS = previousRoots;
        }
      }
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  }

  const metrics = computeMetrics(cases);
  console.log(JSON.stringify({ cases, metrics }, null, 2));
}

main();
