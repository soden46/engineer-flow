import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);

const ROOT =
  path.resolve(
    SCRIPT_DIR,
    ".."
  );

const REPO_ROOT =
  path.resolve(
    ROOT,
    "..",
    ".."
  );

const SKILLS_DIR =
  path.join(
    ROOT,
    "core"
  );


const CORE_MANIFEST =
  path.join(
    SKILLS_DIR,
    "core-manifest.json"
  );

const MAX_SPECIALISTS = 2;

const MEMORY_ROOT =
  path.join(
    ROOT,
    "infrastructure",
    "memory-management"
  );

const MEMORY_SKILL =
  path.join(
    MEMORY_ROOT,
    "SKILL.md"
  );

const MEMORY_RUNNER =
  path.join(
    MEMORY_ROOT,
    "scripts",
    "memory.mjs"
  );

/*
 * Intent-conditioned retrieval bounds.
 *
 * Generic manifest formats only. Dependency names are never mapped to
 * technologies manually; affinity emerges from each external skill's
 * own name-derived identity terms.
 */
const MAX_PROJECT_EVIDENCE_FILES = 16;

const MAX_BYTES_PER_EVIDENCE_FILE = 65536;

const MAX_TOTAL_EVIDENCE_BYTES = 262144;

const MAX_EVIDENCE_TOKENS = 4096;

const MAX_INTENT_ANCHORS = 2;

const MAX_RETRIEVAL_DIAGNOSTICS = 16;

/*
 * Uniform, technology-agnostic weight applied when an external skill's
 * own specific identity terms appear in project evidence. Any external
 * skill can earn it; nothing is keyed to a particular technology.
 */
const EVIDENCE_IDENTITY_AFFINITY = 3;

const PROJECT_EVIDENCE_MANIFEST_NAMES = new Set([
  "package.json",
  "composer.json",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "go.mod",
  "Cargo.toml",
  "pubspec.yaml",
  "Gemfile"
]);


/* =========================================================
   TEXT / METADATA
   ========================================================= */

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

