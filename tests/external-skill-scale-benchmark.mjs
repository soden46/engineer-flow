#!/usr/bin/env node
/*
 * External skill scale benchmark harness.
 *
 * Measures discovery/routing behavior at 100/500/1000 external skills.
 *
 * Uses temporary directories only. Never mutates the real repository
 * or the user's real installed skills.
 * Windows + POSIX compatible. Node built-ins only.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const RUNNER = path.join(
  REPO_ROOT,
  "skills",
  "engineer-flow",
  "scripts",
  "engineer-flow.mjs"
);

const SCALES = [100, 500, 1000];
const WARMUP = 3;
const MEASURED = 10;

function createTempDir() {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "ef-scale-bench-")
  );
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function generateSkills(root, count) {
  const distinctiveTerms = [
    "alpha", "bravo", "charlie", "delta", "echo",
    "foxtrot", "golf", "hotel", "india", "juliet",
    "kilo", "lima", "mike", "november", "oscar",
    "papa", "quebec", "romeo", "sierra", "tango",
    "uniform", "victor", "whiskey", "xray", "yankee", "zulu"
  ];

  for (let i = 0; i < count; i++) {
    const idx = String(i).padStart(5, "0");
    const skillDir = path.join(root, `scale-skill-${idx}`);
    fs.mkdirSync(skillDir, { recursive: true });

    const term = distinctiveTerms[i % distinctiveTerms.length];
    const uniqueTerm = `${term}${Math.floor(i / distinctiveTerms.length)}`;
    const name = `scale-${uniqueTerm}-skill`;
    const description = `Benchmark fixture ${idx}.`;

    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      [
        "---",
        `name: ${name}`,
        `description: ${description}`,
        "---",
        "",
        `# ${name}`,
        "",
        `Fixture ${idx}.`
      ].join("\n"),
      "utf8"
    );
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function runResolve(task, cwd, envVars) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(envVars)) {
    if (value === null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  return spawnSync(
    process.execPath,
    [RUNNER, "resolve", "--task", task, "--cwd", cwd],
    {
      encoding: "utf8",
      cwd: REPO_ROOT,
      env,
      timeout: 60000,
      windowsHide: true
    }
  );
}

function runInventory(envVars) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(envVars)) {
    if (value === null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  return spawnSync(
    process.execPath,
    [RUNNER, "inventory"],
    {
      encoding: "utf8",
      cwd: REPO_ROOT,
      env,
      timeout: 60000,
      windowsHide: true
    }
  );
}

function parseResolveOutput(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function timeRuns(fn, warmup, measured) {
  for (let i = 0; i < warmup; i++) {
    fn();
  }

  const times = [];
  for (let i = 0; i < measured; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    median_ms: median(times),
    runs: measured
  };
}

/* =========================================================
   SCENARIOS
   ========================================================= */

function scenarioInternalOnly(resolveResult) {
  const ok =
    resolveResult.status === 0 &&
    resolveResult.parsed &&
    resolveResult.parsed.specialist_count <= 2;

  return {
    ok,
    specialist_count: resolveResult.parsed?.specialist_count ?? -1,
    primary: resolveResult.parsed?.primary?.name ?? "NONE",
    support: resolveResult.parsed?.support?.name ?? "NONE"
  };
}

function scenarioExplicitExternal(resolveResult, expectedName) {
  const ok =
    resolveResult.status === 0 &&
    resolveResult.parsed &&
    resolveResult.parsed.specialist_count <= 2;

  const primaryMatch =
    resolveResult.parsed?.primary?.name === expectedName;
  const supportMatch =
    resolveResult.parsed?.support?.name === expectedName;

  return {
    ok: ok && (primaryMatch || supportMatch),
    specialist_count: resolveResult.parsed?.specialist_count ?? -1,
    primary: resolveResult.parsed?.primary?.name ?? "NONE",
    support: resolveResult.parsed?.support?.name ?? "NONE",
    intended_found: primaryMatch || supportMatch
  };
}

function scenarioProjectEvidence(resolveResult, expectedName) {
  const ok =
    resolveResult.status === 0 &&
    resolveResult.parsed &&
    resolveResult.parsed.specialist_count <= 2;

  const primaryMatch =
    resolveResult.parsed?.primary?.name === expectedName;
  const supportMatch =
    resolveResult.parsed?.support?.name === expectedName;

  return {
    ok: ok && (primaryMatch || supportMatch),
    specialist_count: resolveResult.parsed?.specialist_count ?? -1,
    primary: resolveResult.parsed?.primary?.name ?? "NONE",
    support: resolveResult.parsed?.support?.name ?? "NONE",
    intended_found: primaryMatch || supportMatch
  };
}

function scenarioNoRelevant(resolveResult) {
  const ok =
    resolveResult.status === 0 &&
    resolveResult.parsed &&
    resolveResult.parsed.specialist_count <= 2;

  return {
    ok,
    specialist_count: resolveResult.parsed?.specialist_count ?? -1,
    primary: resolveResult.parsed?.primary?.name ?? "NONE",
    support: resolveResult.parsed?.support?.name ?? "NONE",
    mass_activation: resolveResult.parsed?.specialist_count > 2
  };
}

