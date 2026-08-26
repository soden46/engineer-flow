#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const SCRIPT_DIR =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const PACKAGE_ROOT =
  path.resolve(
    SCRIPT_DIR,
    ".."
  );

const REPO_ROOT =
  path.resolve(
    PACKAGE_ROOT,
    "..",
    ".."
  );

const CORE_ROOT =
  path.join(
    PACKAGE_ROOT,
    "core"
  );

const CORE_MANIFEST =
  path.join(
    CORE_ROOT,
    "core-manifest.json"
  );

const MEMORY_ROOT =
  path.join(
    PACKAGE_ROOT,
    "infrastructure",
    "memory-management"
  );

const MEMORY_SKILL =
  path.join(
    MEMORY_ROOT,
    "SKILL.md"
  );

const MEMORY_RUNNER =
  path.join(
    MEMORY_ROOT,
    "scripts",
    "memory.mjs"
  );

const RESOLVER =
  path.join(
    PACKAGE_ROOT,
    "scripts",
    "engineer-flow.mjs"
  );

let failed = false;

await validatePublicSurface();
await validateCoreCapabilities();
await validateMemoryInfrastructure();
await validateResolver();
await validateMetadata();

if (failed) {
  process.exit(1);
}

console.log("ENGINEER_FLOW_VALIDATE=PASS");

function fail(message) {
  failed = true;
  console.error(`ERROR: ${message}`);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  }
  catch {
    return false;
  }
}

async function readJson(file) {
  return JSON.parse(
    await fs.readFile(
      file,
      "utf8"
    )
  );
}

async function validatePublicSurface() {
  const skillsRoot =
    path.join(
      REPO_ROOT,
      "skills"
    );

  const dirs =
    (
      await fs.readdir(
        skillsRoot,
        {
          withFileTypes:
            true
        }
      )
    )
      .filter(
        (entry) =>
          entry.isDirectory()
      )
      .map(
        (entry) =>
          entry.name
      )
      .sort();

  if (
    dirs.length !== 1 ||
    dirs[0] !== "engineer-flow"
  ) {
    fail(
      `public skill surface must contain only engineer-flow; found ${dirs.join(", ")}`
    );
    return;
  }

  console.log(
    "PUBLIC_SKILLS=1"
  );
}

async function validateCoreCapabilities() {
  const manifest =
    await readJson(
      CORE_MANIFEST
    );

  const cores =
    Array.isArray(
      manifest.cores
    )
      ? manifest.cores
      : [];

  if (
    cores.length !== 16
  ) {
    fail(
      `expected 16 internal capabilities, found ${cores.length}`
    );
    return;
  }

  const seen =
    new Set();

  for (
    const name of cores
  ) {
    if (
      seen.has(name)
    ) {
      fail(
        `duplicate core capability ${name}`
      );
      continue;
    }

    seen.add(name);

    const file =
      path.join(
        CORE_ROOT,
        name,
        "SKILL.md"
      );

    if (
      !await exists(file)
    ) {
      fail(
        `missing core SKILL.md: ${name}`
      );
      continue;
    }

    const text =
      await fs.readFile(
        file,
        "utf8"
      );

    const frontmatter =
      text.match(
        /^---\r?\n([\s\S]*?)\r?\n---/
      );

    if (
      !frontmatter
    ) {
      fail(
        `${name}: missing frontmatter`
      );
      continue;
    }

    const fm =
      frontmatter[1];

    const declaredName =
      fm.match(
        /^name:\s*(.+)$/m
      )?.[1]?.trim();

    if (
      declaredName !== name
    ) {
      fail(
        `${name}: frontmatter name mismatch (${declaredName || "missing"})`
      );
    }

    if (
      !/^metadata:\s*$/m.test(fm) ||
      !/^\s+internal:\s*true\s*$/m.test(fm)
    ) {
      fail(
        `${name}: metadata.internal must be true`
      );
    }

    if (
      !/^routing_terms:\s*$/m.test(fm)
    ) {
      fail(
        `${name}: routing_terms is required`
      );
    }

    const routingTermsMatch =
      fm.match(/^routing_terms:\s*\n([\s\S]*)/m);

    if (!routingTermsMatch) {
      fail(
        `${name}: routing_terms list is missing`
      );
    }
    else {
      const terms =
        routingTermsMatch[1]
          .split("\n")
          .map((line) => line.trim().replace(/^-\s*/, ""))
          .filter(Boolean);

      if (terms.length < 3) {
        fail(
          `${name}: routing_terms must have at least 3 terms, found ${terms.length}`
        );
      }

      if (terms.length > 12) {
        fail(
          `${name}: routing_terms must have at most 12 terms, found ${terms.length}`
        );
      }

      const seen = new Set();
      for (const term of terms) {
        if (!term || term.length === 0) {
          fail(
            `${name}: routing_terms contains empty term`
          );
          break;
        }

        const normalized = term.toLowerCase();
        if (seen.has(normalized)) {
          fail(
            `${name}: routing_terms contains duplicate term: ${term}`
          );
          break;
        }

        seen.add(normalized);
      }
    }
  }

  console.log(
    `INTERNAL_SKILLS=${cores.length}`
  );
}

