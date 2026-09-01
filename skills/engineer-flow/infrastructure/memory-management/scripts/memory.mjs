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
  if (command === "compact") return compact(args);
  throw new Error(`unknown command "${command}"`);
}

function help() {
  console.log(`engineer-flow memory v${VERSION}

Usage:
  node memory.mjs auto --cwd <project> --query <task> [--limit 5] [--force]
  node memory.mjs recall --project <alias> --query <task> [--limit 5]
  node memory.mjs checkpoint --project <alias> --summary <text> [--pending <text>]
  node memory.mjs checkpoint --project <alias> --summary <text> [options]
  node memory.mjs compact --project <alias> [--keep-history <n>] [--apply]
  node memory.mjs status

Checkpoint options:
  --type <type>        Checkpoint type (default: general)
  --scope <scope>      Scope of the checkpoint (default: project)
  --status <status>    Status (default: current)
  --source <source>    Source of the checkpoint (default: engineer-flow checkpoint)
  --confidence <conf>  Confidence level (default: confirmed)
  --supersedes <ids>   Comma-separated list of checkpoint IDs to supersede
  --force              Override temporary content guard

Compact options:
  --keep-history <n>   Number of historical (stale+resolved) entries to keep active (default: 50)
  --apply              Apply compaction; default is dry-run

Root defaults to ENGINEER_FLOW_MEMORY_ROOT, AI_MEMORY_ROOT, or ~/.engineer-flow-memory.

New checkpoints are written to checkpoints.jsonl (schema v2).
Legacy current-state.md remains readable for backward compatibility.
Compaction archives stale/resolved entries to archive.jsonl.`);
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
        const lexicalScore = score(block, query);
        if (lexicalScore <= 0) continue;
        entries.push({
          format: "structured",
          entry,
          block,
          score: lexicalScore,
          lifecycleRank: lifecycleRankForStructured(entry),
          lifecycleKey: lifecycleKeyForStructured(entry),
          originalIndex: entries.length
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
      const lexicalScore = score(block, query);
      if (lexicalScore <= 0) continue;
      entries.push({
        format: "legacy",
        block,
        score: lexicalScore,
        lifecycleRank: 1,
        lifecycleKey: "",
        originalIndex: entries.length
      });
    }
  }

  entries.sort(lifecycleCompare);

  const scored = entries.slice(0, limit);

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

function lifecycleRankForStructured(entry) {
  if (entry.status === "current") return 0;
  if (entry.status === "stale") return 2;
  if (entry.status === "resolved") return 3;
  return 4;
}

function lifecycleKeyForStructured(entry) {
  return String(entry.updated_at || entry.created_at || entry.id || "");
}

function lifecycleCompare(a, b) {
  if (a.lifecycleRank !== b.lifecycleRank) return a.lifecycleRank - b.lifecycleRank;
  if (a.score !== b.score) return b.score - a.score;
  if (a.lifecycleKey !== b.lifecycleKey) {
    if (a.lifecycleKey < b.lifecycleKey) return -1;
    if (a.lifecycleKey > b.lifecycleKey) return 1;
  }
  return a.originalIndex - b.originalIndex;
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
  for (const word of words) {
    if (!word) continue;
    let idx = 0;
    while ((idx = haystack.indexOf(word, idx)) !== -1) {
      total += 1;
      idx += word.length;
    }
  }
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

function normalizeText(text) {
  return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function readCheckpoints(file) {
  if (!await exists(file)) return [];
  const text = await fs.readFile(file, "utf8");
  const lines = text.split(/\n/).filter((line) => line.trim());
  const entries = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      continue;
    }
  }
  return entries;
}

async function writeAllCheckpoints(file, entries) {
  const tmpFile = `${file}.tmp-${process.pid}-${Date.now()}`;
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length ? "\n" : "");
  await fs.writeFile(tmpFile, content, "utf8");
  try {
    await fs.rename(tmpFile, file);
  } catch {
    await fs.rm(file, { force: true });
    await fs.rename(tmpFile, file);
  }
}

