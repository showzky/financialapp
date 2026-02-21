# Loan Tracking Feature

This document covers the **Loan Tracking Area on Dashboard** and the
associated backend support. It provides implementation details, usage
notes, and migration guidance.

## Overview

The app now supports tracking loans given to other individuals directly
from the dashboard. A summary card on the home screen displays:

- Total outstanding loan amount
- Count of loans due soon (within the next 7 days)
- Count of overdue loans
- Link to the full Loans management page

The dedicated _Loans_ page allows full CRUD operations on loans and a
quick way to mark loans as repaid.

## Frontend components

Key files:

- `src/components/LoanAreaCard.tsx` – dashboard summary card
- `src/components/LoanTable.tsx` – tabular list used on `/loans`
- `src/components/AddLoanModal.tsx` – modal for creating/editing loans
- `src/pages/Loans.tsx` – page component and route registration
- `src/utils/loanStatus.ts` – utility helpers for status labels and
  time‑remaining formatting
- `src/types/loan.ts` – TypeScript types for the API payloads and
  responses

### Search and Filtering

The Loans page includes a dedicated search bar and status filter system:

- **Name-based Filtering**: Users can search for specific loans by the recipient's name via the search input. This performs a case-insensitive partial match against the `recipient` field.
- **Status Filtering**: Quick-access filter chips allow narrowing down the list by status (Outstanding, Due Soon, Overdue, Repaid).
- **Combined Logic**: Search and status filters work together to refine the displayed dataset in real-time.

The Loans section features a custom scrollbar styled in green (success theme), updated from the previous pink color for better visual consistency.

The dashboard card is pulled into `src/pages/Home.tsx` alongside the
existing budget and wishlist summaries. It fetches the summary API
(`GET /api/v1/loans/summary`) and displays the information with
neumorphic styling consistent with other cards.

### Usage example

```tsx
// Home.tsx
import { LoanAreaCard } from '@/components/LoanAreaCard'

function Home() {
  return (
    <div className="grid gap-4">
      {/* existing cards */}
      <LoanAreaCard />
    </div>
  )
}
```

## Visual Alignment

The Loans dashboard adheres to the **Glass HUD** design system to maintain a cohesive high-tech aesthetic:

- **HUD Integration**: All interactive elements, including the search bar and filter chips, use the `.glass-panel` utility class for background blur and border effects.
- **Contrast Mitigation**:
    - **Local Scrim Layers**: The search input uses a subtle `bg-white/5` (or equivalent dark/light tint) scrim layer. This ensures that text remains legible even when the underlying background has complex visual noise.
    - **High-Contrast Placeholders**: Placeholder text uses `text-text-muted/70` to ensure it meet contrast requirements while still appearing distinct from active input text.
- **Consistent Accents**: The focus ring and active filter states utilize the `accent` and `primary` color tokens defined in the global theme.

## Backend API

The server exposes the following endpoints for loans:

```
GET    /api/v1/loans
GET    /api/v1/loans/summary    # used by dashboard card
POST   /api/v1/loans
PATCH  /api/v1/loans/:id
PATCH  /api/v1/loans/:id/repaid   # mark a loan as repaid
DELETE /api/v1/loans/:id
```

All loan routes are protected and require an authenticated session.
The request/response payloads correspond to the types declared on the
frontend (`Loan`, `CreateLoanPayload`, `UpdateLoanPayload`).

## Database migration

A new migration file creates the `loans_given` table and two indexes
for efficient querying by user and due date. Run the migration via the
standard workflow:

1. Add `backend/migrations/20260220183000_add_loans_given.sql` to your
   repo (already committed).
2. Apply to your local development database and verify the backend
   starts correctly.
3. Mirror the migration to staging/production as described in
   `backend/migrations/README.md`.

The same file is included under `supabase/migrations` so `supabase db
push` will keep the schema in sync with hosted environments.

## Testing

- Frontend unit tests cover status logic (`src/tests/loanStatus.test.ts`)
  and component rendering (`LoanTable.test.tsx`).
- Backend tests (if applicable) should verify due-state computation and
  the `repaid` endpoint.

## Additional notes

- A new utility function `formatLoanTimeRemaining` computes human‑readable
  strings such as "3 days" or "overdue" based on server-provided
  `status` and `days_remaining` values.
- The dashboard card automatically hides itself when there are no loans
  (empty state).

---

For any questions or enhancement ideas, see the main project README or
open an issue on the repository.
