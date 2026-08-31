#!/usr/bin/env node
/*
 * POSIX security gate installer regression tests.
 *
 * Uses temporary Git repositories only.
 * Does not mutate the real engineer-flow working tree.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const INSTALLER = path.join(REPO_ROOT, "skills", "engineer-flow", "scripts", "install-security-gate.sh");

function git(args, cwd) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    cwd,
    timeout: 180000,
    windowsHide: true
  });

  if (result.error) {
    throw new Error(`git ${args.join(" ")} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }

  return result.stdout;
}

function createTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ef-posix-install-"));
  fs.mkdirSync(path.join(repoRoot, "src"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, "src", "index.js"), "console.log('hello');\n", "utf8");
  git(["init"], repoRoot);
  git(["config", "user.email", "test@example.com"], repoRoot);
  git(["config", "user.name", "Test User"], repoRoot);
  git(["add", "."], repoRoot);
  git(["commit", "-m", "initial"], repoRoot);
  return repoRoot;
}

function shAvailable() {
  try {
    const result = spawnSync("sh", ["-c", "exit 0"], {
      encoding: "utf8",
      cwd: REPO_ROOT,
      timeout: 180000,
      windowsHide: true
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

function runInstaller(projectPath) {
  const result = spawnSync("sh", [INSTALLER, projectPath], {
    encoding: "utf8",
    cwd: REPO_ROOT,
    timeout: 180000,
    windowsHide: true
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error
  };
}

function getHookPath(projectPath) {
  const hooksPath = git(["rev-parse", "--git-path", "hooks"], projectPath).trim();
  if (!path.isAbsolute(hooksPath)) {
    return path.resolve(projectPath, hooksPath, "pre-commit");
  }
  return path.join(hooksPath, "pre-commit");
}

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
  }
}

function testFreshInstall() {
  const repoRoot = createTempRepo();
  try {
    const result = runInstaller(repoRoot);
    assert(result.status === 0, "FRESH_INSTALL: exit 0");
    assert(result.stdout.includes("SECURITY_GATE_INSTALLED=YES"), "FRESH_INSTALL: installed marker");
    assert(result.stdout.includes("PROJECT=" + repoRoot), "FRESH_INSTALL: project path");
    assert(result.stdout.includes("HOOK="), "FRESH_INSTALL: hook path");

    const hookPath = getHookPath(repoRoot);
    assert(fs.existsSync(hookPath), "FRESH_INSTALL: pre-commit exists");
    assert(fs.readFileSync(hookPath, "utf8").includes("ENGINEER_FLOW_SECURITY_GATE"), "FRESH_INSTALL: marker in hook");
    assert(fs.statSync(hookPath).mode & 0o111, "FRESH_INSTALL: hook executable on POSIX");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testExistingHookPreserved() {
  const repoRoot = createTempRepo();
  try {
    const hooksPath = git(["rev-parse", "--git-path", "hooks"], repoRoot).trim();
    const hookDir = path.isAbsolute(hooksPath) ? hooksPath : path.resolve(repoRoot, hooksPath);
    fs.mkdirSync(hookDir, { recursive: true });
    const hookPath = path.join(hookDir, "pre-commit");
    const backupPath = path.join(hookDir, "pre-commit.pre-engineer-flow");
    fs.writeFileSync(hookPath, "#!/bin/sh\necho 'original'\n", "utf8");

    const result = runInstaller(repoRoot);
    assert(result.status === 0, "EXISTING_HOOK_PRESERVED: install succeeds");
    assert(fs.existsSync(backupPath), "EXISTING_HOOK_PRESERVED: backup exists");
    assert(fs.readFileSync(backupPath, "utf8").includes("original"), "EXISTING_HOOK_PRESERVED: original content preserved");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testPreviousHookSuccess() {
  const repoRoot = createTempRepo();
  try {
    const hooksPath = git(["rev-parse", "--git-path", "hooks"], repoRoot).trim();
    const hookDir = path.isAbsolute(hooksPath) ? hooksPath : path.resolve(repoRoot, hooksPath);
    fs.mkdirSync(hookDir, { recursive: true });
    const hookPath = path.join(hookDir, "pre-commit");
    const backupPath = path.join(hookDir, "pre-commit.pre-engineer-flow");
    fs.writeFileSync(hookPath, "#!/bin/sh\nexit 0\n", "utf8");

    runInstaller(repoRoot);

    const hookContent = fs.readFileSync(hookPath, "utf8");
    assert(hookContent.includes("sh \"$BACKUP\""), "PREVIOUS_HOOK_SUCCESS: preserved hook invoked");
    assert(hookContent.includes("node \"$GATE\" check"), "PREVIOUS_HOOK_SUCCESS: security gate invoked");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testPreviousHookFailure() {
  const repoRoot = createTempRepo();
  try {
    const hooksPath = git(["rev-parse", "--git-path", "hooks"], repoRoot).trim();
    const hookDir = path.isAbsolute(hooksPath) ? hooksPath : path.resolve(repoRoot, hooksPath);
    fs.mkdirSync(hookDir, { recursive: true });
    const hookPath = path.join(hookDir, "pre-commit");
    const backupPath = path.join(hookDir, "pre-commit.pre-engineer-flow");
    fs.writeFileSync(hookPath, "#!/bin/sh\nexit 42\n", "utf8");

    runInstaller(repoRoot);

    const hookContent = fs.readFileSync(hookPath, "utf8");
    assert(hookContent.includes("if [ \\$PREVIOUS_EXIT -ne 0 ]; then"), "PREVIOUS_HOOK_FAILURE: failure propagation present");
    assert(hookContent.includes("exit \\$PREVIOUS_EXIT"), "PREVIOUS_HOOK_FAILURE: immediate exit present");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testIdempotentReinstall() {
  const repoRoot = createTempRepo();
  try {
    runInstaller(repoRoot);
    const hooksPath = git(["rev-parse", "--git-path", "hooks"], repoRoot).trim();
    const hookDir = path.isAbsolute(hooksPath) ? hooksPath : path.resolve(repoRoot, hooksPath);
    const backupPath = path.join(hookDir, "pre-commit.pre-engineer-flow");

    fs.writeFileSync(backupPath, "#!/bin/sh\necho 'original'\n", "utf8");
    runInstaller(repoRoot);
    runInstaller(repoRoot);

    const content = fs.readFileSync(backupPath, "utf8");
    assert(content.includes("original"), "IDEMPOTENT_REINSTALL: original preserved");
    assert(fs.readFileSync(path.join(hookDir, "pre-commit"), "utf8").includes("ENGINEER_FLOW_SECURITY_GATE"), "IDEMPOTENT_REINSTALL: marker intact");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testSpacePath() {
  const baseTemp = path.join(os.tmpdir(), "ef posix install spaces");
  fs.mkdirSync(baseTemp, { recursive: true });
  const repoRoot = path.join(baseTemp, "project with spaces");
  fs.mkdirSync(path.join(repoRoot, "src"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, "src", "index.js"), "console.log('hello');\n", "utf8");
  git(["init"], repoRoot);
  git(["config", "user.email", "test@example.com"], repoRoot);
  git(["config", "user.name", "Test User"], repoRoot);
  git(["add", "."], repoRoot);
  git(["commit", "-m", "initial"], repoRoot);

  try {
    const result = runInstaller(repoRoot);
    assert(result.status === 0, "SPACE_PATH: install succeeds");
    const hookPath = getHookPath(repoRoot);
    assert(fs.existsSync(hookPath), "SPACE_PATH: hook exists");
    assert(fs.readFileSync(hookPath, "utf8").includes("ENGINEER_FLOW_SECURITY_GATE"), "SPACE_PATH: marker in hook");
  } finally {
    fs.rmSync(baseTemp, { recursive: true, force: true });
  }
}

function testNonGitRejected() {
  const nonGit = fs.mkdtempSync(path.join(os.tmpdir(), "ef-non-git-"));
  fs.mkdirSync(path.join(nonGit, "src"), { recursive: true });
  fs.writeFileSync(path.join(nonGit, "src", "index.js"), "console.log('hello');\n", "utf8");

  try {
    const result = runInstaller(nonGit);
    assert(result.status !== 0, "NON_GIT_REJECTED: non-zero exit");
    assert(result.stdout.includes("ERROR=NOT_A_GIT_REPOSITORY"), "NON_GIT_REJECTED: not a git repo marker");
  } finally {
    fs.rmSync(nonGit, { recursive: true, force: true });
  }
}

function testInvalidUsageRejected() {
  const result = spawnSync("sh", [INSTALLER], {
    encoding: "utf8",
    cwd: REPO_ROOT,
    timeout: 180000,
    windowsHide: true
  });

  assert(result.status !== 0, "INVALID_USAGE_REJECTED: non-zero exit");
  assert(result.stdout.includes("Usage:"), "INVALID_USAGE_REJECTED: usage message");
}

function main() {
  const available = shAvailable();

  console.log("Running POSIX security gate installer tests...\n");

  if (!available) {
    console.log("SKIP: REAL_SH_EXECUTION_TEST=SKIP_UNSUPPORTED_PLATFORM");
    console.log("\nPOSIX installer tests skipped: sh not available on this platform.");
    return;
  }

  testFreshInstall();
  testExistingHookPreserved();
  testPreviousHookSuccess();
  testPreviousHookFailure();
  testIdempotentReinstall();
  testSpacePath();
  testNonGitRejected();
  testInvalidUsageRejected();

  console.log("\nPOSIX installer tests completed.");
}

main();
