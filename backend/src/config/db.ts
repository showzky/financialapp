// ADD THIS: database abstraction built on parameterized pg queries
import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from './env.js'
import { logger } from './logger.js'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL
    ? {
        rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
      }
    : false,
})

pool.on('error', (error: Error) => {
  logger.error({ error }, 'Unexpected PostgreSQL pool error')
})

export const db = {
  query: <T extends QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> => {
    return pool.query<T>(text, params)
  },

  transaction: async <T>(
    work: (query: <R extends QueryResultRow>(text: string, params?: unknown[]) => Promise<QueryResult<R>>) => Promise<T>,
  ): Promise<T> => {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')
      const result = await work((text, params = []) => client.query(text, params))
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
}
