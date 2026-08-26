#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_DIR =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const REPO_ROOT =
  path.resolve(
    TEST_DIR,
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

const CASES = [
  {
    name: "REFERENCE_UI_RECONSTRUCTION",
    task:
      "Inspect the reference website in a browser, capture a screenshot, reconstruct the dashboard UI in the existing app, then verify mobile and desktop behavior with Playwright tests.",
    expected: {
      primary: "frontend-ui",
      support: "testing",
      external: false
    }
  },
  {
    name: "BROWSER_E2E_REGRESSION",
    task:
      "Add Playwright browser regression tests for the rendered checkout journey, covering navigation, form submission, and web-first assertions.",
    expected: {
      primary: "testing",
      support: "frontend-ui",
      external: false
    }
  },
  {
    name: "EXPLICIT_EXTERNAL_BROWSER_SPECIALIST",
    task:
      "Use agent-browser to inspect the reference UI, capture browser screenshots, and map the visual layout into this project.",
    externalSkills: [
      {
        directory: "agent-browser",
        name: "agent-browser",
        description:
          "Browser UI inspection specialist for rendered pages, screenshots, DOM snapshots, accessibility trees, and visual review.",
        body:
          "# agent-browser\n\n## Browser UI Inspection\n\n## Screenshots\n\n## DOM Snapshots\n"
      }
    ],
    expected: {
      primary: "agent-browser",
      support: null,
      external: true
    }
  }
];

function createSkill(root, definition) {
  const directory =
    path.join(
      root,
      definition.directory
    );

  fs.mkdirSync(
    directory,
    {
      recursive: true
    }
  );

  const content = [
    "---",
    `name: ${definition.name}`,
    `description: ${definition.description}`,
    "---",
    "",
    definition.body
  ].join("\n");

  fs.writeFileSync(
    path.join(
      directory,
      "SKILL.md"
    ),
    content,
    "utf8"
  );
}

function runCase(testCase) {
  const tempRoot =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "engineer-flow-browser-ui-"
      )
    );

  try {
  const homeDir =
    path.join(
      tempRoot,
      "home"
    );

  const externalRoot =
    path.join(
      tempRoot,
      "external-skills"
    );

  const projectDir =
    path.join(
      tempRoot,
      "project"
    );

  fs.mkdirSync(
    homeDir,
    {
      recursive: true
    }
  );

  fs.mkdirSync(
    externalRoot,
    {
      recursive: true
    }
  );

  fs.mkdirSync(
    projectDir,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    path.join(
      projectDir,
      "package.json"
    ),
    JSON.stringify(
      {
        name: "browser-ui-fixture",
        private: true
      },
      null,
      2
    ),
    "utf8"
  );

  for (
    const skill of
    testCase.externalSkills || []
  ) {
    createSkill(
      externalRoot,
      skill
    );
  }

  const result =
    spawnSync(
      process.execPath,
      [
        RESOLVER,
        "resolve",
        "--task",
        testCase.task,
        "--cwd",
        projectDir
      ],
      {
        cwd: REPO_ROOT,
        env: {
          ...process.env,
          HOME: homeDir,
          USERPROFILE: homeDir,
          ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: externalRoot
        },
        encoding: "utf8",
        timeout: 120000
      }
    );

  if (result.status !== 0) {
    throw new Error(
      `${testCase.name}: resolver failed\n${result.stderr || result.stdout}`
    );
  }

  let resolution;

  try {
    resolution =
      JSON.parse(
        result.stdout
      );
  }
  catch (error) {
    throw new Error(
      `${testCase.name}: resolver output was not JSON: ${error.message}\n${result.stdout}`
    );
  }

  const actual = {
    primary:
      resolution.primary
        ? resolution.primary.name
        : null,
    support:
      resolution.support
        ? resolution.support.name
        : null,
    external:
      Boolean(
        resolution.primary &&
          resolution.primary.source !== "engineer-flow"
      ) ||
      Boolean(
        resolution.support &&
          resolution.support.source !== "engineer-flow"
      )
  };

  const expected =
    testCase.expected;

  const failures = [];

  if (actual.primary !== expected.primary) {
    failures.push(
      `primary expected ${expected.primary}, got ${actual.primary}`
    );
  }

  if (actual.support !== expected.support) {
    failures.push(
      `support expected ${expected.support}, got ${actual.support}`
    );
  }

  if (actual.external !== expected.external) {
    failures.push(
      `external expected ${expected.external}, got ${actual.external}`
    );
  }

  if (resolution.specialist_count > 2) {
    failures.push(
      `specialist_count exceeded 2: ${resolution.specialist_count}`
    );
  }

  if (
    !resolution.post_development_security ||
    resolution.post_development_security.required_after_development !== true
  ) {
    failures.push(
      "post-development security was not required"
    );
  }

  if (failures.length) {
    throw new Error(
      `${testCase.name}: ${failures.join("; ")}\n${JSON.stringify(resolution, null, 2)}`
    );
  }

  return actual;
  }
  finally {
    fs.rmSync(
      tempRoot,
      {
        recursive: true,
        force: true
      }
    );
  }
}

let failed = false;

for (
  const testCase of
  CASES
) {
  try {
    const actual =
      runCase(testCase);

    console.log(
      `${testCase.name}=PASS primary=${actual.primary} support=${actual.support || "none"} external=${actual.external}`
    );
  }
  catch (error) {
    failed = true;
    console.error(
      `${testCase.name}=FAIL`
    );
    console.error(
      error.message
    );
  }
}

if (failed) {
  process.exitCode = 1;
}
else {
  console.log(
    "BROWSER_UI_ROUTING_TESTS=PASS"
  );
}
