#!/usr/bin/env node
/*
 * Fresh HELDOUT-V5 routing evaluation runner.
 *
 * One-time generalization evaluation for Candidate J
 * (SYMMETRIC_EXPLICIT_SKILL_NAME_NORMALIZATION) with Candidate I
 * intent-conditioned retrieval under regression watch.
 *
 * Executes the PRODUCTION resolver as a subprocess inside a fully
 * isolated environment per scenario. The resolver is never mocked,
 * imported, or reimplemented here. After execution the dataset is
 * considered BURNED and the written result records
 * dataset_status = "burned".
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RUNNER_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RUNNER_DIR, "..");
const RESOLVER =
  path.join(REPO_ROOT, "skills", "engineer-flow", "scripts", "engineer-flow.mjs");

const HELDOUT_FILE = path.join(RUNNER_DIR, "routing-heldout-v5.json");

const HELDOUT_VERSION = 5;
const DATASET = "heldout-v5";
const CANDIDATE = "Candidate J";
const MECHANISM = "SYMMETRIC_EXPLICIT_SKILL_NAME_NORMALIZATION";
const RESOLVER_TIMEOUT_MS = 180000;

const EXPECTED_GROUP_COUNTS = {
  A_EXPLICIT_NORMALIZATION: 8,
  B_PARTIAL_NEGATIVE: 4,
  C_EVIDENCE_REGRESSION: 4,
  D_ROBUSTNESS_SCALE: 2,
  E_MODE0: 2
};

class FatalError extends Error {}

/* =========================================================
   CLI
   ========================================================= */

function parseArgs(argv) {
  const options = { json: false, write: null };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (arg === "--json") {
      options.json = true;
    }
    else if (arg === "--write") {
      index += 1;

      if (!argv[index]) {
        throw new FatalError("--write requires a path");
      }

      options.write = argv[index];
    }
    else {
      throw new FatalError(`unknown argument: ${arg}`);
    }
  }

  return options;
}

/* =========================================================
   FIXTURE LOADING AND VALIDATION
   ========================================================= */

function loadFixtures() {
  let parsed;

  try {
    parsed = JSON.parse(fs.readFileSync(HELDOUT_FILE, "utf8"));
  }
  catch (error) {
    throw new FatalError(`cannot read heldout fixtures: ${error.message}`);
  }

  const problems = [];

  if (parsed.version !== HELDOUT_VERSION) problems.push("version must be 5");
  if (parsed.dataset !== DATASET) problems.push(`dataset must be ${DATASET}`);
  if (parsed.status !== "fresh") problems.push("status must be fresh at evaluation time");
  if (parsed.candidate !== CANDIDATE) problems.push(`candidate must be ${CANDIDATE}`);

  const rules = parsed.rules || {};

  if (rules.heldout_v4_reuse !== false) problems.push("rules.heldout_v4_reuse must be false");
  if (rules.calibration_v4_reuse !== false) problems.push("rules.calibration_v4_reuse must be false");
  if (rules.technology_hardcoding !== false) problems.push("rules.technology_hardcoding must be false");
  if (rules.max_specialists !== 2) problems.push("rules.max_specialists must be 2");

  if (!Array.isArray(parsed.scenarios)) {
    problems.push("scenarios must be an array");
  }
  else {
    if (parsed.scenarios.length !== 20) {
      problems.push(`expected exactly 20 heldout scenarios, found ${parsed.scenarios.length}`);
    }

    const groupCounts = {};
    const seenIds = new Set();

    for (const scenario of parsed.scenarios) {
      validateScenario(scenario, seenIds, problems);

      if (scenario && typeof scenario === "object" && scenario.group) {
        groupCounts[scenario.group] = (groupCounts[scenario.group] || 0) + 1;
      }
    }

    for (const [group, count] of Object.entries(EXPECTED_GROUP_COUNTS)) {
      if ((groupCounts[group] || 0) !== count) {
        problems.push(`group ${group} must contain exactly ${count} scenarios, found ${groupCounts[group] || 0}`);
      }
    }
  }

  if (problems.length) {
    throw new FatalError(`invalid heldout fixtures:\n  - ${problems.join("\n  - ")}`);
  }

  return parsed;
}

