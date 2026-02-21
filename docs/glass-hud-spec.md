# Glass HUD UI Specification

This document defines the high-tech Glassmorphic UI HUD (Heads-Up Display) specifications for the application.

## 🎨 CSS Variables

The following CSS variables are used to create the glassmorphic effect across different themes:

| Variable | Description |
| :--- | :--- |
| `--glass-bg` | The semi-transparent background color of the glass panels. |
| `--glass-border` | The color of the 1px solid border surrounding glass panels. |
| `--glass-blur` | The backdrop filter value (blur and saturation) for the transparency effect. |

## 🌓 Theme Matrix

To maintain consistency and readability (WCAG 2.1 AA), the variables scale as follows:

| Theme | `--glass-bg` | `--glass-border` | `--glass-blur` |
| :--- | :--- | :--- | :--- |
| **Aurora (Light)** | `rgba(255, 255, 255, 0.2)` | `rgba(255, 255, 255, 0.4)` | `blur(20px) saturate(160%)` |
| **Midnight (Dark)** | `rgba(15, 23, 42, 0.4)` | `rgba(255, 255, 255, 0.1)` | `blur(20px) saturate(160%)` |
| **Sunset (Warm)** | `rgba(255, 245, 235, 0.25)` | `rgba(255, 255, 255, 0.3)` | `blur(20px) saturate(160%)` |

## � Semantic Status Tokens

To ensure accessibility (WCAG 2.1 AA) and visual consistency across the HUD, the following semantic variables are integrated with the glass layers:

| Token | CSS Variable | Use Case |
| :--- | :--- | :--- |
| **Success** | `--color-success` | Repaid loans, positive growth, healthy budgets. |
| **Warning** | `--color-warning` | Loans due soon, nearing budget limits. |
| **Error** | `--color-error` | Overdue loans, exceeded budgets. |

These tokens are mapped to Tailwind classes (e.g., `text-success`, `bg-error/10`) and are tested for contrast on both Aurora (Light) and Midnight (Dark) glass panels.

## �🛠️ Utility Class: `.glass-panel`

The `.glass-panel` utility should be applied to containers to achieve the HUD look:

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  /* Top-edge highlight for high-tech feel */
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}
```
