import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const migrationPath = resolve(
  fileURLToPath(new URL('../../migrations/20260227162000_add_subscriptions.sql', import.meta.url)),
)
const migrationSql = readFileSync(migrationPath, 'utf-8')

test('subscriptions migration defines expected table and constraints', () => {
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS subscriptions/i)
  assert.match(migrationSql, /id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/i)
  assert.match(migrationSql, /user_id UUID NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/i)
  assert.match(migrationSql, /status TEXT NOT NULL DEFAULT 'active' CHECK \(status IN \('active', 'paused', 'canceled'\)\)/i)
  assert.match(migrationSql, /cadence TEXT NOT NULL DEFAULT 'monthly' CHECK \(cadence IN \('monthly', 'yearly'\)\)/i)
  assert.match(migrationSql, /price_cents INTEGER NOT NULL CHECK \(price_cents > 0\)/i)
  assert.match(migrationSql, /next_renewal_date DATE NOT NULL/i)
})

test('subscriptions migration defines required indexes', () => {
  assert.match(migrationSql, /CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions\(user_id\)/i)
  assert.match(
    migrationSql,
    /CREATE INDEX IF NOT EXISTS idx_subscriptions_user_next_renewal ON subscriptions\(user_id, next_renewal_date\)/i,
  )
})
