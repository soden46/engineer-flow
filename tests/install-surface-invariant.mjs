#!/usr/bin/env node
/*
 * Test-only install-surface invariant.
 *
 * Verifies that the local public Agent Skills install surface exposes
 * only `engineer-flow` and does not expose internal core capabilities
 * as installable public skills.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

function loadCoreManifest() {
  const manifestPath = path.join(REPO_ROOT, "skills", "engineer-flow", "core", "core-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return manifest.cores || [];
}

const INTERNAL_CORES = loadCoreManifest();

function runSkillsList() {
  const command = process.platform === "win32"
    ? "cmd.exe"
    : "npx";
  const args = process.platform === "win32"
    ? ["/c", "C:\\Program Files\\nodejs\\npx.cmd", "--yes", "skills", "add", ".", "--list"]
    : ["--yes", "skills", "add", ".", "--list"];

  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: REPO_ROOT,
    timeout: 180000,
    windowsHide: true
  });

  if (result.error) {
    console.error(`INSTALL_SURFACE_INVARIANT=FAIL`);
    console.error(`ERROR=${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`INSTALL_SURFACE_INVARIANT=FAIL`);
    console.error(`NPM_SCRIPT_FAILED=YES`);
    console.error(`STDOUT=${result.stdout}`);
    console.error(`STDERR=${result.stderr}`);
    process.exit(1);
  }

  return result.stdout;
}

function parseSkillsList(output) {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const skills = [];
  for (const line of lines) {
    if (line.includes("engineer-flow")) {
      skills.push("engineer-flow");
    }
  }
  return skills;
}

function main() {
  const output = runSkillsList();
  const listedSkills = parseSkillsList(output);

  const hasEngineerFlow = listedSkills.includes("engineer-flow");
  const internalExposed = INTERNAL_CORES.filter((core) => listedSkills.includes(core));

  if (!hasEngineerFlow) {
    console.error(`INSTALL_SURFACE_INVARIANT=FAIL`);
    console.error(`ENGINEER_FLOW_MISSING=YES`);
    process.exit(1);
  }

  if (internalExposed.length > 0) {
    console.error(`INSTALL_SURFACE_INVARIANT=FAIL`);
    console.error(`INTERNAL_CORES_EXPOSED=${internalExposed.join(",")}`);
    process.exit(1);
  }

  console.log(`INSTALL_SURFACE_INVARIANT=PASS`);
  console.log(`PUBLIC_SKILLS_LISTED=${listedSkills.length}`);
  console.log(`INTERNAL_CORES_EXPOSED=0`);
  process.exit(0);
}

main().catch((error) => {
  console.error(`INSTALL_SURFACE_INVARIANT=FAIL`);
  console.error(`ERROR=${error.message}`);
  process.exit(1);
});
