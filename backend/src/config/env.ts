// ADD THIS: centralized environment parsing and validation
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

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

const envSchema = z.object({
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
  LOCAL_AUTH_COOKIE_SAME_SITE: z.enum(['strict', 'lax']).default('strict'),
  LOCAL_AUTH_COOKIE_MAX_AGE_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  ALLOW_DEV_AUTH_BYPASS: booleanFromEnv(false),
  DATABASE_SSL: booleanFromEnv(true),
  DATABASE_SSL_REJECT_UNAUTHORIZED: booleanFromEnv(false),
  DEV_USER_ID: z.string().uuid().default('00000000-0000-0000-0000-000000000001'),
  DEV_USER_EMAIL: z.string().email().default('local@financetracker.local'),
  DEV_USER_NAME: z.string().min(1).default('Local User'),
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

  // ADD THIS: prevent accidental production database usage during local development
  if (value.NODE_ENV === 'development') {
    const normalizedDatabaseUrl = value.DATABASE_URL.toLowerCase()
    const looksLikeProductionHost =
      normalizedDatabaseUrl.includes('supabase.co') ||
      normalizedDatabaseUrl.includes('render.com') ||
      normalizedDatabaseUrl.includes('railway.app')

    if (looksLikeProductionHost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'DATABASE_URL looks like a remote host while NODE_ENV=development. Use local/staging credentials to avoid production writes.',
        path: ['DATABASE_URL'],
      })
    }
  }
})

export const env = envSchema.parse(process.env)
