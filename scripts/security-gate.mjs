import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const ROOT = path.resolve(SCRIPT_DIR, "..");

const RESOLVER =
  path.join(
    ROOT,
    "scripts",
    "engineer-flow.mjs"
  );

function arg(name) {
  const index =
    process.argv.indexOf(name);

  if (index < 0) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function git(cwd, args, options = {}) {
  const result =
    spawnSync(
      "git",
      args,
      {
        cwd,
        encoding: "utf8",
        maxBuffer:
          100 * 1024 * 1024,
        ...options
      }
    );

  if (result.status !== 0) {
    throw new Error(
      result.stderr ||
      `git ${args.join(" ")} failed`
    );
  }

  return result.stdout;
}

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function ensureGitRepo(cwd) {
  git(
    cwd,
    ["rev-parse", "--is-inside-work-tree"]
  );
}

function stagedDiff(cwd) {
  return git(
    cwd,
    [
      "diff",
      "--cached",
      "--no-ext-diff",
      "--binary",
      "--unified=40",
      "--"
    ]
  );
}

function stagedFiles(cwd) {
  return git(
    cwd,
    [
      "diff",
      "--cached",
      "--name-only",
      "--diff-filter=ACMR",
      "--"
    ]
  )
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function gateDirectory(cwd) {
  let value =
    git(
      cwd,
      [
        "rev-parse",
        "--git-path",
        "engineer-flow-security"
      ]
    ).trim();

  if (!path.isAbsolute(value)) {
    value =
      path.resolve(
        cwd,
        value
      );
  }

  return value;
}

function resolveSecurity(cwd) {
  const task =
    [
      "Verify the completed engineering changes before commit.",
      "Apply the mandatory Engineer Flow post-development security review."
    ].join(" ");

  const result =
    spawnSync(
      process.execPath,
      [
        RESOLVER,
        "resolve",
        "--task",
        task,
        "--cwd",
        cwd
      ],
      {
        encoding: "utf8"
      }
    );

  if (result.status !== 0) {
    throw new Error(
      result.stderr ||
      "Engineer Flow resolver failed"
    );
  }

  const resolved =
    JSON.parse(
      result.stdout
    );

  if (
    !resolved.post_development_security ||
    !resolved.post_development_security.core
  ) {
    throw new Error(
      "POST_DEVELOPMENT_SECURITY_NOT_RESOLVED"
    );
  }

  return resolved;
}

function writeRequest(cwd, diff, files, resolved) {
  const hash =
    sha256(diff);

  const gateDir =
    gateDirectory(cwd);

  const requests =
    path.join(
      gateDir,
      "requests"
    );

  const results =
    path.join(
      gateDir,
      "results"
    );

  fs.mkdirSync(
    requests,
    { recursive: true }
  );

  fs.mkdirSync(
    results,
    { recursive: true }
  );

  const diffFile =
    path.join(
      requests,
      `${hash}.diff`
    );

  const requestFile =
    path.join(
      requests,
      `${hash}.json`
    );

  const promptFile =
    path.join(
      requests,
      `${hash}.md`
    );

  const resultFile =
    path.join(
      results,
      `${hash}.json`
    );

  fs.writeFileSync(
    diffFile,
    diff,
    "utf8"
  );

  const request = {
    version: 1,

    mode:
      "pre-commit",

    project:
      cwd,

    diff_sha256:
      hash,

    changed_files:
      files,

    security_core:
      resolved.post_development_security.core,

    diff_file:
      diffFile,

    result_file:
      resultFile
  };

  fs.writeFileSync(
    requestFile,
    JSON.stringify(
      request,
      null,
      2
    ) + "\n",
    "utf8"
  );

  const prompt =
`# Engineer Flow Security Gate

Review the staged changes for this project.

## Security instructions

Read:

- Core: ${resolved.post_development_security.core}

## Changed files

${files.map((file) => `- ${file}`).join("\n")}

## Diff

Read:

${diffFile}

Focus first on changed code, then inspect reachable surrounding code when necessary.

Use evidence-based source -> transformation -> authorization -> sink analysis.

Do not report speculative vulnerabilities as confirmed findings.

When a vulnerability is found:

1. explain the evidence
2. assign appropriate severity
3. fix the root cause
4. add regression protection where appropriate
5. re-test

Finish the review with exactly one result:

SECURITY REVIEW: PASS

or:

SECURITY REVIEW: NEEDS_FIX

After the review is complete, record the result using:

node "${path.join(ROOT, "scripts", "security-gate.mjs")}" record --cwd "${cwd}" --result PASS

Use NEEDS_FIX instead of PASS when actionable security issues remain.

Diff hash:

${hash}
`;

  fs.writeFileSync(
    promptFile,
    prompt,
    "utf8"
  );

  return {
    hash,
    requestFile,
    promptFile,
    diffFile,
    resultFile
  };
}

function validExistingResult(resultFile, hash) {
  if (!fs.existsSync(resultFile)) {
    return null;
  }

  try {
    const result =
      JSON.parse(
        fs.readFileSync(
          resultFile,
          "utf8"
        )
      );

    if (
      result.diff_sha256 !== hash
    ) {
      return null;
    }

    if (
      result.result !== "PASS" &&
      result.result !== "NEEDS_FIX"
    ) {
      return null;
    }

    return result;
  }
  catch {
    return null;
  }
}

function check() {
  const cwd =
    path.resolve(
      arg("--cwd") ||
      process.cwd()
    );

  ensureGitRepo(cwd);

  const diff =
    stagedDiff(cwd);

  if (!diff.trim()) {
    console.log(
      "SECURITY_GATE=SKIP_NO_STAGED_CHANGES"
    );

    process.exit(0);
  }

  const files =
    stagedFiles(cwd);

  const resolved =
    resolveSecurity(cwd);

  const packet =
    writeRequest(
      cwd,
      diff,
      files,
      resolved
    );

  const existing =
    validExistingResult(
      packet.resultFile,
      packet.hash
    );

  if (
    existing?.result === "PASS"
  ) {
    console.log(
      "SECURITY_GATE=PASS"
    );

    console.log(
      `DIFF_SHA256=${packet.hash}`
    );

    console.log(
      `CORE=${resolved.post_development_security.core}`
    );

    process.exit(0);
  }

  if (
    existing?.result === "NEEDS_FIX"
  ) {
    console.error(
      "SECURITY_GATE=NEEDS_FIX"
    );

    console.error(
      `DIFF_SHA256=${packet.hash}`
    );

    process.exit(1);
  }

  console.error("");
  console.error(
    "SECURITY_GATE=REVIEW_REQUIRED"
  );

  console.error(
    `DIFF_SHA256=${packet.hash}`
  );

  console.error(
    `CORE=${resolved.post_development_security.core}`
  );

  console.error(
    `REQUEST=${packet.requestFile}`
  );

  console.error(
    `PROMPT=${packet.promptFile}`
  );

  console.error(
    `DIFF=${packet.diffFile}`
  );

  console.error("");
  console.error(
    "Commit blocked until this exact staged diff receives SECURITY REVIEW: PASS."
  );

  process.exit(1);
}

function record() {
  const cwd =
    path.resolve(
      arg("--cwd") ||
      process.cwd()
    );

  const result =
    String(
      arg("--result") || ""
    ).toUpperCase();

  if (
    result !== "PASS" &&
    result !== "NEEDS_FIX"
  ) {
    throw new Error(
      "--result must be PASS or NEEDS_FIX"
    );
  }

  ensureGitRepo(cwd);

  const diff =
    stagedDiff(cwd);

  if (!diff.trim()) {
    throw new Error(
      "NO_STAGED_DIFF_TO_RECORD"
    );
  }

  const hash =
    sha256(diff);

  const gateDir =
    gateDirectory(cwd);

  const resultDir =
    path.join(
      gateDir,
      "results"
    );

  fs.mkdirSync(
    resultDir,
    { recursive: true }
  );

  const resultFile =
    path.join(
      resultDir,
      `${hash}.json`
    );

  const payload = {
    version: 1,

    diff_sha256:
      hash,

    result,

    reviewed_at:
      new Date().toISOString()
  };

  fs.writeFileSync(
    resultFile,
    JSON.stringify(
      payload,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `SECURITY_REVIEW_RECORDED=${result}`
  );

  console.log(
    `DIFF_SHA256=${hash}`
  );

  console.log(
    `RESULT_FILE=${resultFile}`
  );
}

const command =
  process.argv[2] || "check";

if (command === "check") {
  check();
}
else if (command === "record") {
  record();
}
else {
  console.log(
    [
      "Usage:",
      "",
      'node security-gate.mjs check --cwd "PROJECT"',
      "",
      'node security-gate.mjs record --cwd "PROJECT" --result PASS',
      "",
      'node security-gate.mjs record --cwd "PROJECT" --result NEEDS_FIX'
    ].join("\n")
  );
}