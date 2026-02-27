# Financial Budget Tracker (Neumorphism & Glass HUD)

My personal finance tracker built with React + TypeScript.

## Overview

A hybrid-aesthetic React + TypeScript app featuring soft Neumorphic surfaces for general UI and a high-tech Glassmorphic HUD (Heads-Up Display) for data-heavy sections like Loans. Built with Tailwind tokens, ESLint/Prettier, and Vitest + Testing Library.

Includes a server-backed Loan Area for tracking loans given to others with due-date status, repayment tracking, and a compact dashboard summary card. See [docs/loan-tracking.md](docs/loan-tracking.md) and [docs/glass-hud-spec.md](docs/glass-hud-spec.md) for architecture details.

Subscriptions dashboard now uses locale-aware currency/date formatting (browser locale by default, currency fallback `NOK`) and explicit empty states for no-data vs filter-no-match cases.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS with custom neumorphic shadows and theme tokens
- ESLint + Prettier (flat config)
- Vitest + Testing Library + jest-dom

## Getting started

1. Install dependencies: `pnpm install`
2. Create `.env.local` from `.env.example` and set `VITE_BACKEND_URL` to your local backend API (example: `http://localhost:4000/api/v1`)
3. Run the dev server: `pnpm dev`
4. Open `http://localhost:5173`

## Environment safety

- Development mode requires `VITE_BACKEND_URL` and will fail fast if missing.
- Use separate credentials for local, staging, and production backends/databases.
- Apply database changes through versioned SQL files in [backend/migrations/README.md](backend/migrations/README.md).

## Scripts

- `pnpm dev` – start Vite dev server
- `pnpm build` – type-check and build for production
- `pnpm lint` – run ESLint
- `pnpm test` – run Vitest in watch mode
- `pnpm exec vitest run` – run tests once (CI style)

## Project notes

- Theme tokens: [src/styles/theme.css](src/styles/theme.css)
- Primary CTA tokens and semantic utilities:
	- CSS variables in `src/styles/theme.css`: `--primary-cta-bg`, `--primary-cta-foreground`
	- Tailwind semantic utilities in `tailwind.config.ts`: `bg-primary`, `text-primary-foreground`
	- Reuse rule: use these semantic utilities for all primary call-to-action surfaces/text instead of hard-coded color classes
- Budget state/context: [src/context/BudgetContext.tsx](src/context/BudgetContext.tsx)
- Dashboard composition: [src/pages/Home.tsx](src/pages/Home.tsx)
- Dashboard loan summary card: [src/components/LoanAreaCard.tsx](src/components/LoanAreaCard.tsx) showing totals and upcoming due dates
- Loan management page: [src/pages/Loans.tsx](src/pages/Loans.tsx)
### Vacation Dashboard (Ferie Tank)
- See [docs/vacation-blueprint.md](docs/vacation-blueprint.md) for schema and UI details.
- New inline days editor lets users adjust trip duration directly in the HUD; changes update daily allowance instantly.
- Category chart (donut) visualizes expense breakdown with hover tooltips and custom category extraction.
- HUD improvements: glassmorphic cards, status dots, progress rings, floored numeric values, and alert messaging.
- All state logic and orchestration in [src/pages/VacationDash.tsx](src/pages/VacationDash.tsx); API wrapper in [src/services/vacationApi.ts](src/services/vacationApi.ts).
- Maintain: update chart color mapping and legend logic for new categories; migrate hardcoded colors to theme tokens for full customization.
