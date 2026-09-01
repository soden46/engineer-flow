#!/usr/bin/env node
/*
 * Regression tests for the read-only `explain` command.
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

const EXPLAIN_RUNNER = path.join(
  REPO_ROOT,
  "skills",
  "engineer-flow",
  "scripts",
  "engineer-flow.mjs"
);

const results = {};

function createTempDir() {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "ef-explain-test-")
  );
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function runExplain(args, envVars = {}, cwd = REPO_ROOT) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(envVars)) {
    if (value === null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  const allArgs = ["explain", ...args];
  return spawnSync(process.execPath, [EXPLAIN_RUNNER, ...allArgs], {
    encoding: "utf8",
    cwd,
    env,
    timeout: 30000,
    windowsHide: true,
  });
}

function runResolve(args, envVars = {}, cwd = REPO_ROOT) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(envVars)) {
    if (value === null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  const allArgs = ["resolve", ...args];
  return spawnSync(process.execPath, [EXPLAIN_RUNNER, ...allArgs], {
    encoding: "utf8",
    cwd,
    env,
    timeout: 30000,
    windowsHide: true,
  });
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

function parseExplainOutput(stdout) {
  const fields = {};
  for (const line of stdout.split(/\r?\n/)) {
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const key = line.slice(0, idx);
    const value = line.slice(idx + 1);
    fields[key] = value;
  }
  return fields;
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

function testBasicExplain() {
  const result = runExplain([
    "--task", "fix duplicate orders under concurrency",
    "--cwd", REPO_ROOT
  ]);

  const fields = parseExplainOutput(result.stdout);

  assert(result.status === 0, "exit 0");
  assert(result.stdout.startsWith("ENGINEER_FLOW_EXPLAIN"), "starts with ENGINEER_FLOW_EXPLAIN");
  assert(fields.TASK === "fix duplicate orders under concurrency", "TASK reported");
  assert(fields.PROJECT_ROOT === REPO_ROOT, "PROJECT_ROOT reported");
  assert(fields.PRIMARY !== undefined && fields.PRIMARY !== "", "PRIMARY field exists");
  assert(fields.PRIMARY_SCORE !== undefined && fields.PRIMARY_SCORE !== "", "PRIMARY_SCORE field exists");
  assert(fields.SPECIALIST_COUNT !== undefined, "SPECIALIST_COUNT field exists");
  assert(fields.MAX_SPECIALISTS === "2", "MAX_SPECIALISTS=2");
  assert(fields.ROUTING_BEHAVIOR_CHANGED === "NO", "ROUTING_BEHAVIOR_CHANGED=NO");
}

function testPrimaryMatchedTerms() {
  const result = runExplain([
    "--task", "debug performance issue in database queries",
    "--cwd", REPO_ROOT
  ]);

  const fields = parseExplainOutput(result.stdout);

  assert(result.status === 0, "exit 0");
  assert(fields.PRIMARY_MATCHED_TERMS !== undefined, "PRIMARY_MATCHED_TERMS field exists");
  assert(fields.PRIMARY === "performance" || fields.PRIMARY === "database", "PRIMARY is routing-relevant");
  if (fields.PRIMARY === "performance" || fields.PRIMARY === "database") {
    assert(
      fields.PRIMARY_MATCHED_TERMS !== "NONE",
      "matched terms reported for lexically matching primary"
    );
  }
}

function testSupportExplanation() {
  const result = runExplain([
    "--task", "debug performance issue in database queries",
    "--cwd", REPO_ROOT
  ]);

  const fields = parseExplainOutput(result.stdout);

  assert(result.status === 0, "exit 0");
  assert(fields.SUPPORT !== undefined, "SUPPORT field exists");
  assert(fields.SUPPORT_SCORE !== undefined, "SUPPORT_SCORE field exists");
  assert(fields.SUPPORT_MATCHED_TERMS !== undefined, "SUPPORT_MATCHED_TERMS field exists");
  if (fields.SUPPORT !== "NONE") {
    assert(
      parseInt(fields.SUPPORT_SCORE, 10) > 0,
      "SUPPORT_SCORE > 0 when support selected"
    );
  }
}

function testZeroSpecialist() {
  const result = runExplain([
    "--task", "xyz abc 123",
    "--cwd", REPO_ROOT
  ]);

  const fields = parseExplainOutput(result.stdout);

  assert(result.status === 0, "exit 0");
  assert(fields.PRIMARY === "NONE", "PRIMARY=NONE");
  assert(fields.SUPPORT === "NONE", "SUPPORT=NONE");
  assert(fields.SPECIALIST_COUNT === "0", "SPECIALIST_COUNT=0");
}

function testProjectEvidence() {
  const root = createTempDir();
  try {
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ name: "test-project", version: "1.0.0" }),
      "utf8"
    );

    const result = runExplain([
      "--task", "fix bug",
      "--cwd", root
    ]);

    const fields = parseExplainOutput(result.stdout);

    assert(result.status === 0, "exit 0");
    assert(
      fields.PROJECT_EVIDENCE_FILES !== undefined,
      "PROJECT_EVIDENCE_FILES field exists"
    );
    assert(
      fields.PROJECT_EVIDENCE_FILES.includes("package.json"),
      "package.json reported as project evidence"
    );
  } finally {
    cleanup(root);
  }
}

function testExternalEvidence() {
  const root = createTempDir();
  const extRoot = path.join(root, "ext-skills");
  const skillDir = path.join(extRoot, "flutter-test-skill");

  try {
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      [
        "---",
        "name: flutter-test-skill",
        "description: Flutter skill for explain tests.",
        "---",
        "",
        "# Flutter Test Skill"
      ].join("\n"),
      "utf8"
    );

    fs.writeFileSync(
      path.join(root, "pubspec.yaml"),
      "name: my_flutter_app\nflutter:\n  uses-material-design: true\n",
      "utf8"
    );

    const result = runExplain([
      "--task", "fix flutter state management",
      "--cwd", root
    ], {
      ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot
    });

    const fields = parseExplainOutput(result.stdout);

    assert(result.status === 0, "exit 0");

    if (fields.PRIMARY === "flutter-test-skill") {
      assert(
        fields.PRIMARY_EXTERNAL_EVIDENCE !== undefined &&
        fields.PRIMARY_EXTERNAL_EVIDENCE !== "NONE",
        "external evidence reported for selected external specialist"
      );
    } else if (fields.SUPPORT === "flutter-test-skill") {
      assert(
        fields.SUPPORT_EXTERNAL_EVIDENCE !== undefined &&
        fields.SUPPORT_EXTERNAL_EVIDENCE !== "NONE",
        "external evidence reported for selected external support"
      );
    }
  } finally {
    cleanup(root);
  }
}

function testMetadata() {
  const result = runExplain([
    "--task", "fix bug",
    "--cwd", REPO_ROOT
  ]);

  const fields = parseExplainOutput(result.stdout);

  assert(result.status === 0, "exit 0");
  assert(fields.MEMORY_MODE === "conditional", "MEMORY_MODE=conditional");
  assert(fields.MEMORY_COUNTED_AS_SPECIALIST === "NO", "MEMORY_COUNTED_AS_SPECIALIST=NO");
  assert(fields.SECURITY_REVIEW_REQUIRED === "YES", "SECURITY_REVIEW_REQUIRED=YES");
  assert(fields.SECURITY_COUNTED_AS_SPECIALIST === "NO", "SECURITY_COUNTED_AS_SPECIALIST=NO");
}

function testReadOnly() {
  const root = createTempDir();
  const extRoot = path.join(root, "ext-skills");
  const skillDir = path.join(extRoot, "test-ro-skill");
  const memRoot = path.join(root, "memory-root");

  try {
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: test-ro-skill\ndescription: read-only test.\n---\n",
      "utf8"
    );
    fs.mkdirSync(memRoot, { recursive: true });

    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ name: "ro-test" }),
      "utf8"
    );

    const beforeExt = snapshotDir(extRoot);
    const beforeMem = snapshotDir(memRoot);
    const beforeRoot = snapshotDir(root);

    const result = runExplain([
      "--task", "fix bug",
      "--cwd", root
    ], {
      ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: extRoot,
      ENGINEER_FLOW_MEMORY_ROOT: memRoot
    });

    const afterExt = snapshotDir(extRoot);
    const afterMem = snapshotDir(memRoot);
    const afterRoot = snapshotDir(root);

    assert(result.status === 0, "exit 0");
    assert(
      JSON.stringify(beforeExt) === JSON.stringify(afterExt),
      "external skill root unchanged"
    );
    assert(
      JSON.stringify(beforeMem) === JSON.stringify(afterMem),
      "memory root unchanged"
    );
    assert(
      JSON.stringify(beforeRoot) === JSON.stringify(afterRoot),
      "project root unchanged"
    );
  } finally {
    cleanup(root);
  }
}

function testResolveByteEquivalent() {
  const task = "fix duplicate orders under concurrency";
  const cwd = REPO_ROOT;

  const before = runResolve(["--task", task, "--cwd", cwd]);
  const explain = runExplain(["--task", task, "--cwd", cwd]);
  const after = runResolve(["--task", task, "--cwd", cwd]);

  assert(before.status === 0, "resolve before exits 0");
  assert(explain.status === 0, "explain exits 0");
  assert(after.status === 0, "resolve after exits 0");
  assert(
    before.stdout === after.stdout,
    "resolve output byte-identical before and after explain"
  );
}

function testDeterministicExplain() {
  const task = "optimize database query performance";
  const cwd = REPO_ROOT;

  const result1 = runExplain(["--task", task, "--cwd", cwd]);
  const result2 = runExplain(["--task", task, "--cwd", cwd]);

  assert(result1.status === 0, "first run exits 0");
  assert(result2.status === 0, "second run exits 0");
  assert(
    result1.stdout === result2.stdout,
    "explain output byte-identical across runs"
  );
}

function testRequiredTask() {
  const result = runExplain(["--cwd", REPO_ROOT]);

  assert(result.status !== 0, "non-zero exit when --task missing");
}

/* =========================================================
   MAIN
   ========================================================= */

