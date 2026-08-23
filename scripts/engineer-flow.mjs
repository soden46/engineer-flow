import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);

const ROOT =
  path.resolve(
    SCRIPT_DIR,
    ".."
  );

const SKILLS_DIR =
  path.join(
    ROOT,
    "skills"
  );

const ADAPTERS_DIR =
  path.join(
    ROOT,
    "adapters"
  );

const CORE_MANIFEST =
  path.join(
    SKILLS_DIR,
    "core-manifest.json"
  );

const MAX_SPECIALISTS = 2;


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

function discoverExternalSkills() {
  const skills = [];

  for (
    const root of externalRoots()
  ) {
    for (
      const file of
      walkSkillFiles(root)
    ) {
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
    String(task)
      .toLowerCase();

  const normalizedName =
    String(skill.name)
      .toLowerCase()
      .replace(
        /[-_:]+/g,
        " "
      );

  /*
   * Strong explicit skill-name evidence.
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

function chooseSpecialists(
  task,
  capabilities
) {
  const ranked =
    capabilities
      .map(
        (skill) => ({
          skill,
          score:
            scoreSkill(
              task,
              skill
            )
        })
      )
      .filter(
        (item) =>
          item.score > 0 &&
          externalSkillAnchored(
            task,
            item.skill
          )
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
   STACK ADAPTER DISCOVERY
   ========================================================= */

function discoverAdapters() {
  if (
    !fs.existsSync(
      ADAPTERS_DIR
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      ADAPTERS_DIR,
      {
        withFileTypes:
          true
      }
    )
    .filter(
      (entry) =>
        entry.isDirectory()
    )
    .map(
      (entry) => {
        const manifestFile =
          path.join(
            ADAPTERS_DIR,
            entry.name,
            "adapter.json"
          );

        if (
          !fs.existsSync(
            manifestFile
          )
        ) {
          return null;
        }

        let manifest;

        try {
          manifest =
            JSON.parse(
              fs.readFileSync(
                manifestFile,
                "utf8"
              )
            );
        }
        catch {
          return null;
        }

        return {
          directory:
            path.join(
              ADAPTERS_DIR,
              entry.name
            ),

          ...manifest
        };
      }
    )
    .filter(Boolean);
}

function evidenceMatches(
  cwd,
  rule
) {
  const file =
    path.join(
      cwd,
      rule.file
    );

  if (
    rule.exists === true &&
    fs.existsSync(file)
  ) {
    return true;
  }

  if (
    !fs.existsSync(file) ||
    !Array.isArray(
      rule.contains_any
    )
  ) {
    return false;
  }

  let content = "";

  try {
    content =
      fs.readFileSync(
        file,
        "utf8"
      )
      .toLowerCase();
  }
  catch {
    return false;
  }

  return rule
    .contains_any
    .some(
      (term) =>
        content.includes(
          String(term)
            .toLowerCase()
        )
    );
}

function detectAdapter(
  cwd,
  adapters
) {
  const ranked =
    adapters
      .map(
        (adapter) => {
          const evidence =
            adapter.evidence ||
            [];

          const matches =
            evidence.filter(
              (rule) =>
                evidenceMatches(
                  cwd,
                  rule
                )
            ).length;

          return {
            adapter,
            matches
          };
        }
      )
      .filter(
        (item) =>
          item.matches > 0
      )
      .sort(
        (a,b) =>
          b.matches -
          a.matches
      );

  return (
    ranked[0]?.adapter ||
    null
  );
}


/* =========================================================
   SPECIALIST + ADAPTER
   ========================================================= */

function materializeSpecialist(
  item,
  role,
  adapter
) {
  const skill =
    item.skill;

  let adapterFile =
    null;

  /*
   * Stack adapters belong to generalized Engineer Flow
   * core skills.
   *
   * External skills keep their own native instructions.
   */
  if (
    skill.internal &&
    adapter
  ) {
    const candidate =
      path.join(
        adapter.directory,
        `${skill.name}.md`
      );

    if (
      fs.existsSync(
        candidate
      )
    ) {
      adapterFile =
        candidate;
    }
  }

  return {
    role,

    name:
      skill.name,

    score:
      item.score,

    source:
      skill.source,

    skill:
      skill.path,

    adapter:
      adapterFile
  };
}


/* =========================================================
   SECURITY VERIFICATION STAGE
   ========================================================= */

function securityStage(
  adapter
) {
  const core =
    path.join(
      SKILLS_DIR,
      "security",
      "SKILL.md"
    );

  let adapterFile =
    null;

  if (adapter) {
    const candidate =
      path.join(
        adapter.directory,
        "security.md"
      );

    if (
      fs.existsSync(
        candidate
      )
    ) {
      adapterFile =
        candidate;
    }
  }

  return {
    required_after_development:
      true,

    core,

    adapter:
      adapterFile,

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

  const selected =
    chooseSpecialists(
      task,
      pool.capabilities
    );

  const adapters =
    discoverAdapters();

  const adapter =
    detectAdapter(
      cwd,
      adapters
    );

  const specialists =
    selected.map(
      (item,index) =>
        materializeSpecialist(
          item,
          index === 0
            ? "primary"
            : "support",
          adapter
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

    specialist_count:
      specialists.length,

    primary:
      specialists[0] ||
      null,

    support:
      specialists[1] ||
      null,

    detected_adapter:
      adapter?.name ||
      null,

    post_development_security:
      securityStage(
        adapter
      ),

    resolution_model:
      "internal-plus-external-skills-with-post-development-security",

    max_specialists:
      MAX_SPECIALISTS
  };
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

  const adapters =
    discoverAdapters();

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

  console.log(
    "SELF_TEST_PASS=YES"
  );

  console.log(
    `INTERNAL_SKILLS=${pool.internal.length}`
  );

  console.log(
    `EXTERNAL_SKILLS=${pool.external.length}`
  );

  console.log(
    `EFFECTIVE_CAPABILITIES=${pool.capabilities.length}`
  );

  console.log(
    `ADAPTER_FAMILIES=${adapters.length}`
  );

  console.log(
    `MAX_SPECIALISTS=${MAX_SPECIALISTS}`
  );

  console.log(
    "POST_DEVELOPMENT_SECURITY=ENABLED"
  );
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
      "node engineer-flow.mjs self-test"
    ].join("\n")
  );
}