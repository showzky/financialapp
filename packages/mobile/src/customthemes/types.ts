export type CustomThemeId = 'default' | 'spring' | 'easter' | 'summer' | 'winter' | 'obisidan-wealth'

export type ThemeSource = 'auto' | 'manual'

export type CustomThemeDefinition = {
  id: CustomThemeId
  label: string
  description: string
  swatches: [string, string, string, string]
  colors: {
    screenBackground: string
    surface: string
    surfaceAlt: string
    surfaceMuted: string
    surfaceBorder: string
    surfaceBorderStrong: string
    text: string
    mutedText: string
    subtleText: string
    accent: string
    accent2: string
    secondary: string
    tertiary: string
    accentSoft: string
    accentLine: string
    accentGlow: string
    secondarySoft: string
    secondaryLine: string
    tertiarySoft: string
    tertiaryLine: string
    heroGradient: [string, string]
    heroEyebrow: string
    heroTitle: string
    heroSubtitle: string
    heroActionSurface: string
    heroActionBorder: string
    heroActionText: string
    heroCardSurface: string
    heroCardBorder: string
    progressTrack: string
    success: string
    warning: string
    danger: string
    tabBarBackground: string
    tabBarActive: string
    tabBarInactive: string

    // Atmospheric gradient (4-stop body gradient)
    gradientStops: [string, string, string, string]
    gradientLocations: [number, number, number, number]
    bloomOverlay: string

    // Ghost text (dimmer than subtleText)
    ghostText: string

    // Accent tint pairs (bg + border)
    goldTintBg: string
    goldTintBorder: string
    sageTintBg: string
    sageTintBorder: string
    roseTintBg: string
    roseTintBorder: string
    skyTintBg: string
    skyTintBorder: string
    amberTintBg: string
    amberTintBorder: string
  }
}

export type CustomThemeContextValue = {
  activeTheme: CustomThemeDefinition
  activeThemeId: CustomThemeId
  resolvedThemeId: CustomThemeId
  source: ThemeSource
  manualThemeId: CustomThemeId | null
  isHydrated: boolean
  selectTheme: (themeId: CustomThemeId | null) => void
  setManualThemeId: (themeId: CustomThemeId | null) => void
  clearManualTheme: () => void
  cycleTheme: () => void
}