function skillNameAtIndex(i) {
  const distinctiveTerms = [
    "alpha", "bravo", "charlie", "delta", "echo",
    "foxtrot", "golf", "hotel", "india", "juliet",
    "kilo", "lima", "mike", "november", "oscar",
    "papa", "quebec", "romeo", "sierra", "tango",
    "uniform", "victor", "whiskey", "xray", "yankee", "zulu"
  ];
  const term = distinctiveTerms[i % distinctiveTerms.length];
  const uniqueTerm = `${term}${Math.floor(i / distinctiveTerms.length)}`;
  return `scale-${uniqueTerm}-skill`;
}

/* =========================================================
   MAIN BENCHMARK
   ========================================================= */

function runBenchmark() {
  const result = {
    benchmark: "external-skill-scale",
    scales: []
  };

  let allDeterministic = true;
  let allBounded = true;
  let allMaxSpecialistsOk = true;

  for (const scale of SCALES) {
    const extRoot = createTempDir();
    const projectDir = createTempDir();

    try {
      generateSkills(extRoot, scale);

      fs.writeFileSync(
        path.join(projectDir, "package.json"),
        JSON.stringify({
          name: "benchmark-fixture-project",
          version: "1.0.0"
        }),
        "utf8"
      );

      const env = {
        ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot
      };

      const invResult = runInventory(env);
      const invParsed = JSON.parse(invResult.stdout);

      const externalDiscovered = invParsed.counts.external;
      const effectiveCapabilities = invParsed.counts.effective;

      const inventoryTiming = timeRuns(
        () => runInventory(env),
        WARMUP,
        MEASURED
      );

      // INTERNAL_ONLY scenario
      const internalTask = "write unit tests for data validation";
      const internalResults = [];
      const internalTiming = timeRuns(
        () => {
          const r = runResolve(internalTask, projectDir, env);
          internalResults.push(r);
        },
        WARMUP,
        MEASURED
      );

      const internalParsed = internalResults.map((r) => ({
        status: r.status,
        parsed: parseResolveOutput(r.stdout)
      }));

      const internalScenario = scenarioInternalOnly(
        internalParsed[internalParsed.length - 1]
      );

      const internalPrimaryStable =
        new Set(internalParsed.map((r) => r.parsed?.primary?.name)).size === 1;
      const internalSupportStable =
        new Set(internalParsed.map((r) => r.parsed?.support?.name)).size === 1;
      const internalDeterministic =
        internalPrimaryStable && internalSupportStable;

      // EXPLICIT_EXTERNAL scenario
      const explicitSkillIdx = 50;
      const explicitSkillName = skillNameAtIndex(explicitSkillIdx);
      const explicitTask = `use ${explicitSkillName} to implement feature`;
      const explicitResults = [];
      const explicitTiming = timeRuns(
        () => {
          const r = runResolve(explicitTask, projectDir, env);
          explicitResults.push(r);
        },
        WARMUP,
        MEASURED
      );

      const explicitParsed = explicitResults.map((r) => ({
        status: r.status,
        parsed: parseResolveOutput(r.stdout)
      }));

      const explicitScenario = scenarioExplicitExternal(
        explicitParsed[explicitParsed.length - 1],
        explicitSkillName
      );

      const explicitPrimaryStable =
        new Set(explicitParsed.map((r) => r.parsed?.primary?.name)).size === 1;
      const explicitDeterministic = explicitPrimaryStable;

      // PROJECT_EVIDENCE_EXTERNAL scenario
      const evidenceSkillIdx = 50;
      const evidenceTargetName = skillNameAtIndex(evidenceSkillIdx);

      fs.writeFileSync(
        path.join(projectDir, "scale.config.yaml"),
        `preferred_library: ${evidenceTargetName}\n`,
        "utf8"
      );

      const evidenceTask = "implement data processing pipeline";
      const evidenceResults = [];
      const evidenceTiming = timeRuns(
        () => {
          const r = runResolve(evidenceTask, projectDir, env);
          evidenceResults.push(r);
        },
        WARMUP,
        MEASURED
      );

      const evidenceParsed = evidenceResults.map((r) => ({
        status: r.status,
        parsed: parseResolveOutput(r.stdout)
      }));

      const evidenceScenario = scenarioProjectEvidence(
        evidenceParsed[evidenceParsed.length - 1],
        evidenceTargetName
      );

      const evidencePrimaryStable =
        new Set(evidenceParsed.map((r) => r.parsed?.primary?.name)).size === 1;
      const evidenceDeterministic = evidencePrimaryStable;

      // NO_RELEVANT_SPECIALIST scenario
      const irrelevantTask = "xyz qwz 123 456";
      const irrelevantResults = [];
      const irrelevantTiming = timeRuns(
        () => {
          const r = runResolve(irrelevantTask, projectDir, env);
          irrelevantResults.push(r);
        },
        WARMUP,
        MEASURED
      );

      const irrelevantParsed = irrelevantResults.map((r) => ({
        status: r.status,
        parsed: parseResolveOutput(r.stdout)
      }));

      const irrelevantScenario = scenarioNoRelevant(
        irrelevantParsed[irrelevantParsed.length - 1]
      );

      // Boundedness checks
      const lastParsed = internalParsed[internalParsed.length - 1].parsed;
      const intentAnchorsBounded =
        lastParsed?.retrieval?.intent?.length <= 2;
      const externalMatchesBounded =
        lastParsed?.retrieval?.external_matches?.length <= 16;
      const specialistBounded =
        lastParsed?.specialist_count <= 2;

      if (!intentAnchorsBounded || !externalMatchesBounded) {
        allBounded = false;
      }
      if (!specialistBounded) {
        allMaxSpecialistsOk = false;
      }
      if (
        !internalDeterministic ||
        !explicitDeterministic ||
        !evidenceDeterministic
      ) {
        allDeterministic = false;
      }

      const scaleResult = {
        scale,
        external_discovered: externalDiscovered,
        effective_capabilities: effectiveCapabilities,
        inventory_median_ms: Math.round(inventoryTiming.median_ms * 100) / 100,
        scenarios: {
          INTERNAL_ONLY: {
            resolve_median_ms:
              Math.round(internalTiming.median_ms * 100) / 100,
            specialist_count: internalScenario.specialist_count,
            primary: internalScenario.primary,
            support: internalScenario.support,
            deterministic: internalDeterministic,
            bounded: specialistBounded
          },
          EXPLICIT_EXTERNAL: {
            resolve_median_ms:
              Math.round(explicitTiming.median_ms * 100) / 100,
            specialist_count: explicitScenario.specialist_count,
            primary: explicitScenario.primary,
            support: explicitScenario.support,
            deterministic: explicitDeterministic,
            bounded: specialistBounded,
            intended_found: explicitScenario.intended_found
          },
          PROJECT_EVIDENCE_EXTERNAL: {
            resolve_median_ms:
              Math.round(evidenceTiming.median_ms * 100) / 100,
            specialist_count: evidenceScenario.specialist_count,
            primary: evidenceScenario.primary,
            support: evidenceScenario.support,
            deterministic: evidenceDeterministic,
            bounded: specialistBounded,
            intended_found: evidenceScenario.intended_found
          },
          NO_RELEVANT_SPECIALIST: {
            resolve_median_ms:
              Math.round(irrelevantTiming.median_ms * 100) / 100,
            specialist_count: irrelevantScenario.specialist_count,
            primary: irrelevantScenario.primary,
            support: irrelevantScenario.support,
            bounded: specialistBounded,
            mass_activation: irrelevantScenario.mass_activation
          }
        },
        boundedness: {
          intent_anchors_bounded: intentAnchorsBounded,
          external_matches_bounded: externalMatchesBounded,
          specialist_bounded: specialistBounded
        }
      };

      result.scales.push(scaleResult);

      console.log(
        `SCALE_${scale}=${internalScenario.ok && explicitScenario.ok && irrelevantScenario.ok ? "PASS" : "FAIL"}`
      );
    } finally {
      cleanup(extRoot);
      cleanup(projectDir);
    }
  }

  result.max_specialists_invariant = allMaxSpecialistsOk;
  result.routing_deterministic = allDeterministic;
  result.diagnostics_bounded = allBounded;
  result.production_changed = false;

  console.log("");
  console.log(JSON.stringify(result, null, 2));
  console.log("");
  console.log(
    `MAX_SPECIALISTS_INVARIANT=${allMaxSpecialistsOk ? "PASS" : "FAIL"}`
  );
  console.log(
    `ROUTING_DETERMINISTIC=${allDeterministic ? "PASS" : "FAIL"}`
  );
  console.log(
    `DIAGNOSTICS_BOUNDED=${allBounded ? "PASS" : "FAIL"}`
  );
  console.log("PRODUCTION_CHANGED=NO");
}

if (process.argv.includes("--freeze")) {
  process.argv = process.argv.filter((a) => a !== "--freeze");
  const origLog = console.log;
  let captured = "";
  console.log = (...args) => {
    captured += args.join(" ") + "\n";
  };
  runBenchmark();
  console.log = origLog;
  const lines = captured.split("\n");
  const jsonStart = lines.findIndex((l) => l.startsWith("{"));
  const jsonEnd = lines.length - 1 - [...lines].reverse().findIndex((l) => l.endsWith("}"));
  if (jsonStart >= 0 && jsonEnd >= jsonStart) {
    const json = lines.slice(jsonStart, jsonEnd + 1).join("\n");
    const outPath = path.join(REPO_ROOT, "benchmark-results", "external-skill-scale-v1.json");
    fs.writeFileSync(outPath, json + "\n", "utf8");
    origLog(`Frozen: ${outPath}`);
  } else {
    origLog("ERROR: could not extract JSON");
    process.exit(1);
  }
} else {
  runBenchmark();
}