function validateSupersedes(ids, existing, newId) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`duplicate supersedes ID: ${id}`);
    }
    seen.add(id);
  }
  for (const id of ids) {
    const entry = existing.find((e) => e.id === id);
    if (!entry) {
      throw new Error(`supersedes ID not found: ${id}`);
    }
    if (entry.status !== "current") {
      throw new Error(`supersedes ID is not current: ${id} (status=${entry.status})`);
    }
    if (id === newId) {
      throw new Error("checkpoint cannot supersede itself");
    }
  }
}

async function checkpoint(args) {
  const summary = String(args.summary || "").trim();
  if (!summary) throw new Error("--summary is required");

  const type = String(args.type || DEFAULT_TYPE);
  const scope = String(args.scope || DEFAULT_SCOPE);
  const status = String(args.status || DEFAULT_STATUS);
  const source = String(args.source || DEFAULT_SOURCE);
  const confidence = String(args.confidence || DEFAULT_CONFIDENCE);
  const supersedesRaw = parseSupersedes(args.supersedes);

  validateEnum(type, VALID_TYPES, "--type");
  validateEnum(status, VALID_STATUS, "--status");
  validateEnum(confidence, VALID_CONFIDENCE, "--confidence");

  assertSafe(summary);
  assertSafe(scope);
  assertSafe(source);
  if (args.pending !== undefined && args.pending !== true) {
    assertSafe(String(args.pending));
  }
  for (const id of supersedesRaw) {
    assertSafe(id);
  }

  if (isTemporary(summary) && !args.force) {
    console.log("No checkpoint written: summary looks temporary or non-durable.");
    return;
  }

  const project = projectAlias(args.project || "default");
  const memoryRoot = root(args);
  const file = path.join(memoryRoot, "projects", project, "checkpoints.jsonl");

  await fs.mkdir(path.dirname(file), { recursive: true });

  const existing = await readCheckpoints(file);

  const normalizedContent = normalizeText(summary);
  const normalizedScope = normalizeText(scope);
  const duplicate = existing.find(
    (e) =>
      e.status === "current" &&
      e.type === type &&
      normalizeText(e.scope) === normalizedScope &&
      normalizeText(e.content) === normalizedContent
  );
  if (duplicate) {
    console.log("CHECKPOINT_DEDUPLICATED=YES");
    console.log(`CHECKPOINT_ID=${duplicate.id}`);
    return;
  }

  const now = new Date().toISOString();
  const id = crypto.createHash("sha256").update(`${now}:${summary}`).digest("hex").slice(0, 12);

  if (supersedesRaw.length > 0) {
    validateSupersedes(supersedesRaw, existing, id);
  }

  const entry = {
    version: SCHEMA_VERSION,
    id,
    type,
    scope,
    status,
    created_at: now,
    updated_at: now,
    supersedes: supersedesRaw,
    source,
    confidence,
    content: summary
  };

  if (args.pending !== undefined && args.pending !== true) {
    const pending = String(args.pending).trim();
    if (pending) entry.pending = pending;
  }

  if (supersedesRaw.length > 0) {
    for (const e of existing) {
      if (supersedesRaw.includes(e.id)) {
        e.status = "stale";
        e.updated_at = now;
      }
    }
    await writeAllCheckpoints(file, [...existing, entry]);
    console.log("CHECKPOINT_WRITTEN=YES");
    console.log(`CHECKPOINT_ID=${id}`);
    console.log(`SUPERSEDED=${supersedesRaw.join(",")}`);
  } else {
    await fs.appendFile(file, JSON.stringify(entry) + "\n", "utf8");
    console.log(`Checkpoint written: ${file}`);
  }
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

function parseKeepHistory(value) {
  if (value === undefined || value === true) return 50;
  if (typeof value !== "string") {
    throw new Error("invalid --keep-history: must be integer >= 0");
  }
  if (!/^\d+$/.test(value)) {
    throw new Error("invalid --keep-history: must be integer >= 0");
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("invalid --keep-history: must be integer >= 0");
  }
  return n;
}

function compareEntryNewest(a, b) {
  const aKey = a.updated_at || a.created_at || a.id || "";
  const bKey = b.updated_at || b.created_at || b.id || "";
  if (aKey < bKey) return 1;
  if (aKey > bKey) return -1;
  const aCreated = a.created_at || "";
  const bCreated = b.created_at || "";
  if (aCreated < bCreated) return 1;
  if (aCreated > bCreated) return -1;
  if (a.id < b.id) return 1;
  if (a.id > b.id) return -1;
  return 0;
}

async function readArchiveIds(archiveFile) {
  if (!await exists(archiveFile)) return new Set();
  const text = await fs.readFile(archiveFile, "utf8");
  const lines = text.split(/\n/).filter((line) => line.trim());
  const ids = new Set();
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry && entry.id) ids.add(entry.id);
    } catch {
      continue;
    }
  }
  return ids;
}

