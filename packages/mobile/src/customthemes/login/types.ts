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
    gridLine: string
    haloPrimary: string
    haloSecondary: string
    cardBackground: string
    cardBorder: string
    cardChipBackground: string
    cardChipBorder: string
    segmentedBackground: string
    segmentedBorder: string
    segmentedThumb: GradientColors
    segmentedThumbShadow: string
    segmentedActiveText: string
    segmentedInactiveText: string
    title: string
    body: string
    muted: string
    eyebrow: string
    accentSurface: string
    accentBorder: string
    accentIcon: string
    inputBackground: string
    inputBorder: string
    inputText: string
    inputPlaceholder: string
    divider: string
    buttonGradient: GradientColors
    buttonShadow: string
    buttonText: string
    buttonDisabled: GradientColors
    errorBackground: string
    errorBorder: string
    errorText: string
  }
}
