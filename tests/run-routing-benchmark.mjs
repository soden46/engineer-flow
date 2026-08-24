#!/usr/bin/env node
/*
 * Calibration V4 routing benchmark runner.
 *
 * Executes the PRODUCTION resolver (skills/engineer-flow/scripts/engineer-flow.mjs)
 * as a child process inside a fully isolated environment per scenario:
 *   - isolated temporary root
 *   - isolated fake HOME / USERPROFILE so the developer machine's
 *     ~/.agents/skills cannot contaminate results
 *   - isolated temporary project directory with materialized project_files
 *   - isolated external skill root advertised via ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS
 *
 * The runner never mocks, imports, or reimplements resolver routing logic.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RUNNER_DIR =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const REPO_ROOT =
  path.resolve(
    RUNNER_DIR,
    ".."
  );

const RESOLVER =
  path.join(
    REPO_ROOT,
    "skills",
    "engineer-flow",
    "scripts",
    "engineer-flow.mjs"
  );

const SCENARIOS_FILE =
  path.join(
    RUNNER_DIR,
    "routing-scenarios.json"
  );

const BENCHMARK_VERSION = 4;
const DATASET = "calibration-v4";
const RESOLVER_TIMEOUT_MS = 120000;

class FatalError extends Error {}

/* =========================================================
   CLI
   ========================================================= */