function validateScenario(scenario, seenIds, problems) {
  if (!scenario || typeof scenario !== "object") {
    problems.push("scenario must be an object");
    return;
  }

  const id = scenario.id;

  if (typeof id !== "string" || !id.trim()) {
    problems.push("scenario id is required");
    return;
  }

  if (seenIds.has(id)) {
    problems.push(`${id}: duplicate scenario id`);
  }

  seenIds.add(id);

  if (!EXPECTED_GROUP_COUNTS[scenario.group]) {
    problems.push(`${id}: unknown group ${JSON.stringify(scenario.group)}`);
  }

  if (typeof scenario.family !== "string" || !scenario.family.trim()) {
    problems.push(`${id}: family is required`);
  }

  if (typeof scenario.task !== "string" || !scenario.task.trim()) {
    problems.push(`${id}: task is required`);
  }

  const expected = scenario.expected;

  if (!expected || typeof expected !== "object" || ![0, 1, 2].includes(expected.mode)) {
    problems.push(`${id}: expected.mode must be 0, 1, or 2`);
    return;
  }

  if (
    (expected.primary !== null && typeof expected.primary !== "string") ||
    (expected.support !== null && typeof expected.support !== "string")
  ) {
    problems.push(`${id}: expected.primary/support must be string or null`);
    return;
  }

  if (expected.mode === 0 && (expected.primary !== null || expected.support !== null)) {
    problems.push(`${id}: mode 0 requires primary=null and support=null`);
  }

  if (expected.mode === 1 && (typeof expected.primary !== "string" || expected.support !== null)) {
    problems.push(`${id}: mode 1 requires primary=string and support=null`);
  }

  if (expected.mode === 2 && (typeof expected.primary !== "string" || typeof expected.support !== "string")) {
    problems.push(`${id}: mode 2 requires primary and support strings`);
  }

  if (typeof expected.external_required !== "boolean") {
    problems.push(`${id}: expected.external_required must be boolean`);
  }

  if (!Array.isArray(expected.must_not_select) || expected.must_not_select.some((name) => typeof name !== "string")) {
    problems.push(`${id}: expected.must_not_select must be an array of strings`);
  }
  else if (expected.primary && expected.must_not_select.includes(expected.primary)) {
    problems.push(`${id}: expected.primary must not appear in must_not_select`);
  }
  else if (expected.support && expected.must_not_select.includes(expected.support)) {
    problems.push(`${id}: expected.support must not appear in must_not_select`);
  }

  if (expected.max_specialists !== 2) {
    problems.push(`${id}: expected.max_specialists must be 2`);
  }

  if (scenario.project_files !== undefined) {
    const files = scenario.project_files;

    if (!files || typeof files !== "object" || Array.isArray(files)) {
      problems.push(`${id}: project_files must be an object`);
    }
    else {
      for (const [relativePath, content] of Object.entries(files)) {
        if (path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes("..")) {
          problems.push(`${id}: project_files path escapes project dir: ${relativePath}`);
        }

        if (typeof content !== "string") {
          problems.push(`${id}: project_files content must be a string: ${relativePath}`);
        }
      }
    }
  }

  if (scenario.external_skills !== undefined) {
    if (!Array.isArray(scenario.external_skills)) {
      problems.push(`${id}: external_skills must be an array`);
    }
    else {
      for (const definition of scenario.external_skills) {
        if (!definition || typeof definition.directory !== "string" || !/^[A-Za-z0-9._-]+$/.test(definition.directory)) {
          problems.push(`${id}: external skill directory must be a safe name`);
        }

        if (definition.raw_content !== undefined && typeof definition.raw_content !== "string") {
          problems.push(`${id}: raw_content must be a string`);
        }
      }
    }
  }

  if (scenario.generated_external_skills !== undefined) {
    const count = scenario.generated_external_skills;

    if (!Number.isInteger(count) || count < 0) {
      problems.push(`${id}: generated_external_skills must be a non-negative integer`);
    }
  }
}

/* =========================================================
   ENVIRONMENT MATERIALIZATION
   ========================================================= */

