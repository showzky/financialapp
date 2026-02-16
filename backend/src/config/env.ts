// ADD THIS: centralized environment parsing and validation
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().url().or(z.literal('*')).default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().min(1, 'SUPABASE_URL is required'),
  SUPABASE_JWT_AUDIENCE: z.string().min(1).default('authenticated'),
  SUPABASE_JWT_ISSUER: z.string().url().optional(),
})

export const env = envSchema.parse(process.env)
