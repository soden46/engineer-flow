#!/usr/bin/env node
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const VERSION = "0.1.0";
const DEFAULT_LIMIT = 5;
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
  node memory.mjs status

Root defaults to ENGINEER_FLOW_MEMORY_ROOT, AI_MEMORY_ROOT, or ~/.engineer-flow-memory.`);
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
  const file = path.join(memoryRoot, "projects", project, "current-state.md");
  if (!await exists(file)) {
    console.log("No relevant memory found.");
    return;
  }
  const text = await fs.readFile(file, "utf8");
  const blocks = text.split(/\n(?=## )/).filter(Boolean);
  const scored = blocks.map((block) => ({ block, score: score(block, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(args.limit || DEFAULT_LIMIT));
  if (!scored.length) {
    console.log("No relevant memory found.");
    return;
  }
  for (const item of scored) console.log(item.block.trim(), "\n");
}

function score(block, query) {
  if (!query) return 1;
  const words = new Set(query.split(/[^a-z0-9._-]+/).filter((word) => word.length > 2));
  let total = 0;
  const haystack = block.toLowerCase();
  for (const word of words) if (haystack.includes(word)) total += 1;
  return total;
}

async function checkpoint(args) {
  const summary = String(args.summary || "").trim();
  if (!summary) throw new Error("--summary is required");
  assertSafe(summary);
  if (isTemporary(summary) && !args.force) {
    console.log("No checkpoint written: summary looks temporary or non-durable.");
    return;
  }
  const project = projectAlias(args.project || "default");
  const memoryRoot = root(args);
  const file = path.join(memoryRoot, "projects", project, "current-state.md");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const id = crypto.createHash("sha256").update(`${Date.now()}:${summary}`).digest("hex").slice(0, 12);
  const entry = [
    `## ${new Date().toISOString()} ${id}`,
    "",
    "- Scope: project",
    "- Status: CURRENT",
    "- Source: engineer-flow checkpoint",
    "",
    summary,
    args.pending ? `\nPending: ${args.pending}` : "",
    ""
  ].join("\n");
  await fs.appendFile(file, `${entry}\n`, "utf8");
  console.log(`Checkpoint written: ${file}`);
}

async function status(args) {
  const memoryRoot = root(args);
  const projectsDir = path.join(memoryRoot, "projects");
  const projects = await fs.readdir(projectsDir).catch(() => []);
  console.log(JSON.stringify({ root: memoryRoot, version: VERSION, projects: projects.length, project_aliases: projects }, null, 2));
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
