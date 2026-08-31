#!/usr/bin/env node
/*
 * Security gate regression suite.
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
const SECURITY_GATE = path.join(REPO_ROOT, "skills", "engineer-flow", "scripts", "security-gate.mjs");

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
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ef-security-gate-"));
  fs.mkdirSync(path.join(repoRoot, "src"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, "src", "index.js"), "console.log('hello');\n", "utf8");
  git(["init"], repoRoot);
  git(["config", "user.email", "test@example.com"], repoRoot);
  git(["config", "user.name", "Test User"], repoRoot);
  git(["add", "."], repoRoot);
  git(["commit", "-m", "initial"], repoRoot);
  return repoRoot;
}

function runSecurityGate(command, cwd, extraArgs = []) {
  const args = [
    SECURITY_GATE,
    command,
    "--cwd",
    cwd,
    ...extraArgs
  ];

  const result = spawnSync(process.execPath, args, {
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

function stageNewFile(repoRoot) {
  const filePath = path.join(repoRoot, "src", "new-file.js");
  fs.writeFileSync(filePath, "console.log('new');\n", "utf8");
  git(["add", "src/new-file.js"], repoRoot);
}

function modifyAndStage(repoRoot, filename, content) {
  const filePath = path.join(repoRoot, filename);
  fs.writeFileSync(filePath, content, "utf8");
  git(["add", filename], repoRoot);
}

function readResultFile(repoRoot, hash) {
  const gateDir = git(["rev-parse", "--git-path", "engineer-flow-security"], repoRoot).trim();
  if (!path.isAbsolute(gateDir)) {
    const gateDirAbs = path.resolve(repoRoot, gateDir);
    const resultFile = path.join(gateDirAbs, "results", `${hash}.json`);
    if (fs.existsSync(resultFile)) {
      return JSON.parse(fs.readFileSync(resultFile, "utf8"));
    }
    return null;
  }
  const resultFile = path.join(gateDir, "results", `${hash}.json`);
  if (fs.existsSync(resultFile)) {
    return JSON.parse(fs.readFileSync(resultFile, "utf8"));
  }
  return null;
}

function getDiffHash(repoRoot) {
  const diff = git(["diff", "--cached", "--no-ext-diff", "--binary", "--unified=40", "--"], repoRoot);
  return crypto.createHash("sha256").update(diff).digest("hex");
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`FAIL: ${message}`);
  }
}

function testNoStagedChanges() {
  const repoRoot = createTempRepo();
  try {
    const result = runSecurityGate("check", repoRoot);
    assert(result.status === 0, "NO_STAGED_CHANGES: exit 0");
    assert(result.stdout.includes("SECURITY_GATE=SKIP_NO_STAGED_CHANGES"), "NO_STAGED_CHANGES: correct output");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testReviewRequired() {
  const repoRoot = createTempRepo();
  try {
    stageNewFile(repoRoot);
    const result = runSecurityGate("check", repoRoot);
    assert(result.status !== 0, "REVIEW_REQUIRED: non-zero exit");
    assert(result.stderr.includes("SECURITY_GATE=REVIEW_REQUIRED"), "REVIEW_REQUIRED: correct output");

    const hash = getDiffHash(repoRoot);
    const gateDir = git(["rev-parse", "--git-path", "engineer-flow-security"], repoRoot).trim();
    const gateDirAbs = path.isAbsolute(gateDir) ? gateDir : path.resolve(repoRoot, gateDir);
    const requestFile = path.join(gateDirAbs, "requests", `${hash}.json`);
    const promptFile = path.join(gateDirAbs, "requests", `${hash}.md`);
    const diffFile = path.join(gateDirAbs, "requests", `${hash}.diff`);

    assert(fs.existsSync(requestFile), "REVIEW_REQUIRED: request JSON exists");
    assert(fs.existsSync(promptFile), "REVIEW_REQUIRED: prompt file exists");
    assert(fs.existsSync(diffFile), "REVIEW_REQUIRED: diff file exists");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testPassRecord() {
  const repoRoot = createTempRepo();
  try {
    stageNewFile(repoRoot);
    const checkResult = runSecurityGate("check", repoRoot);
    assert(checkResult.status !== 0, "PASS_RECORD: initial check requires review");

    const hash = getDiffHash(repoRoot);
    const recordResult = runSecurityGate("record", repoRoot, ["--result", "PASS"]);
    assert(recordResult.status === 0, "PASS_RECORD: record exit 0");
    assert(recordResult.stdout.includes("SECURITY_REVIEW_RECORDED=PASS"), "PASS_RECORD: recorded PASS");

    const checkAfterResult = runSecurityGate("check", repoRoot);
    assert(checkAfterResult.status === 0, "PASS_RECORD: check after record exit 0");
    assert(checkAfterResult.stdout.includes("SECURITY_GATE=PASS"), "PASS_RECORD: check returns PASS");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testDiffHashInvalidation() {
  const repoRoot = createTempRepo();
  try {
    stageNewFile(repoRoot);
    const hash1 = getDiffHash(repoRoot);
    runSecurityGate("record", repoRoot, ["--result", "PASS"]);

    modifyAndStage(repoRoot, "src/new-file.js", "console.log('modified');\n");
    const hash2 = getDiffHash(repoRoot);
    assert(hash1 !== hash2, "DIFF_HASH_INVALIDATION: hashes differ");

    const checkResult = runSecurityGate("check", repoRoot);
    assert(checkResult.status !== 0, "DIFF_HASH_INVALIDATION: non-zero exit after change");
    assert(checkResult.stderr.includes("SECURITY_GATE=REVIEW_REQUIRED"), "DIFF_HASH_INVALIDATION: requires review again");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testNeedsFix() {
  const repoRoot = createTempRepo();
  try {
    stageNewFile(repoRoot);
    const checkResult = runSecurityGate("check", repoRoot);
    assert(checkResult.status !== 0, "NEEDS_FIX: initial check requires review");

    const recordResult = runSecurityGate("record", repoRoot, ["--result", "NEEDS_FIX"]);
    assert(recordResult.status === 0, "NEEDS_FIX: record exit 0");
    assert(recordResult.stdout.includes("SECURITY_REVIEW_RECORDED=NEEDS_FIX"), "NEEDS_FIX: recorded NEEDS_FIX");

    const checkAfterResult = runSecurityGate("check", repoRoot);
    assert(checkAfterResult.status !== 0, "NEEDS_FIX: check after record non-zero exit");
    assert(checkAfterResult.stderr.includes("SECURITY_GATE=NEEDS_FIX"), "NEEDS_FIX: check returns NEEDS_FIX");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testMalformedResult() {
  const repoRoot = createTempRepo();
  try {
    stageNewFile(repoRoot);
    const hash = getDiffHash(repoRoot);
    const gateDir = git(["rev-parse", "--git-path", "engineer-flow-security"], repoRoot).trim();
    const gateDirAbs = path.isAbsolute(gateDir) ? gateDir : path.resolve(repoRoot, gateDir);
    const resultDir = path.join(gateDirAbs, "results");
    fs.mkdirSync(resultDir, { recursive: true });
    const resultFile = path.join(resultDir, `${hash}.json`);

    fs.writeFileSync(resultFile, "not valid json", "utf8");

    const checkResult = runSecurityGate("check", repoRoot);
    assert(checkResult.status !== 0, "MALFORMED_RESULT_REJECTED: non-zero exit");
    assert(checkResult.stderr.includes("SECURITY_GATE=REVIEW_REQUIRED"), "MALFORMED_RESULT_REJECTED: requires review");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testWrongHashResult() {
  const repoRoot = createTempRepo();
  try {
    stageNewFile(repoRoot);
    const hash = getDiffHash(repoRoot);
    const gateDir = git(["rev-parse", "--git-path", "engineer-flow-security"], repoRoot).trim();
    const gateDirAbs = path.isAbsolute(gateDir) ? gateDir : path.resolve(repoRoot, gateDir);
    const resultDir = path.join(gateDirAbs, "results");
    fs.mkdirSync(resultDir, { recursive: true });
    const resultFile = path.join(resultDir, `${hash}.json`);

    const wrongHash = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const payload = {
      version: 1,
      diff_sha256: wrongHash,
      result: "PASS",
      reviewed_at: new Date().toISOString()
    };

    fs.writeFileSync(resultFile, JSON.stringify(payload, null, 2) + "\n", "utf8");

    const checkResult = runSecurityGate("check", repoRoot);
    assert(checkResult.status !== 0, "WRONG_HASH_REJECTED: non-zero exit");
    assert(checkResult.stderr.includes("SECURITY_GATE=REVIEW_REQUIRED"), "WRONG_HASH_REJECTED: requires review");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function testDiffScopedResult() {
  const repoRoot = createTempRepo();
  try {
    stageNewFile(repoRoot);
    const hash1 = getDiffHash(repoRoot);
    runSecurityGate("record", repoRoot, ["--result", "PASS"]);

    modifyAndStage(repoRoot, "src/new-file.js", "console.log('modified-2');\n");
    const hash2 = getDiffHash(repoRoot);
    assert(hash1 !== hash2, "DIFF_SCOPED_RESULT: hashes differ");

    const result1 = readResultFile(repoRoot, hash1);
    const result2 = readResultFile(repoRoot, hash2);

    assert(result1 !== null && result1.result === "PASS", "DIFF_SCOPED_RESULT: first diff has PASS result");
    assert(result2 === null, "DIFF_SCOPED_RESULT: second diff has no result");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function main() {
  console.log("Running security gate regression tests...\n");

  testNoStagedChanges();
  testReviewRequired();
  testPassRecord();
  testDiffHashInvalidation();
  testNeedsFix();
  testMalformedResult();
  testWrongHashResult();
  testDiffScopedResult();

  console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main();
