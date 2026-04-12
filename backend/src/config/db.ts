// ADD THIS: database abstraction built on parameterized pg queries
import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from './env.js'
import { logger } from './logger.js'

const TRANSIENT_DB_ERROR_CODES = new Set(['EAI_AGAIN', 'ENOTFOUND'])
const TRANSIENT_DB_RETRY_DELAY_MS = 250

const getConnectionString = (): string => {
  if (!env.DATABASE_SSL) {
    return env.DATABASE_URL
  }

  const connectionUrl = new URL(env.DATABASE_URL)

  // Let the explicit ssl object control certificate verification.
  ;['sslmode', 'ssl', 'sslrootcert', 'sslcert', 'sslkey', 'sslpassword'].forEach((key) => {
    connectionUrl.searchParams.delete(key)
  })

  return connectionUrl.toString()
}

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: env.DATABASE_SSL
    ? {
        rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
      }
    : false,
})

pool.on('error', (error: Error) => {
  logger.error({ error }, 'Unexpected PostgreSQL pool error')
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isTransientConnectionError = (error: unknown): error is Error & { code?: string } => {
  return (
    error instanceof Error &&
    typeof (error as Error & { code?: string }).code === 'string' &&
    TRANSIENT_DB_ERROR_CODES.has((error as Error & { code?: string }).code as string)
  )
}

const queryWithRetry = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params)
  } catch (error) {
    if (!isTransientConnectionError(error)) {
      throw error
    }

    logger.warn({ error }, 'Retrying PostgreSQL query after transient DNS failure')
    await delay(TRANSIENT_DB_RETRY_DELAY_MS)
    return pool.query<T>(text, params)
  }
}

const connectWithRetry = async () => {
  try {
    return await pool.connect()
  } catch (error) {
    if (!isTransientConnectionError(error)) {
      throw error
    }

    logger.warn({ error }, 'Retrying PostgreSQL connection after transient DNS failure')
    await delay(TRANSIENT_DB_RETRY_DELAY_MS)
    return pool.connect()
  }
}

export const db = {
  query: <T extends QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> => {
    return queryWithRetry<T>(text, params)
  },

  transaction: async <T>(
    work: (query: <R extends QueryResultRow>(text: string, params?: unknown[]) => Promise<QueryResult<R>>) => Promise<T>,
  ): Promise<T> => {
    const client = await connectWithRetry()

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
