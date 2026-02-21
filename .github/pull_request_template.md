## Summary

- <!-- ADD THIS: short description of what changed -->

## Type of change

- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] docs
- [ ] chore

## Scope

- [ ] Frontend
- [ ] Backend
- [ ] Database migration
- [ ] DevOps/CI

## Migration

- [ ] No migration
- [ ] Migration added: `supabase/migrations/<file>.sql`
- [ ] Migration tested on development/staging database
- [ ] Forward-only migration (no edits to previously applied migration files)

## Local validation

- [ ] `pnpm build` passed
- [ ] `pnpm --dir backend typecheck` passed
- [ ] `GET /health` passed locally
- [ ] Wishlist smoke flow verified (list/create/edit/delete)

## Staging gate (required before merge to main)

- [ ] CI checks green
- [ ] Staging smoke test passed (auth + wishlist + metadata refresh + trends)
- [ ] No unresolved merge conflicts
- [ ] Environment values verified (development/staging vs production)

## Risk and rollback

- **Risk level:** Low / Medium / High
- **Potential impact:** <!-- ADD THIS -->
- **Rollback plan:** <!-- ADD THIS -->

## Changelog

- [ ] Updated `CHANGELOG.md` in `Unreleased` (or release section)

## Post-merge checklist (main)

- [ ] Production migration applied (if required)
- [ ] Production smoke test completed
- [ ] Logs monitored for 10-15 minutes