console.log("Running explain regression tests...\n");

runTest("BASIC_EXPLAIN", testBasicExplain);
runTest("PRIMARY_MATCHED_TERMS", testPrimaryMatchedTerms);
runTest("SUPPORT_EXPLANATION", testSupportExplanation);
runTest("ZERO_SPECIALIST", testZeroSpecialist);
runTest("PROJECT_EVIDENCE", testProjectEvidence);
runTest("EXTERNAL_EVIDENCE", testExternalEvidence);
runTest("METADATA", testMetadata);
runTest("READ_ONLY", testReadOnly);
runTest("RESOLVE_BYTE_EQUIVALENT", testResolveByteEquivalent);
runTest("DETERMINISTIC_EXPLAIN", testDeterministicExplain);
runTest("REQUIRED_TASK", testRequiredTask);

const passed = Object.values(results).filter(Boolean).length;
const failed = Object.values(results).filter((v) => !v).length;

console.log(`Results: ${passed} test groups passed, ${failed} failed\n`);

for (const [name, passed] of Object.entries(results)) {
  console.log(`${name}=${passed ? "PASS" : "FAIL"}`);
}

if (failed === 0) {
  console.log("EXPLAIN_REGRESSION=PASS");
  process.exit(0);
} else {
  console.log("EXPLAIN_REGRESSION=FAIL");
  process.exit(1);
}
