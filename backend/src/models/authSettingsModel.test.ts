import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import type { QueryResult, QueryResultRow } from 'pg'
import { db } from '../config/db.js'
import { authSettingsModel } from './authSettingsModel.js'

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

test('authSettingsModel.get defaults to true when row is missing', async () => {
  db.query = (async <T extends QueryResultRow>(): Promise<QueryResult<T>> => {
    return createQueryResult([] as T[], 0)
  }) as typeof db.query

  const settings = await authSettingsModel.get()
  assert.equal(settings.publicRegistrationEnabled, true)
})

test('authSettingsModel.update persists and returns the latest flag', async () => {
  let queryCallCount = 0

  db.query = (async <T extends QueryResultRow>(text: string): Promise<QueryResult<T>> => {
    queryCallCount += 1

    if (text.includes('INSERT INTO app_settings')) {
      return createQueryResult([] as T[], 1)
    }

    return createQueryResult([{ value: false } as unknown as T], 1)
  }) as typeof db.query

  const settings = await authSettingsModel.update({ publicRegistrationEnabled: false })

  assert.equal(settings.publicRegistrationEnabled, false)
  assert.equal(queryCallCount, 2)
})
