---
name: feature-build
description: Implement or refactor a product feature in this repository when the work spans multiple files, packages, or layers such as web React pages and components, React Native or Expo mobile screens, dashboards, APIs, and shared code. Use this skill for incremental feature delivery that must follow existing project structure, keep concerns separated, respect monorepo boundaries, and avoid broad rewrites. Do not use this for generic one-off coding tasks, isolated small bug fixes, or instruction-file authoring.
---

# Feature Build

Build features in the smallest complete slice that fits the request. Preserve existing behavior unless the prompt explicitly changes it.

## Inspect first

- Read the existing entrypoints, types, and neighboring files before editing.
- Follow the current structure, naming, and code style used in the area you touch.
- Reuse existing UI primitives, shared types, schemas, and helpers before creating new ones.
- Check how the target area already handles routing, data loading, validation, and persistence before introducing a new pattern.

## Plan the slice

- Define the smallest usable version of the feature before expanding scope.
- Prefer incremental implementation over a broad rewrite.
- Keep files manageable. Split growing files into helpers, hooks, services, or subcomponents when that improves readability.
- Avoid introducing abstraction unless it clearly improves reuse, readability, or maintenance.

## Implement by layer

- Keep UI rendering, data fetching, and business logic separate unless the task is truly tiny.
- Keep presentation components focused on UI and move reusable logic into hooks or utilities.
- Keep layout logic separate from data transformation logic.
- Preserve existing behavior outside the requested change.
- Do not silently rewrite unrelated parts of the codebase.

## Platform rules

### Web

- Use normal React web patterns and TypeScript.
- Do not import React Native components into web files.
- Prefer reusable components for repeated dashboard or page sections.
- Avoid inline styles unless the existing file already relies on them.
- Do not introduce visual redesigns unless explicitly requested.

### Mobile

- Use React Native and Expo-safe components and patterns.
- Do not use HTML elements, DOM APIs, or browser-only event patterns.
- Avoid web-only libraries unless compatibility is confirmed.
- Keep screens small and modular, and follow the existing navigation or router setup.
- Do not import web UI components into mobile files.

### Shared concepts across platforms

- Share concepts, types, and pure helpers, not copied UI implementations.
- Adapt shared features to native UI patterns on mobile instead of reusing web markup directly.
- Keep shared code framework-safe for every consumer.

## Backend and data rules

- Keep controllers and route handlers thin where practical.
- In this repository, validate input at the boundary and call models directly by default.
- Introduce a service layer only when business logic is clearly reusable or the surrounding area already uses services.
- Return predictable response shapes and avoid scattering hardcoded values.
- Keep route registration thin and keep persistence logic out of route files.
- If backend wiring is not ready, use typed local mock data and keep placeholders clearly separate from real integrations.

## Monorepo boundaries

- Respect package ownership and existing app or package responsibilities.
- Keep each app independently buildable.
- Do not solve a local problem by importing from an unrelated package that should not own that responsibility.
- Avoid backdoor cross-imports between apps.
- Put shared types and pure helpers only in established shared locations.
- Do not place web-only or mobile-only logic in shared modules unless it is clearly separated.
- Prefer small local duplication over introducing the wrong dependency edge.
- Create or extend shared modules only when the behavior is truly cross-consumer and framework-safe.

## Refactor safely

- Preserve behavior first, then improve readability and reduce complexity.
- Extract repeated logic when it meaningfully improves maintainability.
- Rename broadly only when it clearly improves understanding.
- Do not delete important existing code unless replacement is part of the task.
- Do not introduce new dependencies unless they are necessary and the smallest compatible option.

## Finish cleanly

- Verify the affected paths still fit the existing architecture and package boundaries.
- Mention what changed, any assumptions, and any mocked or placeholder pieces.
- Mention file-splitting follow-up only when the task created or revealed a concrete maintainability risk.
