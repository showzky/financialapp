import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import type { QueryResult, QueryResultRow } from 'pg'
import { db } from '../config/db.js'
import { pushNotificationTokenModel } from './pushNotificationTokenModel.js'

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

test('pushNotificationTokenModel.upsert writes token, platform, and user scope', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([
      {
        id: 'token-1',
        userId: 'user-1',
        token: 'ExponentPushToken[abc]',
        platform: 'android',
        createdAt: '2026-03-07T00:00:00.000Z',
        updatedAt: '2026-03-07T00:00:00.000Z',
      } as unknown as T,
    ])
  }) as typeof db.query

  await pushNotificationTokenModel.upsert({
    userId: 'user-1',
    token: 'ExponentPushToken[abc]',
    platform: 'android',
  })

  assert.match(capturedSql, /INSERT INTO push_notification_tokens/i)
  assert.match(capturedSql, /ON CONFLICT \(token\)/i)
  assert.match(capturedSql, /updated_at = NOW\(\)/i)
  assert.deepEqual(capturedParams, ['user-1', 'ExponentPushToken[abc]', 'android'])
})

test('pushNotificationTokenModel.removeByUserAndToken deletes only the signed-in user token', async () => {
  let capturedSql = ''
  let capturedParams: unknown[] = []

  db.query = (async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    capturedSql = text
    capturedParams = params
    return createQueryResult([] as T[], 1)
  }) as typeof db.query

  const removed = await pushNotificationTokenModel.removeByUserAndToken('user-1', 'ExponentPushToken[abc]')

  assert.match(capturedSql, /DELETE FROM push_notification_tokens/i)
  assert.match(capturedSql, /WHERE user_id = \$1 AND token = \$2/i)
  assert.deepEqual(capturedParams, ['user-1', 'ExponentPushToken[abc]'])
  assert.equal(removed, true)
})