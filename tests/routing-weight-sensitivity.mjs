#!/usr/bin/env node
/*
 * Read-only weight-sensitivity diagnostic harness.
 *
 * Forks the production resolver with weight overrides only.
 * All other routing behavior is preserved exactly.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const RESOLVER_SOURCE = path.join(REPO_ROOT, "skills", "engineer-flow", "scripts", "engineer-flow.mjs");
const CALIBRATION = path.join(REPO_ROOT, "tests", "routing-calibration-v7.json");
const TARGETED = path.join(REPO_ROOT, "benchmark-results", "calibration-v7-targeted-term-refinement.json");

function createModifiedResolver(outputPath, termWeight, nameWeight) {
  let source = fs.readFileSync(RESOLVER_SOURCE, "utf8");

  source = source.replace(
    /const ROUTING_TERM_WEIGHT = \d+;/,
    `const ROUTING_TERM_WEIGHT = ${termWeight};`
  );
  source = source.replace(
    /const NAME_MATCH_WEIGHT = \d+;/,
    `const NAME_MATCH_WEIGHT = ${nameWeight};`
  );

  fs.writeFileSync(outputPath, source, "utf8");
  return outputPath;
}

function runResolver(resolverPath, task, projectDir, extRoot) {
  const env = { ...process.env };
  env.HOME = path.dirname(projectDir);
  env.USERPROFILE = path.dirname(projectDir);
  if (extRoot) env.ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS = extRoot;

  const result = spawnSync(process.execPath, [resolverPath, "resolve", "--task", task, "--cwd", projectDir], {
    encoding: "utf8",
    env,
    cwd: REPO_ROOT,
    timeout: 180000,
    windowsHide: true
  });

  if (result.status !== 0) return null;
  try { return JSON.parse(result.stdout); }
  catch { return null; }
}

function materializeEnvironment(tmpRoot, scenario) {
  const projectDir = path.join(tmpRoot, "project");
  const extRoot = path.join(tmpRoot, "external-skills");

  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(extRoot, { recursive: true });

  for (const [rel, content] of Object.entries(scenario.project_files || {})) {
    const target = path.resolve(projectDir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  }

  for (const def of scenario.external_skills || []) {
    const content =
      def.raw_content ||
      `---\nname: ${def.name || def.directory}\ndescription: ${def.description || ""}\n---\n\n${def.body || ""}\n`;
    fs.mkdirSync(path.join(extRoot, def.directory), { recursive: true });
    fs.writeFileSync(path.join(extRoot, def.directory, "SKILL.md"), content, "utf8");
  }

  return { projectDir, extRoot };
}

function simulateConfig(termWeight, nameWeight, calibrationData, actualMap) {
  const tmpDir = fs.mkdtempSync(path.join(REPO_ROOT, "tmp-weight-sim-"));
  const resolverPath = path.join(path.dirname(RESOLVER_SOURCE), "engineer-flow-modified.mjs");
  try {
    createModifiedResolver(resolverPath, termWeight, nameWeight);

    let primaryCorrect = 0;
    let exactRoute = 0;
    let falseFrontend = 0;
    let falseTesting = 0;
    let falseSecurity = 0;
    let falseExternal = 0;
    let groupBWrongPrimary = 0;
    let mustNotSelectViolations = 0;
    const differingCases = [];
    const total = calibrationData.scenarios.length;

    for (const scenario of calibrationData.scenarios) {
      const id = scenario.id;
      const actual = actualMap.get(id);
      if (!actual) continue;

      const { projectDir, extRoot } = materializeEnvironment(tmpDir, scenario);

      const resolution = runResolver(resolverPath, scenario.task, projectDir, extRoot);
      if (!resolution) continue;

      const simPrimary = resolution.primary?.name || null;
      const simSupport = resolution.support?.name || null;
      const simMode = resolution.specialist_count || 0;
      const simPrimarySource = resolution.primary?.source || null;
      const simSupportSource = resolution.support?.source || null;

      const expectedPrimary = scenario.expected.primary;
      const expectedSupport = scenario.expected.support;
      const expectedMode = scenario.expected.mode;
      const externalRequired = scenario.expected.external_required;
      const mustNotSelect = scenario.expected.must_not_select || [];

      if (simPrimary === expectedPrimary) primaryCorrect++;

      const exactMatch = simPrimary === expectedPrimary && simSupport === expectedSupport;
      if (exactMatch) exactRoute++;

      if (scenario.group === "B_SUPPORT_COMPOSITION" && simPrimary !== expectedPrimary) {
        groupBWrongPrimary++;
      }

      const selected = [simPrimary, simSupport].filter(Boolean);
      for (const forbidden of mustNotSelect) {
        if (selected.includes(forbidden)) {
          mustNotSelectViolations++;
        }
      }

      const selectedFrontend = simPrimary === "frontend-ui" || simSupport === "frontend-ui";
      const expectedFrontend = expectedPrimary === "frontend-ui" || expectedSupport === "frontend-ui";
      if (selectedFrontend && !expectedFrontend) {
        falseFrontend++;
      }

      const selectedTesting = simPrimary === "testing" || simSupport === "testing";
      const expectedTesting = expectedPrimary === "testing" || expectedSupport === "testing";
      if (selectedTesting && !expectedTesting) {
        falseTesting++;
      }

      const selectedSecurity = simPrimary === "security" || simSupport === "security";
      const expectedSecurity = expectedPrimary === "security" || expectedSupport === "security";
      if (selectedSecurity && !expectedSecurity) {
        falseSecurity++;
      }

      const externalSelected = simPrimarySource === "external" || simSupportSource === "external";
      if (externalSelected && !externalRequired) {
        falseExternal++;
      }

      if (simPrimary !== actual.actual.primary || simSupport !== actual.actual.support || simMode !== actual.actual.specialist_count) {
        differingCases.push(id);
      }
    }

    return {
      name: `term=${termWeight}_name=${nameWeight}`,
      primaryCorrect,
      primaryAccuracy: primaryCorrect / total,
      exactRoute,
      exactAccuracy: exactRoute / total,
      falseFrontend,
      falseTesting,
      falseSecurity,
      falseExternal,
      groupBWrongPrimary,
      mustNotSelectViolations,
      differingCases
    };
  }
  finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    try { fs.unlinkSync(resolverPath); } catch {}
  }
}

function main() {
  const calibrationData = JSON.parse(fs.readFileSync(CALIBRATION, "utf8"));
  const targetedData = JSON.parse(fs.readFileSync(TARGETED, "utf8"));
  const actualMap = new Map(targetedData.cases.map(c => [c.id, c]));

  const configs = [
    { termWeight: 1, nameWeight: 3 },
    { termWeight: 1, nameWeight: 0 },
    { termWeight: 2, nameWeight: 2 },
    { termWeight: 1, nameWeight: 2 }
  ];

  for (const config of configs) {
    const result = simulateConfig(config.termWeight, config.nameWeight, calibrationData, actualMap);
    console.log(
      `${result.name}: PRIMARY=${result.primaryAccuracy.toFixed(4)} EXACT=${result.exactAccuracy.toFixed(4)} ` +
      `FALSE_FRONTEND=${result.falseFrontend} FALSE_TESTING=${result.falseTesting} FALSE_SECURITY=${result.falseSecurity} ` +
      `FALSE_EXTERNAL=${result.falseExternal} GROUP_B_WRONG=${result.groupBWrongPrimary} ` +
      `MUST_NOT=${result.mustNotSelectViolations} DIFF=${result.differingCases.length}`
    );
  }
}

main();
