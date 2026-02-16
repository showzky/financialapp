// ADD THIS: database abstraction built on parameterized pg queries
import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from './env.js'
import { logger } from './logger.js'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
})

pool.on('error', (error: Error) => {
  logger.error({ error }, 'Unexpected PostgreSQL pool error')
})

export const db = {
  query: <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    return pool.query<T>(text, params)
  },
}
