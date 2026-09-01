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

function writeCheckpointsJsonl(project, entries, rootDir) {
  const file = path.join(rootDir, "projects", project, "checkpoints.jsonl");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  fs.writeFileSync(file, content, "utf8");
  return file;
}

function makeEntry(id, type, scope, content, status, opts = {}) {
  return {
    version: 2,
    id,
    type,
    scope,
    status,
    created_at: opts.created_at || "2020-01-01T00:00:00.000Z",
    updated_at: opts.updated_at || "2020-01-01T00:00:00.000Z",
    supersedes: opts.supersedes || [],
    source: "engineer-flow checkpoint",
    confidence: "confirmed",
    content
  };
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
      ["checkpoint", "--project", "demo", "--summary", "Old item one"],
      root
    );
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Old item two"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const prior = readJsonl(jsonlPath);
    const oldId1 = prior[0].id;
    const oldId2 = prior[1].id;

    const result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Use PostgreSQL.",
        "--type", "decision",
        "--scope", "database",
        "--status", "current",
        "--source", "manual-review",
        "--confidence", "inferred",
        "--supersedes", `${oldId1},${oldId2}`,
      ],
      root
    );
    assert(result.status === 0, "checkpoint with custom metadata exits 0");

    const entries = readJsonl(jsonlPath);
    const entry = entries[entries.length - 1];

    assert(entry.type === "decision", "type=decision");
    assert(entry.scope === "database", "scope=database");
    assert(entry.status === "current", "status=current");
    assert(entry.source === "manual-review", "source=manual-review");
    assert(entry.confidence === "inferred", "confidence=inferred");
    assert(entry.supersedes.length === 2, "supersedes has 2 items");
    assert(entry.supersedes[0] === oldId1, "supersedes[0]=oldId1");
    assert(entry.supersedes[1] === oldId2, "supersedes[1]=oldId2");
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

function sha256File(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return sha256(content);
}

function testDedupeIdentical(assert) {
  const root = createTempRoot();
  try {
    const result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Use PostgreSQL for production.",
        "--type", "decision",
        "--scope", "database",
      ],
      root
    );
    assert(result.status === 0, "first checkpoint exits 0");

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const entries = readJsonl(jsonlPath);
    const originalId = entries[0].id;
    assert(entries.length === 1, "one entry after first checkpoint");

    const result2 = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Use PostgreSQL for production.",
        "--type", "decision",
        "--scope", "database",
      ],
      root
    );
    assert(result2.status === 0, "second identical checkpoint exits 0");
    assert(
      result2.stdout.includes("CHECKPOINT_DEDUPLICATED=YES"),
      "dedupe marker in output"
    );
    assert(
      result2.stdout.includes(`CHECKPOINT_ID=${originalId}`),
      "dedupe returns original ID"
    );

    const after = readJsonl(jsonlPath);
    assert(after.length === 1, "no new line appended on dedupe");
  } finally {
    cleanup(root);
  }
}

function testDedupeScopeIsolated(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Same content", "--type", "decision", "--scope", "production"],
      root
    );
    const result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Same content", "--type", "decision", "--scope", "development"],
      root
    );

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const entries = readJsonl(jsonlPath);
    assert(entries.length === 2, "different scope creates new checkpoint");
    assert(!result.stdout.includes("CHECKPOINT_DEDUPLICATED=YES"), "no dedupe for different scope");
  } finally {
    cleanup(root);
  }
}

function testDedupeTypeIsolated(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Same content", "--type", "decision"],
      root
    );
    const result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Same content", "--type", "general"],
      root
    );

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const entries = readJsonl(jsonlPath);
    assert(entries.length === 2, "different type creates new checkpoint");
    assert(!result.stdout.includes("CHECKPOINT_DEDUPLICATED=YES"), "no dedupe for different type");
  } finally {
    cleanup(root);
  }
}

function testStaleAllowsNew(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Config set to Redis"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const a = readJsonl(jsonlPath)[0];
    assert(a.status === "current", "A is current initially");

    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Updated config", "--supersedes", a.id],
      root
    );
    const afterSupersede = readJsonl(jsonlPath);
    const aStale = afterSupersede.find((e) => e.id === a.id);
    assert(aStale.status === "stale", "A is stale after supersession");

    const result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Config set to Redis"],
      root
    );
    const final = readJsonl(jsonlPath);
    assert(final.length === 3, "new checkpoint created for stale content (3 total)");
    assert(!result.stdout.includes("CHECKPOINT_DEDUPLICATED=YES"), "no dedupe for stale content");
  } finally {
    cleanup(root);
  }
}

