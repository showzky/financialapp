// ADD THIS: centralized, extensible theme preset registry for Settings Drawer
export type ThemeTokenName =
  | '--color-surface'
  | '--color-surface-strong'
  | '--color-accent'
  | '--color-accent-strong'
  | '--accent-rgb'
  | '--accent-strong-rgb'
  | '--color-text-primary'
  | '--color-text-muted'
  | '--color-shadow-dark'
  | '--color-shadow-light'
  | '--app-bg'

export type ThemePreset = {
  id: string
  name: string
  description: string
  swatches: [string, string, string]
  tokens: Record<ThemeTokenName, string>
}

// ADD THIS: three premium starter themes with distinct moods and high contrast
export const themePresets: ThemePreset[] = [
  {
    id: 'aurora-mist',
    name: 'Aurora Mist',
    description: 'Clean daylight gradients with crisp indigo highlights.',
    swatches: ['#eef4ff', '#cfdcff', '#5f72ff'],
    tokens: {
      '--color-surface': '#eaf0fb',
      '--color-surface-strong': '#dde6f5',
      '--color-accent': '#667cff',
      '--color-accent-strong': '#4e63dd',
      '--accent-rgb': '102, 124, 255',
      '--accent-strong-rgb': '78, 99, 221',
      '--color-text-primary': '#1d2b45',
      '--color-text-muted': '#66779a',
      '--color-shadow-dark': '#c4cfde',
      '--color-shadow-light': '#ffffff',
      '--app-bg': 'radial-gradient(circle at 20% 20%, #f5f9ff, #e9effa 45%, #dfe6f3 100%)',
    },
  },
  {
    id: 'mission-control',
    name: 'Obsidian Wealth',
    description: 'Dark luxury dashboard with gold accents and serif display type.',
    swatches: ['#111114', '#202026', '#c9a84c'],
    tokens: {
      '--color-surface': '#111114',
      '--color-surface-strong': '#18181c',
      '--color-accent': '#c9a84c',
      '--color-accent-strong': '#e2c06a',
      '--accent-rgb': '201, 168, 76',
      '--accent-strong-rgb': '226, 192, 106',
      '--color-text-primary': '#f0ede8',
      '--color-text-muted': '#b8b4ae',
      '--color-shadow-dark': '#06060a',
      '--color-shadow-light': '#1a1a20',
      '--app-bg': 'linear-gradient(180deg, #0a0a0b, #0a0a0b)',
    },
  },
  {
    id: 'sunset-bloom',
    name: 'Sunset Bloom',
    description: 'Warm peach tones with elegant fuchsia accents.',
    swatches: ['#fff1ea', '#ffd7c7', '#f06fa1'],
    tokens: {
      '--color-surface': '#fff1eb',
      '--color-surface-strong': '#ffe3d8',
      '--color-accent': '#f178a7',
      '--color-accent-strong': '#d95488',
      '--accent-rgb': '241, 120, 167',
      '--accent-strong-rgb': '217, 84, 136',
      '--color-text-primary': '#3d2a33',
      '--color-text-muted': '#8f6d7d',
      '--color-shadow-dark': '#e7c5b8',
      '--color-shadow-light': '#ffffff',
      '--app-bg': 'radial-gradient(circle at 20% 20%, #fff9f6, #ffefe8 45%, #ffe5dc 100%)',
    },
  },
]

// ADD THIS: helper to safely resolve persisted theme ids
export const getThemePresetById = (themeId: string) =>
  themePresets.find((theme) => theme.id === (themeId === 'midnight-luxe' ? 'mission-control' : themeId)) ?? themePresets[0]

// ADD THIS: applies all CSS token overrides to the root element
export const applyThemePreset = (target: HTMLElement, preset: ThemePreset) => {
  Object.entries(preset.tokens).forEach(([tokenName, tokenValue]) => {
    target.style.setProperty(tokenName, tokenValue)
  })

  target.setAttribute('data-theme-preset', preset.id)
}