async function validateMemoryInfrastructure() {
  if (
    !await exists(MEMORY_SKILL) ||
    !await exists(MEMORY_RUNNER)
  ) {
    fail(
      "memory infrastructure files are missing"
    );
    return;
  }

  const skillText =
    await fs.readFile(
      MEMORY_SKILL,
      "utf8"
    );

  if (
    !/^metadata:\s*$/m.test(skillText) ||
    !/^\s+internal:\s*true\s*$/m.test(skillText)
  ) {
    fail(
      "memory-management must be internal infrastructure"
    );
  }

  try {
    await execFileAsync(
      process.execPath,
      [
        "--check",
        MEMORY_RUNNER
      ],
      {
        cwd:
          REPO_ROOT
      }
    );
  }
  catch (error) {
    fail(
      `memory runtime syntax check failed: ${error.stderr || error.message}`
    );
    return;
  }

  const tempRoot =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "engineer-flow-memory-"
      )
    );

  try {
    const auto =
      await execFileAsync(
        process.execPath,
        [
          MEMORY_RUNNER,
          "auto",
          "--cwd",
          REPO_ROOT,
          "--query",
          "continue previous architecture work",
          "--root",
          tempRoot
        ],
        {
          cwd:
            REPO_ROOT
        }
      );

    if (
      !auto.stdout.includes(
        "decision: RUN"
      )
    ) {
      fail(
        "memory preflight did not return RUN for continuation task"
      );
    }

    const summary =
      "Architecture decision: memory infrastructure remains outside specialist slots.";

    await execFileAsync(
      process.execPath,
      [
        MEMORY_RUNNER,
        "checkpoint",
        "--project",
        "engineer-flow-test",
        "--summary",
        summary,
        "--root",
        tempRoot
      ],
      {
        cwd:
          REPO_ROOT
      }
    );

    const recall =
      await execFileAsync(
        process.execPath,
        [
          MEMORY_RUNNER,
          "recall",
          "--project",
          "engineer-flow-test",
          "--query",
          "memory infrastructure specialist slots",
          "--root",
          tempRoot
        ],
        {
          cwd:
            REPO_ROOT
        }
      );

    if (
      !recall.stdout.includes(
        "memory infrastructure remains outside specialist slots"
      )
    ) {
      fail(
        "memory recall did not return checkpointed durable context"
      );
    }

    let secretRejected =
      false;

    try {
      await execFileAsync(
        process.execPath,
        [
          MEMORY_RUNNER,
          "checkpoint",
          "--project",
          "engineer-flow-test",
          "--summary",
          "password=supersecret",
          "--root",
          tempRoot
        ],
        {
          cwd:
            REPO_ROOT
        }
      );
    }
    catch (error) {
      secretRejected =
        String(
          error.stderr ||
          error.message
        )
          .toLowerCase()
          .includes(
            "refusing to store"
          );
    }

    if (
      !secretRejected
    ) {
      fail(
        "memory secret guard did not reject secret-like content"
      );
    }
  }
  finally {
    await fs.rm(
      tempRoot,
      {
        recursive:
          true,
        force:
          true
      }
    );
  }

  console.log(
    "MEMORY_INFRASTRUCTURE=PASS"
  );

  console.log(
    "MEMORY_RUNTIME=PASS"
  );

  console.log(
    "MEMORY_SECRET_GUARD=PASS"
  );
}

