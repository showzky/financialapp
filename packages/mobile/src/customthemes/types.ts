export type CustomThemeId = 'default' | 'spring' | 'summer' | 'easter' | 'christmas'

export type ThemeSource = 'auto' | 'manual'

export type CustomThemeDefinition = {
  id: CustomThemeId
  label: string
  colors: {
    screenBackground: string
    surface: string
    surfaceBorder: string
    text: string
    mutedText: string
    accent: string
    accentSoft: string
    tabBarBackground: string
    tabBarActive: string
    tabBarInactive: string
  }
}

export type CustomThemeContextValue = {
  activeTheme: CustomThemeDefinition
  activeThemeId: CustomThemeId
  resolvedThemeId: CustomThemeId
  source: ThemeSource
  manualThemeId: CustomThemeId | null
  setManualThemeId: (themeId: CustomThemeId | null) => void
  clearManualTheme: () => void
  cycleTheme: () => void
}