function parseArgs(argv) {
  const options = {
    json: false,
    write: null
  };

  for (
    let index = 0;
    index < argv.length;
    index++
  ) {
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
  let raw;

  try {
    raw = fs.readFileSync(SCENARIOS_FILE, "utf8");
  }
  catch (error) {
    throw new FatalError(`cannot read fixtures: ${error.message}`);
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  }
  catch (error) {
    throw new FatalError(`fixtures are not valid JSON: ${error.message}`);
  }

  const problems = [];

  if (parsed.version !== 4) {
    problems.push("version must be 4");
  }

  if (parsed.dataset !== DATASET) {
    problems.push(`dataset must be ${DATASET}`);
  }

  const rules = parsed.rules || {};

  if (rules.heldout_v2_reuse !== false) problems.push("rules.heldout_v2_reuse must be false");
  if (rules.heldout_v3_reuse !== false) problems.push("rules.heldout_v3_reuse must be false");
  if (rules.technology_hardcoding !== false) problems.push("rules.technology_hardcoding must be false");
  if (rules.max_specialists !== 2) problems.push("rules.max_specialists must be 2");

  if (!Array.isArray(parsed.scenarios)) {
    problems.push("scenarios must be an array");
  }
  else if (parsed.scenarios.length !== 12) {
    problems.push(`expected exactly 12 calibration scenarios, found ${parsed.scenarios.length}`);
  }
  else {
    const seenIds = new Set();

    parsed.scenarios.forEach((scenario, index) => {
      validateScenario(scenario, index, seenIds, problems);
    });
  }

  if (problems.length) {
    throw new FatalError(
      `invalid benchmark fixtures:\n  - ${problems.join("\n  - ")}`
    );
  }

  return parsed;
}

function validateScenario(scenario, index, seenIds, problems) {
  const label = `scenario[${index}]`;

  if (!scenario || typeof scenario !== "object") {
    problems.push(`${label}: must be an object`);
    return;
  }

  if (typeof scenario.id !== "string" || !scenario.id.trim()) {
    problems.push(`${label}: id is required`);
    return;
  }

  const id = scenario.id;

  if (seenIds.has(id)) {
    problems.push(`${id}: duplicate scenario id`);
  }

  seenIds.add(id);

  if (typeof scenario.family !== "string" || !scenario.family.trim()) {
    problems.push(`${id}: family is required`);
  }

  if (typeof scenario.task !== "string" || !scenario.task.trim()) {
    problems.push(`${id}: task is required`);
  }

  const expected = scenario.expected;

  if (
    !expected ||
    typeof expected !== "object" ||
    ![0, 1, 2].includes(expected.mode)
  ) {
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
      scenario.external_skills.forEach((definition) => {
        if (!definition || typeof definition.directory !== "string" || !/^[A-Za-z0-9._-]+$/.test(definition.directory)) {
          problems.push(`${id}: external skill directory must be a safe name`);
          return;
        }

        if (definition.raw_content !== undefined && typeof definition.raw_content !== "string") {
          problems.push(`${id}: raw_content must be a string`);
        }
      });
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
   TEMPORARY ENVIRONMENT MATERIALIZATION
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
  const body = definition.body ?? "";

  return [
    "---",
    `name: ${definition.name}`,
    `description: ${definition.description}`,
    "---",
    "",
    body,
    ""
  ].join("\n");
}

function writeExternalSkill(extRoot, directory, content) {
  const directoryPath =
    path.join(extRoot, directory);

  fs.mkdirSync(directoryPath, { recursive: true });

  fs.writeFileSync(
    path.join(directoryPath, "SKILL.md"),
    content,
    "utf8"
  );
}

function materializeScenarioEnvironment(tmpRoot, scenario) {
  const fakeHome =
    path.join(tmpRoot, "home");

  const projectDir =
    path.join(tmpRoot, "project");

  const extRoot =
    path.join(tmpRoot, "external-skills");

  fs.mkdirSync(path.join(fakeHome, ".agents", "skills"), { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(extRoot, { recursive: true });

  for (const [relativePath, content] of Object.entries(scenario.project_files || {})) {
    const target =
      path.resolve(projectDir, relativePath);

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

  /*
   * Full home isolation: the resolver derives the canonical
   * ~/.agents/skills location from os.homedir(), which reads
   * USERPROFILE on Windows and HOME on POSIX.
   */
  env.HOME = fakeHome;
  env.USERPROFILE = fakeHome;
  env.ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS = extRoot;

  const result =
    spawnSync(
      process.execPath,
      [
        RESOLVER,
        "resolve",
        "--task",
        task,
        "--cwd",
        projectDir
      ],
      {
        encoding: "utf8",
        env,
        cwd: REPO_ROOT,
        timeout: RESOLVER_TIMEOUT_MS,
        windowsHide: true
      }
    );

  if (result.error) {
    throw new FatalError(`resolver process failed to start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new FatalError(
      `resolver exited with status ${result.status}:\n${result.stderr || result.stdout || "(no output)"}`
    );
  }

  try {
    return JSON.parse(result.stdout);
  }
  catch (error) {
    throw new FatalError(`resolver produced unparseable output: ${error.message}`);
  }
}

/* =========================================================
   EVALUATION
   ========================================================= */

function evaluateCase(scenario, response) {
  const actual = {
    mode: response.specialist_count,
    primary: response.primary ? response.primary.name : null,
    support: response.support ? response.support.name : null,
    specialist_count: response.specialist_count,
    external_used:
      Boolean(response.primary && response.primary.source === "external") ||
      Boolean(response.support && response.support.source === "external")
  };

  const expected = scenario.expected;
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

  const selectedNames =
    [actual.primary, actual.support].filter(Boolean);

  for (const forbidden of expected.must_not_select) {
    if (selectedNames.includes(forbidden)) {
      failures.push(`MUST_NOT_SELECT_VIOLATION: ${forbidden} was selected`);
    }
  }

  return {
    id: scenario.id,
    family: scenario.family,
    pass: failures.length === 0,
    expected: {
      mode: expected.mode,
      primary: expected.primary,
      support: expected.support,
      external_required: expected.external_required,
      must_not_select: expected.must_not_select,
      max_specialists: expected.max_specialists
    },
    actual,
    failures,
    classes: []
  };
}

/*
 * Failure-class analysis. Routing misses are baseline data; classes are
 * descriptive labels only. No resolver behavior may be changed here.
 */
function classifyCase(caseResult) {
  const classes = [];
  const expected = caseResult.expected;
  const actual = caseResult.actual;

  if (caseResult.family === "project-evidence" && actual.primary !== expected.primary) {
    classes.push("PROJECT_EVIDENCE_NOT_USED");
  }

  if (
    (actual.external_used && !expected.external_required) ||
    caseResult.failures.some((failure) => failure.startsWith("MUST_NOT_SELECT_VIOLATION"))
  ) {
    classes.push("FALSE_EXTERNAL_ACTIVATION");
  }

  if (actual.primary !== expected.primary) {
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
   GIT METADATA
   ========================================================= */

function runGit(gitArgs) {
  const result =
    spawnSync(
      "git",
      gitArgs,
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
        windowsHide: true
      }
    );

  if (result.status !== 0) {
    return null;
  }

  const value = String(result.stdout || "").trim();

  return value || null;
}

/* =========================================================
   METRICS AND REPORT
   ========================================================= */

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function computeMetrics(cases) {
  const total = cases.length;

  const matches = (predicate) =>
    cases.filter(predicate).length;

  const modeAccuracy = matches((item) => item.actual.specialist_count === item.expected.mode) / total;
  const primaryAccuracy = matches((item) => item.actual.primary === item.expected.primary) / total;
  const supportAccuracy = matches((item) => item.actual.support === item.expected.support) / total;
  const exactRouteAccuracy =
    matches((item) =>
      item.actual.specialist_count === item.expected.mode &&
      item.actual.primary === item.expected.primary &&
      item.actual.support === item.expected.support
    ) / total;
  const externalRequiredAccuracy =
    matches((item) => item.actual.external_used === item.expected.external_required) / total;
  const falseExternalActivationCount =
    matches((item) => item.actual.external_used && !item.expected.external_required);
  const maxSpecialistsObserved =
    cases.reduce((max, item) => Math.max(max, item.actual.specialist_count), 0);

  return {
    mode_accuracy: round4(modeAccuracy),
    primary_accuracy: round4(primaryAccuracy),
    support_accuracy: round4(supportAccuracy),
    exact_route_accuracy: round4(exactRouteAccuracy),
    external_required_accuracy: round4(externalRequiredAccuracy),
    false_external_activation_count: falseExternalActivationCount,
    max_specialists_observed: maxSpecialistsObserved,
    max_specialists_invariant: "PASS"
  };
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

/* =========================================================
   MAIN
   ========================================================= */

function main() {
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
  const tmpRootsToClean = [];
  let fatal = null;
  let invariantHolds = true;

  for (const scenario of fixtures.scenarios) {
    const tmpRoot =
      fs.mkdtempSync(
        path.join(os.tmpdir(), "ef-calib-v4-")
      );

    tmpRootsToClean.push(tmpRoot);

    try {
      const { fakeHome, projectDir, extRoot } =
        materializeScenarioEnvironment(tmpRoot, scenario);

      const response =
        runResolver(scenario.task, projectDir, extRoot, fakeHome);

      if (response.max_specialists !== 2) {
        invariantHolds = false;
      }

      cases.push(classifyCase(evaluateCase(scenario, response)));
    }
    catch (error) {
      fatal = error;
      break;
    }
    finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  }

  if (fatal) {
    console.error(`BENCHMARK_FATAL=${fatal.message}`);
    process.exit(1);
  }

  const metrics = computeMetrics(cases);

  if (metrics.max_specialists_observed > 2 || !invariantHolds) {
    metrics.max_specialists_invariant = "FAIL";
  }

  const report = {
    benchmark_version: BENCHMARK_VERSION,
    dataset: DATASET,
    generated_at: new Date().toISOString(),
    git_branch: runGit(["rev-parse", "--abbrev-ref", "HEAD"]),
    git_commit: runGit(["rev-parse", "HEAD"]),
    rules: fixtures.rules,
    metrics: {
      scenarios: cases.length,
      ...metrics
    },
    failure_classes: aggregateFailureClasses(cases),
    cases
  };

  if (options.write) {
    const writePath =
      path.resolve(options.write);

    fs.mkdirSync(path.dirname(writePath), { recursive: true });

    fs.writeFileSync(writePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  }
  else {
    console.log(`ROUTING_BENCHMARK_VERSION=${BENCHMARK_VERSION}`);
    console.log(`DATASET=${DATASET}`);
    console.log(`SCENARIOS=${report.metrics.scenarios}`);
    console.log(`MODE_ACCURACY=${report.metrics.mode_accuracy}`);
    console.log(`PRIMARY_ACCURACY=${report.metrics.primary_accuracy}`);
    console.log(`SUPPORT_ACCURACY=${report.metrics.support_accuracy}`);
    console.log(`EXACT_ROUTE_ACCURACY=${report.metrics.exact_route_accuracy}`);
    console.log(`EXTERNAL_REQUIRED_ACCURACY=${report.metrics.external_required_accuracy}`);
    console.log(`FALSE_EXTERNAL_ACTIVATION_COUNT=${report.metrics.false_external_activation_count}`);
    console.log(`MAX_SPECIALISTS_OBSERVED=${report.metrics.max_specialists_observed}`);
    console.log(`MAX_SPECIALISTS_INVARIANT=${report.metrics.max_specialists_invariant}`);
  }

  /*
   * Routing misses are baseline data and never fail the run.
   * Only fixture errors, runner errors, resolver crashes, and
   * MAX_SPECIALISTS violations exit non-zero.
   */
  if (metrics.max_specialists_invariant === "FAIL") {
    console.error("BENCHMARK_FATAL=MAX_SPECIALISTS_INVARIANT_VIOLATED");
    process.exit(1);
  }
}

main();
