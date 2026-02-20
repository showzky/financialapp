# Backend SQL Migrations

Use this folder as the **single source of truth** for database schema changes.

## Naming

Create migration files with UTC timestamps:

- `YYYYMMDDHHMMSS_description.sql`
- Example: `20260220101500_add_wishlist_indexes.sql`

## Workflow

1. Write migration SQL in a new file in this folder.
2. Apply it to local development database first.
3. Apply it to staging database.
4. Run smoke tests (auth + wishlist CRUD + metadata refresh + trends).
5. Apply to production database only after staging validation.

## Rules

- Prefer additive and idempotent SQL (`IF NOT EXISTS`) when practical.
- Never edit old migration files after they are applied to shared environments.
- Add a new migration for every schema/data change.
- Keep `backend/schema.sql` as the latest schema snapshot reference.
