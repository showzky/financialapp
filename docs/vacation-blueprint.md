# Vacation Dashboard Blueprint (Ferie Tank)

This document outlines the architecture, data structures, and design specifications for the Vacation Dashboard, a dedicated feature for tracking travel savings and in-trip expenditures.

## 1. Data Schema

The vacation feature uses two primary tables to manage funds and expenses.

### `vacation_funds` (The "Ferie Tank")
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, default `gen_random_uuid()` |
| `user_id` | `UUID` | Foreign Key to `users(id)` |
| `name` | `TEXT` | Destination or trip name (e.g., "Tokyo 2026") |
| `target_amount` | `NUMERIC(12, 2)` | The total budget goal for the trip |
| `current_amount`| `NUMERIC(12, 2)` | Total saved specifically for this fund |
| `start_date` | `DATE` | Expected start date of the vacation |
| `duration_days` | `INT` | Planned trip length in days; editable via dashboard, overrides computed days remaining |
| `end_date` | `DATE` | Expected end date of the vacation |
| `created_at` | `TIMESTAMPTZ` | Timestamp of creation |
| `updated_at` | `TIMESTAMPTZ` | Timestamp of last update |

### `vacation_expenses`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `vacation_id` | `UUID` | Foreign Key to `vacation_funds(id)` |
| `category` | `TEXT` | One of: `flights`, `food`, `hotel`, `miscellaneous` |
| `amount` | `NUMERIC(12, 2)` | Cost of the specific expense |
| `description` | `TEXT` | Note about the expense |
| `date` | `DATE` | Date the expense occurred |
| `created_at` | `TIMESTAMPTZ` | Timestamp of entry |

---

## 2. UI Style Guide (Glassmorphism)

The Vacation Dashboard adheres to the **Glass HUD** design system but applies a specific transparency profile for the "Ferie" routes.

### Visual specs
- **Backdrop Blur**: `20px` (consistent with `--glass-blur`).
- **Background Opacity**: `20%` (e.g., `rgba(255, 255, 255, 0.2)` on light themes).
- **Border**: `1px solid rgba(255, 255, 255, 0.3)` to maintain edge clarity against vibrant vacation-themed backgrounds.
- **Utility Class**: Use `.glass-panel` with a local override for opacity:
  ```css
  .vacation-glass-panel {
    @apply glass-panel;
    background: rgba(var(--glass-bg-rgb), 0.20); /* Explicit 20% opacity */
  }
  ```

### Color Mapping
- **Flights**: Blue Accent
- **Food**: Yellow/Orange Accent
- **Hotel**: Purple Accent
- **Miscellaneous**: Grey/Silver Accent

---

## 4. Theme Mapping

The Vacation Dashboard integrates with the global theme system, mapping dashboard elements to CSS custom properties for consistent light and dark mode support. All color tokens are defined in `src/styles/theme.css` and can be overridden by theme presets in `src/styles/themePresets.ts`.

### Global Color Tokens

The following CSS variables are used throughout the dashboard:

| Variable | Light Mode Value | Dark Mode Value | Purpose |
|----------|------------------|-----------------|---------|
| `--color-surface` | `#e8edf5` | `#1f2533` | Base surface color for cards and backgrounds |
| `--color-surface-strong` | `#dde4ef` | `#252c3d` | Stronger surface variant for emphasis |
| `--color-accent` | `#6c7df0` | `#8ea0ff` | Primary accent color for highlights and CTAs |
| `--color-accent-strong` | `#4f61d8` | N/A | Stronger accent variant |
| `--color-text-primary` | `#1f2a44` | `#eaf1ff` | Primary text color |
| `--color-text-muted` | `#475569` | `#94a3b8` | Secondary/muted text color |
| `--color-shadow-dark` | `#c2c8d4` | `#161b27` | Dark shadow for depth effects |
| `--color-shadow-light` | `#ffffff` | `#2b3347` | Light shadow for depth effects |
| `--app-bg` | `radial-gradient(...)` | `radial-gradient(...)` | Page background gradient |
| `--glass-bg` | `rgba(255, 255, 255, 0.2)` | `rgba(15, 23, 42, 0.4)` | Glass panel background |
| `--glass-border` | `rgba(255, 255, 255, 0.4)` | `rgba(255, 255, 255, 0.1)` | Glass panel border |
| `--glass-blur` | `20px` | `20px` | Backdrop blur intensity |
| `--glass-saturate` | `160%` | `160%` | Color saturation for glass effects |