function testSupersedenceSuccess(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Old architecture A"],
      root
    );
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Old architecture B"],
      root
    );

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const before = readJsonl(jsonlPath);
    const a = before[0];
    const b = before[1];
    const aCreated = a.created_at;
    const bCreated = b.created_at;
    const aUpdated = a.updated_at;
    const bUpdated = b.updated_at;

    const result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "New architecture C",
        "--supersedes", `${a.id},${b.id}`,
      ],
      root
    );
    assert(result.status === 0, "supersession checkpoint exits 0");
    assert(result.stdout.includes("CHECKPOINT_WRITTEN=YES"), "CHECKPOINT_WRITTEN marker");
    assert(result.stdout.includes(`SUPERSEDED=${a.id},${b.id}`), "SUPERSEDED lists both IDs");

    const after = readJsonl(jsonlPath);
    assert(after.length === 3, "three entries after supersession");

    const aAfter = after.find((e) => e.id === a.id);
    const bAfter = after.find((e) => e.id === b.id);
    const cAfter = after.find((e) => e.id === result.stdout.match(/CHECKPOINT_ID=(.+)/)?.[1]?.trim());

    assert(aAfter.status === "stale", "A is stale");
    assert(bAfter.status === "stale", "B is stale");
    assert(cAfter.status === "current", "C is current");
    assert(aAfter.created_at === aCreated, "A.created_at unchanged");
    assert(bAfter.created_at === bCreated, "B.created_at unchanged");
    assert(aAfter.updated_at !== aUpdated, "A.updated_at changed");
    assert(bAfter.updated_at !== bUpdated, "B.updated_at changed");
  } finally {
    cleanup(root);
  }
}

function testUnknownIdRejected(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Valid entry"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const before = getLineCount(jsonlPath);

    const result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "New entry", "--supersedes", "nonexistent999"],
      root
    );
    assert(result.status !== 0, "non-zero exit on unknown supersedes ID");
    assert(getLineCount(jsonlPath) === before, "no new line on unknown ID");
  } finally {
    cleanup(root);
  }
}

function testStaleIdRejected(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "First entry"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const a = readJsonl(jsonlPath)[0];

    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Replacement", "--supersedes", a.id],
      root
    );

    const before = getLineCount(jsonlPath);
    const result = runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Another", "--supersedes", a.id],
      root
    );
    assert(result.status !== 0, "non-zero exit on stale supersedes ID");
    assert(getLineCount(jsonlPath) === before, "no new line on stale ID");
  } finally {
    cleanup(root);
  }
}

function testDuplicateSupersedesRejected(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Entry A"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const a = readJsonl(jsonlPath)[0];

    const before = getLineCount(jsonlPath);
    const result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Entry B",
        "--supersedes", `${a.id},${a.id}`,
      ],
      root
    );
    assert(result.status !== 0, "non-zero exit on duplicate supersedes ID");
    assert(getLineCount(jsonlPath) === before, "no new line on duplicate supersedes");

    const after = readJsonl(jsonlPath);
    assert(after[0].status === "current", "original entry remains current");
  } finally {
    cleanup(root);
  }
}

function testAtomicSupersedenceFailure(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Valid current entry"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const hashBefore = sha256File(jsonlPath);
    const before = readJsonl(jsonlPath);
    const a = before[0];
    assert(a.status === "current", "A is current before failure");

    const result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Attempt with one valid one invalid",
        "--supersedes", `${a.id},nonexistent999`,
      ],
      root
    );
    assert(result.status !== 0, "non-zero exit on partial-invalid supersedes");
    assert(getLineCount(jsonlPath) === before.length, "no new line on partial-invalid");

    const after = readJsonl(jsonlPath);
    const aAfter = after.find((e) => e.id === a.id);
    assert(aAfter.status === "current", "A remains current after failed supersession");

    const hashAfter = sha256File(jsonlPath);
    assert(hashBefore === hashAfter, "JSONL SHA-256 unchanged after failed supersession");
  } finally {
    cleanup(root);
  }
}

