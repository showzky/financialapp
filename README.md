# Financial Budget Tracker (Neumorphism)

My personal finance tracker built with React + TypeScript.

## Overview

Neumorphic React + TypeScript app with Tailwind tokens, ESLint/Prettier, and Vitest + Testing Library. Includes budget state management, category and income modals, recurring automation support, and history snapshots.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS with custom neumorphic shadows and theme tokens
- ESLint + Prettier (flat config)
- Vitest + Testing Library + jest-dom

## Getting started

1. Install dependencies: `pnpm install`
2. Run the dev server: `pnpm dev`
3. Open `http://localhost:5173`

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