### Dashboard Element Mapping

#### Ferie Tank (Savings Progress)
- **Background**: Uses `.hud-glass-card` class with `--glass-bg` and `--glass-border`
- **Progress Ring**: Stroke color `#60a5fa` (hardcoded blue) with glow effect
- **Text**: `--color-text-primary` for values, `--color-text-muted` for labels
- **Status Dot**: `--color-accent` (blue/teal depending on theme)

#### Daily Allowance
- **Background**: `.hud-glass-card` with glass variables
- **Value Display**: `--color-text-primary` with glow effect (`text-shadow` with white)
- **Status Dot**: `--color-accent` with slow pulse animation
- **Labels**: `--color-text-muted`

#### Expense Sensors (Category Breakdown)
- **Background**: `.hud-glass-card` with glass variables
- **Chart Segments**: Hardcoded category colors:
  - Flights: `pink-400` (`#f472b6`)
  - Food: `yellow-400` (`#facc15`)
  - Hotel: `emerald-400` (`#34d399`)
- **Legend Dots**: Match segment colors
- **Labels**: `--color-text-muted`

### Theme Preset Integration

The dashboard supports theme presets defined in `themePresets.ts`:

- **Aurora Mist** (Light): Clean gradients with indigo accents
- **Midnight Luxe** (Dark): Deep slate with neon-teal accents  
- **Sunset Bloom** (Warm): Peach tones with fuchsia accents

Each preset overrides the base tokens, automatically updating dashboard colors. The glass variables (`--glass-bg`, `--glass-border`) are adjusted per theme for optimal contrast.

### Implementation Notes
- Dashboard elements use Tailwind classes that reference CSS variables (e.g., `text-[var(--color-text-primary)]`)
- Hardcoded colors in Expense Sensors should be migrated to theme tokens for full customization

### New features 🎯
- A trip duration field (`duration_days`) has been added to the `vacation_funds` schema. The front end exposes this as an inline editable number next to the “Days” value on the Daily Allowance card. Clicking the pencil icon toggles a compact glass‑themed input (styled with `--glass-bg`/`--glass-border`). Modifying the value updates `daysRemaining` immediately and causes the projected daily allowance to recompute. The override lives in local state until backend persistence is implemented.
- The number input used for editing days is now stripped of its native stepper/spinner controls (via `appearance:none`/`-moz-appearance:textfield`) to keep the HUD aesthetic clean. Input is still type‑number to enforce numeric entry and the change handler guards against invalid values.
- Display values for projected daily allowance and total pocket money are floored (`Math.floor`) to remove trailing decimals.

### API / persistence notes 🛠
- Create/update vacation endpoints must accept and return a `durationDays` property; the column should be added to the database (`duration_days INT`) with a sensible default (e.g. computed from `start_date`/`end_date` during migration).
- `GET /vacations` responses need to include the new field so the UI can initialize its override state.
- Utilities such as `calculateDailyAllowance` may be extended in the future to consume an explicit duration value rather than deriving from end date alone.
- Glass effects use `backdrop-filter` with `--glass-filter-legacy` for cross-browser support

## 3. Component Structure

The feature is broken down into the following frontend components:

### Page Layout
- **`src/pages/VacationDash.tsx`**: The main orchestration component for the route `/vacation`.

### Core Components
- **`FerieTankCard.tsx`**: A primary progress visualization showing `current_amount` vs `target_amount` with a high-tech progress ring.
- **`ExpenseDistributionChart.tsx`**: A breakdown of spending across the 4 categories (flights, food, hotel, misc) using a donut chart.
- **`AddExpenseModal.tsx`**: A glass-morphic form for logging new costs while on the trip.
- **`ExpenseActivityFeed.tsx`**: A vertical timeline or list showing recent expenditures.
- **`TripSummaryStats.tsx`**: Smaller HUD cards showing "Daily Burn Rate", "Remaining Budget", and "Days Until Trip".

### Types & Utilities
- **`src/types/vacation.ts`**: TypeScript definitions for `VacationFund` and `VacationExpense`.
- **`src/services/vacationApi.ts`**: API wrapper for CRUD operations on funds and expenses.
