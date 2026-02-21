# Global Glass Architecture

## Scope
This document defines the global Glassmorphic theme engine for all app themes before component-level refactors.

## Architectural Plan (Pre-Implementation)
1. Introduce a canonical glass token set in the global theme layer for Aurora, Midnight, and Sunset.
2. Split filter composition into independent tokens (`--glass-blur`, `--glass-saturate`) while keeping a compatibility alias for existing usages.
3. Validate contrast mathematically per theme on blended glass surfaces over real app gradients.
4. Gate rollout with visual regression tests focused on ghosting (invisible containers after border/shadow removal).
5. Promote to production only after visual, accessibility, functional, and performance criteria pass.

## Global Glass Variable Map

| Theme | `--glass-bg` | `--glass-border` | `--glass-blur` | `--glass-saturate` |
|---|---|---|---|---|
| Aurora (Light) | `rgba(255,255,255,0.20)` | `rgba(255,255,255,0.40)` | `20px` | `160%` |
| Midnight (Dark) | `rgba(15,23,42,0.40)` | `rgba(255,255,255,0.10)` | `20px` | `160%` |
| Sunset (Warm) | `rgba(255,245,235,0.25)` | `rgba(255,255,255,0.30)` | `20px` | `160%` |

## Safe Ranges (Custom Theme Guardrails)

| Variable | Safe Range | Why |
|---|---|---|
| `--glass-bg` (alpha) | `0.18–0.45` | Under `0.18` becomes noisy/low separation; above `0.45` loses glass transparency. |
| `--glass-border` (alpha) | `0.10–0.45` | Keeps panel edges perceptible without looking opaque/plastic. |
| `--glass-blur` | `12px–28px` | Under `12px` weak separation; above `28px` over-softens UI and harms edge clarity. |
| `--glass-saturate` | `130%–180%` | Under `130%` looks flat; above `180%` risks neon overdrive and contrast instability. |

Recommended default operating zone: blur `18–22px`, saturate `150–165%`, then tune only background/border alpha per theme.

## Token Migration (Compatibility)
- Add independent tokens for every theme:
  - `--glass-blur: 20px;`
  - `--glass-saturate: 160%;`
- Add compatibility alias during migration:
  - `--glass-filter-legacy: blur(var(--glass-blur)) saturate(var(--glass-saturate));`
- Existing usage can continue with `var(--glass-filter-legacy)` until all components are migrated.

## WCAG 2.1 AA Contrast Audit (Mathematical)
Method: alpha compositing per channel over app gradient stops, then WCAG contrast ratio.

### Results Summary
| Theme | Primary Text | Muted Text | Verdict |
|---|---:|---:|---|
| Aurora | `12.0–13.5:1` | `4.03–4.52:1` | Primary PASS (AAA), Muted near-threshold/conditional FAIL |
| Midnight | `14.5–15.7:1` | `6.4–6.9:1` | PASS (AA) |
| Sunset | `11.4–13.2:1` | `3.83–4.41:1` | Primary PASS (AAA), Muted FAIL |

### Risk Note (Blur on Complex UI)
Backdrop blur + saturation amplifies local luminance/chroma variance from noisy backgrounds. Any muted token close to `4.5:1` can dip below AA in real UI states.

### Required Mitigation Before Global Rollout
- Darken muted text token on light/warm themes (target luminance <= `0.14`) **or**
- Add an additional local scrim/contrast layer for muted text regions.

## Visual Regression Suite (Ghosting Prevention)
Run a dedicated `glass-regression` suite with snapshots and computed-style assertions:
- Container visibility contract test (panel must have visible separator mechanism).
- Boundary-loss diff test (layout box exists but edge pixels disappear).
- Layering test (glass panel remains perceptible over gradients/patterns).
- Hover/focus state visibility test for interactive surfaces.
- Disabled/read-only visibility test.
- Empty-state silhouette test.
- Table row/column scannability test.
- Modal isolation test (modal distinct from backdrop/page content).

### Required Snapshot Matrix
- Routes/components: Loans, Wishlist, History, Home cards, all modals, tabular views.
- States: default, hover, focus, disabled, loading/empty, confirm/delete states.
- Themes: Aurora + Midnight + Sunset.
- Viewports: `390x844`, `768x1024`, `1440x900`.
- Browsers: Chromium on PR; Chromium + Firefox + WebKit nightly.

## Production-Ready Criteria
- Visual diffs: <= `0.15%` changed pixels per capture; no critical ghosting defects.
- Accessibility: `0` critical/serious axe violations on covered routes; keyboard focus visibility retained.
- Contrast: WCAG 2.1 AA passes for text and non-text UI indicators in all supported themes.
- Functional: no click-target loss from transparent overlays; modals/forms/table actions unchanged.
- Performance: no noticeable interaction regression from backdrop filters; CI budget remains within agreed threshold.

## Status
- Architecture, variable map, guardrails, and quality gates are defined.
- Component-level refactor work has **not** started in this phase.
