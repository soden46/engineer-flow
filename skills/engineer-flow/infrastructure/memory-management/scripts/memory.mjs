#!/usr/bin/env node
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const VERSION = "0.2.0";
const SCHEMA_VERSION = 2;
const DEFAULT_LIMIT = 5;

const VALID_TYPES = [
  "general", "decision", "architecture", "convention",
  "deployment", "migration", "known-issue", "benchmark", "pending-work"
];
const VALID_STATUS = ["current", "resolved", "stale"];
const VALID_CONFIDENCE = ["confirmed", "inferred"];

const DEFAULT_TYPE = "general";
const DEFAULT_SCOPE = "project";
const DEFAULT_STATUS = "current";
const DEFAULT_SOURCE = "engineer-flow checkpoint";
const DEFAULT_CONFIDENCE = "confirmed";

const SENSITIVE = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/i, "private key"],
  [/\b(api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd|private[_-]?key)\b\s*[:=]\s*\S+/i, "secret assignment"],
  [/\b(sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/i, "token-like value"],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, "raw email address"]
];

main().catch((error) => {
  console.error(`memory: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const [command, ...argv] = process.argv.slice(2);
  const args = parseArgs(argv);
  if (!command || command === "help" || args.help) return help();
  if (command === "auto") return auto(args);
  if (command === "checkpoint") return checkpoint(args);
  if (command === "recall") return recall(args);
  if (command === "status") return status(args);
  throw new Error(`unknown command "${command}"`);
}

function help() {
  console.log(`engineer-flow memory v${VERSION}

Usage:
  node memory.mjs auto --cwd <project> --query <task> [--limit 5] [--force]
  node memory.mjs recall --project <alias> --query <task> [--limit 5]
  node memory.mjs checkpoint --project <alias> --summary <text> [--pending <text>]
  node memory.mjs checkpoint --project <alias> --summary <text> [options]
  node memory.mjs status

Checkpoint options:
  --type <type>        Checkpoint type (default: general)
  --scope <scope>      Scope of the checkpoint (default: project)
  --status <status>    Status (default: current)
  --source <source>    Source of the checkpoint (default: engineer-flow checkpoint)
  --confidence <conf>  Confidence level (default: confirmed)
  --supersedes <ids>   Comma-separated list of checkpoint IDs to supersede
  --force              Override temporary content guard

Root defaults to ENGINEER_FLOW_MEMORY_ROOT, AI_MEMORY_ROOT, or ~/.engineer-flow-memory.

New checkpoints are written to checkpoints.jsonl (schema v2).
Legacy current-state.md remains readable for backward compatibility.`);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function root(args = {}) {
  return path.resolve(String(args.root || process.env.ENGINEER_FLOW_MEMORY_ROOT || process.env.AI_MEMORY_ROOT || path.join(os.homedir(), ".engineer-flow-memory")));
}

async function auto(args) {
  const cwd = path.resolve(String(args.cwd || process.cwd()));
  const query = String(args.query || "").trim();
  const project = projectAlias(args.project || path.basename(cwd));
  const decision = shouldRun(query);
  console.log("# Memory Preflight");
  console.log(`root: ${root(args)}`);
  console.log(`project: ${project}`);
  console.log(`project_root: ${cwd}`);
  console.log(`query: ${query || "latest project context"}`);
  console.log(`decision: ${decision.run ? "RUN" : "SKIP"}`);
  console.log(`reason: ${decision.reason}`);
  console.log("specialist_routing: independent; memory-management does not count toward MAX_SPECIALISTS");
  console.log("conflict_policy: current code/config wins");
  console.log("");
  if (!decision.run && !args.force) {
    console.log("No memory retrieved: prior context is unlikely to materially improve this task.");
    return;
  }
  await recall({ ...args, project, query, limit: args.limit || DEFAULT_LIMIT });
}

function shouldRun(query) {
  const text = query.toLowerCase();
  const runTerms = [
    "continue", "existing work", "previous", "last session", "again", "resume",
    "release", "migration", "architecture", "convention", "memory", "checkpoint",
    "routing", "benchmark", "production", "deploy"
  ];
  const skipTerms = ["translate", "rewrite this sentence", "what time", "format this"];
  if (skipTerms.some((term) => text.includes(term))) return { run: false, reason: "self-contained request" };
  if (runTerms.some((term) => text.includes(term))) return { run: true, reason: "prior/project context may matter" };
  return { run: false, reason: "no durable prior context signal detected" };
}

async function recall(args) {
  const memoryRoot = root(args);
  const project = projectAlias(args.project || "default");
  const query = String(args.query || "").toLowerCase();
  const limit = Number(args.limit || DEFAULT_LIMIT);
  const projectDir = path.join(memoryRoot, "projects", project);

  const structuredFile = path.join(projectDir, "checkpoints.jsonl");
  const legacyFile = path.join(projectDir, "current-state.md");

  const entries = [];

  if (await exists(structuredFile)) {
    const text = await fs.readFile(structuredFile, "utf8");
    const lines = text.split(/\n/).filter((line) => line.trim());
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const block = structuredSearchText(entry);
        entries.push({
          format: "structured",
          entry,
          block,
          score: score(block, query)
        });
      } catch {
        continue;
      }
    }
  }

  if (await exists(legacyFile)) {
    const text = await fs.readFile(legacyFile, "utf8");
    const blocks = text.split(/\n(?=## )/).filter(Boolean);
    for (const block of blocks) {
      entries.push({
        format: "legacy",
        block,
        score: score(block, query)
      });
    }
  }

  const scored = entries
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!scored.length) {
    console.log("No relevant memory found.");
    return;
  }

  for (const item of scored) {
    if (item.format === "structured") {
      const e = item.entry;
      console.log(`ID: ${e.id}`);
      console.log(`TYPE: ${e.type}`);
      console.log(`SCOPE: ${e.scope}`);
      console.log(`STATUS: ${e.status}`);
      console.log(`CONTENT: ${e.content}`);
      if (e.pending) console.log(`PENDING: ${e.pending}`);
      console.log("");
    } else {
      console.log(item.block.trim(), "\n");
    }
  }
}

function structuredSearchText(entry) {
  return [
    entry.content,
    entry.scope,
    entry.type,
    entry.status,
    entry.source,
    entry.pending,
    entry.confidence
  ].filter(Boolean).join(" ");
}

function score(block, query) {
  if (!query) return 1;
  const words = new Set(query.split(/[^a-z0-9._-]+/).filter((word) => word.length > 2));
  let total = 0;
  const haystack = block.toLowerCase();
  for (const word of words) if (haystack.includes(word)) total += 1;
  return total;
}

function validateEnum(value, valid, flagName) {
  if (valid.indexOf(value) === -1) {
    throw new Error(`invalid ${flagName}: "${value}"; allowed: ${valid.join(", ")}`);
  }
}

function parseSupersedes(value) {
  if (!value || typeof value !== "string") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

async function checkpoint(args) {
  const summary = String(args.summary || "").trim();
  if (!summary) throw new Error("--summary is required");

  const type = String(args.type || DEFAULT_TYPE);
  const scope = String(args.scope || DEFAULT_SCOPE);
  const status = String(args.status || DEFAULT_STATUS);
  const source = String(args.source || DEFAULT_SOURCE);
  const confidence = String(args.confidence || DEFAULT_CONFIDENCE);
  const supersedes = parseSupersedes(args.supersedes);

  validateEnum(type, VALID_TYPES, "--type");
  validateEnum(status, VALID_STATUS, "--status");
  validateEnum(confidence, VALID_CONFIDENCE, "--confidence");

  assertSafe(summary);
  assertSafe(scope);
  assertSafe(source);
  if (args.pending !== undefined && args.pending !== true) {
    assertSafe(String(args.pending));
  }

  if (isTemporary(summary) && !args.force) {
    console.log("No checkpoint written: summary looks temporary or non-durable.");
    return;
  }

  const project = projectAlias(args.project || "default");
  const memoryRoot = root(args);
  const file = path.join(memoryRoot, "projects", project, "checkpoints.jsonl");

  await fs.mkdir(path.dirname(file), { recursive: true });

  const now = new Date().toISOString();
  const id = crypto.createHash("sha256").update(`${now}:${summary}`).digest("hex").slice(0, 12);

  const entry = {
    version: SCHEMA_VERSION,
    id,
    type,
    scope,
    status,
    created_at: now,
    updated_at: now,
    supersedes,
    source,
    confidence,
    content: summary
  };

  if (args.pending !== undefined && args.pending !== true) {
    const pending = String(args.pending).trim();
    if (pending) entry.pending = pending;
  }

  await fs.appendFile(file, JSON.stringify(entry) + "\n", "utf8");
  console.log(`Checkpoint written: ${file}`);
}

async function status(args) {
  const memoryRoot = root(args);
  const projectsDir = path.join(memoryRoot, "projects");
  const projects = await fs.readdir(projectsDir).catch(() => []);

  let structuredCheckpoints = 0;
  let legacyProjects = 0;
  let current = 0;
  let resolved = 0;
  let stale = 0;

  for (const project of projects) {
    const projectDir = path.join(projectsDir, project);
    const jsonlFile = path.join(projectDir, "checkpoints.jsonl");
    const mdFile = path.join(projectDir, "current-state.md");

    if (await exists(mdFile)) legacyProjects++;

    if (await exists(jsonlFile)) {
      const text = await fs.readFile(jsonlFile, "utf8");
      const lines = text.split(/\n/).filter((line) => line.trim());
      structuredCheckpoints += lines.length;
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.status === "current") current++;
          else if (entry.status === "resolved") resolved++;
          else if (entry.status === "stale") stale++;
        } catch {
          continue;
        }
      }
    }
  }

  console.log(JSON.stringify({
    root: memoryRoot,
    version: VERSION,
    projects: projects.length,
    project_aliases: projects,
    structured_checkpoints: structuredCheckpoints,
    legacy_projects: legacyProjects,
    current,
    resolved,
    stale
  }, null, 2));
}

function assertSafe(text) {
  for (const [pattern, label] of SENSITIVE) {
    if (pattern.test(text)) throw new Error(`refusing to store ${label}`);
  }
}

function isTemporary(text) {
  return /\b(one-time|temporary|debug output|grep result|transient|scratch)\b/i.test(text);
}

function projectAlias(value) {
  return String(value || "default").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "default";
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
