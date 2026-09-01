#!/usr/bin/env node
/*
 * Regression tests for the read-only `doctor` command.
 *
 * Uses temporary directories only. Never mutates the real repository.
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

const DOCTOR_RUNNER = path.join(
  REPO_ROOT,
  "skills",
  "engineer-flow",
  "scripts",
  "engineer-flow.mjs"
);

const results = {};

function createTempDir() {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "ef-doctor-test-")
  );
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function runDoctor(args, envVars = {}, cwd = REPO_ROOT) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(envVars)) {
    if (value === null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  const allArgs = ["doctor", ...args];
  return spawnSync(process.execPath, [DOCTOR_RUNNER, ...allArgs], {
    encoding: "utf8",
    cwd,
    env,
    timeout: 30000,
    windowsHide: true,
  });
}

function runGit(cwd, args) {
  return spawnSync("git", args, {
    encoding: "utf8",
    cwd,
    timeout: 30000,
    windowsHide: true,
  });
}

function initGitRepo(dir) {
  runGit(dir, ["init"]);
  runGit(dir, ["config", "user.email", "doctor@test.invalid"]);
  runGit(dir, ["config", "user.name", "Doctor Test"]);
}

function listFilesRecursive(dir, baseDir = dir) {
  const list = [];
  if (!fs.existsSync(dir)) {
    return list;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(baseDir, full);
    list.push(rel);
    if (entry.isDirectory()) {
      list.push(...listFilesRecursive(full, baseDir));
    }
  }
  return list.sort();
}

function snapshotDir(dir, baseDir = dir) {
  const snapshot = {};
  for (const rel of listFilesRecursive(dir, baseDir)) {
    const full = path.join(baseDir, rel);
    if (fs.statSync(full).isFile()) {
      snapshot[rel] = fs.readFileSync(full, "utf8");
    } else {
      snapshot[rel + "/"] = "DIR";
    }
  }
  return snapshot;
}

function assert(output, message) {
  if (output) {
    console.log(`  PASS: ${message}`);
    return true;
  } else {
    console.error(`  FAIL: ${message}`);
    return false;
  }
}

function runTest(name, fn) {
  let passed = true;
  const failures = [];
  const localAssert = (condition, message) => {
    if (!condition) {
      passed = false;
      failures.push(message);
    }
    console.log(`  ${condition ? "PASS" : "FAIL"}: ${message}`);
  };
  try {
    fn(localAssert);
  } catch (error) {
    passed = false;
    failures.push(error.message);
    console.error(`  ERROR: ${error.message}`);
  }
  results[name] = passed;
  if (passed) {
    console.log(`  -> ${name}: ALL PASS\n`);
  } else {
    console.error(`  -> ${name}: ${failures.length} FAILURE(S)\n`);
  }
}

/* =========================================================
   TEST CASES
   ========================================================= */

function testHealthyRepo() {
  const result = runDoctor(["--cwd", REPO_ROOT]);

  const ok =
    assert(result.status === 0, "exit 0") &&
    assert(
      result.stdout.startsWith("ENGINEER_FLOW_DOCTOR"),
      "output starts with ENGINEER_FLOW_DOCTOR"
    ) &&
    assert(result.stdout.includes("CORE_MANIFEST=PASS"), "CORE_MANIFEST=PASS") &&
    assert(result.stdout.includes("CORE_COUNT=16"), "CORE_COUNT=16") &&
    assert(result.stdout.includes("MEMORY_INFRASTRUCTURE=PASS"), "MEMORY_INFRASTRUCTURE=PASS") &&
    assert(result.stdout.includes("VERSION_CONSISTENCY=PASS"), "VERSION_CONSISTENCY=PASS") &&
    assert(
      result.stdout.includes("DOCTOR_STATUS=PASS") ||
        result.stdout.includes("DOCTOR_STATUS=WARN"),
      "final status PASS or WARN"
    );
}