async function validateResolver() {
  let stdout = "";

  try {
    const result =
      await execFileAsync(
        process.execPath,
        [
          RESOLVER,
          "self-test"
        ],
        {
          cwd:
            REPO_ROOT
        }
      );

    stdout =
      result.stdout;
  }
  catch (error) {
    fail(
      `resolver self-test failed: ${error.stderr || error.message}`
    );
    return;
  }

  for (
    const expected of [
      "SELF_TEST_PASS=YES",
      "INTERNAL_SKILLS=16",
      "MEMORY_INFRASTRUCTURE=ENABLED",
      "MAX_SPECIALISTS=2",
      "POST_DEVELOPMENT_SECURITY=ENABLED"
    ]
  ) {
    if (
      !stdout.includes(
        expected
      )
    ) {
      fail(
        `resolver self-test missing ${expected}`
      );
    }
  }

  let resolution;

  try {
    const result =
      await execFileAsync(
        process.execPath,
        [
          RESOLVER,
          "resolve",
          "--task",
          "Fix a database transaction bug and add regression tests.",
          "--cwd",
          REPO_ROOT
        ],
        {
          cwd:
            REPO_ROOT
        }
      );

    resolution =
      JSON.parse(
        result.stdout
      );
  }
  catch (error) {
    fail(
      `resolver integration check failed: ${error.stderr || error.message}`
    );
    return;
  }

  if (
    resolution.specialist_count > 2
  ) {
    fail(
      "resolver exceeded MAX_SPECIALISTS=2"
    );
  }

  if (
    !resolution.memory_infrastructure ||
    resolution.memory_infrastructure.available !== true ||
    resolution.memory_infrastructure.counted_as_specialist !== false
  ) {
    fail(
      "memory infrastructure is missing or counted as specialist"
    );
  }

  if (
    !resolution.post_development_security ||
    resolution.post_development_security.required_after_development !== true ||
    resolution.post_development_security.counted_as_specialist !== false
  ) {
    fail(
      "mandatory post-development security contract is invalid"
    );
  }

  console.log(
    "MEMORY_SPECIALIST_EXCLUSION=PASS"
  );

  console.log(
    "MAX_SPECIALISTS=2"
  );

  console.log(
    "POST_DEVELOPMENT_SECURITY=ENABLED"
  );
}

async function validateMetadata() {
  const packageJson =
    await readJson(
      path.join(
        REPO_ROOT,
        "package.json"
      )
    );

  const version =
    packageJson.version;

  for (
    const file of [
      "agent-skills.json",
      ".codex-plugin/plugin.json",
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json"
    ]
  ) {
    const full =
      path.join(
        REPO_ROOT,
        file
      );

    const json =
      await readJson(full);

    if (
      !JSON.stringify(json)
        .includes(version)
    ) {
      fail(
        `${file}: does not contain package version ${version}`
      );
    }
  }

  const skillsSh =
    await readJson(
      path.join(
        REPO_ROOT,
        "skills.sh.json"
      )
    );

  const skillsShNames =
    (
      skillsSh.groupings ||
      []
    )
      .flatMap(
        (group) =>
          group.skills ||
          []
      );

  if (
    skillsShNames.length !== 1 ||
    skillsShNames[0] !== "engineer-flow"
  ) {
    fail(
      "skills.sh.json must expose only engineer-flow"
    );
  }

  const pluginGroups =
    await readJson(
      path.join(
        REPO_ROOT,
        "plugin-groups.json"
      )
    );

  const pluginNames =
    (
      pluginGroups.plugins ||
      []
    )
      .flatMap(
        (plugin) =>
          plugin.skills ||
          []
      );

  if (
    pluginNames.length !== 1 ||
    pluginNames[0] !== "engineer-flow"
  ) {
    fail(
      "plugin-groups.json must expose only engineer-flow"
    );
  }
}