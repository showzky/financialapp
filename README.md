# Financial Budget Tracker (Neumorphism)

My personal finance tracker built with React + TypeScript.

## Overview

Neumorphic React + TypeScript app with Tailwind tokens, ESLint/Prettier, and Vitest + Testing Library. Includes budget state management, category and income modals, recurring automation support, and history snapshots.

Includes a server-backed Loan Area for tracking loans given to others with due-date status, repayment tracking, and a compact dashboard summary card.

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
- Budget state/context: [src/context/BudgetContext.tsx](src/context/BudgetContext.tsx)
- Dashboard composition: [src/pages/Home.tsx](src/pages/Home.tsx)
- Loan management page: [src/pages/Loans.tsx](src/pages/Loans.tsx)