function frontmatter(text) {
  const match =
    String(text || "")
      .match(
        /^---\s*([\s\S]*?)\s*---/
      );

  if (!match) {
    return {};
  }

  const result = {};

  for (
    const line of
    match[1].split(/\r?\n/)
  ) {
    const index =
      line.indexOf(":");

    if (index < 0) {
      continue;
    }

    const key =
      line
        .slice(0,index)
        .trim();

    const value =
      line
        .slice(index + 1)
        .trim()
        .replace(
          /^["']|["']$/g,
          ""
        );

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


/* =========================================================
   INTERNAL ENGINEER FLOW SKILLS
   ========================================================= */

function discoverInternalSkills() {
  if (
    !fs.existsSync(
      CORE_MANIFEST
    )
  ) {
    throw new Error(
      "CORE_MANIFEST_MISSING"
    );
  }

  const manifest =
    JSON.parse(
      fs.readFileSync(
        CORE_MANIFEST,
        "utf8"
      )
    );

  const names =
    manifest.cores || [];

  return names.map(
    (name) => {
      const file =
        path.join(
          SKILLS_DIR,
          name,
          "SKILL.md"
        );

      if (
        !fs.existsSync(file)
      ) {
        throw new Error(
          `CORE_FILE_MISSING: ${name}`
        );
      }

      const text =
        fs.readFileSync(
          file,
          "utf8"
        );

      const meta =
        frontmatter(text);

      return {
        name:
          meta.name || name,

        description:
          meta.description || "",

        path:
          file,

        text,

        source:
          "engineer-flow",

        internal:
          true
      };
    }
  );
}


/* =========================================================
   EXTERNAL USER-INSTALLED SKILLS
   ========================================================= */

function externalRoots() {
  const roots = [];

  /*
   * Canonical shared Agent Skills location.
   */
  roots.push(
    path.join(
      os.homedir(),
      ".agents",
      "skills"
    )
  );

  /*
   * Optional additional locations.
   *
   * Windows:
   * ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS=
   * C:\foo\skills;D:\bar\skills
   */
  const configured =
    process.env
      .ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS;

  if (configured) {
    for (
      const value of
      configured.split(
        path.delimiter
      )
    ) {
      const cleaned =
        value.trim();

      if (cleaned) {
        roots.push(
          path.resolve(cleaned)
        );
      }
    }
  }

  return [
    ...new Set(
      roots
        .map(
          (root) =>
            path.resolve(root)
        )
    )
  ];
}

function walkSkillFiles(root) {
  const result = [];

  if (
    !fs.existsSync(root)
  ) {
    return result;
  }

  const stack =
    [root];

  while (
    stack.length
  ) {
    const current =
      stack.pop();

    let entries = [];

    try {
      entries =
        fs.readdirSync(
          current,
          {
            withFileTypes:
              true
          }
        );
    }
    catch {
      continue;
    }

    for (
      const entry of entries
    ) {
      const full =
        path.join(
          current,
          entry.name
        );

      if (
        entry.isDirectory()
      ) {
        if (
          entry.name === ".git" ||
          entry.name === "node_modules" ||
          entry.name === "migration"
        ) {
          continue;
        }

        stack.push(full);

        continue;
      }

      /*
       * Only active Agent Skills.
       *
       * SKILL.md.retired is ignored automatically.
       */
      if (
        entry.isFile() &&
        entry.name === "SKILL.md"
      ) {
        result.push(full);
      }
    }
  }

  return result;
}


function isInside(parent, child) {
  const relative =
    path.relative(
      path.resolve(parent),
      path.resolve(child)
    );

  return (
    relative === "" ||
    (
      !relative.startsWith("..") &&
      !path.isAbsolute(relative)
    )
  );
}

function discoverExternalSkills() {
  const skills = [];

  for (
    const root of externalRoots()
  ) {
    for (
      const file of
      walkSkillFiles(root)
    ) {
            if (isInside(ROOT, file)) {
        continue;
      }
let text = "";

      try {
        text =
          fs.readFileSync(
            file,
            "utf8"
          );
      }
      catch {
        continue;
      }

      const meta =
        frontmatter(text);

      const fallbackName =
        path.basename(
          path.dirname(file)
        );

      const name =
        meta.name ||
        fallbackName;

      /*
       * Ignore unusable skill definitions.
       */
      if (!name) {
        continue;
      }

      skills.push({
        name,

        description:
          meta.description || "",

        path:
          file,

        text,

        source:
          "external",

        external_root:
          root,

        internal:
          false
      });
    }
  }

  return skills;
}


/* =========================================================
   DEDUPE
   ========================================================= */

function buildCapabilityPool() {
  const internal =
    discoverInternalSkills();

  const external =
    discoverExternalSkills();

  const result = [];
  const seen = new Set();

  /*
   * Internal Engineer Flow capabilities are canonical
   * when an external skill has the same exact name.
   */
  for (
    const skill of
    [...internal, ...external]
  ) {
    const key =
      normalizeName(
        skill.name
      );

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    result.push(skill);
  }

  return {
    internal,
    external,
    capabilities:
      result
  };
}


/* =========================================================
   SKILL RELEVANCE
   ========================================================= */

function skillTerms(skill) {
  const headings =
    skill.text.match(
      /^#{1,3}\s+.+$/gm
    ) || [];

  const material =
    [
      skill.name,
      skill.description,
      ...headings
    ].join(" ");

  return new Set(
    words(material)
  );
}

/*
 * Symmetric delimiter normalization for explicit skill-name
 * comparison. Generic only: lowercase, unify - _ : separators into
 * spaces, collapse whitespace, trim. No stemming, no fuzzy matching,
 * no technology knowledge.
 */
function normalizeComparableName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(
      /[-_:]+/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSkill(
  task,
  skill
) {
  const taskWords =
    new Set(
      words(task)
    );

  const terms =
    skillTerms(skill);

  let score = 0;

  for (
    const word of taskWords
  ) {
    if (
      terms.has(word)
    ) {
      score += 1;
    }
  }

  const normalizedTask =
    normalizeComparableName(task);

  const normalizedName =
    normalizeComparableName(skill.name);

  /*
   * Strong explicit skill-name evidence, compared symmetrically.
   */
  if (
    normalizedName.length >= 3 &&
    normalizedTask.includes(
      normalizedName
    )
  ) {
    score += 3;
  }

  return score;
}

const EXTERNAL_GENERIC_ANCHORS = new Set([
  "api",
  "app",
  "application",
  "architecture",
  "auth",
  "authentication",
  "authorization",
  "best",
  "build",
  "code",
  "config",
  "configuration",
  "data",
  "database",
  "development",
  "design",
  "e2e",
  "error",
  "errors",
  "feature",
  "framework",
  "integration",
  "model",
  "models",
  "performance",
  "project",
  "report",
  "reports",
  "review",
  "security",
  "service",
  "services",
  "storage",
  "test",
  "testing",
  "training",
  "ui",
  "web",
  "workflow"
]);

function externalSkillAnchored(task, skill) {
  if (skill.internal) {
    return true;
  }

  const taskTokens =
    new Set(
      words(task)
    );

  const nameTokens =
    words(
      String(skill.name)
        .replace(/[-_:]+/g, " ")
    );

  const normalizedTask =
    String(task)
      .toLowerCase()
      .replace(/[-_:]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizedName =
    String(skill.name)
      .toLowerCase()
      .replace(/[-_:]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  /*
   * Strongest evidence:
   * explicit full external skill name.
   */
  if (
    normalizedName.length >= 3 &&
    normalizedTask.includes(
      normalizedName
    )
  ) {
    return true;
  }

  /*
   * Technology/domain-specific name tokens.
   *
   * Examples:
   * firebase-database -> firebase
   * trl-training -> trl
   * odoo-cross-platform-report-consistency -> odoo/cross/platform/consistency
   *
   * Generic words like "database" or "testing"
   * cannot activate an external skill by themselves.
   */
  const specificTokens =
    nameTokens.filter(
      (token) =>
        token.length >= 3 &&
        !EXTERNAL_GENERIC_ANCHORS.has(
          token
        )
    );

  if (
    specificTokens.some(
      (token) =>
        taskTokens.has(token)
    )
  ) {
    return true;
  }

  /*
   * Fallback for external skills whose names contain
   * only broad vocabulary:
   * require at least two name-token matches.
   */
  const matched =
    nameTokens.filter(
      (token) =>
        token.length >= 3 &&
        taskTokens.has(token)
    );

  return (
    nameTokens.length >= 2 &&
    matched.length >= 2
  );
}


/* =========================================================
   INTENT-CONDITIONED SKILL RETRIEVAL
   ========================================================= */

/*
 * Manifest text is tokenized generically: every run of characters
 * outside [a-z0-9+#_] acts as a boundary. This covers the required
 * delimiter family (/ \ . : _ -) plus manifest punctuation such as
 * quotes, brackets, and angle brackets, without any technology
 * mapping. org.springframework.boot therefore yields
 * org / springframework / boot naturally.
 */
function evidenceTokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(
      /[^a-z0-9+#_]+/g,
      " "
    )
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length >= 2)
    .filter((token) => !STOP.has(token));
}

/*
 * Bounded, generic project-evidence extraction.
 *
 * Root-level manifest files only. No recursive repository scan.
 * Dependency identifiers and manifest text are normalized into
 * searchable tokens; nothing is mapped to a specific technology.
 */
function collectProjectEvidence(cwd) {
  const result = {
    files_considered: [],
    tokens: new Set()
  };

  let entries = [];

  try {
    entries =
      fs.readdirSync(
        cwd,
        {
          withFileTypes: true
        }
      );
  }
  catch {
    return result;
  }

  let totalBytes = 0;

  for (
    const entry of
    entries
  ) {
    if (
      result.files_considered.length >=
        MAX_PROJECT_EVIDENCE_FILES ||
      totalBytes >=
        MAX_TOTAL_EVIDENCE_BYTES
    ) {
      break;
    }

    if (!entry.isFile()) {
      continue;
    }

    const isManifest =
      PROJECT_EVIDENCE_MANIFEST_NAMES.has(
        entry.name
      ) ||
      /^requirements(\..+)?\.txt$/.test(
        entry.name
      );

    if (!isManifest) {
      continue;
    }

    const file =
      path.join(
        cwd,
        entry.name
      );

    let text = "";

    try {
      const stats =
        fs.statSync(file);

      if (stats.size <= 0) {
        continue;
      }

      const length =
        Math.min(
          stats.size,
          MAX_BYTES_PER_EVIDENCE_FILE
        );

      const handle =
        fs.openSync(file, "r");

      try {
        const buffer =
          Buffer.alloc(length);

        fs.readSync(
          handle,
          buffer,
          0,
          length,
          0
        );

        text =
          buffer.toString("utf8");
      }
      finally {
        fs.closeSync(handle);
      }
    }
    catch {
      continue;
    }

    result.files_considered.push(
      entry.name
    );

    totalBytes += text.length;

    for (
      const token of
      evidenceTokens(text)
    ) {
      if (
        result.tokens.size >=
        MAX_EVIDENCE_TOKENS
      ) {
        break;
      }

      result.tokens.add(token);
    }
  }

  return result;
}

/*
 * External skill identity terms derived only from existing data:
 * the skill's own name. Generic anchor vocabulary is excluded so
 * broad words can never act as identity.
 */
function skillIdentityTerms(skill) {
  if (skill.internal) {
    return [];
  }

  return words(
    String(skill.name)
      .replace(/[-_:]+/g, " ")
  )
    .filter(
      (token) =>
        token.length >= 3 &&
        !EXTERNAL_GENERIC_ANCHORS.has(token)
    );
}

/*
 * Builds retrieval context combining task intent (derived from the
 * EXISTING internal capability scoring), bounded project evidence,
 * and external skill identity.
 *
 * Project evidence only benefits an external skill when one of that
 * skill's own specific identity terms appears in the evidence, and
 * only when the task itself maps to at least one internal engineering
 * capability. Intent anchors are context only; they never decide
 * primary/support routing directly.
 */
function buildRetrievalContext({
  task,
  cwd,
  internalSkills,
  externalSkills
}) {
  const evidence =
    collectProjectEvidence(cwd);

  const intent =
    internalSkills
      .map(
        (skill) => ({
          name:
            skill.name,

          score:
            scoreSkill(
              task,
              skill
            )
        })
      )
      .filter(
        (item) =>
          item.score > 0
      )
      .sort(
        (a,b) =>
          b.score -
            a.score ||
          a.name.localeCompare(
            b.name
          )
      )
      .slice(0, MAX_INTENT_ANCHORS)
      .map(
        (item) =>
          item.name
      );

  const affinityByPath =
    new Map();

  const externalMatches = [];

  if (
    intent.length &&
    evidence.tokens.size
  ) {
    const normalizedEvidence =
      ` ${[...evidence.tokens].join(" ")} `;

    for (
      const skill of
      externalSkills
    ) {
      const identity =
        skillIdentityTerms(skill);

      if (!identity.length) {
        continue;
      }

      const matched =
        identity.filter(
          (term) =>
            evidence.tokens.has(term) ||
            normalizedEvidence.includes(
              ` ${term} `
            )
        );

      if (!matched.length) {
        continue;
      }

      affinityByPath.set(
        skill.path,
        matched.length *
          EVIDENCE_IDENTITY_AFFINITY
      );

      if (
        externalMatches.length <
        MAX_RETRIEVAL_DIAGNOSTICS
      ) {
        externalMatches.push({
          name:
            skill.name,

          matched_identity_terms:
            matched.slice(
              0,
              MAX_RETRIEVAL_DIAGNOSTICS
            )
        });
      }
    }
  }

  return {
    diagnostics: {
      intent,

      project_evidence: {
        files_considered:
          evidence.files_considered,

        token_count:
          evidence.tokens.size
      },

      external_matches:
        externalMatches
    },

    affinityByPath
  };
}

function chooseSpecialists(
  task,
  capabilities,
  retrieval = null
) {
  const affinity =
    retrieval &&
    retrieval.affinityByPath instanceof Map
      ? retrieval.affinityByPath
      : new Map();

  const ranked =
    capabilities
      .map(
        (skill) => ({
          skill,

          score:
            scoreSkill(
              task,
              skill
            ) +
            (skill.internal
              ? 0
              : affinity.get(
                  skill.path
                ) || 0)
        })
      )
      .filter(
        (item) =>
          item.score > 0 &&
          (item.skill.internal ||
            externalSkillAnchored(
              task,
              item.skill
            ) ||
            affinity.has(
              item.skill.path
            ))
      )
      .sort(
        (a,b) =>
          b.score -
            a.score ||

          /*
           * On exact ties prefer Engineer Flow core.
           * External specialist wins naturally when
           * it has stronger task evidence.
           */
          Number(
            b.skill.internal
          ) -
          Number(
            a.skill.internal
          ) ||

          a.skill.name
            .localeCompare(
              b.skill.name
            )
      );

  if (
    !ranked.length
  ) {
    return [];
  }

  const selected =
    [ranked[0]];

  const second =
    ranked[1];

  /*
   * Sparse activation:
   * support specialist only when independently useful.
   */
  if (
    second &&
    second.score >= 2 &&
    second.score >=
      Math.max(
        2,
        ranked[0].score *
          0.60
      )
  ) {
    selected.push(second);
  }

  return selected.slice(
    0,
    MAX_SPECIALISTS
  );
}


/* =========================================================
   SPECIALIST MATERIALIZATION
   ========================================================= */

function materializeSpecialist(
  item,
  role
) {
  const skill =
    item.skill;

  return {
    role,

    name:
      skill.name,

    score:
      item.score,

    source:
      skill.source,

    skill:
      skill.path
  };
}

/* =========================================================
   CONDITIONAL PERSISTENT MEMORY INFRASTRUCTURE
   ========================================================= */

function memoryStage({
  task,
  cwd
}) {
  const available =
    fs.existsSync(MEMORY_SKILL) &&
    fs.existsSync(MEMORY_RUNNER);

  return {
    mode:
      "conditional",

    available,

    skill:
      MEMORY_SKILL,

    runner:
      MEMORY_RUNNER,

    preflight:
      "auto",

    task,

    cwd,

    conflict_policy:
      "current code/config wins",

    checkpoint_policy:
      "durable reusable project knowledge only",

    prefer_host_mcp_memory:
      true,

    counted_as_specialist:
      false
  };
}

/* =========================================================
   SECURITY VERIFICATION STAGE
   ========================================================= */

function securityStage() {
  return {
    required_after_development:
      true,

    core:
      path.join(
        SKILLS_DIR,
        "security",
        "SKILL.md"
      ),

    gate:
      "SECURITY REVIEW: PASS | SECURITY REVIEW: NEEDS_FIX",

    counted_as_specialist:
      false
  };
}

/* =========================================================
   RESOLUTION
   ========================================================= */

function resolve({
  task,
  cwd
}) {
  const pool =
    buildCapabilityPool();

  const retrieval =
    buildRetrievalContext({
      task,

      cwd,

      internalSkills:
        pool.internal,

      externalSkills:
        pool.external
    });

  const selected =
    chooseSpecialists(
      task,
      pool.capabilities,
      retrieval
    );

  const specialists =
    selected.map(
      (item,index) =>
        materializeSpecialist(
          item,
          index === 0
            ? "primary"
            : "support"
        )
    );

  return {
    task,

    cwd,

    capability_pool: {
      internal:
        pool.internal.length,

      external_discovered:
        pool.external.length,

      effective_after_dedupe:
        pool.capabilities.length
    },

    /*
     * Diagnostic only. Bounded arrays; never a manifest dump,
     * never secrets, never counted as a specialist.
     */
    retrieval:
      retrieval.diagnostics,

    specialist_count:
      specialists.length,

    primary:
      specialists[0] ||
      null,

    support:
      specialists[1] ||
      null,


    memory_infrastructure:
      memoryStage({
        task,
        cwd
      }),

    post_development_security:
      securityStage(),

    resolution_model:
      "internal-plus-external-skills-with-memory-and-post-development-security",

    max_specialists:
      MAX_SPECIALISTS
  };
}


/* =========================================================
   CLI
   ========================================================= */

/* =========================================================
   DOCTOR (read-only diagnostics)
    ========================================================= */

function readPackageVersion() {
  const pkgPath =
    path.join(
      REPO_ROOT,
      "package.json"
    );

  if (
    !fs.existsSync(pkgPath)
  ) {
    return null;
  }

  try {
    const pkg =
      JSON.parse(
        fs.readFileSync(
          pkgPath,
          "utf8"
        )
      );

    return pkg.version || null;
  }
  catch {
    return null;
  }
}

function readRootPackageJson() {
  const pkgPath =
    path.join(
      REPO_ROOT,
      "package.json"
    );

  if (
    !fs.existsSync(pkgPath)
  ) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        pkgPath,
        "utf8"
      )
    );
  }
  catch {
    return null;
  }
}

function readJsonSafe(file) {
  try {
    return JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );
  }
  catch {
    return null;
  }
}

function isGitRepository(cwd) {
       const result =
    spawnSync(
      "git",
      [
        "rev-parse",
        "--is-inside-work-tree"
      ],
      {
        cwd,
        encoding:
          "utf8"
      }
    );

  return (
    result.status === 0 &&
    result.stdout.trim() === "true"
  );
}

function gitPath(cwd, gitSubpath) {
  const result =
    spawnSync(
      "git",
      [
        "rev-parse",
        "--git-path",
        gitSubpath
      ],
      {
        cwd,
        encoding:
          "utf8"
      }
    );

  if (
    result.status !== 0
  ) {
    return null;
  }

  const value =
    result.stdout.trim();

  if (!value) {
    return null;
  }

  return path.isAbsolute(value)
    ? value
    : path.resolve(
        cwd,
        value
      );
}

function resolveMemoryRoot() {
  const envRoot =
    process.env
      .ENGINEER_FLOW_MEMORY_ROOT ||
    process.env
      .AI_MEMORY_ROOT;

  if (envRoot) {
    return path.resolve(
      String(envRoot)
    );
  }

  return path.join(
    os.homedir(),
    ".engineer-flow-memory"
  );
}

function readMemoryRuntimeVersion() {
  if (
    !fs.existsSync(MEMORY_RUNNER)
  ) {
    return null;
  }

  try {
    const text =
      fs.readFileSync(
        MEMORY_RUNNER,
        "utf8"
      );

    const match =
      text.match(
        /const VERSION = "([^"]+)"/
      );

    return match
      ? match[1]
      : null;
  }
  catch {
    return null;
  }
}