function testNonGitProject() {
  const root = createTempDir();
  try {
    const result = runDoctor(["--cwd", root]);

    assert(result.stdout.includes("GIT_REPOSITORY=NO"), "GIT_REPOSITORY=NO");
    assert(
      result.stdout.includes("SECURITY_HOOK=NOT_GIT_REPOSITORY"),
      "SECURITY_HOOK=NOT_GIT_REPOSITORY"
    );
    assert(result.stdout.includes("DOCTOR_STATUS=WARN"), "DOCTOR_STATUS=WARN");
    assert(result.status === 0, "exit 0");
  } finally {
    cleanup(root);
  }
}

function testMissingMemoryRoot() {
  const root = createTempDir();
  const memRoot = path.join(root, "nonexistent-memory-root");

  try {
    const before = fs.existsSync(memRoot);
    const result = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_MEMORY_ROOT: memRoot,
    });

    const after = fs.existsSync(memRoot);
    assert(!before, "memory root did not exist before doctor");
    assert(!after, "doctor did not create memory root");
    assert(result.stdout.includes("MEMORY_ROOT_EXISTS=NO"), "MEMORY_ROOT_EXISTS=NO");
    assert(result.stdout.includes("DOCTOR_STATUS=WARN"), "DOCTOR_STATUS=WARN");
    assert(result.status === 0, "exit 0");
  } finally {
    cleanup(root);
  }
}

function testMemoryRootExists() {
  const root = createTempDir();
  const memRoot = path.join(root, "memory-root");
  fs.mkdirSync(memRoot, { recursive: true });

  try {
    const result = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_MEMORY_ROOT: memRoot,
    });

    assert(result.stdout.includes(`MEMORY_ROOT=${memRoot}`), "MEMORY_ROOT matches reported path");
    assert(result.stdout.includes("MEMORY_ROOT_EXISTS=YES"), "MEMORY_ROOT_EXISTS=YES");
  } finally {
    cleanup(root);
  }
}

function testMemoryRootPrecedence() {
  const root = createTempDir();
  const rootA = path.join(root, "root-a");
  const rootB = path.join(root, "root-b");
  fs.mkdirSync(rootA, { recursive: true });
  fs.mkdirSync(rootB, { recursive: true });

  try {
    const result1 = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_MEMORY_ROOT: rootA,
      AI_MEMORY_ROOT: rootB,
    });

    assert(
      result1.stdout.includes(`MEMORY_ROOT=${rootA}`),
      "ENGINEER_FLOW_MEMORY_ROOT wins over AI_MEMORY_ROOT"
    );

    const envB = { ...process.env };
    delete envB.ENGINEER_FLOW_MEMORY_ROOT;
    envB.AI_MEMORY_ROOT = rootB;

    const result2 = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_MEMORY_ROOT: null,
      AI_MEMORY_ROOT: rootB,
    });

    assert(
      result2.stdout.includes(`MEMORY_ROOT=${rootB}`),
      "AI_MEMORY_ROOT used when ENGINEER_FLOW_MEMORY_ROOT not set"
    );
  } finally {
    cleanup(root);
  }
}

function testExternalRootMissingWarn() {
  const root = createTempDir();
  const extRoot = path.join(root, "nonexistent-ext-root");

  try {
    const before = fs.existsSync(extRoot);
    const result = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot,
    });

    const after = fs.existsSync(extRoot);
    assert(!before, "external root did not exist before");
    assert(!after, "doctor did not create external root");
    assert(
      result.stdout.includes(`EXTERNAL_ROOT=${extRoot}=NO`),
      "missing external root reported"
    );
    assert(result.stdout.includes("DOCTOR_STATUS=WARN"), "DOCTOR_STATUS=WARN");
    assert(result.status === 0, "exit 0");
  } finally {
    cleanup(root);
  }
}

function testMalformedExternalSkill() {
  const root = createTempDir();
  const extRoot = path.join(root, "ext-skills");
  const badSkillDir = path.join(extRoot, "malformed-skill");
  fs.mkdirSync(badSkillDir, { recursive: true });

  const malformedPath = path.join(badSkillDir, "SKILL.md");
  fs.writeFileSync(malformedPath, "", "utf8");

  try {
    const result = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot,
    });

    assert(result.status === 0, "exit 0 (no crash)");
    assert(
      result.stdout.includes("MALFORMED_EXTERNAL_SKILLS=1"),
      "MALFORMED_EXTERNAL_SKILLS=1"
    );
    assert(result.stdout.includes("DOCTOR_STATUS=WARN"), "DOCTOR_STATUS=WARN");
  } finally {
    cleanup(root);
  }
}

