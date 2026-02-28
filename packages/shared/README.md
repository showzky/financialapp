# @financial-app/shared

Shared types, services, and utilities used by both web and mobile apps.

## What's Inside

- **Services** – API wrappers (wishlist, auth, subscriptions, loans, etc.)
- **Types** – TypeScript type definitions (WishlistItem, Subscription, etc.)
- **Utils** – Formatting, validation, and helper functions

## Usage

### In Web App

```typescript
import { wishlistApi, type WishlistItem } from '@financial-app/shared'
```

### In Mobile App

```typescript
import { wishlistApi, type WishlistItem } from '@financial-app/shared'
```

## Adding New Exports

When you add a new service, type, or utility to the main app:

1. **Add the file** to `src/services/`, `src/types/`, or `src/utils/`
2. **Export it** from the corresponding re-export file:
   - Services: `packages/shared/src/services/index.ts`
   - Types: `packages/shared/src/types/index.ts`
   - Utils: `packages/shared/src/utils/index.ts`

That's it! Mobile and other packages will automatically have access.

## Structure

```
packages/shared/
├── src/
│  ├── index.ts              # Main barrel export
│  ├── services/index.ts     # Re-exports ../../src/services/*
│  ├── types/index.ts        # Re-exports ../../src/types/*
│  └── utils/index.ts        # Re-exports ../../src/utils/*
└── package.json
```

## No Breaking Changes

This package **only re-exports** from the main app. It doesn't copy or modify files, so your existing imports in web continue to work:

```typescript
// Still works:
import { wishlistApi } from '@/services/wishlistApi'

// Also works:
import { wishlistApi } from '@financial-app/shared'
```

Both are valid. Use whichever feels right for your use case.