function runDoctor(args) {
  const cwd =
    path.resolve(
      value("--cwd") ||
      process.cwd()
    );

  const checks = [];
  let hasFail = false;
  let hasWarn = false;

  /*
   * A. CORE_MANIFEST
   */
  let manifestPass = true;
  let coreCount = 0;

  if (
    !fs.existsSync(CORE_MANIFEST)
  ) {
    manifestPass = false;
    hasFail = true;
  }
  else {
    const manifest =
      readJsonSafe(CORE_MANIFEST);

    if (!manifest) {
      manifestPass = false;
      hasFail = true;
    }
    else {
      const cores =
        Array.isArray(manifest.cores)
          ? manifest.cores
          : [];

      coreCount = cores.length;

      if (
        coreCount !== 16
      ) {
        manifestPass = false;
        hasFail = true;
      }
      else {
        for (
          const name of cores
        ) {
          const skillFile =
            path.join(
              SKILLS_DIR,
              name,
              "SKILL.md"
            );

          if (
            !fs.existsSync(skillFile)
          ) {
            manifestPass = false;
            hasFail = true;
            break;
          }
        }
      }
    }
  }

  console.log(
    "CORE_MANIFEST=" +
    (manifestPass ? "PASS" : "FAIL")
  );

  console.log(
    `CORE_COUNT=${coreCount}`
  );

  /*
   * B. MEMORY_INFRASTRUCTURE
   */
  const memSkillExists =
    fs.existsSync(MEMORY_SKILL);

  const memRunnerExists =
    fs.existsSync(MEMORY_RUNNER);

  const memPass =
    memSkillExists &&
    memRunnerExists;

  if (
    !memPass
  ) {
    hasFail = true;
  }

  console.log(
    "MEMORY_INFRASTRUCTURE=" +
    (memPass ? "PASS" : "FAIL")
  );

  const memVersion =
    readMemoryRuntimeVersion();

  console.log(
    `MEMORY_RUNTIME_VERSION=${memVersion ?? "UNKNOWN"}`
  );

  /*
   * C. EXTERNAL_ROOTS
   */
  const roots =
    externalRoots();

  let externalRootsWarn = false;

  for (
    const root_ of roots
  ) {
    const exists =
      fs.existsSync(root_);

    console.log(
      `EXTERNAL_ROOT=${root_}=${exists ? "YES" : "NO"}`
    );

    if (!exists) {
      externalRootsWarn = true;
    }
  }

  console.log(
    `EXTERNAL_ROOTS=${roots.length}`
  );

  /*
   * D. EXTERNAL_SKILLS
   */
  let externalCount = 0;
  let malformedCount = 0;

  for (
    const root_ of roots
  ) {
    const files =
      walkSkillFiles(root_);

    for (
      const file of files
      ) {
      let text = "";
      let unreadable = false;

      try {
        text =
          fs.readFileSync(
            file,
            "utf8"
          );
      }
      catch {
        unreadable =
          true;
      }

      if (unreadable) {
        malformedCount += 1;
        continue;
      }

      const meta =
        frontmatter(text);

      const fallbackName =
        path.basename(
          path.dirname(file)
        );

      const name =
        meta.name ||
        fallbackName;

      if (
        !name
      ) {
        malformedCount += 1;
        continue;
      }

      externalCount += 1;
    }
  }

  console.log(
    `EXTERNAL_SKILLS=${externalCount}`
  );

  console.log(
    `MALFORMED_EXTERNAL_SKILLS=${malformedCount}`
  );

  if (externalRootsWarn || malformedCount > 0) {
    hasWarn = true;
  }

  /*
   * E. VERSION_CONSISTENCY
   */
  let versionPass = true;
  const pkgVersion =
    readPackageVersion();

  if (
    pkgVersion === null
  ) {
    versionPass = false;
    hasFail = true;
  }

  if (
    versionPass
  ) {
    const metadataFiles = [
      "agent-skills.json",
      ".codex-plugin/plugin.json",
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json"
    ];

    for (
      const file of metadataFiles
    ) {
          const full =
        path.join(
          REPO_ROOT,
          file
        );

      if (
        !fs.existsSync(full)
      ) {
        versionPass = false;
        hasFail = true;
        continue;
      }

      const json =
        readJsonSafe(full);

      if (
        !json ||
        !JSON.stringify(json).includes(
          pkgVersion
        )
      ) {
        versionPass = false;
        hasFail = true;
      }
    }
  }

  console.log(
    "VERSION_CONSISTENCY=" +
    (versionPass ? "PASS" : "FAIL")
  );

  /*
   * F. PROJECT_CONTEXT
   */
  const gitRepo =
    isGitRepository(cwd);

  console.log(
    `PROJECT_ROOT=${cwd}`
  );

  console.log(
    `GIT_REPOSITORY=${gitRepo ? "YES" : "NO"}`
  );

  /*
   * G. SECURITY_HOOK
   */
  let hookStatus =
    "NOT_GIT_REPOSITORY";

  let preserved =
    "NO";

  if (
    gitRepo
  ) {
    const hooksPath =
      gitPath(
        cwd,
        "hooks"
      );

    if (
      hooksPath !== null
    ) {
      const preCommit =
        path.join(
          hooksPath,
          "pre-commit"
        );

      const preCommitEf =
        path.join(
          hooksPath,
          "pre-commit.pre-engineer-flow"
        );

      if (
        fs.existsSync(preCommitEf)
      ) {
        preserved =
          "YES";
      }

      if (
        fs.existsSync(preCommit)
      ) {
        try {
          const content =
            fs.readFileSync(
              preCommit,
              "utf8"
            );

          if (
            content.includes(
              "ENGINEER_FLOW_SECURITY_GATE"
            )
          ) {
            hookStatus =
              "INSTALLED";
          }
          else {
            hookStatus =
              "NOT_INSTALLED";
          }
        }
        catch {
          hookStatus =
            "NOT_INSTALLED";
        }
      }
      else {
        hookStatus =
          "NOT_INSTALLED";
        hasWarn = true;
      }
    }
    else {
      hookStatus =
        "NOT_INSTALLED";
      hasWarn = true;
    }
  }

  console.log(
    `SECURITY_HOOK=${hookStatus}`
  );

  console.log(
    `PRESERVED_PREVIOUS_HOOK=${preserved}`
  );

  /*
   * H. MEMORY_ROOT
   */
  const memoryRoot =
    resolveMemoryRoot();

  const memoryRootExists =
    fs.existsSync(memoryRoot);

  console.log(
    `MEMORY_ROOT=${memoryRoot}`
  );

  console.log(
    `MEMORY_ROOT_EXISTS=${memoryRootExists ? "YES" : "NO"}`
  );

  if (
    !memoryRootExists
  ) {
    hasWarn = true;
  }

  /*
   * Summary
   */
  if (hasFail) {
    console.log(
      "DOCTOR_STATUS=FAIL"
    );
    process.exit(1);
  }
  else if (hasWarn) {
    console.log(
      "DOCTOR_STATUS=WARN"
    );
    process.exit(0);
  }
  else {
    console.log(
      "DOCTOR_STATUS=PASS"
    );
    process.exit(0);
  }
}

