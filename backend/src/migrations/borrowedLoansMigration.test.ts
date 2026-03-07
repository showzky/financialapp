import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendMigrationPath = resolve(
  fileURLToPath(new URL('../../migrations/20260307150000_add_borrowed_loans.sql', import.meta.url)),
)
const supabaseMigrationPath = resolve(
  fileURLToPath(new URL('../../../supabase/migrations/20260307150000_add_borrowed_loans.sql', import.meta.url)),
)
const schemaSnapshotPath = resolve(fileURLToPath(new URL('../../schema.sql', import.meta.url)))
const backendMigrationSql = readFileSync(backendMigrationPath, 'utf-8')
const supabaseMigrationSql = readFileSync(supabaseMigrationPath, 'utf-8')
const schemaSnapshotSql = readFileSync(schemaSnapshotPath, 'utf-8')

test('borrowed loans migration defines expected table and constraints', () => {
  assert.match(backendMigrationSql, /CREATE TABLE IF NOT EXISTS borrowed_loans/i)
  assert.match(backendMigrationSql, /id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/i)
  assert.match(backendMigrationSql, /user_id UUID NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/i)
  assert.match(backendMigrationSql, /lender TEXT NOT NULL/i)
  assert.match(backendMigrationSql, /original_amount NUMERIC\(12, 2\) NOT NULL CHECK \(original_amount > 0\)/i)
  assert.match(backendMigrationSql, /current_balance NUMERIC\(12, 2\) NOT NULL CHECK \(current_balance >= 0\)/i)
  assert.match(backendMigrationSql, /CHECK \(current_balance <= original_amount\)/i)
  assert.match(backendMigrationSql, /payoff_date DATE NOT NULL/i)
})

test('borrowed loans migration defines required indexes', () => {
  assert.match(backendMigrationSql, /CREATE INDEX IF NOT EXISTS idx_borrowed_loans_user_id ON borrowed_loans\(user_id\)/i)
  assert.match(
    backendMigrationSql,
    /CREATE INDEX IF NOT EXISTS idx_borrowed_loans_user_paid_off_payoff ON borrowed_loans\(user_id, paid_off_at, payoff_date\)/i,
  )
})

test('supabase borrowed-loans migration mirrors the backend table and adds RLS policies', () => {
  assert.match(supabaseMigrationSql, /CREATE TABLE IF NOT EXISTS borrowed_loans/i)
  assert.match(supabaseMigrationSql, /CHECK \(current_balance <= original_amount\)/i)
  assert.match(supabaseMigrationSql, /CREATE INDEX IF NOT EXISTS idx_borrowed_loans_user_paid_off_payoff ON borrowed_loans\(user_id, paid_off_at, payoff_date\)/i)
  assert.match(supabaseMigrationSql, /ALTER TABLE borrowed_loans ENABLE ROW LEVEL SECURITY/i)
  assert.match(supabaseMigrationSql, /CREATE POLICY borrowed_loans_select_own/i)
  assert.match(supabaseMigrationSql, /CREATE POLICY borrowed_loans_insert_own/i)
  assert.match(supabaseMigrationSql, /CREATE POLICY borrowed_loans_update_own/i)
  assert.match(supabaseMigrationSql, /CREATE POLICY borrowed_loans_delete_own/i)
})

test('schema snapshot includes the borrowed loans table and index names', () => {
  assert.match(schemaSnapshotSql, /CREATE TABLE IF NOT EXISTS borrowed_loans/i)
  assert.match(schemaSnapshotSql, /CHECK \(current_balance <= original_amount\)/i)
  assert.match(schemaSnapshotSql, /CREATE INDEX IF NOT EXISTS idx_borrowed_loans_user_paid_off_payoff ON borrowed_loans\(user_id, paid_off_at, payoff_date\)/i)
})