function testDedupeBeforeSupersedence(assert) {
  const root = createTempRoot();
  try {
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Duplicate checkpoint D"],
      root
    );
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Other entry E"],
      root
    );
    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const before = readJsonl(jsonlPath);
    const d = before[0];
    const e = before[1];

    const result = runMemory(
      [
        "checkpoint",
        "--project", "demo",
        "--summary", "Duplicate checkpoint D",
        "--supersedes", e.id,
      ],
      root
    );
    assert(
      result.stdout.includes("CHECKPOINT_DEDUPLICATED=YES"),
      "dedupe applied before supersession"
    );

    const after = readJsonl(jsonlPath);
    assert(after.length === 2, "no new checkpoint written");

    const eAfter = after.find((e2) => e2.id === e.id);
    assert(eAfter.status === "current", "E remains current (supersession not applied)");
  } finally {
    cleanup(root);
  }
}

function testLegacyUntouched(assert) {
  const root = createTempRoot();
  try {
    const legacyContent = "## 2024-01-01 000000000000\n\nLegacy memory about databases.\n";
    const legacyPath = createLegacyFile(root, "demo", legacyContent);
    const hashBefore = sha256File(legacyPath);

    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Structured checkpoint"],
      root
    );
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Structured checkpoint"],
      root
    );

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const a = readJsonl(jsonlPath)[0];
    runMemory(
      ["checkpoint", "--project", "demo", "--summary", "Replacement", "--supersedes", a.id],
      root
    );

    const hashAfter = sha256File(legacyPath);
    assert(hashBefore === hashAfter, "legacy current-state.md unchanged after dedupe+supersession");
  } finally {
    cleanup(root);
  }
}

function testRankingCurrentBeatsStale(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("stale001", "general", "project", "PostgreSQL PostgreSQL PostgreSQL PostgreSQL", "stale"),
      makeEntry("curr001", "general", "project", "PostgreSQL cluster setup", "current")
    ];
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "PostgreSQL", "--limit", "5"],
      root
    );
    const currPos = result.stdout.indexOf("ID: curr001");
    const stalePos = result.stdout.indexOf("ID: stale001");
    assert(currPos >= 0 && stalePos >= 0, "both entries present in output");
    assert(currPos < stalePos, "CURRENT appears before STALE");
  } finally {
    cleanup(root);
  }
}

function testRankingCurrentBeatsResolved(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("resolved01", "general", "project", "Redis cache Redis cache Redis cache", "resolved"),
      makeEntry("curr002", "general", "project", "Redis cache setup", "current")
    ];
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "Redis cache", "--limit", "5"],
      root
    );
    const currPos = result.stdout.indexOf("ID: curr002");
    const resolvedPos = result.stdout.indexOf("ID: resolved01");
    assert(currPos >= 0 && resolvedPos >= 0, "both entries present in output");
    assert(currPos < resolvedPos, "CURRENT appears before RESOLVED");
  } finally {
    cleanup(root);
  }
}

function testRankingLegacyBeatsStale(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("stale002", "general", "project", "Database migration plan database", "stale")
    ];
    writeCheckpointsJsonl("demo", entries, root);

    const legacyContent = "## 2024-01-01 000000000000\n\nLegacy block about database migration.\n";
    createLegacyFile(root, "demo", legacyContent);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "database", "--limit", "5"],
      root
    );
    const legacyPos = result.stdout.indexOf("Legacy block about database migration");
    const stalePos = result.stdout.indexOf("ID: stale002");
    assert(legacyPos >= 0 && stalePos >= 0, "both entries present in output");
    assert(legacyPos < stalePos, "LEGACY appears before STALE");
  } finally {
    cleanup(root);
  }
}

function testRankingScoreWithinCurrent(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("lowscore", "general", "project", "PostgreSQL", "current"),
      makeEntry("highscore", "general", "project", "PostgreSQL PostgreSQL PostgreSQL database cluster", "current")
    ];
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "PostgreSQL", "--limit", "5"],
      root
    );
    const highPos = result.stdout.indexOf("ID: highscore");
    const lowPos = result.stdout.indexOf("ID: lowscore");
    assert(highPos >= 0 && lowPos >= 0, "both entries present in output");
    assert(highPos < lowPos, "higher lexical score appears first");
  } finally {
    cleanup(root);
  }
}

