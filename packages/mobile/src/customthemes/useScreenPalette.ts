import { useMemo } from 'react'

import { useCustomTheme } from './CustomThemeProvider'

export function useScreenPalette() {
  const theme = useCustomTheme()

  return useMemo(() => {
    const { activeTheme } = theme
    const isDefault = activeTheme.id === 'default'

    return {
      ...theme,
      isDefault,
      colors: {
        ...activeTheme.colors,
        cardShadow: isDefault ? 'rgba(15,23,42,0.06)' : 'rgba(0,0,0,0.32)',
        divider: isDefault ? '#edf2f7' : activeTheme.colors.surfaceBorder,
        chipText: isDefault ? '#475569' : activeTheme.colors.mutedText,
        chipBackground: isDefault ? '#ffffff' : activeTheme.colors.surfaceAlt,
        inputBackground: isDefault ? '#ffffff' : activeTheme.colors.surfaceAlt,
      },
    }
  }, [theme])
}