const BULK_DESCRIPTION_TEMPLATES = [
  "Historical overview of regional pottery glazing traditions, kiln maintenance schedules, and studio exhibitions.",
  "Field guide snippets describing coral reef fish species, tide pool etiquette, and coastal conservation volunteering.",
  "Chess endgame studies, famous grandmaster games, and club tournament etiquette for enthusiasts.",
  "Sourdough starter care, artisan bread shaping techniques, and neighborhood bakery festivals.",
  "Orchestral repertoire notes, rehearsal room acoustics, and community concert season planning.",
  "Alpine wildflower photography walks, mountain hut overnight packing lists, and shuttle timetables.",
  "Houseplant watering calendars, terrarium building workshops, and seasonal plant swap meetups.",
  "Beginner accordion practice routines, folk dance evening schedules, and instrument rental guidance."
];

function composeSkillMarkdown(definition) {
  return [
    "---",
    `name: ${definition.name}`,
    `description: ${definition.description}`,
    "---",
    "",
    definition.body ?? "",
    ""
  ].join("\n");
}

function writeExternalSkill(extRoot, directory, content) {
  const directoryPath = path.join(extRoot, directory);

  fs.mkdirSync(directoryPath, { recursive: true });

  fs.writeFileSync(path.join(directoryPath, "SKILL.md"), content, "utf8");
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
    const content =
      definition.raw_content !== undefined
        ? definition.raw_content
        : composeSkillMarkdown({
            name: definition.name || definition.directory,
            description: definition.description || "",
            body: definition.body
          });

    writeExternalSkill(extRoot, definition.directory, content);
  }

  const generatedCount = scenario.generated_external_skills || 0;

  for (let index = 1; index <= generatedCount; index++) {
    const padded = String(index).padStart(4, "0");

    writeExternalSkill(extRoot, `bulk-noise-skill-${padded}`, composeSkillMarkdown({
      name: `bulk-noise-skill-${padded}`,
      description: BULK_DESCRIPTION_TEMPLATES[index % BULK_DESCRIPTION_TEMPLATES.length]
    }));
  }

  return { fakeHome, projectDir, extRoot };
}

/* =========================================================
   RESOLVER EXECUTION
   ========================================================= */

function runResolver(task, projectDir, extRoot, fakeHome) {
  const env = { ...process.env };

  env.HOME = fakeHome;
  env.USERPROFILE = fakeHome;
  env.ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS = extRoot;

  const result =
    spawnSync(
      process.execPath,
      [RESOLVER, "resolve", "--task", task, "--cwd", projectDir],
      {
        encoding: "utf8",
        env,
        cwd: REPO_ROOT,
        timeout: RESOLVER_TIMEOUT_MS,
        windowsHide: true
      }
    );

  if (result.error) {
    return { crashed: true, reason: `failed to start: ${result.error.message}` };
  }

  if (result.status !== 0) {
    return { crashed: true, reason: `exit ${result.status}: ${result.stderr || "(no output)"}` };
  }

  try {
    return { crashed: false, response: JSON.parse(result.stdout) };
  }
  catch (error) {
    return { crashed: true, reason: `unparseable output: ${error.message}` };
  }
}

/* =========================================================
   EVALUATION
   ========================================================= */