function testRankingLimitAfterLifecycle(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("stale003", "general", "project", "PostgreSQL cluster stale info", "stale"),
      makeEntry("resolved002", "general", "project", "PostgreSQL resolved info", "resolved"),
      makeEntry("curr003", "general", "project", "PostgreSQL current info", "current"),
      makeEntry("curr004", "general", "project", "PostgreSQL another current", "current")
    ];
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "PostgreSQL", "--limit", "2"],
      root
    );
    assert(!result.stdout.includes("stale003"), "STALE excluded by limit");
    assert(!result.stdout.includes("resolved002"), "RESOLVED excluded by limit");
    assert(result.stdout.includes("curr003") || result.stdout.includes("curr004"), "CURRENT entries appear");
    const currentIds = ["curr003", "curr004"].filter((id) => result.stdout.includes(id));
    assert(currentIds.length === 2, "both CURRENT entries present (limit=2 fills from CURRENT)");
  } finally {
    cleanup(root);
  }
}

function testRankingHistoricalFallback(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("stale004", "general", "project", "Old MongoDB config", "stale"),
      makeEntry("resolved003", "general", "project", "Old MongoDB history", "resolved")
    ];
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "MongoDB", "--limit", "5"],
      root
    );
    assert(result.stdout.includes("stale004"), "STALE entry returned when no current");
    assert(result.stdout.includes("resolved003"), "RESOLVED entry returned when no current");
  } finally {
    cleanup(root);
  }
}

function testRankingEmptyQueryOrder(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("resolved004", "general", "project", "Some content", "resolved"),
      makeEntry("stale005", "general", "project", "Other content", "stale"),
      makeEntry("curr005", "general", "project", "More content", "current")
    ];
    writeCheckpointsJsonl("demo", entries, root);
    createLegacyFile(root, "demo", "## 2024-01-01 000000000000\n\nLegacy content block here.\n");

    const result = runMemory(
      ["recall", "--project", "demo", "--limit", "10"],
      root
    );

    const currPos = result.stdout.indexOf("ID: curr005");
    const legacyPos = result.stdout.indexOf("Legacy content block here");
    const stalePos = result.stdout.indexOf("ID: stale005");
    const resolvedPos = result.stdout.indexOf("ID: resolved004");

    assert(currPos >= 0, "current in output");
    assert(legacyPos >= 0, "legacy in output");
    assert(stalePos >= 0, "stale in output");
    assert(resolvedPos >= 0, "resolved in output");
    assert(currPos < legacyPos, "CURRENT before LEGACY");
    assert(legacyPos < stalePos, "LEGACY before STALE");
    assert(stalePos < resolvedPos, "STALE before RESOLVED");
  } finally {
    cleanup(root);
  }
}

function testRankingDeterministicTie(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("aaa001", "general", "project", "Database", "current",
        { created_at: "2020-01-01T00:00:00.000Z", updated_at: "2020-01-01T00:00:00.000Z" }),
      makeEntry("bbb001", "general", "project", "Database", "current",
        { created_at: "2020-01-01T00:00:00.000Z", updated_at: "2020-01-01T00:00:00.000Z" })
    ];
    writeCheckpointsJsonl("demo", entries, root);

    const result1 = runMemory(
      ["recall", "--project", "demo", "--query", "Database", "--limit", "5"],
      root
    );
    const result2 = runMemory(
      ["recall", "--project", "demo", "--query", "Database", "--limit", "5"],
      root
    );
    assert(result1.stdout === result2.stdout, "identical ordering across runs");
  } finally {
    cleanup(root);
  }
}

function testRankingReadOnly(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("stale006", "general", "project", "PostgreSQL stale", "stale"),
      makeEntry("curr006", "general", "project", "PostgreSQL current", "current")
    ];
    writeCheckpointsJsonl("demo", entries, root);
    const legacyContent = "## 2024-01-01 000000000000\n\nLegacy database memory.\n";
    const legacyPath = createLegacyFile(root, "demo", legacyContent);

    const jsonlPath = path.join(root, "projects", "demo", "checkpoints.jsonl");
    const jsonlHashBefore = sha256File(jsonlPath);
    const legacyHashBefore = sha256File(legacyPath);

    runMemory(["recall", "--project", "demo", "--query", "PostgreSQL", "--limit", "5"], root);
    runMemory(["recall", "--project", "demo", "--query", "database", "--limit", "5"], root);
    runMemory(["recall", "--project", "demo", "--query", ""], root);

    const jsonlHashAfter = sha256File(jsonlPath);
    const legacyHashAfter = sha256File(legacyPath);
    assert(jsonlHashBefore === jsonlHashAfter, "checkpoints.jsonl unchanged after recall");
    assert(legacyHashBefore === legacyHashAfter, "current-state.md unchanged after recall");
  } finally {
    cleanup(root);
  }
}

