---
name: feature-build
description: Implement or refactor a product feature in this repository when the work spans multiple files, packages, or layers such as web React pages and components, React Native or Expo mobile screens, dashboards, APIs, and shared code. Use this skill for incremental feature delivery that must follow existing project structure, keep concerns separated, respect monorepo boundaries, and avoid broad rewrites. Do not use this for generic one-off coding tasks, isolated small bug fixes, or instruction-file authoring.
---

# Feature Build

Build features in the smallest complete slice that fits the request. Preserve existing behavior unless the prompt explicitly changes it.

Every output must be production-ready: typed correctly, error-handled, visually consistent with the existing design system, and structurally coherent. No scaffolding placeholders. No `// TODO: implement this`. No `any` leaks. No half-measures.

## Inspect first

- Read the existing entrypoints, types, and neighboring files before editing.
- Follow the current structure, naming, and code style used in the area you touch.
- Reuse existing UI primitives, shared types, schemas, and helpers before creating new ones.
- Check how the target area already handles routing, data loading, validation, and persistence before introducing a new pattern.
- Check how the target area handles authentication and authorization before adding new data access paths.
- Read the existing design tokens, color variables, and component patterns before writing any UI code.

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

## TypeScript rules

- Strict mode always. No `any`. Use `unknown` + type narrowing if needed.
- Prefer `type` for data shapes, `interface` for extensible contracts.
- All async functions return typed Promises. Never `Promise<any>`.
- Use zod or the existing validation library for runtime validation on all user input and API payloads.
- Apply `.max()` bounds to numeric fields and length limits to string fields in every schema.

```ts
// ✅
const schema = z.object({ amount: z.number().positive().max(10_000_000), label: z.string().min(1).max(200) })
type Input = z.infer<typeof schema>

// ❌
const body = req.body as any
```

## UI and design rules

These apply to every component, page, or screen you touch. Generic AI output is not acceptable.

### Before writing any UI code
- Read the existing design tokens, CSS variables, and theme files in the project.
- Follow the exact color palette, spacing scale, typography, and component patterns already established.
- Do not invent new colors, spacing values, or component styles — extend what exists.

### Typography
- Use the fonts already defined in the project. Never substitute generic fallbacks like Inter, Roboto, Arial, or System UI unless the project already uses them.
- Match the existing font weight, size scale, and letter spacing conventions.

### Color
- Use the project's existing CSS variables or theme tokens — never hardcode hex values that aren't already in the design system.
- Apply semantic color roles correctly: positive/income, negative/expense, warning, info — as already defined in the project.

### Components
- Do not use generic UI libraries (Bootstrap, MUI, Chakra, Ant Design) unless the project already depends on them.
- Write components that match the existing visual language — cards, buttons, inputs, labels should look like they belong.
- No cookie-cutter layouts. Match the existing spatial composition, density, and visual weight of the surrounding UI.

### Animations and interaction
- Match the existing motion style — do not add heavy animations to a minimal UI or flat transitions to an animated one.
- Prefer CSS animations for simple effects. Use the existing animation library if one is present.

### What never belongs in output
- Purple gradients on white backgrounds
- Generic card shadows with `box-shadow: 0 2px 4px rgba(0,0,0,0.1)`
- Inter or Roboto when the project uses something else
- Hardcoded `#333`, `#666`, `#f5f5f5` color values
- Layouts that look like a tutorial or template

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

## Security rules

These apply to every feature that touches data, auth, or user input — not just security-specific tasks.

### Authentication and authorization
- Every new route or endpoint that accesses user data must be protected by the existing auth middleware. Check how neighboring routes handle auth before adding a new one.
- Never derive user identity from the request body or query params. Always use the verified identity from the auth layer (e.g. JWT claims, session, middleware-attached user object).
- Do not add public endpoints that expose private data, even temporarily for testing.

### Input validation
- Validate and sanitize all user-supplied input at the boundary before it reaches business logic or persistence.
- Apply upper bounds to numeric fields and length limits to string fields — never accept unbounded input.
- Strip unknown fields from incoming payloads — do not pass raw request bodies directly to the database or ORM.

### Database and data access
- When adding a new table or data access path, verify that row-level access controls exist and scope data to the authenticated user.
- Never use an elevated privilege client (e.g. service role, admin key) in frontend or client-accessible code.
- Use explicit column selection in queries — avoid selecting all columns when only a subset is needed.
- Scope all queries to the authenticated user even when the database enforces it separately — defense in depth.

### Secrets and environment
- Do not hardcode secrets, API keys, or credentials anywhere in the codebase.
- Access environment variables through a validated config object, not raw `process.env` scattered through files.
- Never log sensitive values — mask or omit them from error messages and debug output.

### Dependency hygiene
- Do not introduce new dependencies unless necessary and well-maintained.
- Prefer established libraries over unknown packages for security-sensitive operations (hashing, encryption, token handling).

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
- Verify that new data access paths are authenticated and scoped correctly.
- Verify that UI output matches the existing design system — not a generic approximation of it.
- Mention what changed, any assumptions, and any mocked or placeholder pieces.
- Mention file-splitting follow-up only when the task created or revealed a concrete maintainability risk.
- Flag any security assumptions made — e.g. "this relies on the existing auth middleware being applied at the router level."