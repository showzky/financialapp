type GradientColors = readonly [string, string, ...string[]]

export type LoginScreenThemeId = 'default' | 'easter-renewal'

export type LoginScreenTheme = {
  id: LoginScreenThemeId
  eventLabel?: string
  badgeLabel?: string
  title: string
  subtitleLead?: string
  subtitle: string
  submitLabel: string
  secondaryPrompt: string
  secondaryActionLabel: string
  forgotPasswordLabel: string
  keepSignedInLabel: string
  colors: {
    screenGradient: GradientColors
    frameGradient: GradientColors
    sceneGradient: GradientColors
    cardBackground: string
    cardBorder: string
    cardChipBackground: string
    cardChipBorder: string
    title: string
    body: string
    muted: string
    inputBackground: string
    inputBorder: string
    inputText: string
    inputPlaceholder: string
    buttonGradient: GradientColors
    buttonShadow: string
    buttonDisabled: GradientColors
    errorBackground: string
    errorBorder: string
    errorText: string
  }
}