function compactJsonlPath(root, project) {
  return path.join(root, "projects", project, "checkpoints.jsonl");
}

function archiveJsonlPath(root, project) {
  return path.join(root, "projects", project, "archive.jsonl");
}

function sha256Optional(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha256File(filePath);
}

function buildMixedEntries() {
  return [
    makeEntry("curr-mix-1", "general", "project", "Current decision one", "current",
      { created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" }),
    makeEntry("stale-mix-1", "general", "project", "Old stale one", "stale",
      { created_at: "2020-01-01T00:00:00.000Z", updated_at: "2020-01-01T00:00:00.000Z" }),
    makeEntry("stale-mix-2", "general", "project", "Old stale two", "stale",
      { created_at: "2020-02-01T00:00:00.000Z", updated_at: "2020-02-01T00:00:00.000Z" }),
    makeEntry("resolved-mix-1", "general", "project", "Old resolved one", "resolved",
      { created_at: "2020-03-01T00:00:00.000Z", updated_at: "2020-03-01T00:00:00.000Z" })
  ];
}

function testCompactionDryRunReadOnly(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);
    const activePath = compactJsonlPath(root, "demo");
    const archivePath = archiveJsonlPath(root, "demo");
    const activeHashBefore = sha256File(activePath);

    const result = runMemory(
      ["compact", "--project", "demo", "--keep-history", "1"],
      root
    );
    assert(result.status === 0, "compact dry-run exits 0");
    assert(result.stdout.includes("MEMORY_COMPACTION=DRY_RUN"), "DRY_RUN marker");
    assert(result.stdout.includes("WOULD_ARCHIVE=2"), "WOULD_ARCHIVE count");
    assert(sha256File(activePath) === activeHashBefore, "checkpoints.jsonl unchanged after dry-run");
    assert(!fs.existsSync(archivePath), "archive.jsonl not created on dry-run");
  } finally {
    cleanup(root);
  }
}

function testCompactionCurrentNeverArchived(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["compact", "--project", "demo", "--keep-history", "0", "--apply"],
      root
    );
    assert(result.status === 0, "compact apply exits 0");
    assert(result.stdout.includes("MEMORY_COMPACTION=APPLIED"), "APPLIED marker");

    const archivePath = archiveJsonlPath(root, "demo");
    const archiveEntries = readJsonl(archivePath);
    const archiveIds = new Set(archiveEntries.map((e) => e.id));
    const currentIds = entries.filter((e) => e.status === "current").map((e) => e.id);
    for (const id of currentIds) {
      assert(!archiveIds.has(id), `current ${id} never archived`);
    }
  } finally {
    cleanup(root);
  }
}

function testCompactionRetentionLimit(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["compact", "--project", "demo", "--keep-history", "2", "--apply"],
      root
    );
    assert(result.status === 0, "compact apply exits 0");
    assert(result.stdout.includes("MEMORY_COMPACTION=APPLIED"), "APPLIED marker");

    const activePath = compactJsonlPath(root, "demo");
    const activeEntries = readJsonl(activePath);
    const historicalActive = activeEntries.filter(
      (e) => e.status === "stale" || e.status === "resolved"
    );
    assert(historicalActive.length === 2, "exactly 2 historical entries remain active");

    const archivePath = archiveJsonlPath(root, "demo");
    const archiveEntries = readJsonl(archivePath);
    const retainedIds = new Set(historicalActive.map((e) => e.id));
    for (const archived of archiveEntries) {
      assert(!retainedIds.has(archived.id), `archived ${archived.id} is not in active retention set`);
    }
  } finally {
    cleanup(root);
  }
}

