#!/usr/bin/env node
/*
 * Focused tests for Candidate J:
 * SYMMETRIC_EXPLICIT_SKILL_NAME_NORMALIZATION inside scoreSkill().
 *
 * Uses synthetic skill identities only (no framework knowledge).
 * Exercises the REAL resolver subprocess inside a fully isolated
 * environment so no internal function needs to be exported.
 *
 * The tested skills carry deliberately unrelated description
 * vocabulary, so ordinary lexical overlap contributes zero points and
 * selection can only happen through the explicit-name bonus.
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

const SKILL_ALPHA = {
  directory: "cache-query-optimizer",
  name: "cache-query-optimizer",
  description:
    "Synthetic specialist alpha for verification runs: zephyr calculations, lantern arrangements, and mosaic scheduling.",
  body: "# cache-query-optimizer\n\n## Zephyr Calculations\n\n## Lantern Arrangements\n"
};

const SKILL_BETA = {
  directory: "marble-fountain-restorer",
  name: "marble-fountain-restorer",
  description:
    "Synthetic specialist beta for verification runs: harbor sketches, cinder taxonomies, and velvet calibration.",
  body: "# marble-fountain-restorer\n\n## Harbor Sketches\n\n## Cinder Taxonomies\n"
};

let failures = 0;

function record(label, condition, detail) {
  if (condition) {
    console.log(`${label}=PASS`);
  }
  else {
    failures += 1;
    console.log(`${label}=FAIL ${detail || ""}`.trim());
  }
}

function runCase({ label, task, skills }) {
  const tmpRoot =
    fs.mkdtempSync(path.join(os.tmpdir(), "ef-name-norm-"));

  try {
    const fakeHome = path.join(tmpRoot, "home");
    const projectDir = path.join(tmpRoot, "project");
    const extRoot = path.join(tmpRoot, "external-skills");

    fs.mkdirSync(path.join(fakeHome, ".agents", "skills"), { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(extRoot, { recursive: true });

    for (const definition of skills) {
      const directoryPath = path.join(extRoot, definition.directory);

      fs.mkdirSync(directoryPath, { recursive: true });

      fs.writeFileSync(
        path.join(directoryPath, "SKILL.md"),
        [
          "---",
          `name: ${definition.name}`,
          `description: ${definition.description}`,
          "---",
          "",
          definition.body,
          ""
        ].join("\n"),
        "utf8"
      );
    }

    const result =
      spawnSync(
        process.execPath,
        [RESOLVER, "resolve", "--task", task, "--cwd", projectDir],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            HOME: fakeHome,
            USERPROFILE: fakeHome,
            ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot
          },
          cwd: REPO_ROOT,
          timeout: 60000,
          windowsHide: true
        }
      );

    if (result.error || result.status !== 0) {
      return { crashed: true };
    }

    const response = JSON.parse(result.stdout);

    return {
      crashed: false,
      count: response.specialist_count,
      primary: response.primary ? response.primary.name : null,
      support: response.support ? response.support.name : null,
      primarySource: response.primary ? response.primary.source : null,
      maxSpecialists: response.max_specialists
    };
  }
  finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

/* A. dashed exact skill name */
{
  const outcome =
    runCase({
      label: "TEST_A_DASHED",
      task: "Apply cache-query-optimizer guidance immediately.",
      skills: [SKILL_ALPHA]
    });

  record(
    "TEST_A_DASHED",
    !outcome.crashed &&
      outcome.primary === "cache-query-optimizer" &&
      outcome.primarySource === "external" &&
      outcome.support === null,
    JSON.stringify(outcome)
  );
}

/* B. underscored equivalent */
{
  const outcome =
    runCase({
      label: "TEST_B_UNDERSCORED",
      task: "Follow cache_query_optimizer practices today.",
      skills: [SKILL_ALPHA]
    });

  record(
    "TEST_B_UNDERSCORED",
    !outcome.crashed &&
      outcome.primary === "cache-query-optimizer" &&
      outcome.primarySource === "external" &&
      outcome.support === null,
    JSON.stringify(outcome)
  );
}

/* C. colon-separated equivalent */
{
  const outcome =
    runCase({
      label: "TEST_C_COLON",
      task: "Enable cache:query:optimizer mode now.",
      skills: [SKILL_ALPHA]
    });

  record(
    "TEST_C_COLON",
    !outcome.crashed &&
      outcome.primary === "cache-query-optimizer" &&
      outcome.primarySource === "external" &&
      outcome.support === null,
    JSON.stringify(outcome)
  );
}

/* D. space-separated equivalent */
{
  const outcome =
    runCase({
      label: "TEST_D_SPACED",
      task: "Engage the cache query optimizer routine.",
      skills: [SKILL_ALPHA]
    });

  record(
    "TEST_D_SPACED",
    !outcome.crashed &&
      outcome.primary === "cache-query-optimizer" &&
      outcome.primarySource === "external" &&
      outcome.support === null,
    JSON.stringify(outcome)
  );
}

/*
 * E. partial/generic overlap without any delimiter-equivalent of the
 * full name must stay unselected (no exact-name bonus may fire).
 */
{
  const outcome =
    runCase({
      label: "TEST_E_PARTIAL_OVERLAP",
      task: "Adjust the cache layer and optimizer hints.",
      skills: [SKILL_ALPHA]
    });

  record(
    "TEST_E_PARTIAL_OVERLAP",
    !outcome.crashed &&
      outcome.primary !== "cache-query-optimizer" &&
      !(outcome.primarySource === "external"),
    JSON.stringify(outcome)
  );
}

/* F. normalization must keep unrelated identities distinct */
{
  const outcome =
    runCase({
      label: "TEST_F_DISTINCT_IDENTITIES",
      task: "Please involve marble_fountain_restorer for plaza restoration planning.",
      skills: [SKILL_ALPHA, SKILL_BETA]
    });

  record(
    "TEST_F_DISTINCT_IDENTITIES",
    !outcome.crashed &&
      outcome.primary === "marble-fountain-restorer" &&
      outcome.primarySource === "external" &&
      outcome.primary !== "cache-query-optimizer" &&
      outcome.support !== "cache-query-optimizer",
    JSON.stringify(outcome)
  );
}

console.log(`NORMALIZATION_TESTS=${failures === 0 ? "PASS" : "FAIL"}`);

process.exit(failures === 0 ? 0 : 1);
