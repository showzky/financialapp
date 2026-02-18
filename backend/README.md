# Backend

Secure Node.js + Express + TypeScript backend for the Financial App.

## Quick start

1. Copy `.env.example` to `.env`
2. Set your Supabase values in `backend/.env`
3. Link and apply DB migrations (`supabase link`, `supabase db push`)
4. Install deps: `pnpm install`
5. Start dev server: `pnpm dev`

## Migration workflow (Supabase CLI)

- Link once:
	- `supabase link --project-ref emsbfqqpbvksuwxeekzu`
- Create migration file:
	- `supabase migration new <migration_name>`
- Apply pending migrations:
	- `supabase db push`

Baseline migration is in [supabase/migrations/20260217113000_initial_schema.sql](../supabase/migrations/20260217113000_initial_schema.sql).

## Required environment values (`backend/.env`)

- `DATABASE_URL`: PostgreSQL connection string from Supabase Database settings
- `SUPABASE_URL`: project URL (for JWT/JWKS verification)
- `SUPABASE_JWT_AUDIENCE`: usually `authenticated`
- `SUPABASE_JWT_ISSUER`: usually `${SUPABASE_URL}/auth/v1`
- `CORS_ORIGIN`: your frontend origin (for local dev: `http://localhost:5173`)
- `AUTH_PROVIDER`: `local` or `supabase` (default: `local`)
- `LOCAL_AUTH_EMAIL`: your login email (required when `AUTH_PROVIDER=local`)
- `LOCAL_AUTH_PASSWORD_HASH`: generated password hash (required when `AUTH_PROVIDER=local`)
- `LOCAL_AUTH_JWT_SECRET`: long random secret for token signing (required when `AUTH_PROVIDER=local`)
- `APP_USERNAME`: bootstrap login username/email for first credential setup (optional)
- `APP_PASSWORD_HASH`: bcrypt hash matching `APP_USERNAME` (optional)
- `LOCAL_AUTH_COOKIE_SAME_SITE`: `strict` or `lax`
- `LOCAL_AUTH_COOKIE_MAX_AGE_DAYS`: persistent login lifetime in days (default `30`)
- `ALLOW_DEV_AUTH_BYPASS`: keep `false` unless explicitly needed in local testing

## Generate secure local credentials

Run this once:

- `pnpm auth:generate`

It prints these values for `backend/.env`:

- `APP_PASSWORD_HASH`
- `LOCAL_AUTH_JWT_SECRET`
- `GENERATED_PASSWORD` (store this safely)

## Frontend-to-backend connection

- Create `NewApp/.env.local` with:
	- `VITE_BACKEND_URL=http://localhost:4000/api/v1`
- Local auth uses secure `httpOnly` cookie sessions (no frontend token storage).

## Security defaults

- `helmet` headers
- `hpp` protection
- global rate limiting
- strict body size limits
- input validation with `zod`
- parameterized SQL with `pg`
- Supabase JWT verification using remote JWKS (`jose`)
- structured logs with sensitive-field redaction

## API base

- `GET /health`
- `POST /api/v1/auth/login`
- `POST /api/v1/users/me`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `DELETE /api/v1/users/me`
- `POST /api/v1/categories`
- `GET /api/v1/categories`
- `GET /api/v1/categories/:id`
- `PATCH /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`
- `POST /api/v1/transactions`
- `GET /api/v1/transactions`
- `GET /api/v1/transactions/:id`
- `PATCH /api/v1/transactions/:id`
- `DELETE /api/v1/transactions/:id`

## Login flow (`AUTH_PROVIDER=local`)

1. `POST /api/v1/auth/login` with `email` + `password`
2. Backend verifies password via `bcrypt` against `auth_credentials.password_hash`
3. Backend sets secure session cookie (`httpOnly`, `Secure`, `SameSite`, `maxAge`)
4. Frontend calls protected `/api/v1/*` routes with `credentials: include`
5. `POST /api/v1/auth/logout` clears session cookie