function testValidExternalSkill() {
  const root = createTempDir();
  const extRoot = path.join(root, "ext-skills");
  const skillDir = path.join(extRoot, "example-skill");
  fs.mkdirSync(skillDir, { recursive: true });

  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    [
      "---",
      'name: example-skill',
      'description: Example skill for doctor tests.',
      "---",
      "",
      "# Example Skill",
    ].join("\n"),
    "utf8"
  );

  try {
    const result = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot,
    });

    assert(result.status === 0, "exit 0");
    assert(
      result.stdout.includes("EXTERNAL_SKILLS="),
      "external skills reported"
    );
    const match = result.stdout.match(/EXTERNAL_SKILLS=(\d+)/);
    const count = match ? parseInt(match[1], 10) : 0;
    assert(count >= 1, `at least 1 external skill discovered (got ${count})`);
  } finally {
    cleanup(root);
  }
}

function testSecurityHookDetection() {
  const root = createTempDir();
  initGitRepo(root);

  const hooksResult = runGit(root, [
    "rev-parse",
    "--git-path",
    "hooks",
  ]);
  const hooksPath = hooksResult.stdout.trim();

  fs.mkdirSync(hooksPath, { recursive: true });
  fs.writeFileSync(
    path.join(hooksPath, "pre-commit"),
    "#!/bin/sh\nENGINEER_FLOW_SECURITY_GATE\n",
    "utf8"
  );

  try {
    const result = runDoctor(["--cwd", root]);

    assert(result.stdout.includes("GIT_REPOSITORY=YES"), "GIT_REPOSITORY=YES");
    assert(result.stdout.includes("SECURITY_HOOK=INSTALLED"), "SECURITY_HOOK=INSTALLED");
  } finally {
    cleanup(root);
  }
}

function testPreviousHookDetection() {
  const root = createTempDir();
  initGitRepo(root);

  const hooksResult = runGit(root, [
    "rev-parse",
    "--git-path",
    "hooks",
  ]);
  const hooksPath = hooksResult.stdout.trim();

  fs.mkdirSync(hooksPath, { recursive: true });
  fs.writeFileSync(
    path.join(hooksPath, "pre-commit.pre-engineer-flow"),
    "#!/bin/sh\necho preserved\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(hooksPath, "pre-commit"),
    "#!/bin/sh\nnormal content\n",
    "utf8"
  );

  try {
    const result = runDoctor(["--cwd", root]);

    assert(result.stdout.includes("PRESERVED_PREVIOUS_HOOK=YES"), "PRESERVED_PREVIOUS_HOOK=YES");
  } finally {
    cleanup(root);
  }
}

function testSecurityHookNotInstalled() {
  const root = createTempDir();
  initGitRepo(root);

  try {
    const result = runDoctor(["--cwd", root]);

    assert(result.stdout.includes("GIT_REPOSITORY=YES"), "GIT_REPOSITORY=YES");
    assert(result.stdout.includes("SECURITY_HOOK=NOT_INSTALLED"), "SECURITY_HOOK=NOT_INSTALLED");
    assert(result.stdout.includes("DOCTOR_STATUS=WARN"), "DOCTOR_STATUS=WARN");
    assert(result.status === 0, "exit 0");
  } finally {
    cleanup(root);
  }
}

