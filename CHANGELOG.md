# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning principles.

## [Unreleased]
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