/* =========================================================
   CLI
   ========================================================= */

const args =
  process.argv.slice(2);

const command =
  args[0];

function value(name) {
  const index =
    args.indexOf(name);

  return index >= 0
    ? args[index + 1]
    : null;
}

if (
  command === "resolve"
) {
  const task =
    value("--task") ||
    "";

  const cwd =
    path.resolve(
      value("--cwd") ||
      process.cwd()
    );

  if (!task) {
    throw new Error(
      "--task is required"
    );
  }

  console.log(
    JSON.stringify(
      resolve({
        task,
        cwd
      }),
      null,
      2
    )
  );
}

else if (
  command === "inventory"
) {
  const pool =
    buildCapabilityPool();

  console.log(
    JSON.stringify(
      {
        internal:
          pool.internal.map(
            (skill) => ({
              name:
                skill.name,
              path:
                skill.path
            })
          ),

        external:
          pool.external.map(
            (skill) => ({
              name:
                skill.name,
              path:
                skill.path
            })
          ),

        counts: {
          internal:
            pool.internal.length,

          external:
            pool.external.length,

          effective:
            pool.capabilities.length
        }
      },
      null,
      2
    )
  );
}

else if (
  command === "self-test"
) {
  const pool =
    buildCapabilityPool();

  if (
    pool.internal.length !== 16
  ) {
    throw new Error(
      `Expected 16 internal skills, got ${pool.internal.length}`
    );
  }

  const security =
    pool.internal.find(
      (skill) =>
        skill.name === "security"
    );

  if (!security) {
    throw new Error(
      "SECURITY_CORE_MISSING"
    );
  }

  if (
    !fs.existsSync(MEMORY_SKILL) ||
    !fs.existsSync(MEMORY_RUNNER)
  ) {
    throw new Error(
      "MEMORY_INFRASTRUCTURE_MISSING"
    );
  }

  console.log(
    "SELF_TEST_PASS=YES"
  );

  console.log(
    `INTERNAL_SKILLS=${pool.internal.length}`
  );

  console.log(
    "MEMORY_INFRASTRUCTURE=ENABLED"
  );

  console.log(
    `EXTERNAL_SKILLS=${pool.external.length}`
  );

  console.log(
    `EFFECTIVE_CAPABILITIES=${pool.capabilities.length}`
  );

console.log(
    `MAX_SPECIALISTS=${MAX_SPECIALISTS}`
  );

  console.log(
    "POST_DEVELOPMENT_SECURITY=ENABLED"
  );
}

else if (
  command === "doctor"
) {
  runDoctor(args);
}

else {
  console.log(
    [
      "Engineer Flow",
      "",
      'node engineer-flow.mjs resolve --task "..." --cwd "..."',
      "",
      "node engineer-flow.mjs inventory",
      "",
      "node engineer-flow.mjs self-test",
      "",
      "node engineer-flow.mjs doctor [--cwd <project>]",
      ""
    ].join("\n")
  );
}