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
        cardShadow: 'rgba(0,0,0,0.32)',
        divider: activeTheme.colors.surfaceBorder,
        chipText: activeTheme.colors.mutedText,
        chipBackground: activeTheme.colors.surfaceAlt,
        inputBackground: activeTheme.colors.surfaceAlt,
      },
    }
  }, [theme])
}