async function compact(args) {
  const project = projectAlias(args.project || "default");
  const memoryRoot = root(args);
  const projectDir = path.join(memoryRoot, "projects", project);
  const activeFile = path.join(projectDir, "checkpoints.jsonl");
  const archiveFile = path.join(projectDir, "archive.jsonl");
  const keepHistory = parseKeepHistory(args["keep-history"]);
  const apply = args.apply === true;

  const existing = await readCheckpoints(activeFile);
  const current = existing.filter((e) => e.status === "current");
  const historical = existing
    .filter((e) => e.status === "stale" || e.status === "resolved")
    .slice()
    .sort(compareEntryNewest);

  const historicalActive = historical.slice(0, keepHistory);
  const wouldArchive = historical.slice(keepHistory);

  if (!apply) {
    console.log("MEMORY_COMPACTION=DRY_RUN");
    console.log(`PROJECT=${project}`);
    console.log(`CURRENT=${current.length}`);
    console.log(`HISTORICAL_ACTIVE=${historicalActive.length}`);
    console.log(`WOULD_ARCHIVE=${wouldArchive.length}`);
    console.log(`KEEP_HISTORY=${keepHistory}`);
    return;
  }

  if (wouldArchive.length === 0) {
    console.log("MEMORY_COMPACTION=NOOP");
    console.log("ARCHIVED=0");
    return;
  }

  const archiveIds = await readArchiveIds(archiveFile);
  const newArchives = wouldArchive.filter((e) => !archiveIds.has(e.id));
  if (newArchives.length === 0) {
    console.log("MEMORY_COMPACTION=NOOP");
    console.log("ARCHIVED=0");
    return;
  }

  const activeSet = new Set(current.map((e) => e.id).concat(historicalActive.map((e) => e.id)));
  const newActive = existing.filter((e) => activeSet.has(e.id));

  const tmpActive = `${activeFile}.tmp-${process.pid}-${Date.now()}`;
  const activeContent = newActive.map((e) => JSON.stringify(e)).join("\n") + (newActive.length ? "\n" : "");
  await fs.writeFile(tmpActive, activeContent, "utf8");

  const tmpArchive = `${archiveFile}.tmp-${process.pid}-${Date.now()}`;
  let existingArchive = "";
  if (await exists(archiveFile)) {
    existingArchive = await fs.readFile(archiveFile, "utf8");
  }
  const newArchiveContent = newArchives.map((e) => JSON.stringify(e)).join("\n") + "\n";
  await fs.writeFile(tmpArchive, existingArchive + newArchiveContent, "utf8");

  try {
    await fs.rename(tmpActive, activeFile);
  } catch {
    await fs.rm(activeFile, { force: true });
    await fs.rename(tmpActive, activeFile);
  }
  try {
    await fs.rename(tmpArchive, archiveFile);
  } catch {
    await fs.rm(archiveFile, { force: true });
    await fs.rename(tmpArchive, archiveFile);
  }

  console.log("MEMORY_COMPACTION=APPLIED");
  console.log(`ARCHIVED=${newArchives.length}`);
  console.log(`ACTIVE_REMAINING=${newActive.length}`);
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
