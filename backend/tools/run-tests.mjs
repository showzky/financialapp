import { readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const srcRoot = join(projectRoot, 'src')

const collectTestFiles = (directoryPath) => {
  const entries = readdirSync(directoryPath)
  const files = []

  for (const entry of entries) {
    const fullPath = join(directoryPath, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      files.push(...collectTestFiles(fullPath))
      continue
    }

    if (entry.endsWith('.test.ts')) {
      files.push(relative(projectRoot, fullPath).replace(/\\/g, '/'))
    }
  }

  return files
}

const testFiles = collectTestFiles(srcRoot)

if (testFiles.length === 0) {
  console.log('No backend test files found under src/**/*.test.ts')
  process.exit(0)
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...testFiles], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env,
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
