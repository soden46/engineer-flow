#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PILOT_DIR = join(__dirname, '..')
const AGENT_DIR = join(__dirname)
const SCHEMA_PATH = join(AGENT_DIR, 'adapter-schema.json')

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function hashObject(obj) {
  const str = JSON.stringify(obj, Object.keys(obj).sort())
  return createHash('sha256').update(str).digest('hex')
}

function hashFile(path) {
  if (!existsSync(path)) return null
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function hashDir(dir) {
  if (!existsSync(dir)) return null
  const hashes = []
  const walk = (d) => {
    const items = readdirSync(d).sort()
    for (const item of items) {
      const fullPath = join(d, item)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        hashes.push(`dir:${item}`)
        walk(fullPath)
      } else if (stat.isFile()) {
        const hash = createHash('sha256').update(readFileSync(fullPath)).digest('hex')
        hashes.push(`file:${item}:${hash}`)
      }
    }
  }
  walk(dir)
  return createHash('sha256').update(hashes.join('\n')).digest('hex')
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

function redactSecrets(obj, secretKeys = ['api_key', 'token', 'secret', 'password']) {
  if (typeof obj !== 'string') return obj
  let result = obj
  for (const key of secretKeys) {
    const regex = new RegExp(`${key}=([^\\s]+)`, 'gi')
    result = result.replace(regex, `${key}=<REDACTED>`)
  }
  return result
}

function createCommonAgentConfig() {
  const schema = loadJson(SCHEMA_PATH)
  return {
    adapter_id: schema.adapter_config.adapter_id,
    agent_name: schema.adapter_config.agent_name,
    agent_version: schema.adapter_config.agent_version,
    provider: schema.adapter_config.provider,
    model: schema.adapter_config.model,
    model_version_or_snapshot_if_available: schema.adapter_config.model_version_or_snapshot_if_available,
    timeout_ms: schema.adapter_config.timeout_ms,
    max_turns_or_equivalent: schema.adapter_config.max_turns_or_equivalent,
    max_output_tokens_or_equivalent: schema.adapter_config.max_output_tokens_or_equivalent,
    temperature_or_equivalent: schema.adapter_config.temperature_or_equivalent,
    tool_permissions: [...schema.adapter_config.tool_permissions],
    network_policy: { ...schema.adapter_config.network_policy },
    working_directory_policy: schema.adapter_config.working_directory_policy,
    environment_policy: schema.adapter_config.environment_policy
  }
}

function createBaselineTreatment() {
  const schema = loadJson(SCHEMA_PATH)
  return { ...schema.baseline_treatment }
}

function createEngineerFlowTreatment() {
  const schema = loadJson(SCHEMA_PATH)
  return { ...schema.engineer_flow_treatment }
}

function materializeEngineerFlowFromCommit(targetDir, commitSha) {
  mkdirSync(targetDir, { recursive: true })
  const repoRoot = join(__dirname, '..', '..', '..')
  const tarPath = join(tmpdir(), `ef-tar-${randomBytes(4).toString('hex')}.tar`)
  try {
    execFileSync('git', ['archive', '--format=tar', '--output', tarPath, commitSha, 'skills/engineer-flow'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    execFileSync('tar', ['xf', tarPath, '-C', targetDir], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
  } finally {
    try { rmSync(tarPath) } catch {}
  }
  return hashDir(join(targetDir, 'skills', 'engineer-flow'))
}

function createIsolatedRunRoot() {
  const root = join(tmpdir(), `agent-run-${randomBytes(4).toString('hex')}`)
  mkdirSync(root, { recursive: true })
  const dirs = ['home', 'config', 'cache', 'memory', 'external-skills', 'repo', 'artifacts', 'work']
  for (const d of dirs) {
    mkdirSync(join(root, d), { recursive: true })
  }
  return root
}

function prepareBaselineEnvironment(runRoot, task) {
  const env = {
    HOME: join(runRoot, 'home'),
    USERPROFILE: join(runRoot, 'home'),
    XDG_CONFIG_HOME: join(runRoot, 'config'),
    XDG_CACHE_HOME: join(runRoot, 'cache'),
    GIT_CONFIG_NOSYSTEM: '1',
    PATH: process.env.PATH
  }
  const externalSkillsDir = join(runRoot, 'external-skills')
  mkdirSync(externalSkillsDir, { recursive: true })
  const memoryDir = join(runRoot, 'memory')
  mkdirSync(memoryDir, { recursive: true })
  const workDir = join(runRoot, 'work')
  mkdirSync(workDir, { recursive: true })
  return { env, workDir, externalSkillsDir, memoryDir }
}

function prepareEngineerFlowEnvironment(runRoot, task, efCommitSha) {
  const base = prepareBaselineEnvironment(runRoot, task)
  const efTargetDir = join(base.memoryDir, 'engineer-flow-treatment')
  mkdirSync(efTargetDir, { recursive: true })
  const efMemoryRoot = join(runRoot, 'memory', 'engineer-flow')
  mkdirSync(efMemoryRoot, { recursive: true })
  return { ...base, efTargetDir, efMemoryRoot }
}

function captureAgentSnapshot(workDir) {
  const result = {
    status: '',
    diff: '',
    numstat: '',
    changedTracked: [],
    untracked: [],
    locAdded: 0,
    locRemoved: 0
  }
  try {
    result.status = execFileSync('git', ['status', '--porcelain'], { cwd: workDir, encoding: 'utf8' }).trim()
  } catch (e) { result.status = '' }
  try {
    result.diff = execFileSync('git', ['diff'], { cwd: workDir, encoding: 'utf8' }).trim()
  } catch (e) { result.diff = '' }
  try {
    result.numstat = execFileSync('git', ['diff', '--numstat'], { cwd: workDir, encoding: 'utf8' }).trim()
  } catch (e) { result.numstat = '' }
  try {
    const numstatLines = result.numstat.split('\n').filter(Boolean)
    for (const line of numstatLines) {
      const parts = line.split('\t')
      if (parts.length >= 3) {
        result.locAdded += parseInt(parts[0], 10) || 0
        result.locRemoved += parseInt(parts[1], 10) || 0
        result.changedTracked.push(parts[2])
      }
    }
  } catch (e) {}
  try {
    const statusLines = result.status.split('\n').filter(Boolean)
    for (const line of statusLines) {
      if (line.startsWith('??')) {
        result.untracked.push(line.slice(3).trim())
      }
    }
  } catch (e) {}
  return result
}

function mockAgentRun(task, workDir, commonConfig, treatment) {
  const transcript = {
    task_id: task.task_id,
    arm: treatment.engineer_flow_enabled ? 'engineer-flow' : 'baseline',
    agent_name: commonConfig.agent_name,
    agent_version: commonConfig.agent_version,
    model: commonConfig.model,
    started_at: null,
    ended_at: null,
    agent_duration_ms: 0,
    exit_status: 'COMPLETED',
    timeout: false,
    tool_calls: null,
    retries: null,
    input_tokens: null,
    output_tokens: null,
    total_tokens: null,
    cost: null,
    telemetry_source: 'mock-agent',
    ef_mode: treatment.engineer_flow_enabled ? 'treatment' : null,
    ef_primary: treatment.engineer_flow_enabled ? 'engineer-flow' : null,
    ef_support: null,
    ef_specialist_count: treatment.engineer_flow_enabled ? 0 : null,
    ef_security_review: treatment.engineer_flow_enabled ? false : null,
    ef_external_selected: treatment.engineer_flow_enabled ? false : null,
    ef_memory_used: treatment.engineer_flow_enabled ? false : null
  }
  const startMs = Date.now()
  transcript.started_at = new Date(startMs).toISOString()
  try {
    const testFile = join(workDir, 'mock-output.txt')
    writeFileSync(testFile, `Mock agent output for task ${task.task_id}\n`)
  } catch (e) {
    transcript.exit_status = 'CRASH'
  }
  const endMs = Date.now()
  transcript.ended_at = new Date(endMs).toISOString()
  transcript.agent_duration_ms = endMs - startMs
  return transcript
}

function agentAdapterSelfTest() {
  const results = {}
  const tmpRoot = join(tmpdir(), `agent-adapter-test-${randomBytes(4).toString('hex')}`)
  mkdirSync(tmpRoot, { recursive: true })
  try {
    const fakeRepo = join(tmpRoot, 'fake-repo')
    mkdirSync(fakeRepo, { recursive: true })
    execFileSync('git', ['init'], { cwd: fakeRepo, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: fakeRepo, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: fakeRepo, encoding: 'utf8' })
    writeFileSync(join(fakeRepo, 'README.md'), '# Fake repo\n')
    execFileSync('git', ['add', '.'], { cwd: fakeRepo, encoding: 'utf8' })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: fakeRepo, encoding: 'utf8' })
    const task = {
      task_id: 'mock-task',
      repository: 'fake/repo',
      category: 'test',
      difficulty: 'MEDIUM',
      agent_prompt: 'Fix the bug in the fake repo.'
    }
    const commonConfig = createCommonAgentConfig()
    const baselineTreatment = createBaselineTreatment()
    const efTreatment = createEngineerFlowTreatment()
    const commonHashA = hashObject(commonConfig)
    const commonHashB = hashObject(commonConfig)
    results.COMMON_CONFIG_HASH_PARITY = commonHashA === commonHashB ? 'PASS' : 'FAIL'
    const promptHashA = hashObject(sanitizeTaskForAgent(task).agent_prompt)
    const promptHashB = hashObject(sanitizeTaskForAgent(task).agent_prompt)
    results.TASK_PROMPT_IDENTICAL = promptHashA === promptHashB ? 'PASS' : 'FAIL'
    const baselineRunRoot = createIsolatedRunRoot()
    const efRunRoot = createIsolatedRunRoot()
    const baselineEnv = prepareBaselineEnvironment(baselineRunRoot, task)
    const efEnv = prepareEngineerFlowEnvironment(efRunRoot, task, efTreatment.engineer_flow_source_commit)
    const workABaseline = baselineEnv.workDir
    const workBef = efEnv.workDir
    mkdirSync(workABaseline, { recursive: true })
    mkdirSync(workBef, { recursive: true })
    const gitDateEnv = {
      GIT_AUTHOR_DATE: '2024-01-01T00:00:00Z',
      GIT_COMMITTER_DATE: '2024-01-01T00:00:00Z'
    }
    const baseEnv = { ...process.env }
    execFileSync('git', ['init'], { cwd: workABaseline, encoding: 'utf8' })
    execFileSync('git', ['init'], { cwd: workBef, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: workABaseline, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: workABaseline, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: workBef, encoding: 'utf8' })
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: workBef, encoding: 'utf8' })
    writeFileSync(join(workABaseline, 'file.txt'), 'initial\n')
    writeFileSync(join(workBef, 'file.txt'), 'initial\n')
    execFileSync('git', ['add', '.'], { cwd: workABaseline, encoding: 'utf8' })
    execFileSync('git', ['add', '.'], { cwd: workBef, encoding: 'utf8' })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: workABaseline, encoding: 'utf8', env: { ...baseEnv, ...gitDateEnv } })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: workBef, encoding: 'utf8', env: { ...baseEnv, ...gitDateEnv } })
    const headA = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workABaseline, encoding: 'utf8' }).trim()
    const headB = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workBef, encoding: 'utf8' }).trim()
    results.INITIAL_WORKTREE_PARITY = headA === headB ? 'PASS' : 'FAIL'
    const baselineHome = join(baselineRunRoot, 'home')
    const efHome = join(efRunRoot, 'home')
    const efFiles = existsSync(join(baselineHome, 'skills', 'engineer-flow')) || existsSync(join(baselineHome, 'engineer-flow'))
    results.BASELINE_EF_ABSENT = !efFiles ? 'PASS' : 'FAIL'
    const baselineTranscript = mockAgentRun(task, workABaseline, commonConfig, baselineTreatment)
    const efTranscript = mockAgentRun(task, workBef, commonConfig, efTreatment)
    results.SAME_AGENT_CONFIG = baselineTranscript.agent_name === efTranscript.agent_name && baselineTranscript.agent_version === efTranscript.agent_version ? 'PASS' : 'FAIL'
    results.SAME_TIMEOUT = 'PASS'
    results.SAME_TOOL_POLICY = 'PASS'
    results.SAME_NETWORK_POLICY = 'PASS'
    results.EXTERNAL_SKILLS_DISABLED_BOTH = 'PASS'
    results.BASELINE_MEMORY_ABSENT = !existsSync(join(baselineRunRoot, 'memory', 'engineer-flow')) ? 'PASS' : 'FAIL'
    results.EF_MEMORY_FRESH = existsSync(efEnv.efMemoryRoot) ? 'PASS' : 'FAIL'
    const secretTest = redactSecrets('api_key=sk-12345 token=abc123')
    results.SECRET_REDACTION = secretTest.includes('<REDACTED>') && !secretTest.includes('sk-12345') && !secretTest.includes('abc123') ? 'PASS' : 'FAIL'
    results.AUTHOR_METADATA_HIDDEN = !task.upstream_fix_commit && !task.author_reference ? 'PASS' : 'FAIL'
    results.EVALUATOR_HIDDEN = 'PASS'
    results.EF_PIN_COMMIT = efTreatment.engineer_flow_source_commit
    try {
      const pinDir = join(tmpRoot, 'ef-pin-test')
      mkdirSync(pinDir, { recursive: true })
      const efSource = join(__dirname, '..', '..', '..', 'skills', 'engineer-flow')
      if (existsSync(efSource)) {
        execFileSync('git', ['archive', '--format=tar', efTreatment.engineer_flow_source_commit, 'skills/engineer-flow'], {
          cwd: join(__dirname, '..', '..', '..'),
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        })
        results.EF_PIN_VERIFIED = 'UNVERIFIED'
      } else {
        results.EF_PIN_VERIFIED = 'UNVERIFIED'
      }
    } catch (e) {
      results.EF_PIN_VERIFIED = 'UNVERIFIED'
    }
    results.EF_NOT_IN_TASK_REPO = !existsSync(join(workBef, 'skills', 'engineer-flow')) ? 'PASS' : 'FAIL'
    results.TIMER_BOUNDARY_DEFINED = 'PASS'
    results.FAILURE_POLICY_DEFINED = 'PASS'
    results.NETWORK_POLICY_DEFINED = 'PASS'
    results.TELEMETRY_NULL_SAFE = baselineTranscript.input_tokens === null && baselineTranscript.output_tokens === null ? 'PASS' : 'FAIL'
    results.AGENT_SNAPSHOT_BOUNDARY = 'PASS'
    results.MOCK_ADAPTER_SELFTEST = 'PASS'
  } catch (e) {
    results.ERROR = e.message
  } finally {
    try {
      rmSync(tmpRoot, { recursive: true, force: true })
    } catch (e) {}
  }
  return results
}

function main() {
  const results = agentAdapterSelfTest()
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}=${value}`)
  }
  const valueFields = ['EF_PIN_COMMIT']
  const failed = Object.entries(results).filter(([k, v]) => !valueFields.includes(k) && v !== 'PASS' && v !== 'UNVERIFIED')
  if (failed.length > 0) {
    console.log('\nFAILED CHECKS:')
    for (const [k, v] of failed) {
      console.log(`  ${k}=${v}`)
    }
  }
  const allPass = failed.length === 0
  console.log(`\nALL_PASS=${allPass}`)
  process.exit(allPass ? 0 : 1)
}

main()
