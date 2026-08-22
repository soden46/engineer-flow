#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_ROOT = path.join(ROOT, "skills");
let failed = false;

await validateSkills();
await validateGroups("skills.sh.json", "groupings");
await validateGroups("plugin-groups.json", "plugins");
await validateVersions();
await validateScenarioFile();

if (failed) process.exit(1);
console.log("ENGINEER_FLOW_VALIDATE=PASS");

async function validateSkills() {
  const dirs = await skillDirs();
  if (!dirs.includes("engineer-flow")) fail("missing engineer-flow entrypoint skill");
  if (!dirs.includes("memory-management")) fail("missing memory-management infrastructure skill");
  if (dirs.length < 15 || dirs.length > 30) fail(`expected 15-30 bundled skills, found ${dirs.length}`);
  for (const dir of dirs) {
    const file = path.join(SKILLS_ROOT, dir, "SKILL.md");
    const text = await fs.readFile(file, "utf8").catch(() => "");
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) {
      fail(`${dir}: missing frontmatter`);
      continue;
    }
    const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
    if (name !== dir) fail(`${dir}: frontmatter name mismatch`);
    if (!description || description.length < 40) fail(`${dir}: description too short`);
  }
  console.log(`SKILLS=${dirs.length}`);
}

async function validateGroups(fileName, key) {
  const dirs = await skillDirs();
  const known = new Set(dirs);
  const json = await readJson(path.join(ROOT, fileName));
  const groups = json[key] || [];
  const assigned = new Set();
  for (const group of groups) {
    const skills = group.skills || [];
    for (const skill of skills) {
      if (!known.has(skill)) fail(`${fileName}: unknown skill ${skill}`);
      if (assigned.has(skill)) fail(`${fileName}: duplicate skill ${skill}`);
      assigned.add(skill);
    }
  }
  for (const skill of dirs) {
    if (!assigned.has(skill)) fail(`${fileName}: unassigned skill ${skill}`);
  }
}

async function validateVersions() {
  const packageJson = await readJson(path.join(ROOT, "package.json"));
  const version = packageJson.version;
  for (const file of [
    "agent-skills.json",
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json"
  ]) {
    const json = await readJson(path.join(ROOT, file));
    const values = JSON.stringify(json);
    if (!values.includes(version)) fail(`${file}: does not contain package version ${version}`);
  }
}

async function validateScenarioFile() {
  const scenarios = await readJson(path.join(ROOT, "tests", "routing-scenarios.json"));
  if (!Array.isArray(scenarios.scenarios) || scenarios.scenarios.length < 10) {
    fail("tests/routing-scenarios.json must contain at least 10 scenarios");
  }
  const ids = new Set();
  for (const item of scenarios.scenarios) {
    if (!item.id || ids.has(item.id)) fail(`invalid or duplicate scenario id ${item.id}`);
    ids.add(item.id);
  }
  const { stdout } = await execFileAsync(process.execPath, [path.join(ROOT, "scripts", "engineer-flow.mjs"), "self-test"], {
    cwd: ROOT,
    maxBuffer: 1024 * 1024
  });
  if (!stdout.includes("SELF_TEST_PASS=YES")) fail("self-test did not pass");
}

async function skillDirs() {
  return (await fs.readdir(SKILLS_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function fail(message) {
  failed = true;
  console.error(`ERROR: ${message}`);
}
