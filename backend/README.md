# Backend

Secure Node.js + Express + TypeScript backend for the Financial App.

## Quick start

1. Copy `.env.example` to `.env`
2. Set your Supabase values in `backend/.env`
3. Apply schema from `schema.sql`
4. Install deps: `pnpm install`
5. Start dev server: `pnpm dev`

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
- `DEV_BYPASS_AUTH`: set `true` only when `NODE_ENV=development` and you intentionally want auth bypass for local testing
- `ALLOW_DEV_AUTH_BYPASS`: legacy fallback toggle (prefer `DEV_BYPASS_AUTH`)

## Generate secure local credentials

Run this once:

- `pnpm auth:generate`

It prints these values for `backend/.env`:

- `LOCAL_AUTH_PASSWORD_HASH`
- `LOCAL_AUTH_JWT_SECRET`
- `GENERATED_PASSWORD` (store this safely)

## Frontend-to-backend connection

- Create `NewApp/.env.local` with:
	- `VITE_BACKEND_URL=http://localhost:4000/api/v1`
- Frontend expects a Supabase user access token in local storage key:
	- `finance-access-token`

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
2. Read `accessToken` from response
3. Send `Authorization: Bearer <accessToken>` on all `/api/v1/*` protected routes

## Development auth bypass (safe guardrails)

- Bypass only activates when both `NODE_ENV=development` and `DEV_BYPASS_AUTH=true`.
- In production, missing bearer tokens are always rejected.