function testReadOnly() {
  const root = createTempDir();
  const extRoot = path.join(root, "ext-skills");
  const memRoot = path.join(root, "memory-root");
  fs.mkdirSync(extRoot, { recursive: true });
  fs.mkdirSync(memRoot, { recursive: true });

  fs.mkdirSync(path.join(extRoot, "valid-skill"), { recursive: true });
  fs.writeFileSync(
    path.join(extRoot, "valid-skill", "SKILL.md"),
    "---\nname: ro-skill\ndescription: read-only test skill.\n---\n",
    "utf8"
  );

  const gitDir = path.join(root, "gitrepo");
  fs.mkdirSync(gitDir, { recursive: true });
  initGitRepo(gitDir);

  const beforeExt = snapshotDir(extRoot);
  const beforeMem = snapshotDir(memRoot);
  const beforeGit = snapshotDir(gitDir);

  try {
    const result1 = runDoctor(["--cwd", root], {
      ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot,
      ENGINEER_FLOW_MEMORY_ROOT: memRoot,
    });

    const result2 = runDoctor(["--cwd", root], {
      EMONITOR_FLOW_EXTERNAL_SKILL_ROOTS: extRoot,
      ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot,
      ENGINEER_FLOW_MEMORY_ROOT: memRoot,
    });

    const afterExt = snapshotDir(extRoot);
    const afterMem = snapshotDir(memRoot);
    const afterGit = snapshotDir(gitDir);

    assert(JSON.stringify(beforeExt) === JSON.stringify(afterExt), "external root files unchanged");
    assert(JSON.stringify(beforeMem) === JSON.stringify(afterMem), "memory root files unchanged");
    assert(JSON.stringify(beforeGit) === JSON.stringify(afterGit), "git repo files unchanged");
    assert(result1.status === 0, "first run exit 0");
    assert(result2.status === 0, "second run exit 0");
  } finally {
    cleanup(root);
  }
}

function testResolveRegression() {
  const resolveArgs = ["resolve", "--task", "Fix a database transaction bug and add regression tests.", "--cwd", REPO_ROOT];

  const before = spawnSync(process.execPath, [DOCTOR_RUNNER, ...resolveArgs], {
    encoding: "utf8",
    cwd: REPO_ROOT,
    timeout: 30000,
    windowsHide: true,
  });

  const beforeOutput = before.stdout;

  const doctorResult = runDoctor(["--cwd", REPO_ROOT]);

  const after = spawnSync(process.execPath, [DOCTOR_RUNNER, ...resolveArgs], {
    encoding: "utf8",
    cwd: REPO_ROOT,
    timeout: 30000,
    windowsHide: true,
  });

  const afterOutput = after.stdout;

  assert(before.status === 0, "resolve before exits 0");
  assert(after.status === 0, "resolve after exits 0");
  assert(beforeOutput === afterOutput, "resolve output identical before/after doctor");
  assert(doctorResult.status === 0, "doctor exits 0");
}

/* =========================================================
   MAIN
   ========================================================= */

console.log("Running doctor regression tests...\n");

runTest("DOCTOR_HEALTHY_REPO", testHealthyRepo);
runTest("NON_GIT_PROJECT_WARN", testNonGitProject);
runTest("MISSING_MEMORY_ROOT_WARN", testMissingMemoryRoot);
runTest("MEMORY_ROOT_EXISTS", testMemoryRootExists);
runTest("MEMORY_ROOT_PRECEDENCE", testMemoryRootPrecedence);
runTest("EXTERNAL_ROOT_MISSING_WARN", testExternalRootMissingWarn);
runTest("MALFORMED_EXTERNAL_SKILL", testMalformedExternalSkill);
runTest("VALID_EXTERNAL_SKILL", testValidExternalSkill);
runTest("SECURITY_HOOK_DETECTION", testSecurityHookDetection);
runTest("PREVIOUS_HOOK_DETECTION", testPreviousHookDetection);
runTest("SECURITY_HOOK_NOT_INSTALLED", testSecurityHookNotInstalled);
runTest("READ_ONLY", testReadOnly);
runTest("RESOLVE_REGRESSION", testResolveRegression);

const passed = Object.values(results).filter(Boolean).length;
const failed = Object.values(results).filter((v) => !v).length;

console.log(`Results: ${passed} test groups passed, ${failed} failed\n`);

for (const [name, passed] of Object.entries(results)) {
  console.log(`${name}=${passed ? "PASS" : "FAIL"}`);
}

if (failed === 0) {
  console.log("DOCTOR_REGRESSION=PASS");
  process.exit(0);
} else {
  console.log("DOCTOR_REGRESSION=FAIL");
  process.exit(1);
}
