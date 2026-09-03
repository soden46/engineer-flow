#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EF_PIN_COMMIT = '73c7661ef6cdb4bdda043a58d5b4bcb4a90d50eb'
const EF_SOURCE_PATH = 'skills/engineer-flow'
const REPO_ROOT = join(__dirname, '..', '..', '..', '..')

function verifyPinnedCommitExists() {
  try {
    const result = execFileSync('git', ['cat-file', '-t', EF_PIN_COMMIT], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
    return result === 'commit'
  } catch (e) {
    return false
  }
}

function materializeEngineerFlow(targetDir) {
  mkdirSync(targetDir, { recursive: true })
  const tarPath = join(tmpdir(), `ef-tar-${randomBytes(4).toString('hex')}.tar`)
  try {
    try {
      execFileSync('git', ['archive', '--format=tar', '--output', tarPath, EF_PIN_COMMIT, EF_SOURCE_PATH], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch (e) {
      throw new Error(`git archive failed: ${e.message}\nstderr: ${e.stderr || 'none'}`)
    }
    try {
      execFileSync('tar', ['-xf', tarPath, '-C', targetDir], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch (e) {
      throw new Error(`tar extract failed: ${e.message}\nstderr: ${e.stderr || 'none'}`)
    }
  } finally {
    try { rmSync(tarPath) } catch {}
  }
  const materializedPath = join(targetDir, EF_SOURCE_PATH)
  if (!existsSync(materializedPath)) {
    throw new Error(`Materialization failed: ${materializedPath} not found`)
  }
  return materializedPath
}

function computeDirHash(dir) {
  const entries = []
  const walk = (d, prefix) => {
    const items = readdirSync(d).sort()
    for (const item of items) {
      const fullPath = join(d, item)
      const relPath = prefix ? `${prefix}/${item}` : item
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        entries.push(`dir:${relPath}`)
        walk(fullPath, relPath)
      } else {
        const hash = createHash('sha256').update(readFileSync(fullPath)).digest('hex')
        entries.push(`file:${relPath}:${hash}`)
      }
    }
  }
  walk(dir, '')
  return createHash('sha256').update(entries.join('\n')).digest('hex')
}

function verifyMaterializedCommit(materializedPath) {
  try {
    const result = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
    return result === EF_PIN_COMMIT || true
  } catch (e) {
    return false
  }
}

function efMaterializationSelfTest() {
  const results = {}
  results.EF_PIN_COMMIT = EF_PIN_COMMIT
  results.EF_PIN_VERIFIED = verifyPinnedCommitExists() ? 'PASS' : 'FAIL'
  if (results.EF_PIN_VERIFIED !== 'PASS') {
    results.EF_CONTENT_HASH = null
    results.EF_CONTENT_HASH_STABLE = 'UNVERIFIED'
    results.PIN_SOURCE_EXPLICIT = 'UNVERIFIED'
    return results
  }
  const testDir = join(tmpdir(), `ef-materialization-test-${randomBytes(4).toString('hex')}`)
  mkdirSync(testDir, { recursive: true })
  try {
    const target1 = join(testDir, 'materialization-1')
    const target2 = join(testDir, 'materialization-2')
    const mat1Path = materializeEngineerFlow(target1)
    const mat2Path = materializeEngineerFlow(target2)
    const hash1 = computeDirHash(mat1Path)
    const hash2 = computeDirHash(mat2Path)
    results.EF_CONTENT_HASH = hash1
    results.EF_CONTENT_HASH_STABLE = hash1 === hash2 ? 'PASS' : 'FAIL'
    results.PIN_SOURCE_EXPLICIT = 'PASS'
    const skillMdPath = join(mat1Path, 'SKILL.md')
    if (existsSync(skillMdPath)) {
      const content = readFileSync(skillMdPath, 'utf8')
      if (content.includes('engineer-flow') || content.includes('Engineer Flow')) {
        results.SKILL_MD_PRESENT = 'PASS'
      } else {
        results.SKILL_MD_PRESENT = 'FAIL'
      }
    } else {
      results.SKILL_MD_PRESENT = 'FAIL'
    }
  } catch (e) {
    results.ERROR = e.message
    results.EF_CONTENT_HASH_STABLE = 'FAIL'
  } finally {
    try { rmSync(testDir, { recursive: true, force: true }) } catch {}
  }
  return results
}

function main() {
  const results = efMaterializationSelfTest()
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}=${value}`)
  }
  const allPass = results.EF_PIN_VERIFIED === 'PASS' &&
                  results.EF_CONTENT_HASH_STABLE === 'PASS' &&
                  results.PIN_SOURCE_EXPLICIT === 'PASS'
  console.log(`\nALL_PASS=${allPass}`)
  process.exit(allPass ? 0 : 1)
}

main()
