import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendMigrationPath = resolve(
  fileURLToPath(new URL('../../migrations/20260412224500_add_borrowed_loan_icon_url.sql', import.meta.url)),
)
const supabaseMigrationPath = resolve(
  fileURLToPath(new URL('../../../supabase/migrations/20260412224500_add_borrowed_loan_icon_url.sql', import.meta.url)),
)

const backendMigrationSql = readFileSync(backendMigrationPath, 'utf-8')
const supabaseMigrationSql = readFileSync(supabaseMigrationPath, 'utf-8')

test('borrowed-loan icon migration adds icon_url in backend and Supabase SQL', () => {
  assert.match(backendMigrationSql, /ALTER TABLE borrowed_loans\s+ADD COLUMN IF NOT EXISTS icon_url TEXT;/i)
  assert.match(supabaseMigrationSql, /ALTER TABLE borrowed_loans\s+ADD COLUMN IF NOT EXISTS icon_url TEXT;/i)
})