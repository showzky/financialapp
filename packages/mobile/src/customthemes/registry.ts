import type { CustomThemeDefinition, CustomThemeId } from './types'

const DARK_BASE = {
  screenBackground: '#0a0a0b',
  surface: '#111114',
  surfaceAlt: '#18181c',
  surfaceMuted: '#202026',
  surfaceBorder: 'rgba(255,255,255,0.055)',
  surfaceBorderStrong: 'rgba(255,255,255,0.10)',
  text: '#f0ede8',
  mutedText: '#b8b4ae',
  subtleText: '#6b6862',
  tabBarBackground: '#111114',
}

function createDarkSeasonalTheme(
  id: Exclude<CustomThemeId, 'default'>,
  input: {
    label: string
    description: string
    accent: string
    accent2: string
    secondary: string
    tertiary: string
  },
): CustomThemeDefinition {
  const { accent, accent2, secondary, tertiary } = input

  return {
    id,
    label: input.label,
    description: input.description,
    swatches: [accent, accent2, secondary, tertiary],
    colors: {
      ...DARK_BASE,
      accent,
      accent2,
      secondary,
      tertiary,
      accentSoft: `${accent}1A`,
      accentLine: `${accent}3D`,
      accentGlow: `${accent}14`,
      secondarySoft: `${secondary}1A`,
      secondaryLine: `${secondary}38`,
      tertiarySoft: `${tertiary}1A`,
      tertiaryLine: `${tertiary}38`,
      heroGradient: ['#0f0f13', '#13111a'],
      heroEyebrow: accent,
      heroTitle: '#f0ede8',
      heroSubtitle: '#b8b4ae',
      heroActionSurface: 'rgba(255,255,255,0.04)',
      heroActionBorder: 'rgba(255,255,255,0.10)',
      heroActionText: '#f0ede8',
      heroCardSurface: 'rgba(255,255,255,0.04)',
      heroCardBorder: 'rgba(255,255,255,0.08)',
      progressTrack: 'rgba(255,255,255,0.07)',
      success: secondary,
      warning: accent2,
      danger: '#f26d6d',
      tabBarActive: accent2,
      tabBarInactive: '#6b6862',
    },
  }
}

export const customThemeOrder: CustomThemeId[] = ['default', 'spring', 'easter', 'summer', 'winter']

export const customThemeRegistry: Record<CustomThemeId, CustomThemeDefinition> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'The original mobile app theme.',
    swatches: ['#3b82f6', '#8b5cf6', '#10b981', '#22c55e'],
    colors: {
      screenBackground: '#f3f4f8',
      surface: '#ffffff',
      surfaceAlt: '#f8fafc',
      surfaceMuted: '#eef2ff',
      surfaceBorder: '#dbe4f0',
      surfaceBorderStrong: '#c9d6ea',
      text: '#1e293b',
      mutedText: '#64748b',
      subtleText: '#94a3b8',
      accent: '#8b5cf6',
      accent2: '#a855f7',
      secondary: '#10b981',
      tertiary: '#38bdf8',
      accentSoft: '#f3e8ff',
      accentLine: '#e9d5ff',
      accentGlow: 'rgba(168,85,247,0.16)',
      secondarySoft: '#dcfce7',
      secondaryLine: '#86efac',
      tertiarySoft: '#dbeafe',
      tertiaryLine: '#93c5fd',
      heroGradient: ['#17325d', '#284a7d'],
      heroEyebrow: '#93c5fd',
      heroTitle: '#f8fafc',
      heroSubtitle: '#dbe4f0',
      heroActionSurface: 'rgba(255,255,255,0.12)',
      heroActionBorder: 'rgba(255,255,255,0.16)',
      heroActionText: '#e0f2fe',
      heroCardSurface: 'rgba(255,255,255,0.08)',
      heroCardBorder: 'rgba(255,255,255,0.12)',
      progressTrack: 'rgba(255,255,255,0.12)',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      tabBarBackground: '#f8f5fb',
      tabBarActive: '#a855f7',
      tabBarInactive: '#b4a3c7',
    },
  },
  spring: createDarkSeasonalTheme('spring', {
    label: 'Spring',
    description: 'Cherry blossoms, fresh green, soft rose.',
    accent: '#e8a0b4',
    accent2: '#f2b8c8',
    secondary: '#8ecb8e',
    tertiary: '#b8a4e8',
  }),
  easter: createDarkSeasonalTheme('easter', {
    label: 'Easter',
    description: 'Gold, soft mint, gentle lavender.',
    accent: '#c9a84c',
    accent2: '#e2c06a',
    secondary: '#a8d8b8',
    tertiary: '#d4a8d4',
  }),
  summer: createDarkSeasonalTheme('summer', {
    label: 'Summer',
    description: 'Burnt orange, warm amber, golden sun.',
    accent: '#e8873a',
    accent2: '#f5a04a',
    secondary: '#5ebd97',
    tertiary: '#e8c43a',
  }),
  winter: createDarkSeasonalTheme('winter', {
    label: 'Winter',
    description: 'Cold steel blue, icy clarity, quiet focus.',
    accent: '#7ab8d8',
    accent2: '#96cce8',
    secondary: '#a0c4d8',
    tertiary: '#8ab4e8',
  }),
}
