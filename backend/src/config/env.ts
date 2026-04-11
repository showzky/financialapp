// ADD THIS: centralized environment parsing and validation
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

// Read NODE_ENV from the shell BEFORE dotenv runs (set by cross-env in scripts).
// Validated against the allowlist so it can never be used as a path traversal vector.
const VALID_NODE_ENVS = ['development', 'test', 'staging', 'production'] as const
type NodeEnv = (typeof VALID_NODE_ENVS)[number]
const rawEnv = (process.env.NODE_ENV ?? '').trim() as NodeEnv
const preNodeEnv: NodeEnv = VALID_NODE_ENVS.includes(rawEnv) ? rawEnv : 'development'

// Cascade: each file overrides the previous. Later entries win.
// .env            — base / staging defaults  (committed or secret-free template)
// .env.<NODE_ENV> — environment-specific defaults  (safe to commit if secret-free)
// .env.local      — per-machine personal overrides  (gitignored, never committed)
// .env.<NODE_ENV>.local — per-machine env-specific overrides  (gitignored)
const cascadeFiles = [
  '.env',
  `.env.${preNodeEnv}`,
  '.env.local',
  `.env.${preNodeEnv}.local`,
]

const backendRoot = path.resolve(
  new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  '../../../',
)

for (const file of cascadeFiles) {
  const filePath = path.join(backendRoot, file)
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true })
  }
}

const booleanFromEnv = (fallback: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .transform((value) => {
      if (typeof value === 'boolean') return value

      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true
      if (['false', '0', 'no', 'off'].includes(normalized)) return false
      return fallback
    })
    .default(fallback)

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    CORS_ORIGIN: z.string().url().or(z.literal('*')).default('http://localhost:5173'),
    AUTH_PROVIDER: z.enum(['supabase', 'local']).default('local'),
    SUPABASE_URL: z.string().url().min(1, 'SUPABASE_URL is required'),
    SUPABASE_JWT_AUDIENCE: z.string().min(1).default('authenticated'),
    SUPABASE_JWT_ISSUER: z.string().url().optional(),
    APP_USERNAME: z.string().email().optional(),
    APP_PASSWORD_HASH: z.string().min(1).optional(),
    LOCAL_AUTH_EMAIL: z.string().email().optional(),
    LOCAL_AUTH_PASSWORD_HASH: z.string().min(1).optional(),
    LOCAL_AUTH_USER_ID: z.string().uuid().default('00000000-0000-0000-0000-000000000001'),
    LOCAL_AUTH_USER_NAME: z.string().min(1).default('Local User'),
    LOCAL_AUTH_JWT_SECRET: z.string().min(32).optional(),
    LOCAL_AUTH_JWT_EXPIRES_IN: z.string().min(2).default('8h'),
    LOCAL_AUTH_COOKIE_NAME: z.string().min(3).default('finance_session'),
    LOCAL_AUTH_REFRESH_COOKIE_NAME: z.string().min(3).default('finance_refresh'),
    LOCAL_AUTH_COOKIE_SAME_SITE: z.enum(['strict', 'lax']).default('strict'),
    LOCAL_AUTH_COOKIE_MAX_AGE_DAYS: z.coerce.number().int().min(1).max(365).default(90),
    ALLOW_DEV_AUTH_BYPASS: booleanFromEnv(false),
    DATABASE_SSL: booleanFromEnv(true),
    DATABASE_SSL_REJECT_UNAUTHORIZED: booleanFromEnv(false),
    DEV_USER_ID: z.string().uuid().default('00000000-0000-0000-0000-000000000001'),
    DEV_USER_EMAIL: z.string().email().default('local@financetracker.local'),
    DEV_USER_NAME: z.string().min(1).default('Local User'),
    BROWSERLESS_TOKEN: z.string().min(1).optional(),
    BROWSERLESS_BASE_URL: z.string().url().default('https://production-sfo.browserless.io'),
    BROWSERLESS_MODE: z.enum(['content', 'unblock', 'auto']).default('auto'),
    BROWSERLESS_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(20000),
    GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(60 * 60 * 1000).optional(),
    GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().min(10).max(100000).optional(),
    // Set to true in .env.development when you intentionally use a remote DB in dev
    // (e.g. no local Postgres installed). Never set in staging/production.
    ALLOW_REMOTE_DB_IN_DEV: booleanFromEnv(false),
  })
  .superRefine((value, ctx) => {
    // ADD THIS: strict conditional auth configuration validation
    if (value.AUTH_PROVIDER === 'local') {
      if (!value.LOCAL_AUTH_JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'LOCAL_AUTH_JWT_SECRET is required when AUTH_PROVIDER=local',
          path: ['LOCAL_AUTH_JWT_SECRET'],
        })
      }

      const hasBootstrapUsername = Boolean(value.APP_USERNAME)
      const hasBootstrapHash = Boolean(value.APP_PASSWORD_HASH)

      if (hasBootstrapUsername !== hasBootstrapHash) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'APP_USERNAME and APP_PASSWORD_HASH must be set together',
          path: ['APP_USERNAME'],
        })
      }
    }

    // Prevent accidental production database usage during local development.
    // Guard fires on the shell-level NODE_ENV (preNodeEnv) OR the parsed value so
    // a .env file cannot silently flip NODE_ENV to bypass the check.
    // Set ALLOW_REMOTE_DB_IN_DEV=true in .env.development to opt-in when no local Postgres.
    if ((value.NODE_ENV === 'development' || preNodeEnv === 'development') && !value.ALLOW_REMOTE_DB_IN_DEV) {
      try {
        const dbHost = new URL(value.DATABASE_URL).hostname.toLowerCase()
        const safeLocalHosts = ['localhost', '127.0.0.1', '::1', 'host.docker.internal']
        if (!safeLocalHosts.includes(dbHost)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              `DATABASE_URL points at a remote host (${dbHost}) while NODE_ENV=development. Use a localhost URL to avoid writing to a remote database.`,
            path: ['DATABASE_URL'],
          })
        }
      } catch {
        // DATABASE_URL failed URL parsing — the min(1) check above already caught the empty case;
        // an unparseable value will also fail the z.string().min(1) schema, so no extra issue needed.
      }
    }
  })

export const env = envSchema.parse(process.env)