function testCompactionArchivePreservesObjects(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);

    const result = runMemory(
      ["compact", "--project", "demo", "--keep-history", "0", "--apply"],
      root
    );
    assert(result.status === 0, "compact apply exits 0");

    const archivePath = archiveJsonlPath(root, "demo");
    const archiveEntries = readJsonl(archivePath);
    assert(archiveEntries.length > 0, "archive has entries");

    for (const original of entries) {
      if (original.status === "current") continue;
      const archived = archiveEntries.find((e) => e.id === original.id);
      assert(!!archived, `archive contains original id ${original.id}`);
      assert(archived.id === original.id, `id preserved for ${original.id}`);
      assert(archived.type === original.type, `type preserved for ${original.id}`);
      assert(archived.scope === original.scope, `scope preserved for ${original.id}`);
      assert(archived.status === original.status, `status preserved for ${original.id}`);
      assert(archived.created_at === original.created_at, `created_at preserved for ${original.id}`);
      assert(archived.updated_at === original.updated_at, `updated_at preserved for ${original.id}`);
      assert(archived.source === original.source, `source preserved for ${original.id}`);
      assert(archived.confidence === original.confidence, `confidence preserved for ${original.id}`);
      assert(archived.content === original.content, `content preserved for ${original.id}`);
      assert(JSON.stringify(archived.supersedes) === JSON.stringify(original.supersedes), `supersedes preserved for ${original.id}`);
    }
  } finally {
    cleanup(root);
  }
}

function testCompactionArchiveNoDuplicates(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);

    runMemory(["compact", "--project", "demo", "--keep-history", "0", "--apply"], root);

    const archivePath = archiveJsonlPath(root, "demo");
    const firstArchive = readJsonl(archivePath);
    const firstCount = firstArchive.length;

    writeCheckpointsJsonl("demo", entries, root);
    runMemory(["compact", "--project", "demo", "--keep-history", "0", "--apply"], root);

    const secondArchive = readJsonl(archivePath);
    const ids = secondArchive.map((e) => e.id);
    const uniqueIds = new Set(ids);
    assert(uniqueIds.size === ids.length, "archive IDs are unique");
    assert(secondArchive.length === firstCount, "archive count unchanged on re-compact");
  } finally {
    cleanup(root);
  }
}

function testCompactionIdempotent(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);

    runMemory(["compact", "--project", "demo", "--keep-history", "0", "--apply"], root);

    const activePath = compactJsonlPath(root, "demo");
    const archivePath = archiveJsonlPath(root, "demo");
    const activeHash1 = sha256File(activePath);
    const archiveHash1 = sha256File(archivePath);

    const result2 = runMemory(
      ["compact", "--project", "demo", "--keep-history", "0", "--apply"],
      root
    );
    assert(result2.stdout.includes("MEMORY_COMPACTION=NOOP"), "second compact is NOOP");
    assert(sha256File(activePath) === activeHash1, "active unchanged after second compact");
    assert(sha256File(archivePath) === archiveHash1, "archive unchanged after second compact");
  } finally {
    cleanup(root);
  }
}

function testCompactionInvalidRetentionRejected(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);
    const activePath = compactJsonlPath(root, "demo");
    const activeHashBefore = sha256File(activePath);

    const r1 = runMemory(
      ["compact", "--project", "demo", "--keep-history", "-1", "--apply"],
      root
    );
    assert(r1.status !== 0, "--keep-history -1 non-zero exit");
    assert(sha256File(activePath) === activeHashBefore, "active unchanged after invalid retention");

    const r2 = runMemory(
      ["compact", "--project", "demo", "--keep-history", "abc", "--apply"],
      root
    );
    assert(r2.status !== 0, "--keep-history abc non-zero exit");
    assert(sha256File(activePath) === activeHashBefore, "active unchanged after invalid retention");
  } finally {
    cleanup(root);
  }
}

function testCompactionLegacyUntouched(assert) {
  const root = createTempRoot();
  try {
    const entries = buildMixedEntries();
    writeCheckpointsJsonl("demo", entries, root);
    const legacyContent = "## 2024-01-01 000000000000\n\nLegacy memory about databases.\n";
    const legacyPath = createLegacyFile(root, "demo", legacyContent);
    const legacyHashBefore = sha256File(legacyPath);

    runMemory(["compact", "--project", "demo", "--keep-history", "0", "--apply"], root);

    const legacyHashAfter = sha256File(legacyPath);
    assert(legacyHashBefore === legacyHashAfter, "current-state.md SHA-256 unchanged after compaction");
  } finally {
    cleanup(root);
  }
}

function testCompactionArchiveNotRecalled(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("arch-archive-1", "general", "project", "Archived unique keyword about zymurgy", "stale",
        { created_at: "2020-01-01T00:00:00.000Z", updated_at: "2020-01-01T00:00:00.000Z" }),
      makeEntry("curr-keep-1", "general", "project", "Current entry", "current",
        { created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" })
    ];
    writeCheckpointsJsonl("demo", entries, root);

    runMemory(["compact", "--project", "demo", "--keep-history", "0", "--apply"], root);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "zymurgy", "--limit", "10"],
      root
    );
    assert(!result.stdout.includes("arch-archive-1"), "archived entry not recalled");
  } finally {
    cleanup(root);
  }
}

