// ADD THIS: database abstraction built on parameterized pg queries
import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from './env.js'
import { logger } from './logger.js'

if (env.NODE_ENV !== 'production' && env.DATABASE_SSL && !env.DATABASE_SSL_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL
    ? {
        rejectUnauthorized:
          env.NODE_ENV === 'production' ? true : env.DATABASE_SSL_REJECT_UNAUTHORIZED,
      }
    : false,
})

pool.on('error', (error: Error) => {
  logger.error({ error }, 'Unexpected PostgreSQL pool error')
})

export const db = {
  query: <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
    return pool.query<T>(text, params)
  },
}
