import React, { createContext, useContext, useMemo, useState } from 'react'

import { customThemeOrder, customThemeRegistry } from './registry'
import { resolveSeasonalTheme } from './seasonResolver'
import type { CustomThemeContextValue, CustomThemeId } from './types'

const CustomThemeContext = createContext<CustomThemeContextValue | undefined>(undefined)

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [manualThemeId, setManualThemeId] = useState<CustomThemeId | null>(null)

  const resolvedThemeId = useMemo(() => resolveSeasonalTheme(new Date()), [])
  const activeThemeId = manualThemeId ?? resolvedThemeId
  const activeTheme = customThemeRegistry[activeThemeId]

  const value = useMemo<CustomThemeContextValue>(
    () => ({
      activeTheme,
      activeThemeId,
      resolvedThemeId,
      source: manualThemeId ? 'manual' : 'auto',
      manualThemeId,
      setManualThemeId,
      clearManualTheme: () => setManualThemeId(null),
      cycleTheme: () => {
        const currentIndex = manualThemeId ? customThemeOrder.indexOf(manualThemeId) : -1
        const nextThemeId = currentIndex === customThemeOrder.length - 1
          ? null
          : customThemeOrder[currentIndex + 1]

        setManualThemeId(nextThemeId)
      },
    }),
    [activeTheme, activeThemeId, manualThemeId, resolvedThemeId],
  )

  return <CustomThemeContext.Provider value={value}>{children}</CustomThemeContext.Provider>
}

export function useCustomTheme() {
  const context = useContext(CustomThemeContext)

  if (!context) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider')
  }

  return context
}
