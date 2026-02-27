# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning principles.

## [Unreleased]

### Added

- **High-Tech Glassmorphic UI** refactor for the Loans section:
  - Implementation of Glass HUD aesthetic using `.glass-panel` with backdrop-filter blur and semi-transparent borders.
  - New semantic CSS variables for status indicators: `--color-success`, `--color-warning`, and `--color-error` (mapped to Tailwind).
  - Accessibility improvements (WCAG 2.1 AA) ensuring high-contrast text on glass backgrounds and status badges.
- Documentation updates for the Loan Tracking Area on the dashboard, including a new `docs/loan-tracking.md` guide and expanded README/backend README notes.
- Subscription Ledger now uses locale-aware formatting with `Intl.NumberFormat` and `Intl.DateTimeFormat`, with centralized locale/currency defaults and currency fallback to `NOK`.

### Changed

- Refactored `Loans.tsx` and `LoanTable.tsx` to transition from pure Neumorphism to a hybrid HUD-style glassmorphic interface.
- Loans page scrollbar now uses a green “success” theme instead of pink; added `--color-success` CSS variable and updated utility class to `scrollbar-success`.
- Subscriptions empty-state UX now distinguishes between no backend data and filtered-empty results, with accessible live-region status messaging.
## [1.2.1] - 2026-02-21

### Added

- Added backend migration scaffolding in `backend/migrations` with a runbook for local → staging → production SQL rollout.
- Added server-backed Loan Area feature with dashboard summary, dedicated loans page, and CRUD endpoints for loans given to others.
- Added due-state logic (`outstanding`, `due_soon`, `overdue`, `repaid`) and server-computed days remaining for consistent highlighting across clients.
- Added frontend loan modules: `src/services/loanApi.ts`, `src/types/loan.ts`, `src/components/LoanAreaCard.tsx`, `src/components/LoanTable.tsx`, `src/components/AddLoanModal.tsx`, and `src/pages/Loans.tsx`.
- Added loan status utility tests in `src/tests/loanStatus.test.ts`.

### Changed

- Enforced explicit frontend backend API configuration in development by requiring `VITE_BACKEND_URL` (no silent production fallback).
- Expanded backend environment validation to support `staging` mode and block remote-looking database URLs in local development.
- Updated CI to typecheck backend code in addition to frontend lint/test/build checks.
- Committed changes to `main` and pushed to remote; see commit `9f12113`.

### Fixed

## [1.2.0] - 2026-02-20

### Added

- End-to-end "Wishlist Item Notes" feature: added a nullable `notes` TEXT column to `wishlist_items`, backend normalization and sanitization utility, server-side validation and mapping, and frontend UI (add/edit modal textarea) with client-side character counter (2000 chars max).
- Card-level notes preview with inline expand/collapse and a small notes section component (`src/components/WishlistItemCard.tsx`).
- API contract and types updated to include `notes` on create/update responses and requests (`src/services/wishlistApi.ts`, `src/types/wishlist.ts`).
- Database migration created (`backend/migrations/20260220150000_add_wishlist_item_notes.sql`) and mirrored to `supabase/migrations/20260220150000_add_wishlist_item_notes.sql` for `supabase db push` compatibility.
- Backend and frontend typechecks/builds validated locally; added modular sanitizer utility at `backend/src/utils/wishlistNotes.ts` to centralize notes handling.

### Changed

- Committed changes to `main` and pushed to remote; see commit `9c92375`.

## [1.1.0] - 2026-02-19

### Added

- Wishlist page UI with route and top-nav entry point.
- Add Product modal shell on the Wishlist page with title + URL fields and client-side validation (frontend only; no backend persistence yet).
- Localhost-only frontend login bypass toggle for development via `VITE_DISABLE_LOGIN_ON_LOCALHOST`.
- Persistent wishlist CRUD API (`/api/v1/wishlist`) with database-backed create, list, update, and delete operations.

### Changed

- Restored authentication flow to the previous cookie-based session model for login/logout and protected route checks.
- Rolled backend auth-related implementation back to a known-good baseline to stabilize login and category API behavior.
- Hardened backend dev auth bypass rules to allow bypass only for localhost requests in non-production when explicitly enabled.
- Improved wishlist product preview extraction by prioritizing JSON-LD product metadata (title, image, and price) before OG/meta fallbacks.
- Refactored inline wishlist category tag markup for readability without changing behavior.
- Improved wishlist preview extraction for JS-heavy shops by parsing app JSON payload scripts and added short-lived cache for faster repeat URL previews.
- Rebalanced wishlist product card media area so product images are less visually dominant.
- Switched wishlist page persistence from browser localStorage to backend database writes/reads for add, edit, delete, and deposit updates.
- Added category-based filtering on the wishlist page with a dedicated filter icon and selectable category chips.
- Modularized wishlist UI rendering by extracting reusable category filter and wishlist item card components for easier maintenance.
- Added wishlist item priority levels (High/Medium/Low) with weighted sorting, priority filtering, and card-level priority badges.
- Replaced hardcoded dashboard starter categories with an empty initial state so cards are driven by real user data.
- Added frontend duplicate URL warnings in the wishlist add/edit flow to prevent saving the same product twice.
- Added metadata freshness status badges to wishlist cards to show whether scraped product details are fresh, stale, or unknown.
- Added wishlist price snapshot tracking and trend calculation (up/down/flat/unknown) based on historical product prices.
- Added a card-level price trend indicator on the wishlist page, including percentage change when enough price history exists.
- Added a manual per-item metadata refresh action on wishlist cards with item-level loading and error states.
- Added a compact wishlist analytics summary with responsive stat cards for filtered items, target total, saved total, and ready-to-buy count.
- Standardized wishlist card layout rhythm so cards share equal height and action buttons align consistently across rows.

### Fixed

- Restored Vercel SPA rewrite fallback so refreshing client routes (e.g. `/wishlist`) no longer returns `404 NOT_FOUND`.
- Resolved Vercel build failures when Tailwind CSS 4 is installed by updating PostCSS configuration to use the Tailwind v4 plugin path.
- Added `@tailwindcss/postcss` and a compatibility PostCSS loader so builds work reliably across Tailwind v3 and v4 dependency states.
- Fixed wishlist URL preview autofill failures caused by `304 Not Modified` responses by forcing no-store/no-cache behavior for preview requests.

## [1.0.0] - 2026-02-16

### Added

- Initial React + TypeScript + Vite project setup for the Financial App.
- Neumorphic UI foundation with shared theme styles and reusable UI primitives.
- Budget dashboard flow with category cards, summary stats, and progress visuals.
- Category management modal and income update modal for core budgeting workflows.
- History views and snapshot components for transaction and trend visibility.
- Recurring manager and automation toast for recurring finance logic.
- Context providers and hooks for budget and finance state management.
- Utility modules for currency formatting and pay period logic.
- Test setup with initial utility tests.

### Changed

- Refined project structure into focused folders for components, context, hooks, pages, layouts, styles, tests, types, and utilities.
- Improved consistency of component naming and dashboard composition for maintainability.

### Infrastructure

- Configured Tailwind CSS, PostCSS, ESLint, TypeScript project configs, Vitest, and Vite build tooling.
- Added repository hygiene rules in `.gitignore` for dependencies, build artifacts, environment files, and editor workspace files.
