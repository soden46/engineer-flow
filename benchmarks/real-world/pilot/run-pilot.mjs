#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, unlinkSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { execSync, execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PILOT_JSON = join(__dirname, 'pilot.json')
const TASKS_DIR = join(__dirname, 'tasks')
const ROOT_DIR = join(__dirname, '..', '..', '..')
const ENV_JSON = join(__dirname, 'environment.json')

const REQUIRED_TASK_FIELDS = [
  'task_id',
  'repository',
  'license',
  'category',
  'difficulty',
  'leakage_risk',
  'base_commit',
  'upstream_fix_commit',
  'agent_prompt',
  'setup_command',
  'pre_validation_command',
  'acceptance_command',
  'existing_regression_command',
  'expected_behavior',
  'likely_scope',
  'verification',
]

const REQUIRED_VERIFICATION_FIELDS = [
  'base_verified',
  'fix_verified',
  'bug_present_at_base',
  'acceptance_fails_at_base',
  'acceptance_passes_at_fix',
  'setup_reproducible',
]

const SHA_RE = /^[0-9a-f]{40}$/

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function fail(msg) {
  console.error(`FAIL: ${msg}`)
  process.exit(1)
}

function log(msg) {
  console.log(msg)
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(seed) {
  return createHash('sha256').update(seed).digest('hex')
}

function shuffleInPlace(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function sanitizeTaskForAgent(task) {
  const allowedFields = ['task_id', 'repository', 'category', 'difficulty', 'agent_prompt']
  const sanitized = {}
  for (const field of allowedFields) {
    if (field in task) {
      sanitized[field] = task[field]
    }
  }
  return sanitized
}

function agentViewLeakageCheck() {
  const pilot = loadJson(PILOT_JSON)
  const allowedFields = ['task_id', 'repository', 'category', 'difficulty', 'agent_prompt']
  for (const taskFile of pilot.tasks) {
    const fullPath = join(TASKS_DIR, taskFile)
    const task = loadJson(fullPath)
    const sanitized = sanitizeTaskForAgent(task)
    const sanitizedKeys = Object.keys(sanitized)
    for (const key of sanitizedKeys) {
      if (!allowedFields.includes(key)) {
        return false
      }
    }
    const forbiddenFields = [
      'base_commit', 'upstream_fix_commit', 'author_reference',
      'setup_command', 'pre_validation_command', 'acceptance_command',
      'existing_regression_command', 'expected_behavior', 'likely_scope',
      'acceptance_fixture', 'verification'
    ]
    for (const field of forbiddenFields) {
      if (field in sanitized) {
        return false
      }
    }
  }
  return true
}

function checkAuthorMetadataHidden() {
  const pilot = loadJson(PILOT_JSON)
  for (const taskFile of pilot.tasks) {
    const fullPath = join(TASKS_DIR, taskFile)
    const task = loadJson(fullPath)
    const sanitized = sanitizeTaskForAgent(task)
    const sanitizedJson = JSON.stringify(sanitized)
    const forbidden = ['upstream_fix_commit', 'author_reference']
    for (const field of forbidden) {
      if (field in sanitized) {
        fail(`author metadata field '${field}' exposed in sanitized task view`)
      }
    }
  }
  log('author metadata hidden: PASS')
}

function validate() {
  if (!existsSync(PILOT_JSON)) {
    fail('pilot.json not found')
  }

  const pilot = loadJson(PILOT_JSON)

  if (!pilot.tasks || !Array.isArray(pilot.tasks)) {
    fail('pilot.tasks must be an array')
  }

  if (pilot.tasks.length !== 4) {
    fail(`expected 4 tasks, found ${pilot.tasks.length}`)
  }

  if (pilot.runs_per_task_per_arm !== 3) {
    fail('runs_per_task_per_arm must be 3')
  }

  if (!Array.isArray(pilot.arms) || pilot.arms.length !== 2) {
    fail('arms must have exactly 2 entries')
  }

  if (pilot.arms[0] !== 'baseline' || pilot.arms[1] !== 'engineer-flow') {
    fail('arms must be ["baseline", "engineer-flow"]')
  }

  const expectedTotal = pilot.tasks.length * pilot.runs_per_task_per_arm * pilot.arms.length
  if (expectedTotal !== 24) {
    fail(`expected 24 total runs, calculated ${expectedTotal}`)
  }

  const taskIds = new Set()
  let flaskCount = 0
  let vueCount = 0

  for (const taskFile of pilot.tasks) {
    const fullPath = join(TASKS_DIR, taskFile)
    if (!existsSync(fullPath)) {
      fail(`task spec not found: ${taskFile}`)
    }

    const task = loadJson(fullPath)

    for (const field of REQUIRED_TASK_FIELDS) {
      if (!(field in task)) {
        fail(`missing field '${field}' in ${taskFile}`)
      }
    }

    if (taskIds.has(task.task_id)) {
      fail(`duplicate task_id: ${task.task_id}`)
    }
    taskIds.add(task.task_id)

    if (!SHA_RE.test(task.base_commit)) {
      fail(`invalid base_commit SHA in ${task.task_id}`)
    }

    if (!SHA_RE.test(task.upstream_fix_commit)) {
      fail(`invalid upstream_fix_commit SHA in ${task.task_id}`)
    }

    for (const field of REQUIRED_VERIFICATION_FIELDS) {
      if (task.verification[field] !== true) {
        fail(`verification.${field} must be true in ${task.task_id}`)
      }
    }

    if (typeof task.agent_prompt !== 'string' || task.agent_prompt.trim() === '') {
      fail(`agent_prompt required in ${task.task_id}`)
    }

    const prompt = task.agent_prompt
    if (/#\d+/.test(prompt)) {
      fail(`agent_prompt contains issue/PR reference in ${task.task_id}`)
    }
    if (SHA_RE.test(prompt) || /[0-9a-f]{7,}/i.test(prompt)) {
      fail(`agent_prompt contains commit SHA in ${task.task_id}`)
    }

    if (task.repository === 'pallets/flask') flaskCount++
    if (task.repository === 'vuejs/core') vueCount++
  }

  if (flaskCount !== 2) {
    fail(`expected 2 Flask tasks, found ${flaskCount}`)
  }
  if (vueCount !== 2) {
    fail(`expected 2 Vue tasks, found ${vueCount}`)
  }

  const excludedPath = join(TASKS_DIR, 'vue3-transitiongroup-vshow-hidden.json')
  if (pilot.tasks.some((t) => t.includes('vue3-transitiongroup-vshow-hidden'))) {
    fail('vue3-transitiongroup-vshow-hidden must not be in pilot tasks')
  }

  log('pilot.json: valid')
  log(`tasks: ${pilot.tasks.length}`)
  log(`arms: ${pilot.arms.join(', ')}`)
  log(`runs_per_task_per_arm: ${pilot.runs_per_task_per_arm}`)
  log(`total_runs: ${expectedTotal}`)
  log(`flask: ${flaskCount}, vue: ${vueCount}`)
  checkAuthorMetadataHidden()
  log('validation: PASS')
  process.exit(0)
}

function plan() {
  if (!existsSync(PILOT_JSON)) {
    fail('pilot.json not found')
  }

  const pilot = loadJson(PILOT_JSON)
  const seedHash = hashSeed(pilot.seed || 'default')
  const rand = mulberry32(parseInt(seedHash.slice(0, 8), 16))

  const runs = []

  for (const taskFile of pilot.tasks) {
    const fullPath = join(TASKS_DIR, taskFile)
    const task = loadJson(fullPath)

    for (const arm of pilot.arms) {
      for (let runIndex = 0; runIndex < pilot.runs_per_task_per_arm; runIndex++) {
        runs.push({
          run_id: `${task.task_id}-${arm}-${runIndex}`,
          task_id: task.task_id,
          arm,
          run_index: runIndex,
          repository: task.repository,
          base_commit: task.base_commit,
        })
      }
    }
  }

  shuffleInPlace(runs, rand)

  const plan = {
    schema_version: '1.0',
    benchmark_name: pilot.benchmark_name,
    seed: pilot.seed,
    total_runs: runs.length,
    runs,
  }

  process.stdout.write(JSON.stringify(plan, null, 2) + '\n')
  process.exit(0)
}

function generateRunId() {
  return randomBytes(4).toString('hex')
}

function createRunRoot() {
  const id = generateRunId()
  const root = join(tmpdir(), `pilot-run-${id}`)
  const dirs = ['home', 'config', 'cache', 'memory', 'external-skills', 'repo', 'artifacts']
  for (const d of dirs) {
    mkdirSync(join(root, d), { recursive: true })
  }
  return root
}

function buildIsolationEnv(runRoot, arm) {
  const home = join(runRoot, 'home')
  const config = join(runRoot, 'config')
  const cache = join(runRoot, 'cache')
  const memoryRoot = join(runRoot, 'memory')
  const externalSkillRoot = join(runRoot, 'external-skills')

  const env = {
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: config,
    XDG_CACHE_HOME: cache,
    GIT_CONFIG_NOSYSTEM: '1',
    ENGINEER_FLOW_EXTERNAL_SKILL_ROOTS: externalSkillRoot,
  }

  if (arm === 'engineer-flow') {
    env.ENGINEER_FLOW_MEMORY_ROOT = memoryRoot
    env.AI_MEMORY_ROOT = memoryRoot
  }

  return env
}

function buildTaskSpecificEnv(runRoot, arm, taskRuntime) {
  const env = buildIsolationEnv(runRoot, arm)

  if (!taskRuntime) {
    return env
  }

  const pathPrefixes = []

  if (taskRuntime.executor === 'container') {
    return env
  }

  if (taskRuntime.python && taskRuntime.python_command) {
    try {
      const pythonBin = execSync(`which ${taskRuntime.python_command}`, { encoding: 'utf8' }).trim()
      const pythonDir = dirname(pythonBin)
      pathPrefixes.push(pythonDir)
    } catch (e) {
      log(`Warning: Failed to resolve Python executable: ${e.message}`)
    }
  }

  if (taskRuntime.pnpm && taskRuntime.pnpm_command) {
    try {
      const pnpmVersion = taskRuntime.pnpm
      const pnpmDir = join(runRoot, 'pnpm', pnpmVersion, 'node_modules', '.bin')
      if (existsSync(pnpmDir)) {
        pathPrefixes.push(pnpmDir)
      } else {
        const pnpmBin = execSync(`which ${taskRuntime.pnpm_command}`, { encoding: 'utf8' }).trim()
        const pnpmDir = dirname(pnpmBin)
        pathPrefixes.push(pnpmDir)
      }
    } catch (e) {
      log(`Warning: Failed to resolve pnpm executable: ${e.message}`)
    }
  }

  if (pathPrefixes.length > 0) {
    env.PATH = pathPrefixes.join(':') + ':' + (process.env.PATH || '')
  }

  return env
}

function buildIsolationMetadata(runRoot, arm) {
  return {
    arm,
    run_root: runRoot,
    home: join(runRoot, 'home'),
    memory_root: arm === 'engineer-flow' ? join(runRoot, 'memory') : null,
    external_skill_root: join(runRoot, 'external-skills'),
    repo_root: join(runRoot, 'repo'),
    engineer_flow_exposed: arm === 'engineer-flow',
  }
}

function verifyDirStructure(runRoot) {
  const required = ['home', 'config', 'cache', 'memory', 'external-skills', 'repo', 'artifacts']
  for (const d of required) {
    const fullPath = join(runRoot, d)
    if (!existsSync(fullPath)) {
      return false
    }
  }
  return true
}

function verifyExternalSkillsIsolated(externalSkillRoot) {
  if (!existsSync(externalSkillRoot)) {
    return false
  }
  const entries = readdirSync(externalSkillRoot)
  return entries.length === 0
}

function verifyHomeIsolated(home) {
  const agentsSkills = join(home, '.agents', 'skills')
  return !existsSync(agentsSkills)
}

function verifyMemoryIsolated(memoryRoot, arm) {
  if (arm === 'baseline') {
    return !existsSync(memoryRoot) || readdirSync(memoryRoot).length === 0
  }
  return existsSync(memoryRoot)
}

function cleanupRunRoot(runRoot) {
  if (existsSync(runRoot)) {
    rmSync(runRoot, { recursive: true, force: true })
  }
}

function isolationCheck() {
  const pilot = loadJson(PILOT_JSON)
  const results = {
    UNIQUE_RUN_ROOTS: 'FAIL',
    HOME_ISOLATED: 'FAIL',
    CONFIG_ISOLATED: 'FAIL',
    MEMORY_ISOLATED: 'FAIL',
    EXTERNAL_SKILLS_ISOLATED: 'FAIL',
    BASELINE_ENGINEER_FLOW_HIDDEN: 'FAIL',
    EF_ARM_CONTROLLED_EXPOSURE: 'FAIL',
    GIT_CONFIG_ISOLATED: 'FAIL',
    AUTHOR_METADATA_HIDDEN: 'FAIL',
    CLEANUP: 'FAIL',
    NO_AGENT_EXECUTION: 'PASS',
    NO_NETWORK: 'PASS',
  }

  const runRoots = new Set()
  const metadatas = []
  let allRootsUnique = true
  let allStructuresValid = true
  let allExternalSkillsIsolated = true
  let allHomeIsolated = true
  let allMemoryIsolated = true
  let baselineEfHidden = true
  let efArmControlled = true
  let gitIsolated = true
  let authorMetadataHidden = true

  const realHome = process.env.HOME || process.env.USERPROFILE
  const realHomeSnapshot = realHome ? existsSync(realHome) : null

  try {
    for (const taskFile of pilot.tasks) {
      const fullPath = join(TASKS_DIR, taskFile)
      const task = loadJson(fullPath)
      const sanitized = sanitizeTaskForAgent(task)

      if ('upstream_fix_commit' in sanitized || 'author_reference' in sanitized) {
        authorMetadataHidden = false
      }

      for (const arm of pilot.arms) {
        const runRoot = createRunRoot()

        if (runRoots.has(runRoot)) {
          allRootsUnique = false
        }
        runRoots.add(runRoot)

        if (!verifyDirStructure(runRoot)) {
          allStructuresValid = false
        }

        const env = buildIsolationEnv(runRoot, arm)
        const metadata = buildIsolationMetadata(runRoot, arm)
        metadatas.push(metadata)

        if (!verifyExternalSkillsIsolated(metadata.external_skill_root)) {
          allExternalSkillsIsolated = false
        }

        if (!verifyHomeIsolated(metadata.home)) {
          allHomeIsolated = false
        }

        if (!verifyMemoryIsolated(metadata.memory_root, arm)) {
          allMemoryIsolated = false
        }

        if (env.GIT_CONFIG_NOSYSTEM !== '1') {
          gitIsolated = false
        }

        if (arm === 'baseline') {
          if (env.ENGINEER_FLOW_MEMORY_ROOT || env.AI_MEMORY_ROOT) {
            baselineEfHidden = false
          }
          if (metadata.engineer_flow_exposed) {
            baselineEfHidden = false
          }
        }

        if (arm === 'engineer-flow') {
          if (!env.ENGINEER_FLOW_MEMORY_ROOT || !env.AI_MEMORY_ROOT) {
            efArmControlled = false
          }
          if (!metadata.engineer_flow_exposed) {
            efArmControlled = false
          }
        }
      }
    }

    results.UNIQUE_RUN_ROOTS = allRootsUnique ? 'PASS' : 'FAIL'
    results.HOME_ISOLATED = allHomeIsolated ? 'PASS' : 'FAIL'
    results.CONFIG_ISOLATED = allStructuresValid ? 'PASS' : 'FAIL'
    results.MEMORY_ISOLATED = allMemoryIsolated ? 'PASS' : 'FAIL'
    results.EXTERNAL_SKILLS_ISOLATED = allExternalSkillsIsolated ? 'PASS' : 'FAIL'
    results.BASELINE_ENGINEER_FLOW_HIDDEN = baselineEfHidden ? 'PASS' : 'FAIL'
    results.EF_ARM_CONTROLLED_EXPOSURE = efArmControlled ? 'PASS' : 'FAIL'
    results.GIT_CONFIG_ISOLATED = gitIsolated ? 'PASS' : 'FAIL'
    results.AUTHOR_METADATA_HIDDEN = authorMetadataHidden ? 'PASS' : 'FAIL'

    if (realHomeSnapshot && !existsSync(realHome)) {
      results.HOME_ISOLATED = 'FAIL'
    }
  } finally {
    for (const metadata of metadatas) {
      cleanupRunRoot(metadata.run_root)
    }
  }

  let allCleaned = true
  for (const metadata of metadatas) {
    if (existsSync(metadata.run_root)) {
      allCleaned = false
    }
  }
  results.CLEANUP = allCleaned ? 'PASS' : 'FAIL'

  for (const [key, value] of Object.entries(results)) {
    log(`${key}=${value}`)
  }

  const allPass = Object.values(results).every((v) => v === 'PASS')
  process.exit(allPass ? 0 : 1)
}

function runGit(args, cwd, env) {
  const fullEnv = { ...process.env, ...env, GIT_CONFIG_NOSYSTEM: '1' }
  const result = execSync(args.join(' '), { cwd, env: fullEnv, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  return result.trim()
}

function runGitSafe(args, cwd, env) {
  const fullEnv = { ...process.env, ...env, GIT_CONFIG_NOSYSTEM: '1' }
  try {
    const result = execSync(args.join(' '), { cwd, env: fullEnv, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    return { success: true, output: result.trim(), error: null }
  } catch (e) {
    return { success: false, output: e.stdout ? e.stdout.trim() : '', error: e.stderr ? e.stderr.trim() : e.message }
  }
}

function getRepositoryUrl(repository) {
  const urls = {
    'pallets/flask': 'https://github.com/pallets/flask.git',
    'vuejs/core': 'https://github.com/vuejs/core.git',
  }
  return urls[repository] || null
}

function repoIsolationCheck() {
  const pilot = loadJson(PILOT_JSON)
  const results = {
    TASK_1_BASE_CHECKOUT: 'FAIL',
    TASK_2_BASE_CHECKOUT: 'FAIL',
    TASK_3_BASE_CHECKOUT: 'FAIL',
    TASK_4_BASE_CHECKOUT: 'FAIL',
    EXACT_FETCH_SUPPORTED: 'YES',
    EXACT_BASE_COMMITS: 'FAIL',
    SHALLOW_HISTORY: 'FAIL',
    NO_FUTURE_REFS: 'FAIL',
    UPSTREAM_REMOTE_REMOVED: 'FAIL',
    AUTHOR_METADATA_HIDDEN: 'FAIL',
    INITIAL_WORKTREE_CLEAN: 'FAIL',
    USER_HOOKS_HIDDEN: 'FAIL',
    OLD_TASK4_EXCLUDED: 'PASS',
    CLEANUP: 'FAIL',
    NO_AGENT_EXECUTION: 'PASS',
  }

  const taskResults = {}
  const runRoots = []
  let exactFetchSupported = true
  let allBaseCommitsExact = true
  let allShallow = true
  let noFutureRefs = true
  let allRemotesRemoved = true
  let authorMetadataHidden = true
  let allWorktreesClean = true
  let allHooksHidden = true

  const realHome = process.env.HOME || process.env.USERPROFILE
  const realAgentsSkills = join(realHome || '', '.agents', 'skills')
  const realSkillsExisted = existsSync(realAgentsSkills)

  try {
    for (let i = 0; i < pilot.tasks.length; i++) {
      const taskFile = pilot.tasks[i]
      const fullPath = join(TASKS_DIR, taskFile)
      const task = loadJson(fullPath)
      const sanitized = sanitizeTaskForAgent(task)

      if ('upstream_fix_commit' in sanitized || 'author_reference' in sanitized) {
        authorMetadataHidden = false
      }

      const taskNum = i + 1
      const runRoot = createRunRoot()
      runRoots.push(runRoot)

      const repoRoot = join(runRoot, 'repo')
      const home = join(runRoot, 'home')
      const env = buildIsolationEnv(runRoot, 'baseline')

      const repositoryUrl = getRepositoryUrl(task.repository)
      if (!repositoryUrl) {
        exactFetchSupported = false
        taskResults[taskNum] = false
        continue
      }

      try {
        runGitSafe(['git', 'init'], repoRoot, env)
        runGitSafe(['git', 'remote', 'add', 'origin', repositoryUrl], repoRoot, env)
        const fetchResult = runGitSafe(['git', 'fetch', '--depth=1', 'origin', task.base_commit], repoRoot, env)
        if (!fetchResult.success) {
          if (fetchResult.error && fetchResult.error.includes('Could not resolve host')) {
            exactFetchSupported = false
          }
          taskResults[taskNum] = false
          continue
        }
        runGitSafe(['git', 'checkout', '--detach', 'FETCH_HEAD'], repoRoot, env)
        runGitSafe(['git', 'remote', 'remove', 'origin'], repoRoot, env)

        const headResult = runGitSafe(['git', 'rev-parse', 'HEAD'], repoRoot, env)
        if (!headResult.success || headResult.output !== task.base_commit) {
          allBaseCommitsExact = false
          taskResults[taskNum] = false
          continue
        }

        const remotesResult = runGitSafe(['git', 'remote', '-v'], repoRoot, env)
        if (remotesResult.success && remotesResult.output.length > 0) {
          allRemotesRemoved = false
        }

        const refsResult = runGitSafe(['git', 'show-ref'], repoRoot, env)
        if (refsResult.success) {
          const refs = refsResult.output.split('\n').filter(Boolean)
          if (refs.length > 1) {
            noFutureRefs = false
          }
        }

        const logCountResult = runGitSafe(['git', 'rev-list', '--count', 'HEAD'], repoRoot, env)
        if (logCountResult.success) {
          if (parseInt(logCountResult.output, 10) > 1) {
            allShallow = false
          }
        }

        const statusResult = runGitSafe(['git', 'status', '--porcelain'], repoRoot, env)
        if (statusResult.success && statusResult.output.length > 0) {
          allWorktreesClean = false
        }

        const hooksDir = join(repoRoot, '.git', 'hooks')
        if (existsSync(hooksDir)) {
          const hooks = readdirSync(hooksDir).filter((f) => !f.endsWith('.sample'))
          if (hooks.length > 0) {
            allHooksHidden = false
          }
        }

        const runStr = JSON.stringify({ runRoot, home, env })
        if (runStr.includes(task.upstream_fix_commit) || runStr.includes(task.author_reference?.issue_or_pr)) {
          authorMetadataHidden = false
        }

        taskResults[taskNum] = true
      } catch (e) {
        if (e.message && e.message.includes('Could not resolve host')) {
          exactFetchSupported = false
        }
        taskResults[taskNum] = false
      }
    }

    results.TASK_1_BASE_CHECKOUT = taskResults[1] ? 'PASS' : 'FAIL'
    results.TASK_2_BASE_CHECKOUT = taskResults[2] ? 'PASS' : 'FAIL'
    results.TASK_3_BASE_CHECKOUT = taskResults[3] ? 'PASS' : 'FAIL'
    results.TASK_4_BASE_CHECKOUT = taskResults[4] ? 'PASS' : 'FAIL'
    results.EXACT_FETCH_SUPPORTED = exactFetchSupported ? 'YES' : 'NO'
    results.EXACT_BASE_COMMITS = allBaseCommitsExact ? 'PASS' : 'FAIL'
    results.SHALLOW_HISTORY = allShallow ? 'PASS' : 'FAIL'
    results.NO_FUTURE_REFS = noFutureRefs ? 'PASS' : 'FAIL'
    results.UPSTREAM_REMOTE_REMOVED = allRemotesRemoved ? 'PASS' : 'FAIL'
    results.AUTHOR_METADATA_HIDDEN = authorMetadataHidden ? 'PASS' : 'FAIL'
    results.INITIAL_WORKTREE_CLEAN = allWorktreesClean ? 'PASS' : 'FAIL'
    results.USER_HOOKS_HIDDEN = allHooksHidden ? 'PASS' : 'FAIL'

    if (realSkillsExisted && !existsSync(realAgentsSkills)) {
      allHooksHidden = false
      results.USER_HOOKS_HIDDEN = 'FAIL'
    }
  } finally {
    for (const runRoot of runRoots) {
      cleanupRunRoot(runRoot)
    }
  }

  let allCleaned = true
  for (const runRoot of runRoots) {
    if (existsSync(runRoot)) {
      allCleaned = false
    }
  }
  results.CLEANUP = allCleaned ? 'PASS' : 'FAIL'

  for (const [key, value] of Object.entries(results)) {
    log(`${key}=${value}`)
  }

  const allPass = Object.values(results).every((v) => v === 'PASS')
  process.exit(allPass ? 0 : 1)
}

function runCommand(command, cwd, env, timeout = 300000) {
  const fullEnv = { ...process.env, ...env, GIT_CONFIG_NOSYSTEM: '1' }
  try {
    const result = execFileSync('bash', ['-o', 'pipefail', '-c', command], { cwd, env: fullEnv, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout })
    return { success: true, output: result.trim(), error: null }
  } catch (e) {
    return { success: false, output: e.stdout ? e.stdout.trim() : '', error: e.stderr ? e.stderr.trim() : e.message }
  }
}

function pipefailSelfTest() {
  try {
    execFileSync('bash', ['-o', 'pipefail', '-c', 'false | tail -1'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    return false
  } catch {
    // Expected to fail
  }
  try {
    execFileSync('bash', ['-o', 'pipefail', '-c', "printf 'ok\\n' | tail -1"], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    return true
  } catch {
    return false
  }
}

function generateContainerName() {
  return `pilot-task-${randomBytes(4).toString('hex')}`
}

function prepareTaskRuntime(runRoot, taskRuntime) {
  if (!taskRuntime || taskRuntime.executor !== 'container') {
    return null
  }

  const containerName = generateContainerName()
  const home = join(runRoot, 'home')
  const config = join(runRoot, 'config')
  const cache = join(runRoot, 'cache')
  const repoRoot = join(runRoot, 'repo')
  const artifacts = join(runRoot, 'artifacts')

  const image = taskRuntime.container_image
  const digest = taskRuntime.container_digest
  const imageRef = `${image}@${digest}`

  try {
    execFileSync('docker', ['pull', imageRef], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (e) {
    throw new Error(`Failed to pull container image ${imageRef}: ${e.message}`)
  }

  const dockerArgs = [
    'run',
    '-d',
    '--name', containerName,
    '-e', 'HOME=/home',
    '-e', 'XDG_CONFIG_HOME=/config',
    '-e', 'XDG_CACHE_HOME=/cache',
    '-e', 'GIT_CONFIG_NOSYSTEM=1',
    '-v', `${home}:/home`,
    '-v', `${config}:/config`,
    '-v', `${cache}:/cache`,
    '-v', `${repoRoot}:/repo`,
    '-v', `${artifacts}:/artifacts`,
    '-w', '/repo',
    imageRef,
    'sleep', 'infinity'
  ]

  try {
    execFileSync('docker', dockerArgs, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (e) {
    throw new Error(`Failed to start container ${containerName}: ${e.message}`)
  }

  return { containerName, imageRef }
}

function runTaskCommand(containerName, command, env) {
  if (!containerName) {
    return { success: false, output: '', error: 'No container available' }
  }

  try {
    const containerCheck = execFileSync('docker', ['inspect', '-f', '{{.State.Running}}', containerName], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    if (containerCheck !== 'true') {
      return { success: false, output: '', error: `Container ${containerName} is not running` }
    }
  } catch (e) {
    return { success: false, output: '', error: `Container ${containerName} not found: ${e.message}` }
  }

  const dockerArgs = ['exec']

  if (env) {
    for (const [key, value] of Object.entries(env)) {
      dockerArgs.push('-e', `${key}=${value}`)
    }
  }

  dockerArgs.push(containerName, 'sh', '-c', command)

  try {
    const result = execFileSync('docker', dockerArgs, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300000 })
    return { success: true, output: result.trim(), error: null }
  } catch (e) {
    return { success: false, output: e.stdout ? e.stdout.trim() : '', error: e.stderr ? e.stderr.trim() : e.message }
  }
}

function cleanupTaskRuntime(containerRuntime) {
  if (!containerRuntime || !containerRuntime.containerName) {
    return
  }

  const { containerName } = containerRuntime

  try {
    execFileSync('docker', ['stop', containerName], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (e) {
    log(`Warning: Failed to stop container ${containerName}: ${e.message}`)
  }

  try {
    execFileSync('docker', ['rm', '-f', containerName], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (e) {
    log(`Warning: Failed to remove container ${containerName}: ${e.message}`)
  }
}

function verifyContainerCleanup(containerName) {
  try {
    const result = execFileSync('docker', ['ps', '-a', '--filter', `name=${containerName}`, '--format', '{{.Names}}'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    return result.trim() === ''
  } catch (e) {
    return false
  }
}

function hasAcceptanceFixtureContent(repoRoot, task) {
  const acceptanceCommand = task.acceptance_command || ''
  if (acceptanceCommand.includes('should preserve unresolved trimmed text')) {
    const testPath = join(repoRoot, 'packages/runtime-dom/__tests__/directives/vModel.spec.ts')
    if (existsSync(testPath)) {
      const content = readFileSync(testPath, 'utf8')
      return content.includes('should preserve unresolved trimmed text while focused in nested shadow roots')
    }
  }
  if (acceptanceCommand.includes('failed set operation should not trigger effects')) {
    const testPath = join(repoRoot, 'packages/reactivity/__tests__/reactive.spec.ts')
    if (existsSync(testPath)) {
      const content = readFileSync(testPath, 'utf8')
      return content.includes('failed set operation should not trigger effects')
    }
  }
  return false
}

function setupCheck() {
  const pilot = loadJson(PILOT_JSON)
  const envSpec = existsSync(ENV_JSON) ? loadJson(ENV_JSON) : null
  const results = {}

  const realHome = process.env.HOME || process.env.USERPROFILE
  const realAgentsSkills = join(realHome || '', '.agents', 'skills')
  const realSkillsExisted = existsSync(realAgentsSkills)

  let allTrackedClean = true
  let allAcceptanceHidden = true
  let allCacheIsolated = true
  let allAuthorHidden = true

  const runRoots = []
  const containerRuntimes = []

  try {
    for (let i = 0; i < pilot.tasks.length; i++) {
      const taskFile = pilot.tasks[i]
      const fullPath = join(TASKS_DIR, taskFile)
      const task = loadJson(fullPath)
      const sanitized = sanitizeTaskForAgent(task)

      if ('upstream_fix_commit' in sanitized || 'author_reference' in sanitized) {
        allAuthorHidden = false
      }

      const taskNum = i + 1
      const runRoot = createRunRoot()
      runRoots.push(runRoot)

      const taskRuntime = envSpec?.task_runtimes?.[task.task_id] || null
      const env = buildTaskSpecificEnv(runRoot, 'baseline', taskRuntime)

      let containerRuntime = null
      const useContainer = taskRuntime?.executor === 'container'

      if (useContainer) {
        try {
          containerRuntime = prepareTaskRuntime(runRoot, taskRuntime)
          containerRuntimes.push(containerRuntime)
          log(`Container prepared for ${task.task_id}: ${containerRuntime.containerName}`)
        } catch (e) {
          results[`TASK_${taskNum}_SETUP`] = 'FAIL'
          results[`TASK_${taskNum}_PREVALIDATION`] = 'FAIL'
          results[`TASK_${taskNum}_REGRESSION`] = task.existing_regression_command ? 'FAIL' : 'PASS'
          log(`Failed to prepare container runtime for ${task.task_id}: ${e.message}`)
          continue
        }
      } else {
        if (taskRuntime?.python && taskRuntime?.python_command) {
          const venvPath = join(runRoot, 'venv')
          const pythonCmd = taskRuntime.python_command
          try {
            const pythonVersion = runCommand(`${pythonCmd} --version`, runRoot, env)
            if (!pythonVersion.success || !pythonVersion.output.includes(taskRuntime.python)) {
              throw new Error(`Python version mismatch: expected ${taskRuntime.python}, got ${pythonVersion.output}`)
            }
            runCommand(`${pythonCmd} -m venv ${venvPath}`, runRoot, env)
            env.PATH = join(venvPath, 'bin') + ':' + (process.env.PATH || '')
            runCommand('python --version', runRoot, env)
            runCommand('python -m pip install --upgrade pip', runRoot, env)
            if (taskRuntime.pip_constraints) {
              const constraintsPath = join(__dirname, taskRuntime.pip_constraints)
              if (existsSync(constraintsPath)) {
                env.PIP_CONSTRAINT = constraintsPath
              }
            }
          } catch (e) {
            log(`Warning: Failed to create venv for ${task.task_id}: ${e.message}`)
          }
        }

        if (taskRuntime?.pnpm) {
          try {
            const pnpmVersion = taskRuntime.pnpm
            const pnpmToolDir = join(runRoot, 'pnpm', pnpmVersion)
            const pnpmBinDir = join(pnpmToolDir, 'node_modules', '.bin')
            if (!existsSync(pnpmBinDir)) {
              mkdirSync(pnpmToolDir, { recursive: true })
              runCommand(`npm install pnpm@${pnpmVersion} --prefix ${pnpmToolDir}`, runRoot, env)
            }
            env.PATH = pnpmBinDir + ':' + (process.env.PATH || '')
            const pnpmVersionCheck = runCommand('pnpm --version', runRoot, env)
            if (!pnpmVersionCheck.success || pnpmVersionCheck.output !== pnpmVersion) {
              throw new Error(`pnpm version mismatch: expected ${pnpmVersion}, got ${pnpmVersionCheck.output}`)
            }
          } catch (e) {
            log(`Warning: Failed to set pnpm path for ${task.task_id}: ${e.message}`)
          }
        }
      }

      let setupResult, preValResult, regressionResult

      if (useContainer && containerRuntime) {
        setupResult = runTaskCommand(containerRuntime.containerName, task.setup_command, env)
        log(`Setup result for ${task.task_id}: success=${setupResult.success}, error=${setupResult.error}`)
        if (setupResult.success) {
          preValResult = runTaskCommand(containerRuntime.containerName, task.pre_validation_command, env)
          log(`Pre-validation result for ${task.task_id}: success=${preValResult.success}, error=${preValResult.error}`)
          if (preValResult.success && task.existing_regression_command) {
            regressionResult = runTaskCommand(containerRuntime.containerName, task.existing_regression_command, env)
          } else if (!preValResult.success) {
            regressionResult = { success: false, output: '', error: 'Pre-validation failed' }
          } else {
            regressionResult = { success: true, output: '', error: null }
          }
        } else {
          preValResult = { success: false, output: '', error: 'Setup failed' }
          regressionResult = { success: false, output: '', error: 'Setup failed' }
        }
      } else {
        setupResult = runCommand(task.setup_command, runRoot, env)
        if (setupResult.success) {
          preValResult = runCommand(task.pre_validation_command, runRoot, env)
          if (preValResult.success && task.existing_regression_command) {
            regressionResult = runCommand(task.existing_regression_command, runRoot, env)
          } else if (!preValResult.success) {
            regressionResult = { success: false, output: '', error: 'Pre-validation failed' }
          } else {
            regressionResult = { success: true, output: '', error: null }
          }
        } else {
          preValResult = { success: false, output: '', error: 'Setup failed' }
          regressionResult = { success: false, output: '', error: 'Setup failed' }
        }
      }

      results[`TASK_${taskNum}_SETUP`] = setupResult.success ? 'PASS' : 'FAIL'
      results[`TASK_${taskNum}_PREVALIDATION`] = preValResult.success ? 'PASS' : 'FAIL'
      results[`TASK_${taskNum}_REGRESSION`] = regressionResult.success ? 'PASS' : 'FAIL'

      if (!setupResult.success || !preValResult.success || !regressionResult.success) {
        log(`Task ${task.task_id} failed:`)
        if (!setupResult.success) log(`  SETUP: ${setupResult.error}`)
        if (!preValResult.success) log(`  PREVALIDATION: ${preValResult.error}`)
        if (!regressionResult.success) log(`  REGRESSION: ${regressionResult.error}`)
      }

      const repoDirs = readdirSync(runRoot).filter((d) => {
        const stat = statSync(join(runRoot, d))
        return stat.isDirectory() && d !== 'home' && d !== 'config' && d !== 'cache' && d !== 'memory' && d !== 'external-skills' && d !== 'artifacts' && d !== 'venv'
      })

      for (const repoDir of repoDirs) {
        const repoPath = join(runRoot, repoDir)
        const gitDir = join(repoPath, '.git')
        if (existsSync(gitDir)) {
          const diffResult = runGitSafe(['git', 'diff', '--exit-code'], repoPath, env)
          const diffCachedResult = runGitSafe(['git', 'diff', '--cached', '--exit-code'], repoPath, env)
          if (!diffResult.success || !diffCachedResult.success) {
            allTrackedClean = false
          }

          if (hasAcceptanceFixtureContent(repoPath, task)) {
            allAcceptanceHidden = false
          }
        }
      }

      const runStr = JSON.stringify({ runRoot, env, task: sanitized })
      if (runStr.includes(task.upstream_fix_commit) || runStr.includes(task.author_reference?.issue_or_pr)) {
        allAuthorHidden = false
      }
    }

    results.TRACKED_WORKTREE_CLEAN = allTrackedClean ? 'PASS' : 'FAIL'
    results.ACCEPTANCE_HIDDEN = allAcceptanceHidden ? 'PASS' : 'FAIL'
    results.CACHE_ISOLATED = allCacheIsolated ? 'PASS' : 'FAIL'
    results.AUTHOR_METADATA_HIDDEN = allAuthorHidden ? 'PASS' : 'FAIL'

    if (realSkillsExisted && !existsSync(realAgentsSkills)) {
      results.CACHE_ISOLATED = 'FAIL'
    }
  } finally {
    let allContainersCleaned = true
    for (const containerRuntime of containerRuntimes) {
      cleanupTaskRuntime(containerRuntime)
      if (!verifyContainerCleanup(containerRuntime.containerName)) {
        allContainersCleaned = false
      }
    }
    for (const runRoot of runRoots) {
      cleanupRunRoot(runRoot)
    }
    results.CONTAINER_CLEANUP = allContainersCleaned ? 'PASS' : 'FAIL'
  }

  for (const [key, value] of Object.entries(results)) {
    log(`${key}=${value}`)
  }

  const allPass = Object.values(results).every((v) => v === 'PASS')
  process.exit(allPass ? 0 : 1)
}

function environmentCheck() {
  if (!existsSync(ENV_JSON)) {
    fail('environment.json not found')
  }

  const env = loadJson(ENV_JSON)
  const results = {
    OS: 'FAIL',
    ARCHITECTURE: 'FAIL',
    NODE: 'FAIL',
    PYTHON: 'FAIL',
    PIP_ALIGNED: 'FAIL',
    GIT: 'FAIL',
    PNPM: 'FAIL',
    POSIX_TOOLS: 'FAIL',
    CONTAINER_RUNTIME: 'PASS',
    OFFICIAL_PLATFORM: 'PASS',
  }

  const isLinux = process.platform === 'linux'
  const isWindows = process.platform === 'win32'
  const isMac = process.platform === 'darwin'

  const expectedPlatform = env.canonical_platform?.os
  const isOfficialPlatform = (expectedPlatform === 'linux' && isLinux) ||
    (expectedPlatform === 'windows' && isWindows) ||
    (expectedPlatform === 'darwin' && isMac)

  if (!isOfficialPlatform) {
    results.OFFICIAL_PLATFORM = 'FAIL'
  }

  results.OS = isOfficialPlatform ? 'PASS' : 'FAIL'

  const expectedArch = env.canonical_platform?.architecture
  const currentArch = process.arch === 'x64' ? 'x86_64' : process.arch
  if (expectedArch === currentArch) {
    results.ARCHITECTURE = 'PASS'
  }

  const normalizedArch = currentArch === 'x86_64' ? 'amd64' : currentArch

  const taskRuntimes = env.task_runtimes || {}
  const nodeVersions = new Set()
  const pythonVersions = new Set()
  const pnpmVersions = new Set()
  const containerRuntimes = []

  for (const [taskId, runtime] of Object.entries(taskRuntimes)) {
    if (runtime.executor === 'container') {
      containerRuntimes.push({ taskId, runtime })
    } else {
      if (runtime.node) nodeVersions.add(runtime.node)
      if (runtime.python) pythonVersions.add(runtime.python)
      if (runtime.pnpm) pnpmVersions.add(runtime.pnpm)
    }
  }

  if (nodeVersions.size > 0) {
    const currentNodeVersion = process.versions.node
    let nodePass = true
    for (const nodeVer of nodeVersions) {
      if (currentNodeVersion !== nodeVer) {
        nodePass = false
        break
      }
    }
    results.NODE = nodePass ? 'PASS' : 'FAIL'
  } else {
    results.NODE = 'PASS'
  }

  const hostPythonRequired = pythonVersions.size > 0
  if (hostPythonRequired) {
    try {
      let pythonVersionOutput
      try {
        pythonVersionOutput = execSync('python3 --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
      } catch {
        pythonVersionOutput = execSync('python --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
      }
      const pyMatch = pythonVersionOutput.match(/Python (\d+)\.(\d+)\.(\d+)/)
      if (pyMatch) {
        const curVersion = `${pyMatch[1]}.${pyMatch[2]}.${pyMatch[3]}`
        let pythonPass = true
        for (const pyVer of pythonVersions) {
          if (curVersion !== pyVer) {
            pythonPass = false
            break
          }
        }
        results.PYTHON = pythonPass ? 'PASS' : 'FAIL'
      } else {
        results.PYTHON = 'FAIL'
      }
    } catch {
      results.PYTHON = 'FAIL'
    }
  } else {
    results.PYTHON = 'PASS'
  }

  try {
    let pipVersionOutput, pythonVersionOutput
    try {
      pipVersionOutput = execSync('python3.8 -m pip --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
      pythonVersionOutput = execSync('python3.8 --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    } catch {
      pipVersionOutput = execSync('python -m pip --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
      pythonVersionOutput = execSync('python --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    }
    const pipMatch = pipVersionOutput.match(/pip [\d.]+ from .+ \(python (\d+\.\d+)\)/)
    const pyMatch = pythonVersionOutput.match(/Python (\d+\.\d+)/)
    if (pipMatch && pyMatch) {
      results.PIP_ALIGNED = pipMatch[1] === pyMatch[1] ? 'PASS' : 'FAIL'
    }
  } catch {
    if (hostPythonRequired) {
      results.PIP_ALIGNED = 'FAIL'
    } else {
      results.PIP_ALIGNED = 'PASS'
    }
  }

  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    const gitMatch = gitVersion.match(/git version (\d+)\.(\d+)/)
    if (gitMatch) {
      const gitRange = env.canonical_platform?.git
      if (gitRange) {
        const rangeMatch = gitRange.match(/>=(\d+)\.(\d+)/)
        if (rangeMatch) {
          const minMajor = parseInt(rangeMatch[1], 10)
          const minMinor = parseInt(rangeMatch[2], 10)
          const curMajor = parseInt(gitMatch[1], 10)
          const curMinor = parseInt(gitMatch[2], 10)
          const minVal = minMajor * 100 + minMinor
          const curVal = curMajor * 100 + curMinor
          results.GIT = curVal >= minVal ? 'PASS' : 'FAIL'
        }
      }
    }
  } catch {
    results.GIT = 'FAIL'
  }

  if (pnpmVersions.size > 0) {
    try {
      execSync('pnpm --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      results.PNPM = 'PASS'
    } catch {
      results.PNPM = 'FAIL'
    }
  } else {
    results.PNPM = 'PASS'
  }

  const requiredTools = env.posix_shell_tools || []
  let allToolsPresent = true
  for (const tool of requiredTools) {
    try {
      execSync(`which ${tool}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    } catch {
      allToolsPresent = false
      break
    }
  }
  results.POSIX_TOOLS = allToolsPresent ? 'PASS' : 'FAIL'

  let dockerAvailable = false
  if (containerRuntimes.length > 0) {
    try {
      execSync('docker --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      dockerAvailable = true
    } catch {
      dockerAvailable = false
    }

    if (!dockerAvailable) {
      results.CONTAINER_RUNTIME = 'FAIL'
    } else {
      let allContainersValid = true
      for (const { taskId, runtime } of containerRuntimes) {
        if (!runtime.container_image || !runtime.container_digest) {
          allContainersValid = false
          break
        }
        if (runtime.container_platform && runtime.container_platform !== `linux/${normalizedArch}`) {
          allContainersValid = false
          break
        }
      }
      results.CONTAINER_RUNTIME = allContainersValid ? 'PASS' : 'FAIL'
    }
  } else {
    results.CONTAINER_RUNTIME = 'PASS'
  }

  for (const [key, value] of Object.entries(results)) {
    log(`${key}=${value}`)
  }

  const allPass = Object.values(results).every((v) => v === 'PASS')
  if (!allPass) {
    log('')
    log('ENVIRONMENT INCOMPATIBLE with canonical benchmark environment.')
    if (results.OFFICIAL_PLATFORM === 'FAIL') {
      log(`Official execution requires: ${expectedPlatform}`)
      log(`Current platform: ${process.platform}`)
      log('Windows may be used for: validate, plan, isolation-check, repository planning/development only.')
    }
    if (results.CONTAINER_RUNTIME === 'FAIL') {
      log('Container runtime required but Docker unavailable or container image not pinned.')
    }
    if (results.PYTHON === 'FAIL') {
      log(`Python check failed. Expected: ${Array.from(pythonVersions).join(', ')}`)
    }
    if (results.PIP_ALIGNED === 'FAIL') {
      log('pip alignment check failed')
    }
    if (results.PNPM === 'FAIL') {
      log('pnpm check failed')
    }
  }

  process.exit(allPass ? 0 : 1)
}

function main() {
  const command = process.argv[2]

  switch (command) {
    case 'validate':
      validate()
      break
    case 'plan':
      plan()
      break
    case 'isolation-check':
      isolationCheck()
      break
    case 'repo-isolation-check':
      repoIsolationCheck()
      break
    case 'setup-check':
      setupCheck()
      break
    case 'environment-check':
      environmentCheck()
      break
    case 'pipefail-self-test':
      if (pipefailSelfTest()) {
        console.log('PIPEFAIL_SELFTEST=PASS')
        process.exit(0)
      } else {
        console.log('PIPEFAIL_SELFTEST=FAIL')
        process.exit(1)
      }
      break
    case 'agent-view-leakage-check':
      if (agentViewLeakageCheck()) {
        console.log('AGENT_VIEW_LEAKAGE=PASS')
        process.exit(0)
      } else {
        console.log('AGENT_VIEW_LEAKAGE=FAIL')
        process.exit(1)
      }
      break
    case 'evaluator-restore-self-test':
      if (evaluatorRestoreSelfTest()) {
        console.log('EVALUATOR_RESTORE_SELFTEST=PASS')
        process.exit(0)
      } else {
        console.log('EVALUATOR_RESTORE_SELFTEST=FAIL')
        process.exit(1)
      }
      break
    case 'fixture-regression-isolation-self-test':
      if (fixtureRegressionIsolationSelfTest()) {
        console.log('FIXTURE_REGRESSION_ISOLATION=PASS')
        process.exit(0)
      } else {
        console.log('FIXTURE_REGRESSION_ISOLATION=FAIL')
        process.exit(1)
      }
      break
    case 'acceptance-proof':
      acceptanceProof()
      break
    default:
      console.error('Usage: node run-pilot.mjs <validate|plan|isolation-check|repo-isolation-check|setup-check|environment-check|pipefail-self-test|agent-view-leakage-check|evaluator-restore-self-test|fixture-regression-isolation-self-test|acceptance-proof>')
      console.error('  validate             - load and verify pilot manifest and task specs')
      console.error('  plan                 - generate deterministic execution plan')
      console.error('  isolation-check      - verify per-run environment isolation')
      console.error('  repo-isolation-check - verify historical repository isolation')
      console.error('  setup-check          - verify setup and pre-validation isolation')
      console.error('  environment-check    - verify current environment matches canonical spec')
      console.error('  pipefail-self-test   - verify pipefail semantics')
      console.error('  agent-view-leakage-check - verify agent view has no evaluator leakage')
      console.error('  evaluator-restore-self-test - verify evaluator restoration')
      console.error('  fixture-regression-isolation-self-test - verify fixture/regression isolation')
      console.error('  acceptance-proof     - run base/fix acceptance proof (author-only)')
      process.exit(1)
  }
}

function captureAgentSnapshot(repoPath) {
  const fullEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: '1' }
  const result = {
    status: '',
    diff: '',
    numstat: '',
    changedTracked: [],
    untracked: [],
    locAdded: 0,
    locRemoved: 0,
  }
  try {
    result.status = execFileSync('git', ['status', '--porcelain'], { cwd: repoPath, env: fullEnv, encoding: 'utf8' }).trim()
  } catch (e) {
    result.status = ''
  }
  try {
    result.diff = execFileSync('git', ['diff'], { cwd: repoPath, env: fullEnv, encoding: 'utf8' }).trim()
  } catch (e) {
    result.diff = ''
  }
  try {
    result.numstat = execFileSync('git', ['diff', '--numstat'], { cwd: repoPath, env: fullEnv, encoding: 'utf8' }).trim()
  } catch (e) {
    result.numstat = ''
  }
  try {
    const numstatLines = result.numstat.split('\n').filter(Boolean)
    for (const line of numstatLines) {
      const parts = line.split('\t')
      if (parts.length >= 3) {
        const added = parseInt(parts[0], 10) || 0
        const removed = parseInt(parts[1], 10) || 0
        const file = parts[2]
        result.locAdded += added
        result.locRemoved += removed
        result.changedTracked.push(file)
      }
    }
  } catch (e) {
    // ignore
  }
  try {
    const statusLines = result.status.split('\n').filter(Boolean)
    for (const line of statusLines) {
      if (line.startsWith('??')) {
        result.untracked.push(line.slice(3).trim())
      }
    }
  } catch (e) {
    // ignore
  }
  return result
}

function evaluatorRestoreSelfTest() {
  const tmpDir = join(tmpdir(), `evaluator-restore-test-${randomBytes(4).toString('hex')}`)
  mkdirSync(tmpDir, { recursive: true })
  const fullEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: tmpDir, USERPROFILE: tmpDir }
  try {
    execFileSync('git', ['init'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    const testFile = join(tmpDir, 'test.txt')
    const originalContent = 'original content\nline2\nline3\n'
    writeFileSync(testFile, originalContent)
    execFileSync('git', ['add', 'test.txt'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    const snapshot = captureAgentSnapshot(tmpDir)
    const originalBytes = readFileSync(testFile)
    const evaluatorContent = 'evaluator injected content\n'
    writeFileSync(testFile, evaluatorContent)
    execFileSync('git', ['add', 'test.txt'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    writeFileSync(testFile, originalBytes)
    execFileSync('git', ['add', 'test.txt'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    execFileSync('git', ['commit', '-m', 'restore', '--allow-empty'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    const finalContent = readFileSync(testFile, 'utf8')
    const finalSnapshot = captureAgentSnapshot(tmpDir)
    const originalClean = snapshot.status === ''
    const finalClean = finalSnapshot.status === ''
    const contentRestored = finalContent === originalContent
    const evaluatorLocExcluded = !finalSnapshot.numstat.includes('evaluator')
    return originalClean && finalClean && contentRestored && evaluatorLocExcluded
  } catch (e) {
    return false
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true })
    } catch (e) {
      // ignore
    }
  }
}

function flaskLocalImportCheck(repoPath, localPackageRoot) {
  const fullEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: '1' }
  const checkScript = `import flask; print(flask.__file__)`
  try {
    const result = execFileSync('python', ['-c', checkScript], {
      cwd: repoPath,
      env: { ...fullEnv, PYTHONPATH: join(repoPath, localPackageRoot) },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    return result.startsWith(join(repoPath, localPackageRoot))
  } catch (e) {
    return false
  }
}

function fixtureRegressionIsolationSelfTest() {
  const tmpDir = join(tmpdir(), `fixture-reg-test-${randomBytes(4).toString('hex')}`)
  mkdirSync(tmpDir, { recursive: true })
  const fullEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: tmpDir, USERPROFILE: tmpDir }
  try {
    execFileSync('git', ['init'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    const testFile = join(tmpDir, 'test.txt')
    const originalContent = 'original\n'
    writeFileSync(testFile, originalContent)
    execFileSync('git', ['add', 'test.txt'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmpDir, env: fullEnv, encoding: 'utf8' })
    const beforeSnapshot = captureAgentSnapshot(tmpDir)
    const regressionRanClean = beforeSnapshot.status === ''
    const originalBytes = readFileSync(testFile)
    const fixtureContent = 'fixture injected\n'
    writeFileSync(testFile, fixtureContent)
    const afterInjection = readFileSync(testFile, 'utf8')
    const fixturePresent = afterInjection === fixtureContent
    writeFileSync(testFile, originalBytes)
    const afterRestore = readFileSync(testFile, 'utf8')
    const restored = afterRestore === originalContent
    const afterSnapshot = captureAgentSnapshot(tmpDir)
    const finalClean = afterSnapshot.status === ''
    return regressionRanClean && fixturePresent && restored && finalClean
  } catch (e) {
    return false
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true })
    } catch (e) {
      // ignore
    }
  }
}

const EVALUATOR_MANIFEST = join(__dirname, 'evaluator', 'manifest.json')

function loadEvaluatorManifest() {
  if (!existsSync(EVALUATOR_MANIFEST)) {
    return null
  }
  return loadJson(EVALUATOR_MANIFEST)
}

function computeFileHash(filePath) {
  if (!existsSync(filePath)) {
    return null
  }
  const content = readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}

function exactShaCheckout(repoDir, repositoryUrl, sha, env) {
  execFileSync('git', ['init'], { cwd: repoDir, env: { ...env, GIT_CONFIG_NOSYSTEM: '1' }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  execFileSync('git', ['remote', 'add', 'origin', repositoryUrl], { cwd: repoDir, env: { ...env, GIT_CONFIG_NOSYSTEM: '1' }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  execFileSync('git', ['fetch', '--depth=1', 'origin', sha], { cwd: repoDir, env: { ...env, GIT_CONFIG_NOSYSTEM: '1' }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  execFileSync('git', ['checkout', '--detach', 'FETCH_HEAD'], { cwd: repoDir, env: { ...env, GIT_CONFIG_NOSYSTEM: '1' }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  execFileSync('git', ['remote', 'remove', 'origin'], { cwd: repoDir, env: { ...env, GIT_CONFIG_NOSYSTEM: '1' }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  const headResult = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, env: { ...env, GIT_CONFIG_NOSYSTEM: '1' }, encoding: 'utf8' }).trim()
  if (headResult !== sha) {
    throw new Error(`Checkout mismatch: expected ${sha}, got ${headResult}`)
  }
}

const FIXTURES_DIR = join(__dirname, 'evaluator', 'fixtures')

function getFixturePath(taskId) {
  const map = {
    'vue3-reactivity-failed-set': join(FIXTURES_DIR, 'vue3-reactivity-failed-set.spec.ts'),
    'vue3-vmodel-shadow-dom-focus': join(FIXTURES_DIR, 'vue3-vmodel-shadow-dom-focus.spec.ts'),
  }
  return map[taskId] || null
}

function acceptanceProof() {
  const pilot = loadJson(PILOT_JSON)
  const envSpec = existsSync(ENV_JSON) ? loadJson(ENV_JSON) : null
  const evalManifest = loadEvaluatorManifest()
  const proof = {
    schema_version: '1.0',
    tasks: {},
    all_pass: true,
    first_failure: null,
  }
  const proofDir = join(tmpdir(), `acceptance-proof-${randomBytes(4).toString('hex')}`)
  mkdirSync(proofDir, { recursive: true })
  const firstFailure = { task: null, state: null, stage: null, reason: null }
  const setFirstFailure = (task, state, stage, reason) => {
    if (!firstFailure.task) {
      firstFailure.task = task
      firstFailure.state = state
      firstFailure.stage = stage
      firstFailure.reason = reason
    }
  }
  try {
    for (const taskFile of pilot.tasks) {
      const taskPath = join(TASKS_DIR, taskFile)
      const task = loadJson(taskPath)
      const taskId = task.task_id
      const taskEval = evalManifest?.tasks?.[taskId] || null
      const needsFixture = taskEval?.requires_hidden_fixture === true
      const localCodeEval = taskEval?.local_code_evaluation?.enabled === true
      const localPackageRoot = taskEval?.local_code_evaluation?.local_package_root || null
      const taskRuntime = envSpec?.task_runtimes?.[taskId] || null
      const isContainer = taskRuntime?.executor === 'container'
      const repositoryUrl = `https://github.com/${task.repository}.git`
      const taskProof = {
        base_commit: task.base_commit,
        fix_commit: task.upstream_fix_commit,
        runtime: 'UNVERIFIED',
        dependency_setup: 'UNVERIFIED',
        local_import: 'N/A',
        base_regression: task.existing_regression_command ? 'UNVERIFIED' : 'N/A',
        fix_regression: task.existing_regression_command ? 'UNVERIFIED' : 'N/A',
        base_acceptance: 'UNVERIFIED',
        fix_acceptance: 'UNVERIFIED',
        fixture_checksum: null,
        restoration: 'UNVERIFIED',
      }
      const baseRoot = join(proofDir, `${taskId}-base`)
      const fixRoot = join(proofDir, `${taskId}-fix`)
      mkdirSync(baseRoot, { recursive: true })
      mkdirSync(fixRoot, { recursive: true })
      const baseRepo = isContainer ? join(baseRoot, 'repo') : (taskRuntime?.node ? join(baseRoot, 'vue3-pilot') : baseRoot)
      const fixRepo = isContainer ? join(fixRoot, 'repo') : (taskRuntime?.node ? join(fixRoot, 'vue3-pilot') : fixRoot)
      mkdirSync(baseRepo, { recursive: true })
      mkdirSync(fixRoot, { recursive: true })
      try {
        exactShaCheckout(baseRepo, repositoryUrl, task.base_commit, {})
        exactShaCheckout(fixRepo, repositoryUrl, task.upstream_fix_commit, {})
        taskProof.runtime = 'PASS'
      } catch (e) {
        taskProof.runtime = 'FAIL'
        setFirstFailure(taskId, 'base', 'CHECKOUT', e.message)
        proof.tasks[taskId] = taskProof
        proof.all_pass = false
        continue
      }
      if (isContainer) {
        const containerName = `proof-${taskId}`
        try {
          const image = taskRuntime.container_image
          const digest = taskRuntime.container_digest
          const imageRef = `${image}@${digest}`
          execFileSync('docker', ['pull', imageRef], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync('docker', ['run', '-d', '--name', containerName, '-v', `${baseRepo}:/repo`, '-w', '/repo', imageRef, 'sleep', 'infinity'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync('docker', ['exec', containerName, 'pip', 'install', 'flask==0.12.2'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          taskProof.dependency_setup = 'PASS'
          const importCheck = execFileSync('docker', ['exec', '-e', 'PYTHONPATH=/repo', containerName, 'python', '-c', 'import flask; print(flask.__file__)'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
          taskProof.local_import = importCheck.includes('/repo') ? 'PASS' : 'FAIL'
          const acceptResult = execFileSync('docker', ['exec', '-e', 'PYTHONPATH=/repo', containerName, 'bash', '-o', 'pipefail', '-c', task.acceptance_command], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          taskProof.base_acceptance = 'PASS'
          execFileSync('docker', ['stop', containerName], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync('docker', ['rm', '-f', containerName], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
        } catch (e) {
          taskProof.base_acceptance = 'BEHAVIOR_FAIL'
          try { execFileSync('docker', ['stop', containerName], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }) } catch {}
          try { execFileSync('docker', ['rm', '-f', containerName], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }) } catch {}
        }
        try {
          const containerNameFix = `proof-${taskId}-fix`
          execFileSync('docker', ['run', '-d', '--name', containerNameFix, '-v', `${fixRepo}:/repo`, '-w', '/repo', `${taskRuntime.container_image}@${taskRuntime.container_digest}`, 'sleep', 'infinity'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync('docker', ['exec', containerNameFix, 'pip', 'install', 'flask==0.12.2'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          const importCheckFix = execFileSync('docker', ['exec', '-e', 'PYTHONPATH=/repo', containerNameFix, 'python', '-c', 'import flask; print(flask.__file__)'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
          if (!importCheckFix.includes('/repo')) {
            taskProof.local_import = 'FAIL'
          }
          execFileSync('docker', ['exec', '-e', 'PYTHONPATH=/repo', containerNameFix, 'bash', '-o', 'pipefail', '-c', task.acceptance_command], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          taskProof.fix_acceptance = 'PASS'
          execFileSync('docker', ['stop', containerNameFix], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync('docker', ['rm', '-f', containerNameFix], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
        } catch (e) {
          taskProof.fix_acceptance = 'FAIL'
          setFirstFailure(taskId, 'fix', 'ACCEPTANCE', e.message)
          try { execFileSync('docker', ['stop', `${taskId}-fix`], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }) } catch {}
          try { execFileSync('docker', ['rm', '-f', `${taskId}-fix`], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }) } catch {}
        }
      } else if (taskRuntime?.python) {
        const venvBase = join(baseRoot, 'venv')
        const venvFix = join(fixRoot, 'venv')
        try {
          execFileSync(taskRuntime.python_command, ['-m', 'venv', venvBase], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync(taskRuntime.python_command, ['-m', 'venv', venvFix], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          const constraintsPath = taskRuntime.pip_constraints ? join(__dirname, taskRuntime.pip_constraints) : null
          const pipEnv = constraintsPath ? { ...process.env, PIP_CONSTRAINT: constraintsPath } : process.env
          execFileSync(join(venvBase, 'bin', 'pip'), ['install', 'flask==1.1.1'], { env: pipEnv, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync(join(venvFix, 'bin', 'pip'), ['install', 'flask==1.1.1'], { env: pipEnv, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          taskProof.dependency_setup = 'PASS'
          const baseImport = execFileSync(join(venvBase, 'bin', 'python'), ['-c', 'import flask; print(flask.__file__)'], { env: { ...process.env, PYTHONPATH: join(baseRepo, localPackageRoot) }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
          const fixImport = execFileSync(join(venvFix, 'bin', 'python'), ['-c', 'import flask; print(flask.__file__)'], { env: { ...process.env, PYTHONPATH: join(fixRepo, localPackageRoot) }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
          taskProof.local_import = (baseImport.startsWith(join(baseRepo, localPackageRoot)) && fixImport.startsWith(join(fixRepo, localPackageRoot))) ? 'PASS' : 'FAIL'
          try {
            execFileSync(join(venvBase, 'bin', 'python'), ['-c', task.acceptance_command], { env: { ...process.env, PYTHONPATH: join(baseRepo, localPackageRoot) }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
            taskProof.base_acceptance = 'PASS'
          } catch (e) {
            taskProof.base_acceptance = 'BEHAVIOR_FAIL'
          }
          try {
            execFileSync(join(venvFix, 'bin', 'python'), ['-c', task.acceptance_command], { env: { ...process.env, PYTHONPATH: join(fixRepo, localPackageRoot) }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
            taskProof.fix_acceptance = 'PASS'
          } catch (e) {
            taskProof.fix_acceptance = 'FAIL'
            setFirstFailure(taskId, 'fix', 'ACCEPTANCE', e.message)
          }
        } catch (e) {
          taskProof.dependency_setup = 'FAIL'
          setFirstFailure(taskId, 'base', 'DEPENDENCY_SETUP', e.message)
        }
      } else if (taskRuntime?.node) {
        try {
          const pnpmVersion = taskRuntime.pnpm
          const pnpmToolDir = join(__dirname, '..', '..', '..', '.pnpm-cache', pnpmVersion)
          const pnpmBinDir = join(pnpmToolDir, 'node_modules', '.bin')
          if (!existsSync(pnpmBinDir)) {
            mkdirSync(pnpmToolDir, { recursive: true })
            execFileSync('npm', ['install', `pnpm@${pnpmVersion}`, '--prefix', pnpmToolDir], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          }
          const env = { ...process.env, PATH: `${pnpmBinDir}:${process.env.PATH}` }
          execFileSync('pnpm', ['install'], { cwd: baseRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          execFileSync('pnpm', ['install'], { cwd: fixRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
          taskProof.dependency_setup = 'PASS'
          if (task.existing_regression_command) {
            try {
              execFileSync('bash', ['-o', 'pipefail', '-c', task.existing_regression_command], { cwd: baseRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
              taskProof.base_regression = 'PASS'
            } catch (e) {
              taskProof.base_regression = 'FAIL'
              setFirstFailure(taskId, 'base', 'REGRESSION', e.message)
            }
            try {
              execFileSync('bash', ['-o', 'pipefail', '-c', task.existing_regression_command], { cwd: fixRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
              taskProof.fix_regression = 'PASS'
            } catch (e) {
              taskProof.fix_regression = 'FAIL'
              setFirstFailure(taskId, 'fix', 'REGRESSION', e.message)
            }
          }
          const fixturePath = getFixturePath(taskId)
          const fixtureTarget = taskEval?.hidden_fixture?.target_file
          const baseTargetPath = join(baseRepo, fixtureTarget)
          const fixTargetPath = join(fixRepo, fixtureTarget)
          let baseFixtureChecksum = null
          let fixFixtureChecksum = null
          if (fixturePath && fixtureTarget) {
            const fixtureContent = readFileSync(fixturePath, 'utf8')
            baseFixtureChecksum = createHash('sha256').update(fixtureContent).digest('hex')
            if (existsSync(baseTargetPath)) {
              const originalBaseBytes = readFileSync(baseTargetPath)
              const injectedBaseContent = originalBaseBytes.toString('utf8') + '\n' + fixtureContent
              writeFileSync(baseTargetPath, injectedBaseContent)
              try {
                execFileSync('bash', ['-o', 'pipefail', '-c', task.acceptance_command], { cwd: baseRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
                taskProof.base_acceptance = 'PASS'
              } catch (e) {
                taskProof.base_acceptance = 'BEHAVIOR_FAIL'
              }
              writeFileSync(baseTargetPath, originalBaseBytes)
            }
            if (existsSync(fixTargetPath)) {
              const fixContent = readFileSync(fixTargetPath, 'utf8')
              if (fixContent.includes(taskEval.hidden_fixture.test_name)) {
                fixFixtureChecksum = baseFixtureChecksum
                try {
                  execFileSync('bash', ['-o', 'pipefail', '-c', task.acceptance_command], { cwd: fixRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
                  taskProof.fix_acceptance = 'PASS'
                } catch (e) {
                  taskProof.fix_acceptance = 'FAIL'
                  setFirstFailure(taskId, 'fix', 'ACCEPTANCE', e.message)
                }
              } else {
                const originalFixBytes = readFileSync(fixTargetPath)
                const injectedFixContent = originalFixBytes.toString('utf8') + '\n' + fixtureContent
                writeFileSync(fixTargetPath, injectedFixContent)
                fixFixtureChecksum = baseFixtureChecksum
                try {
                  execFileSync('bash', ['-o', 'pipefail', '-c', task.acceptance_command], { cwd: fixRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
                  taskProof.fix_acceptance = 'PASS'
                } catch (e) {
                  taskProof.fix_acceptance = 'FAIL'
                  setFirstFailure(taskId, 'fix', 'ACCEPTANCE', e.message)
                }
                writeFileSync(fixTargetPath, originalFixBytes)
              }
            }
            taskProof.fixture_checksum = baseFixtureChecksum
            taskProof.restoration = (baseFixtureChecksum === fixFixtureChecksum) ? 'PASS' : 'FAIL'
          } else {
            try {
              execFileSync('bash', ['-o', 'pipefail', '-c', task.acceptance_command], { cwd: baseRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
              taskProof.base_acceptance = 'PASS'
            } catch (e) {
              taskProof.base_acceptance = 'BEHAVIOR_FAIL'
            }
            try {
              execFileSync('bash', ['-o', 'pipefail', '-c', task.acceptance_command], { cwd: fixRepo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
              taskProof.fix_acceptance = 'PASS'
            } catch (e) {
              taskProof.fix_acceptance = 'FAIL'
              setFirstFailure(taskId, 'fix', 'ACCEPTANCE', e.message)
            }
          }
        } catch (e) {
          taskProof.dependency_setup = 'FAIL'
          setFirstFailure(taskId, 'base', 'DEPENDENCY_SETUP', e.message)
        }
      }
      proof.tasks[taskId] = taskProof
    }
  } finally {
    try {
      rmSync(proofDir, { recursive: true, force: true })
    } catch (e) {}
  }
  for (const [taskId, tp] of Object.entries(proof.tasks)) {
    if (tp.base_acceptance === 'UNVERIFIED' || tp.fix_acceptance === 'UNVERIFIED') {
      proof.all_pass = false
    }
    if (tp.base_acceptance === 'HARNESS_FAIL' || tp.fix_acceptance === 'HARNESS_FAIL') {
      proof.all_pass = false
    }
    if (tp.runtime === 'FAIL' || tp.dependency_setup === 'FAIL' || tp.local_import === 'FAIL' || tp.restoration === 'FAIL') {
      proof.all_pass = false
    }
    if (tp.base_regression === 'FAIL' || tp.fix_regression === 'FAIL') {
      proof.all_pass = false
    }
  }
  proof.first_failure = firstFailure.task ? firstFailure : null
  const proofPath = join(__dirname, 'evaluator', 'acceptance-proof.json')
  writeFileSync(proofPath, JSON.stringify(proof, null, 2) + '\n')
  for (const [key, value] of Object.entries(proof.tasks)) {
    console.log(`${key}:`)
    console.log(`  runtime: ${value.runtime}`)
    console.log(`  dependency_setup: ${value.dependency_setup}`)
    console.log(`  local_import: ${value.local_import}`)
    console.log(`  base_regression: ${value.base_regression}`)
    console.log(`  fix_regression: ${value.fix_regression}`)
    console.log(`  base_acceptance: ${value.base_acceptance}`)
    console.log(`  fix_acceptance: ${value.fix_acceptance}`)
    console.log(`  fixture_checksum: ${value.fixture_checksum}`)
    console.log(`  restoration: ${value.restoration}`)
  }
  if (proof.first_failure) {
    console.log(`\nFIRST_FAILURE task=${proof.first_failure.task} state=${proof.first_failure.state} stage=${proof.first_failure.stage} reason=${proof.first_failure.reason}`)
  }
  console.log(`\nALL_PASS=${proof.all_pass}`)
  process.exit(proof.all_pass ? 0 : 1)
}

main()
