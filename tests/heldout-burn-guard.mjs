#!/usr/bin/env node
/*
 * Burn guard regression test for heldout-v4 and heldout-v5.
 *
 * Verifies that the runners permanently refuse execution and that
 * historical evidence files are not mutated.
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

const HELDOUT_V4_RUNNER = path.join(REPO_ROOT, "tests", "run-routing-heldout-v4.mjs");
const HELDOUT_V5_RUNNER = path.join(REPO_ROOT, "tests", "run-routing-heldout-v5.mjs");

const HELDOUT_V4_DATASET = path.join(REPO_ROOT, "tests", "routing-heldout-v4.json");
const HELDOUT_V5_DATASET = path.join(REPO_ROOT, "tests", "routing-heldout-v5.json");

const HELDOUT_V4_RESULT = path.join(REPO_ROOT, "benchmark-results", "heldout-v4-candidate-i.json");
const HELDOUT_V5_RESULT = path.join(REPO_ROOT, "benchmark-results", "heldout-v5-candidate-j.json");

function sha256File(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

function runHeldoutRunner(runnerPath) {
  const result = spawnSync(process.execPath, [runnerPath], {
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

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
  }
}

function testV4Refusal() {
  const result = runHeldoutRunner(HELDOUT_V4_RUNNER);

  assert(result.status !== 0, "V4_REFUSAL: non-zero exit");
  assert(result.stdout.includes("HELDOUT_VERSION=4"), "V4_REFUSAL: version marker");
  assert(result.stdout.includes("HELDOUT_STATUS=BURNED"), "V4_REFUSAL: burned marker");
  assert(result.stdout.includes("HELDOUT_EXECUTION=REFUSED"), "V4_REFUSAL: execution refused");
  assert(result.stdout.includes("HELDOUT_RESULT_ARTIFACT=benchmark-results/heldout-v4-candidate-i.json"), "V4_REFUSAL: artifact path");
}

function testV5Refusal() {
  const result = runHeldoutRunner(HELDOUT_V5_RUNNER);

  assert(result.status !== 0, "V5_REFUSAL: non-zero exit");
  assert(result.stdout.includes("HELDOUT_VERSION=5"), "V5_REFUSAL: version marker");
  assert(result.stdout.includes("HELDOUT_STATUS=BURNED"), "V5_REFUSAL: burned marker");
  assert(result.stdout.includes("HELDOUT_EXECUTION=REFUSED"), "V5_REFUSAL: execution refused");
  assert(result.stdout.includes("HELDOUT_RESULT_ARTIFACT=benchmark-results/heldout-v5-candidate-j.json"), "V5_REFUSAL: artifact path");
}

function testHistoricalEvidenceUnchanged() {
  const beforeHashes = {
    v4Dataset: sha256File(HELDOUT_V4_DATASET),
    v5Dataset: sha256File(HELDOUT_V5_DATASET),
    v4Result: sha256File(HELDOUT_V4_RESULT),
    v5Result: sha256File(HELDOUT_V5_RESULT)
  };

  testV4Refusal();
  testV5Refusal();

  const afterHashes = {
    v4Dataset: sha256File(HELDOUT_V4_DATASET),
    v5Dataset: sha256File(HELDOUT_V5_DATASET),
    v4Result: sha256File(HELDOUT_V4_RESULT),
    v5Result: sha256File(HELDOUT_V5_RESULT)
  };

  assert(afterHashes.v4Dataset === beforeHashes.v4Dataset, "HISTORICAL_EVIDENCE_UNCHANGED: v4 dataset unchanged");
  assert(afterHashes.v5Dataset === beforeHashes.v5Dataset, "HISTORICAL_EVIDENCE_UNCHANGED: v5 dataset unchanged");
  assert(afterHashes.v4Result === beforeHashes.v4Result, "HISTORICAL_EVIDENCE_UNCHANGED: v4 result unchanged");
  assert(afterHashes.v5Result === beforeHashes.v5Result, "HISTORICAL_EVIDENCE_UNCHANGED: v5 result unchanged");
}

function main() {
  console.log("Running heldout burn guard tests...\n");

  testHistoricalEvidenceUnchanged();

  console.log("\nBurn guard tests completed.");
}

main();