function testCompactionActiveRecallUnchanged(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("ret-curr-1", "general", "project", "Active current about PostgreSQL", "current",
        { created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" }),
      makeEntry("ret-hist-1", "general", "project", "Retained historical about PostgreSQL", "stale",
        { created_at: "2026-01-02T00:00:00.000Z", updated_at: "2026-01-02T00:00:00.000Z" }),
      makeEntry("ret-hist-2", "general", "project", "Retained historical two about PostgreSQL", "stale",
        { created_at: "2020-01-01T00:00:00.000Z", updated_at: "2020-01-01T00:00:00.000Z" }),
      makeEntry("ret-hist-3", "general", "project", "Older historical about PostgreSQL", "stale",
        { created_at: "2019-01-01T00:00:00.000Z", updated_at: "2019-01-01T00:00:00.000Z" })
    ];
    writeCheckpointsJsonl("demo", entries, root);

    runMemory(["compact", "--project", "demo", "--keep-history", "2", "--apply"], root);

    const result = runMemory(
      ["recall", "--project", "demo", "--query", "PostgreSQL", "--limit", "10"],
      root
    );
    assert(result.stdout.includes("ret-curr-1"), "retained current recalled");
    assert(result.stdout.includes("ret-hist-1"), "retained historical-1 recalled");
    assert(result.stdout.includes("ret-hist-2"), "retained historical-2 recalled");
    assert(!result.stdout.includes("ret-hist-3"), "archived historical-3 not recalled");

    const currPos = result.stdout.indexOf("ret-curr-1");
    const hist1Pos = result.stdout.indexOf("ret-hist-1");
    assert(currPos >= 0 && hist1Pos >= 0 && currPos < hist1Pos, "current before retained historical (lifecycle ranking preserved)");
  } finally {
    cleanup(root);
  }
}

