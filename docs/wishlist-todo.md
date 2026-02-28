# Wishlist System - TODO & Improvement Roadmap

## Current Status
✅ Core wishlist system implemented with CRUD operations, price tracking, savings progress, and purchase state.

## UI/UX Improvements

### High Priority
- [ ] **Fix card title contrast in dark theme**
  - Current: titles use `text-text-primary` which lacks sufficient contrast over light backgrounds
  - Affected: WishlistItemCard when `isPurchased` or `isReadyToBuy` (uses `bg-emerald-50/40`)
  - Solution: Use higher-contrast text (e.g., `text-slate-900` or dedicated theme token) for titles when background is light
  - Files: `src/components/WishlistItemCard.tsx`

- [ ] **Standardize card background colors and ensure WCAG AA contrast**
  - Current: light emerald background for ready/purchased states
  - Consider: darker emerald or separate high-contrast styling for purchased items
  - Files: `src/components/WishlistItemCard.tsx`

### Medium Priority
- [ ] **Add metadata refresh success toast notification**
  - Current: only shows error on refresh failure
  - Enhancement: add brief success feedback when metadata is refreshed
  - Files: `src/pages/Wishlist.tsx`, `src/components/WishlistItemCard.tsx`

- [ ] **Improve empty state messaging**
  - Current: basic empty state
  - Enhancement: add onboarding tips or quick-add shortcuts

- [ ] **Add keyboard shortcuts for common actions**
  - Quick add (Cmd+Shift+A)
  - Mark as purchased (Enter on card)
  - Delete with confirmation (Backspace on card)

- [ ] **Implement bulk actions**
  - Select multiple items
  - Bulk mark as purchased
  - Bulk delete with confirmation

### Low Priority
- [ ] **Add infinite scroll or virtual scroll for large lists**
  - Current: all items loaded at once
  - Consider: pagination or lazy loading for 100+ items

- [ ] **Enhance price trend visualization**
  - Current: colored badge with percentage
  - Enhancement: small sparkline chart or price history popup

- [ ] **Add wishlist sharing/collaboration**
  - Generate shareable wish list links
  - Allow friends to contribute to savings

- [ ] **Add item duplication detection and merging**
  - Warn on duplicate URLs
  - Allow merging prices/notes from duplicates

## Performance Optimizations
- [ ] Memoize WishlistItemCard components (currently re-renders on parent updates)
- [ ] Consider image lazy loading for card previews
- [ ] Debounce category filter changes

## Testing
- [ ] Add visual regression tests for dark/light theme variants
- [ ] Expand WishlistItemCard component tests for edge cases (no title, no price, etc.)
- [ ] Add integration tests for add/edit/delete workflows

## Accessibility
- [ ] Ensure all interactive elements are keyboard navigable
- [ ] Add loading state announcements for metadata refresh
- [ ] Improve screen reader labels for status badges and indicators
- [ ] Test WCAG 2.1 AA compliance (particularly contrast ratios on themed backgrounds)

## Backend Integration
- [ ] Monitor wishlist API response times for metadata refresh
- [ ] Add pagination support to avoid large payload transfers
- [ ] Consider caching strategy for product metadata

## Documentation
- [ ] Add comments explaining price trend calculation logic
- [ ] Document filter behavior and state management
- [ ] Add examples for customizing category display/colors