function evaluateCase(scenario, outcome) {
  const id = scenario.id;
  const expected = scenario.expected;

  if (outcome.crashed) {
    return {
      id,
      group: scenario.group,
      family: scenario.family,
      crashed: true,
      crash_reason: outcome.reason,
      pass: false,
      expected,
      actual: {
        mode: -1,
        primary: null,
        support: null,
        specialist_count: -1,
        primary_source: null,
        support_source: null,
        external_used: false
      },
      retrieval: {
        identity_evidence_found: false,
        retrieved: false,
        ranked_primary: false,
        matched_identity_terms: []
      },
      failures: [`RESOLVER_CRASH: ${outcome.reason}`],
      classes: ["RESOLVER_CRASH"]
    };
  }

  const response = outcome.response;
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

  if (actual.specialist_count !== expected.mode) {
    failures.push(`MODE_MISMATCH: expected ${expected.mode}, got ${actual.specialist_count}`);
  }

  if (actual.primary !== expected.primary) {
    failures.push(`PRIMARY_MISMATCH: expected ${JSON.stringify(expected.primary)}, got ${JSON.stringify(actual.primary)}`);
  }

  if (actual.support !== expected.support) {
    failures.push(`SUPPORT_MISMATCH: expected ${JSON.stringify(expected.support)}, got ${JSON.stringify(actual.support)}`);
  }

  if (actual.external_used !== expected.external_required) {
    failures.push(`EXTERNAL_REQUIRED_MISMATCH: expected ${expected.external_required}, got ${actual.external_used}`);
  }

  const selectedNames = [primary, support].filter(Boolean);

  for (const forbidden of expected.must_not_select) {
    if (selectedNames.includes(forbidden)) {
      failures.push(`MUST_NOT_SELECT_VIOLATION: ${forbidden} was selected`);
    }
  }

  const matches = (response.retrieval && Array.isArray(response.retrieval.external_matches))
    ? response.retrieval.external_matches
    : [];

  const match = matches.find((entry) => entry.name === expected.primary);

  const retrieval = {
    identity_evidence_found: Boolean(
      match &&
      Array.isArray(match.matched_identity_terms) &&
      match.matched_identity_terms.length
    ),
    matched_identity_terms:
      match && Array.isArray(match.matched_identity_terms)
        ? match.matched_identity_terms
        : [],
    retrieved:
      actual.external_used &&
      (actual.primary === expected.primary || actual.support === expected.primary),
    ranked_primary: actual.primary === expected.primary && primarySource === "external"
  };

  return {
    id,
    group: scenario.group,
    family: scenario.family,
    crashed: false,
    pass: failures.length === 0,
    expected,
    actual,
    retrieval,
    failures,
    classes: []
  };
}

function classifyCase(caseResult) {
  const classes = [];
  const expected = caseResult.expected;
  const actual = caseResult.actual;

  if (caseResult.crashed) {
    return caseResult;
  }

  if (expected.external_required) {
    if (!caseResult.retrieval.retrieved) {
      classes.push("RETRIEVAL_MISS");
    }
    else if (!caseResult.retrieval.ranked_primary) {
      classes.push("RANKING_MISS");
    }
  }

  if (
    (actual.external_used && !expected.external_required) ||
    caseResult.failures.some((failure) => failure.startsWith("MUST_NOT_SELECT_VIOLATION"))
  ) {
    classes.push("FALSE_EXTERNAL_ACTIVATION");
  }

  if (!expected.external_required && actual.primary !== expected.primary) {
    classes.push("PRIMARY_RETRIEVAL_MISS");
  }

  if (actual.support !== expected.support) {
    classes.push("SUPPORT_SELECTION_MISS");
  }

  if (actual.specialist_count !== expected.mode) {
    classes.push("MODE_SELECTION_MISS");
  }

  if (!classes.length && caseResult.failures.length) {
    classes.push("OTHER");
  }

  caseResult.classes = classes;

  return caseResult;
}

/* =========================================================
   METRICS
   ========================================================= */

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function ratio(cases, predicate) {
  if (!cases.length) {
    return null;
  }

  return round4(cases.filter(predicate).length / cases.length);
}

function computeMetrics(cases) {
  const liveCases = cases.filter((item) => !item.crashed);

  const maxSpecialistsObserved =
    liveCases.reduce((max, item) => Math.max(max, item.actual.specialist_count), 0);

  const explicitCases = liveCases.filter((item) => item.group === "A_EXPLICIT_NORMALIZATION");
  const negativeCases = liveCases.filter((item) => item.group === "B_PARTIAL_NEGATIVE");
  const evidenceCases = liveCases.filter((item) => item.group === "C_EVIDENCE_REGRESSION");
  const robustnessCases = liveCases.filter((item) => item.group === "D_ROBUSTNESS_SCALE");
  const mode0Cases = liveCases.filter((item) => item.group === "E_MODE0");

  const negativePass = (item) =>
    item.actual.external_used === false &&
    !item.failures.some((failure) => failure.startsWith("MUST_NOT_SELECT_VIOLATION"));

  const robustnessPass = (item) =>
    item.actual.specialist_count <= 2 &&
    item.response_max_specialists === 2 &&
    item.actual.primary === item.expected.primary &&
    item.actual.external_used === true;

  return {
    scenarios: cases.length,
    mode_accuracy: ratio(liveCases, (item) => item.actual.specialist_count === item.expected.mode),
    primary_accuracy: ratio(liveCases, (item) => item.actual.primary === item.expected.primary),
    support_accuracy: ratio(liveCases, (item) => item.actual.support === item.expected.support),
    exact_route_accuracy: ratio(liveCases, exactRoute),
    explicit_normalized_external_accuracy: ratio(explicitCases, (item) =>
      item.actual.primary === item.expected.primary && item.actual.primary_source === "external"),
    partial_name_negative_pass_rate: ratio(negativeCases, negativePass),
    project_evidence_regression_accuracy: ratio(evidenceCases, (item) =>
      item.actual.primary === item.expected.primary),
    robustness_pass_rate: ratio(robustnessCases, robustnessPass),
    mode0_accuracy: ratio(mode0Cases, (item) =>
      item.actual.specialist_count === 0 && item.actual.external_used === false),
    false_external_activation_count:
      liveCases.filter((item) => item.actual.external_used && !item.expected.external_required).length,
    resolver_crash_count: cases.filter((item) => item.crashed).length,
    max_specialists_observed: maxSpecialistsObserved,
    max_specialists_invariant:
      maxSpecialistsObserved <= 2 && liveCases.every((item) => item.response_max_specialists === 2)
        ? "PASS"
        : "FAIL"
  };
}

