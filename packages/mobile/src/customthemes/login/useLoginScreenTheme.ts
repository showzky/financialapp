import { useCustomTheme } from '..'

import { defaultLoginTheme, easterRenewalLoginTheme } from './loginThemeRegistry'

export function useLoginScreenTheme() {
  const { activeThemeId } = useCustomTheme()

  if (activeThemeId === 'easter') {
    return easterRenewalLoginTheme
  }

  return defaultLoginTheme
}
