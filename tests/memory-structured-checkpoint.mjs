#!/usr/bin/env node
/*
 * Regression tests for structured memory checkpoints v0.2.
 *
 * Uses temporary memory roots only.
 * Does not touch ~/.engineer-flow-memory.
 * Does not depend on network.
 * Uses Node built-ins only.
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
const MEMORY_RUNNER = path.join(
  REPO_ROOT,
  "skills",
  "engineer-flow",
  "infrastructure",
  "memory-management",
  "scripts",
  "memory.mjs"
);

const results = {};

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ef-mem-test-"));
}

function runMemory(args, rootDir) {
  const allArgs = [...args, "--root", rootDir];
  return spawnSync(process.execPath, [MEMORY_RUNNER, ...allArgs], {
    encoding: "utf8",
    cwd: REPO_ROOT,
    timeout: 30000,
    windowsHide: true,
  });
}

function createLegacyFile(root, project, content) {
  const projectDir = path.join(root, "projects", project);
  fs.mkdirSync(projectDir, { recursive: true });
  const legacyPath = path.join(projectDir, "current-state.md");
  fs.writeFileSync(legacyPath, content, "utf8");
  return legacyPath;
}

function readJsonl(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return text
    .split(/\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function cleanup(root) {
  try {
    fs.rmSync(root, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function getLineCount(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const text = fs.readFileSync(filePath, "utf8");
  return text.split(/\n/).filter((line) => line.trim()).length;
}

function runTest(name, fn) {
  let passed = true;
  let failures = [];
  const assert = (condition, message) => {
    if (condition) {
      console.log(`  PASS: ${message}`);
    } else {
      passed = false;
      failures.push(message);
      console.error(`  FAIL: ${message}`);
    }
  };
  try {
    fn(assert);
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

function testLegacyCheckpointCliCompat(assert) {
  const root = createTempRoot();
  try {
    const result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Use PostgreSQL for production."],
      root
    );
    assert(result.status === 0, "exit 0");

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    assert(fs.existsSync(jsonlPath), "checkpoints.jsonl created");

    const lines = readJsonl(jsonlPath);
    assert(lines.length === 1, "exactly one JSON line");

    const mdPath = path.join(root, "projects", "demo", "current-state.md");
    assert(!fs.existsSync(mdPath), "no legacy md file created");
  } finally {
    cleanup(root);
  }
}

function testStructuredSchema(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Use PostgreSQL for production."],
      root
    );

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const entries = readJsonl(jsonlPath);
    const entry = entries[0];

    assert(entry.version === 2, "version=2");
    assert(!!entry.id, "has id");
    assert(entry.type === "general", "default type=general");
    assert(entry.scope === "project", "default scope=project");
    assert(entry.status === "current", "default status=current");
    assert(!!entry.created_at, "has created_at");
    assert(!!entry.updated_at, "has updated_at");
    assert(Array.isArray(entry.supersedes), "supersedes is array");
    assert(entry.source === "engineer-flow checkpoint", "default source");
    assert(entry.confidence === "confirmed", "default confidence");
    assert(entry.content === "Use PostgreSQL for production.", "content matches summary");
  } finally {
    cleanup(root);
  }
}

function testCustomMetadata(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Use PostgreSQL.",
        "--type", "decision",
        "--scope", "database",
        "--status", "current",
        "--source", "manual-review",
        "--confidence", "inferred",
        "--supersedes", "abc123,def456",
      ],
      root
    );

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const entries = readJsonl(jsonlPath);
    const entry = entries[0];

    assert(entry.type === "decision", "type=decision");
    assert(entry.scope === "database", "scope=database");
    assert(entry.status === "current", "status=current");
    assert(entry.source === "manual-review", "source=manual-review");
    assert(entry.confidence === "inferred", "confidence=inferred");
    assert(entry.supersedes.length === 2, "supersedes has 2 items");
    assert(entry.supersedes[0] === "abc123", "supersedes[0]=abc123");
    assert(entry.supersedes[1] === "def456", "supersedes[1]=def456");
  } finally {
    cleanup(root);
  }
}

function testEnumValidation(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "valid entry"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const before = getLineCount(jsonlPath);

    let result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "test", "--type", "invalidtype"],
      root
    );
    assert(result.status !== 0, "invalid type exits non-zero");
    assert(getLineCount(jsonlPath) === before, "no append on invalid type");

    result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "test", "--status", "invalidstatus"],
      root
    );
    assert(result.status !== 0, "invalid status exits non-zero");
    assert(getLineCount(jsonlPath) === before, "no append on invalid status");

    result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "test", "--confidence", "invalidconf"],
      root
    );
    assert(result.status !== 0, "invalid confidence exits non-zero");
    assert(getLineCount(jsonlPath) === before, "no append on invalid confidence");
  } finally {
    cleanup(root);
  }
}

function testSecretRejection(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "valid entry"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const before = getLineCount(jsonlPath);

    let result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "password=supersecret"],
      root
    );
    assert(result.status !== 0, "summary secret exits non-zero");
    assert(getLineCount(jsonlPath) === before, "no partial write on summary secret");

    result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "valid pending",
        "--pending", "sk-1234567890123456789012345678",
      ],
      root
    );
    assert(result.status !== 0, "pending token exits non-zero");
    assert(getLineCount(jsonlPath) === before, "no partial write on pending token");

    result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "valid scope",
        "--scope", "user@example.com",
      ],
      root
    );
    assert(result.status !== 0, "scope email exits non-zero");
    assert(getLineCount(jsonlPath) === before, "no partial write on scope email");

    result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "valid source",
        "--source", "private:-----BEGIN PRIVATE KEY-----",
      ],
      root
    );
    assert(result.status !== 0, "source private-key exits non-zero");
    assert(getLineCount(jsonlPath) === before, "no partial write on source private-key");
  } finally {
    cleanup(root);
  }
}

function testLegacyRecall(assert) {
  const root = createTempRoot();
  try {
    const legacyContent = [
      "## 2024-01-01 000000000000",
      "",
      "- Scope: project",
      "- Status: CURRENT",
      "- Source: engineer-flow checkpoint",
      "",
      "Legacy memory about database migration strategy.",
      "",
    ].join("\n");
    createLegacyFile(root, "demo", legacyContent);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "database migration"],
      root
    );
    assert(result.status === 0, "exit 0");
    assert(
      result.stdout.includes("Legacy memory about database migration"),
      "legacy content in output"
    );
  } finally {
    cleanup(root);
  }
}

function testMixedRecall(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Use PostgreSQL for production."],
      root
    );

    const legacyContent = [
      "## 2024-01-01 000000000000",
      "",
      "- Scope: project",
      "- Status: CURRENT",
      "- Source: engineer-flow checkpoint",
      "",
      "Legacy memory about PostgreSQL configuration.",
      "",
    ].join("\n");
    createLegacyFile(root, "demo", legacyContent);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "PostgreSQL"],
      root
    );
    assert(result.status === 0, "exit 0");
    assert(
      result.stdout.includes("CONTENT: Use PostgreSQL for production."),
      "structured entry in output"
    );
    assert(
      result.stdout.includes("Legacy memory about PostgreSQL"),
      "legacy entry in output"
    );
  } finally {
    cleanup(root);
  }
}

function testLegacyFileUnchanged(assert) {
  const root = createTempRoot();
  try {
    const legacyContent = [
      "## 2024-01-01 000000000000",
      "",
      "- Scope: project",
      "- Status: CURRENT",
      "- Source: engineer-flow checkpoint",
      "",
      "Legacy memory about database migration strategy.",
      "",
    ].join("\n");
    const legacyPath = createLegacyFile(root, "demo", legacyContent);

    const hashBefore = sha256(fs.readFileSync(legacyPath, "utf8"));

    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Use PostgreSQL for production."],
      root
    );

    const hashAfter = sha256(fs.readFileSync(legacyPath, "utf8"));
    assert(hashBefore === hashAfter, "current-state.md identical before/after checkpoint");
  } finally {
    cleanup(root);
  }
}

function testStatusCounts(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "svc1", "--summary", "Current item", "--status", "current"],
      root
    );
    runMemory(
      ["checkpoint", "--project", "svc1", "--summary", "Resolved item", "--status", "resolved"],
      root
    );
    runMemory(
      ["checkpoint", "--project", "svc1", "--summary", "Stale item", "--status", "stale"],
      root
    );

    const legacyContent = "## 2024-01-01 000000000000\n\nLegacy memory.\n";
    createLegacyFile(root, "svc2", legacyContent);

    const result = runMemory(["status"], root);
    assert(result.status === 0, "exit 0");

    const status = JSON.parse(result.stdout);
    assert(status.structured_checkpoints === 3, "structured_checkpoints=3");
    assert(status.legacy_projects === 1, "legacy_projects=1");
    assert(status.current === 1, "current=1");
    assert(status.resolved === 1, "resolved=1");
    assert(status.stale === 1, "stale=1");
    assert(status.version === "0.2.0", "version=0.2.0");
  } finally {
    cleanup(root);
  }
}

function testJsonlIntegrity(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "First checkpoint"],
      root
    );
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Second checkpoint"],
      root
    );
    runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Third checkpoint",
        "--type", "decision",
        "--scope", "database",
      ],
      root
    );

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const text = fs.readFileSync(jsonlPath, "utf8");
    const lines = text.split(/\n/).filter((line) => line.trim());

    assert(lines.length === 3, "3 lines");
    let allValid = true;
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (typeof parsed !== "object" || parsed === null) {
          allValid = false;
        }
        if (!Array.isArray(parsed.supersedes)) {
          allValid = false;
        }
      } catch {
        allValid = false;
      }
    }
    assert(allValid, "all lines independently parseable as JSON");
  } finally {
    cleanup(root);
  }
}

function testStructuredRecallMetadata(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Use PostgreSQL for production.",
        "--type", "decision",
        "--scope", "database",
      ],
      root
    );

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "PostgreSQL"],
      root
    );
    assert(result.status === 0, "exit 0");

    assert(result.stdout.includes("ID:"), "exposes ID");
    assert(result.stdout.includes("TYPE:"), "exposes TYPE");
    assert(result.stdout.includes("SCOPE:"), "exposes SCOPE");
    assert(result.stdout.includes("STATUS:"), "exposes STATUS");
    assert(result.stdout.includes("CONTENT:"), "exposes CONTENT");
    assert(
      result.stdout.includes("Use PostgreSQL for production."),
      "content text present"
    );
  } finally {
    cleanup(root);
  }
}

function main() {
  console.log("Running structured memory checkpoint regression tests...\n");

  runTest("LEGACY_CHECKPOINT_CLI_COMPAT", testLegacyCheckpointCliCompat);
  runTest("STRUCTURED_SCHEMA", testStructuredSchema);
  runTest("CUSTOM_METADATA", testCustomMetadata);
  runTest("ENUM_VALIDATION", testEnumValidation);
  runTest("SECRET_REJECTION", testSecretRejection);
  runTest("LEGACY_RECALL", testLegacyRecall);
  runTest("MIXED_RECALL", testMixedRecall);
  runTest("LEGACY_FILE_UNCHANGED", testLegacyFileUnchanged);
  runTest("STATUS_COUNTS", testStatusCounts);
  runTest("JSONL_INTEGRITY", testJsonlIntegrity);
  runTest("STRUCTURED_RECALL_METADATA", testStructuredRecallMetadata);

  const allPassed = Object.values(results).every(Boolean);

  console.log(
    `Results: ${Object.values(results).filter(Boolean).length} test groups passed, ` +
      `${Object.values(results).filter((v) => !v).length} failed\n`
  );

  for (const [name, passed] of Object.entries(results)) {
    console.log(`${name}=${passed ? "PASS" : "FAIL"}`);
  }

  if (allPassed) {
    console.log("MEMORY_REGRESSION=PASS");
    process.exit(0);
  } else {
    console.log("MEMORY_REGRESSION=FAIL");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`memory-structured-checkpoint: ${error.message}`);
  process.exit(1);
});