function exactRoute(item) {
  return (
    item.actual.specialist_count === item.expected.mode &&
    item.actual.primary === item.expected.primary &&
    item.actual.support === item.expected.support
  );
}

function computeGroupMetrics(cases) {
  const groups = {};

  for (const group of Object.keys(EXPECTED_GROUP_COUNTS)) {
    const groupCases = cases.filter((item) => item.group === group && !item.crashed);

    groups[group] = {
      scenarios: cases.filter((item) => item.group === group).length,
      mode_accuracy: ratio(groupCases, (item) => item.actual.specialist_count === item.expected.mode),
      primary_accuracy: ratio(groupCases, (item) => item.actual.primary === item.expected.primary),
      support_accuracy: ratio(groupCases, (item) => item.actual.support === item.expected.support),
      exact_route_accuracy: ratio(groupCases, exactRoute)
    };
  }

  return groups;
}

function aggregateFailureClasses(cases) {
  const counts = new Map();

  for (const item of cases) {
    for (const className of item.classes) {
      counts.set(className, (counts.get(className) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([className, count]) => ({ class: className, count }));
}

function collectClassIds(cases, className) {
  return cases
    .filter((item) => item.classes.includes(className))
    .map((item) => item.id);
}

/* =========================================================
   GIT METADATA
   ========================================================= */

function runGit(gitArgs) {
  const result =
    spawnSync("git", gitArgs, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      windowsHide: true
    });

  if (result.status !== 0) {
    return null;
  }

  const value = String(result.stdout || "").trim();

  return value || null;
}

/* =========================================================
    PERMANENT BURN GUARD
    ========================================================= */

/*
 * HELDOUT-V5 is permanently burned historical evidence.
 *
 * This runner intentionally refuses to execute evaluation.
 * The committed result artifact is authoritative historical output:
 *   benchmark-results/heldout-v5-candidate-j.json
 *
 * Future routing research requires a freshly authored heldout dataset.
 * Do not add --force, --rerun, --allow-burned, or any bypass.
 */

function refuseBurnedHeldout() {
  console.log("HELDOUT_VERSION=5");
  console.log("HELDOUT_STATUS=BURNED");
  console.log("HELDOUT_EXECUTION=REFUSED");
  console.log("HELDOUT_RESULT_ARTIFACT=benchmark-results/heldout-v5-candidate-j.json");
  process.exit(1);
}

/* =========================================================
    MAIN
    ========================================================= */

function main() {
  refuseBurnedHeldout();

  /*
   * HISTORICAL CODE PRESERVED BELOW - UNREACHABLE
   *
   * The following evaluation logic is preserved for reproducibility
   * reference only. It is unreachable because the burn guard above
   * always exits before this point.
   */

  let options;

  try {
    options = parseArgs(process.argv.slice(2));
  }
  catch (error) {
    console.error(String(error.message || error));
    process.exit(1);
  }

  const fixtures = loadFixtures();
  const cases = [];

  /*
   * One-time evaluation. Crashes are recorded per case (and reported),
   * not used to tune anything; the dataset burns either way.
   */
  for (const scenario of fixtures.scenarios) {
    const tmpRoot =
      fs.mkdtempSync(path.join(os.tmpdir(), "ef-heldout-v5-"));

    try {
      const { fakeHome, projectDir, extRoot } =
        materializeScenarioEnvironment(tmpRoot, scenario);

      const outcome =
        runResolver(scenario.task, projectDir, extRoot, fakeHome);

      const caseResult =
        classifyCase(evaluateCase(scenario, outcome));

      if (!outcome.crashed) {
        caseResult.response_max_specialists = outcome.response.max_specialists;
      }

      cases.push(caseResult);
    }
    finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  }

  const metrics = computeMetrics(cases);

  const report = {
    benchmark_version: HELDOUT_VERSION,
    dataset: DATASET,
    candidate: CANDIDATE,
    mechanism: MECHANISM,
    secondary_regression_mechanism: "INTENT_CONDITIONED_SKILL_RETRIEVAL",
    dataset_status: "burned",
    generated_at: new Date().toISOString(),
    git_branch: runGit(["rev-parse", "--abbrev-ref", "HEAD"]),
    git_commit: runGit(["rev-parse", "HEAD"]),
    rules: fixtures.rules,
    metrics,
    group_metrics: computeGroupMetrics(cases),
    failure_classes: aggregateFailureClasses(cases),
    retrieval_misses: collectClassIds(cases, "RETRIEVAL_MISS"),
    ranking_misses: collectClassIds(cases, "RANKING_MISS"),
    support_misses: collectClassIds(cases, "SUPPORT_SELECTION_MISS"),
    mode_misses: collectClassIds(cases, "MODE_SELECTION_MISS"),
    false_activations: collectClassIds(cases, "FALSE_EXTERNAL_ACTIVATION"),
    crashes: collectClassIds(cases, "RESOLVER_CRASH"),
    new_regressions: [],
    cases
  };

  if (options.write) {
    const writePath = path.resolve(options.write);

    fs.mkdirSync(path.dirname(writePath), { recursive: true });

    fs.writeFileSync(writePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  }
  else {
    console.log(`HELDOUT_VERSION=${HELDOUT_VERSION}`);
    console.log(`DATASET=${DATASET}`);
    console.log(`CANDIDATE=${CANDIDATE}`);
    console.log(`SCENARIOS=${metrics.scenarios}`);
    console.log(`MODE_ACCURACY=${metrics.mode_accuracy}`);
    console.log(`PRIMARY_ACCURACY=${metrics.primary_accuracy}`);
    console.log(`SUPPORT_ACCURACY=${metrics.support_accuracy}`);
    console.log(`EXACT_ROUTE_ACCURACY=${metrics.exact_route_accuracy}`);
    console.log(`EXPLICIT_NORMALIZED_EXTERNAL_ACCURACY=${metrics.explicit_normalized_external_accuracy}`);
    console.log(`PARTIAL_NAME_NEGATIVE_PASS_RATE=${metrics.partial_name_negative_pass_rate}`);
    console.log(`PROJECT_EVIDENCE_REGRESSION_ACCURACY=${metrics.project_evidence_regression_accuracy}`);
    console.log(`ROBUSTNESS_PASS_RATE=${metrics.robustness_pass_rate}`);
    console.log(`MODE0_ACCURACY=${metrics.mode0_accuracy}`);
    console.log(`FALSE_EXTERNAL_ACTIVATION_COUNT=${metrics.false_external_activation_count}`);
    console.log(`RESOLVER_CRASH_COUNT=${metrics.resolver_crash_count}`);
    console.log(`MAX_SPECIALISTS_OBSERVED=${metrics.max_specialists_observed}`);
    console.log(`MAX_SPECIALISTS_INVARIANT=${metrics.max_specialists_invariant}`);

    for (const [group, stats] of Object.entries(report.group_metrics)) {
      console.log(
        `GROUP_${group}: scenarios=${stats.scenarios}` +
        ` mode=${stats.mode_accuracy}` +
        ` primary=${stats.primary_accuracy}` +
        ` support=${stats.support_accuracy}` +
        ` exact=${stats.exact_route_accuracy}`
      );
    }
  }

  if (metrics.max_specialists_invariant === "FAIL") {
    console.error("HELDOUT_FATAL=MAX_SPECIALISTS_INVARIANT_VIOLATED");
    process.exit(1);
  }
}

main();