function testCompactionNoop(assert) {
  const root = createTempRoot();
  try {
    const entries = [
      makeEntry("noop-curr-1", "general", "project", "Current only", "current",
        { created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" })
    ];
    writeCheckpointsJsonl("demo", entries, root);
    const activePath = compactJsonlPath(root, "demo");
    const activeHashBefore = sha256File(activePath);

    const result = runMemory(
      ["compact", "--project", "demo", "--keep-history", "0", "--apply"],
      root
    );
    assert(result.status === 0, "compact exits 0");
    assert(result.stdout.includes("MEMORY_COMPACTION=NOOP"), "NOOP marker");
    assert(result.stdout.includes("ARCHIVED=0"), "ARCHIVED=0");
    assert(sha256File(activePath) === activeHashBefore, "active unchanged on NOOP");
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

  runTest("DEDUPE_IDENTICAL", testDedupeIdentical);
  runTest("DEDUPE_SCOPE_ISOLATED", testDedupeScopeIsolated);
  runTest("DEDUPE_TYPE_ISOLATED", testDedupeTypeIsolated);
  runTest("STALE_ALLOWS_NEW", testStaleAllowsNew);
  runTest("SUPERSESSION_SUCCESS", testSupersedenceSuccess);
  runTest("UNKNOWN_ID_REJECTED", testUnknownIdRejected);
  runTest("STALE_ID_REJECTED", testStaleIdRejected);
  runTest("DUPLICATE_SUPERSEDES_REJECTED", testDuplicateSupersedesRejected);
  runTest("ATOMIC_SUPERSESSION_FAILURE", testAtomicSupersedenceFailure);
  runTest("DEDUPE_BEFORE_SUPERSESSION", testDedupeBeforeSupersedence);
  runTest("LEGACY_UNTOUCHED", testLegacyUntouched);

  runTest("CURRENT_BEATS_STALE", testRankingCurrentBeatsStale);
  runTest("CURRENT_BEATS_RESOLVED", testRankingCurrentBeatsResolved);
  runTest("LEGACY_BEATS_STALE", testRankingLegacyBeatsStale);
  runTest("SCORE_WITHIN_CURRENT", testRankingScoreWithinCurrent);
  runTest("LIMIT_AFTER_LIFECYCLE", testRankingLimitAfterLifecycle);
  runTest("HISTORICAL_FALLBACK", testRankingHistoricalFallback);
  runTest("EMPTY_QUERY_ORDER", testRankingEmptyQueryOrder);
  runTest("DETERMINISTIC_TIE", testRankingDeterministicTie);
  runTest("RECALL_READ_ONLY", testRankingReadOnly);

  runTest("DRY_RUN_READ_ONLY", testCompactionDryRunReadOnly);
  runTest("CURRENT_NEVER_ARCHIVED", testCompactionCurrentNeverArchived);
  runTest("RETENTION_LIMIT", testCompactionRetentionLimit);
  runTest("ARCHIVE_PRESERVES_OBJECTS", testCompactionArchivePreservesObjects);
  runTest("ARCHIVE_NO_DUPLICATES", testCompactionArchiveNoDuplicates);
  runTest("COMPACTION_IDEMPOTENT", testCompactionIdempotent);
  runTest("INVALID_RETENTION_REJECTED", testCompactionInvalidRetentionRejected);
  runTest("LEGACY_UNTOUCHED", testCompactionLegacyUntouched);
  runTest("ARCHIVE_NOT_RECALLED", testCompactionArchiveNotRecalled);
  runTest("ACTIVE_RECALL_UNCHANGED", testCompactionActiveRecallUnchanged);
  runTest("COMPACTION_NOOP", testCompactionNoop);

  const allPassed = Object.values(results).every(Boolean);

  console.log(
    `Results: ${Object.values(results).filter(Boolean).length} test groups passed, ` +
      `${Object.values(results).filter((v) => !v).length} failed\n`
  );

  for (const [name, passed] of Object.entries(results)) {
    console.log(`${name}=${passed ? "PASS" : "FAIL"}`);
  }

  const lifecycleTests = [
    "DEDUPE_IDENTICAL",
    "DEDUPE_SCOPE_ISOLATED",
    "DEDUPE_TYPE_ISOLATED",
    "STALE_ALLOWS_NEW",
    "SUPERSESSION_SUCCESS",
    "UNKNOWN_ID_REJECTED",
    "STALE_ID_REJECTED",
    "DUPLICATE_SUPERSEDES_REJECTED",
    "ATOMIC_SUPERSESSION_FAILURE",
    "DEDUPE_BEFORE_SUPERSESSION",
    "LEGACY_UNTOUCHED",
  ];

  const rankingTests = [
    "CURRENT_BEATS_STALE",
    "CURRENT_BEATS_RESOLVED",
    "LEGACY_BEATS_STALE",
    "SCORE_WITHIN_CURRENT",
    "LIMIT_AFTER_LIFECYCLE",
    "HISTORICAL_FALLBACK",
    "EMPTY_QUERY_ORDER",
    "DETERMINISTIC_TIE",
    "RECALL_READ_ONLY",
  ];

  const compactionTests = [
    "DRY_RUN_READ_ONLY",
    "CURRENT_NEVER_ARCHIVED",
    "RETENTION_LIMIT",
    "ARCHIVE_PRESERVES_OBJECTS",
    "ARCHIVE_NO_DUPLICATES",
    "COMPACTION_IDEMPOTENT",
    "INVALID_RETENTION_REJECTED",
    "LEGACY_UNTOUCHED",
    "ARCHIVE_NOT_RECALLED",
    "ACTIVE_RECALL_UNCHANGED",
    "COMPACTION_NOOP",
  ];

  const lifecycleAllPassed = lifecycleTests.every((name) => results[name]);
  const rankingAllPassed = rankingTests.every((name) => results[name]);
  const compactionAllPassed = compactionTests.every((name) => results[name]);

  if (allPassed) {
    console.log("MEMORY_REGRESSION=PASS");
  } else {
    console.log("MEMORY_REGRESSION=FAIL");
  }

  if (lifecycleAllPassed) {
    console.log("MEMORY_LIFECYCLE_REGRESSION=PASS");
  } else {
    console.log("MEMORY_LIFECYCLE_REGRESSION=FAIL");
  }

  if (rankingAllPassed) {
    console.log("RECALL_RANKING_REGRESSION=PASS");
  } else {
    console.log("RECALL_RANKING_REGRESSION=FAIL");
  }

  if (compactionAllPassed) {
    console.log("MEMORY_COMPACTION_REGRESSION=PASS");
    process.exit(0);
  } else {
    console.log("MEMORY_COMPACTION_REGRESSION=FAIL");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`memory-structured-checkpoint: ${error.message}`);
  process.exit(1);
});
