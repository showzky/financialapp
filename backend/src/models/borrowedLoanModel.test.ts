import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import type { QueryResult, QueryResultRow } from 'pg'
import { db } from '../config/db.js'
import { borrowedLoanModel } from './borrowedLoanModel.js'

const originalQuery = db.query

const createQueryResult = <T extends QueryResultRow>(rows: T[], rowCount = rows.length): QueryResult<T> =>
  ({
    command: 'SELECT',
    oid: 0,
    fields: [],
    rows,
    rowCount,
  }) as QueryResult<T>

afterEach(() => {
  db.query = originalQuery
})

test('borrowedLoanModel.listByUser queries borrowed loans ordered by unpaid payoff date first', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([] as T[], 0)
  }) as typeof db.query

  await borrowedLoanModel.listByUser('user-1')

  assert.match(capturedSql, /FROM borrowed_loans/i)
  assert.match(capturedSql, /ORDER BY/i)
  assert.match(capturedSql, /CASE WHEN paid_off_at IS NULL THEN 0 ELSE 1 END/i)
  assert.match(capturedSql, /payoff_date ASC/i)
  assert.deepEqual(capturedParams, ['user-1'])
})

test('borrowedLoanModel.create writes nullable notes and borrowed-loan fields', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([
      {
        id: 'borrowed-1',
        userId: 'user-1',
        lender: 'Storebrand',
        originalAmount: 100000,
        currentBalance: 95000,
        payoffDate: '2030-01-01',
        notes: null,
        paidOffAt: null,
        status: 'active',
        daysRemaining: 1,
        createdAt: '2026-03-07T00:00:00.000Z',
        updatedAt: '2026-03-07T00:00:00.000Z',
      } as unknown as T,
    ])
  }) as typeof db.query

  await borrowedLoanModel.create({
    userId: 'user-1',
    lender: 'Storebrand',
    originalAmount: 100000,
    currentBalance: 95000,
    payoffDate: '2030-01-01',
    notes: null,
  })

  assert.match(capturedSql, /INSERT INTO borrowed_loans/i)
  assert.match(capturedSql, /paid_off_at/i)
  assert.match(capturedSql, /\$3::numeric\(12, 2\)/i)
  assert.match(capturedSql, /\$4::numeric\(12, 2\) <= 0::numeric/i)
  assert.deepEqual(capturedParams, ['user-1', 'Storebrand', 100000, 95000, '2030-01-01', null])
})

test('borrowedLoanModel.getById scopes the lookup to the signed-in user', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([] as T[], 0)
  }) as typeof db.query

  await borrowedLoanModel.getById('loan-1', 'user-1')

  assert.match(capturedSql, /WHERE id = \$1 AND user_id = \$2/i)
  assert.deepEqual(capturedParams, ['loan-1', 'user-1'])
})

test('borrowedLoanModel.update preserves patch semantics for nullable notes and numeric fields', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([] as T[], 0)
  }) as typeof db.query

  await borrowedLoanModel.update('loan-1', 'user-1', {
    originalAmount: 100000,
    currentBalance: 50000,
    notes: null,
  })

  assert.match(capturedSql, /UPDATE borrowed_loans/i)
  assert.match(capturedSql, /original_amount = CASE WHEN \$4 THEN \$5::numeric\(12, 2\) ELSE original_amount END/i)
  assert.match(capturedSql, /current_balance = CASE WHEN \$6 THEN \$7::numeric\(12, 2\) ELSE current_balance END/i)
  assert.match(capturedSql, /WHEN \$6 AND \$7::numeric\(12, 2\) <= 0::numeric THEN COALESCE\(paid_off_at, NOW\(\)\)/i)
  assert.match(capturedSql, /paid_off_at = CASE/i)
  assert.match(capturedSql, /payoff_date = COALESCE\(\$8::date, payoff_date\)/i)
  assert.match(capturedSql, /notes = CASE WHEN \$9 THEN \$10 ELSE notes END/i)
  assert.deepEqual(capturedParams, ['loan-1', 'user-1', null, true, 100000, true, 50000, null, true, null])
})

test('borrowedLoanModel.markPaidOff zeros current balance and stamps paid_off_at', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([] as T[], 0)
  }) as typeof db.query

  await borrowedLoanModel.markPaidOff('loan-1', 'user-1')

  assert.match(capturedSql, /UPDATE borrowed_loans/i)
  assert.match(capturedSql, /current_balance = 0/i)
  assert.match(capturedSql, /paid_off_at = COALESCE\(paid_off_at, NOW\(\)\)/i)
  assert.deepEqual(capturedParams, ['loan-1', 'user-1'])
})

test('borrowedLoanModel.remove deletes only paid-off rows for the signed-in user', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([] as T[], 1)
  }) as typeof db.query

  const removed = await borrowedLoanModel.remove('loan-1', 'user-1')

  assert.match(capturedSql, /DELETE FROM borrowed_loans/i)
  assert.match(capturedSql, /AND paid_off_at IS NOT NULL/i)
  assert.deepEqual(capturedParams, ['loan-1', 'user-1'])
  assert.equal(removed, true)
})

test('borrowedLoanModel.getSummary aggregates active and paid-off borrowed balances', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([
      {
        totalCurrentBalance: 95000,
        activeCount: 1,
        overdueCount: 0,
        dueSoonCount: 0,
        paidOffCount: 0,
      } as unknown as T,
    ])
  }) as typeof db.query

  const result = await borrowedLoanModel.getSummary('user-1')

  assert.match(capturedSql, /SUM\(CASE WHEN paid_off_at IS NULL THEN current_balance ELSE 0 END\)/i)
  assert.match(capturedSql, /AS "paidOffCount"/i)
  assert.deepEqual(capturedParams, ['user-1'])
  assert.equal(result.totalCurrentBalance, 95000)
})