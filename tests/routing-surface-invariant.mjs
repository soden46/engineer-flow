#!/usr/bin/env node
/*
 * Test-only routing-surface invariant.
 *
 * Verifies that the effective routing surface of all 16 internal
 * capabilities matches the committed snapshot.
 *
 * The effective routing surface is derived from:
 * - skill name
 * - skill description
 * - H1-H3 headings
 *
 * using behavior-equivalent normalization to the production resolver.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const CORE_MANIFEST = path.join(REPO_ROOT, "skills", "engineer-flow", "core", "core-manifest.json");
const SNAPSHOT_FILE = path.join(REPO_ROOT, "tests", "routing-surface-snapshot.json");
const UPDATE_MODE = process.argv.includes("--update");

const STOP = new Set([
  "the","a","an","and","or","to","of","for","in","on",
  "with","using","use","this","that","from","into","by",
  "be","is","are","was","were","project","application",
  "engineering","principles","framework","language",
  "technology","skill","skills"
]);

function words(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#._:-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => word.length >= 2)
    .filter((word) => !STOP.has(word));
}

function normalizeComparableName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-_:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function frontmatterField(text, field) {
  const match = text.match(new RegExp(`^${field}:\\s*(.+)`, "m"));
  if (!match) return null;
  let value = match[1].trim().replace(/^["']|["']$/g, "");
  if (field === "routing_terms" && value === "") {
    const lines = text.split(/\r?\n/);
    const terms = [];
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("- ")) {
        const termValue = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
        if (termValue) terms.push(termValue);
        found = true;
      } else if (found) {
        break;
      }
    }
    return terms.length ? terms : null;
  }
  return value;
}

function extractRoutingVisible(text) {
  const name = frontmatterField(text, "name") || "";
  const description = frontmatterField(text, "description") || "";

  const headingLines = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      if (level <= 3) {
        headingLines.push(match[2].trim());
      }
    }
  }

  const combined = [name, description, ...headingLines].join(" ");
  return words(combined);
}

function computeFingerprint(terms) {
  const normalized = [...terms].sort();
  const input = JSON.stringify(normalized);
  return createHash("sha256").update(input, "utf8").digest("hex");
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(CORE_MANIFEST, "utf8"));
  const capabilities = manifest.cores || [];

  if (capabilities.length !== 16) {
    console.error(`ROUTING_SURFACE_INVARIANT=FAIL`);
    console.error(`CAPABILITIES_CHECKED=${capabilities.length}`);
    console.error(`UNEXPECTED_CAPABILITY_COUNT=YES`);
    process.exit(1);
  }

  const current = {};
  for (const capability of capabilities) {
    const skillPath = path.join(REPO_ROOT, "skills", "engineer-flow", "core", capability, "SKILL.md");
    const text = fs.readFileSync(skillPath, "utf8");

    const name = frontmatterField(text, "name") || capability;
    const normalizedName = normalizeComparableName(name);
    const effectiveTerms = extractRoutingVisible(text);
    const fingerprint = computeFingerprint(effectiveTerms);

    current[capability] = {
      normalized_name: normalizedName,
      effective_terms: effectiveTerms,
      fingerprint_sha256: fingerprint
    };
  }

  if (UPDATE_MODE) {
    const snapshot = {};
    for (const [capability, data] of Object.entries(current)) {
      snapshot[capability] = {
        normalized_name: data.normalized_name,
        effective_terms: data.effective_terms,
        fingerprint_sha256: data.fingerprint_sha256
      };
    }
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
    console.log(`ROUTING_SURFACE_SNAPSHOT_UPDATED=YES`);
    process.exit(0);
  }

  if (!fs.existsSync(SNAPSHOT_FILE)) {
    console.error(`ROUTING_SURFACE_INVARIANT=FAIL`);
    console.error(`SNAPSHOT_MISSING=YES`);
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
  let failed = false;

  for (const capability of capabilities) {
    const currentData = current[capability];
    const snapshotData = snapshot[capability];

    if (!snapshotData) {
      console.error(`ROUTING_SURFACE_INVARIANT=FAIL`);
      console.error(`CAPABILITY=${capability}`);
      console.error(`MISSING_IN_SNAPSHOT=YES`);
      failed = true;
      continue;
    }

    const normalizedNameChanged = currentData.normalized_name !== snapshotData.normalized_name;
    const currentTerms = new Set(currentData.effective_terms);
    const snapshotTerms = new Set(snapshotData.effective_terms);
    const added = [...currentTerms].filter((t) => !snapshotTerms.has(t));
    const removed = [...snapshotTerms].filter((t) => !currentTerms.has(t));
    const fingerprintChanged = currentData.fingerprint_sha256 !== snapshotData.fingerprint_sha256;

    if (normalizedNameChanged || added.length > 0 || removed.length > 0 || fingerprintChanged) {
      failed = true;
      console.error(`ROUTING_SURFACE_INVARIANT=FAIL`);
      console.error(`CAPABILITY=${capability}`);
      if (normalizedNameChanged) {
        console.error(`NORMALIZED_NAME_CHANGED=YES`);
        console.error(`CURRENT_NAME=${currentData.normalized_name}`);
        console.error(`SNAPSHOT_NAME=${snapshotData.normalized_name}`);
      }
      if (added.length > 0) {
        console.error(`TERMS_ADDED=${added.join(",")}`);
      }
      if (removed.length > 0) {
        console.error(`TERMS_REMOVED=${removed.join(",")}`);
      }
      if (fingerprintChanged) {
        console.error(`FINGERPRINT_CHANGED=YES`);
        console.error(`CURRENT_FINGERPRINT=${currentData.fingerprint_sha256}`);
        console.error(`SNAPSHOT_FINGERPRINT=${snapshotData.fingerprint_sha256}`);
      }
    }
  }

  if (!failed) {
    console.log(`ROUTING_SURFACE_INVARIANT=PASS`);
    console.log(`CAPABILITIES_CHECKED=${capabilities.length}`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`ROUTING_SURFACE_INVARIANT=FAIL`);
  console.error(`ERROR=${error.message}`);
  process.exit(1);
});
