import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { customThemeOrder, customThemeRegistry } from './registry'
import { resolveSeasonalTheme } from './seasonResolver'
import type { CustomThemeContextValue, CustomThemeId } from './types'

const CustomThemeContext = createContext<CustomThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'app:manual-theme-id'

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [manualThemeId, setManualThemeId] = useState<CustomThemeId | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let isMounted = true

    const hydrateTheme = async () => {
      try {
        const storedThemeId = await AsyncStorage.getItem(STORAGE_KEY)

        if (!isMounted) {
          return
        }

        if (storedThemeId && storedThemeId in customThemeRegistry) {
          setManualThemeId(storedThemeId as CustomThemeId)
        }
      } catch (error) {
        console.error('Failed to restore manual theme:', error)
      } finally {
        if (isMounted) {
          setIsHydrated(true)
        }
      }
    }

    void hydrateTheme()

    return () => {
      isMounted = false
    }
  }, [])

  const resolvedThemeId = useMemo(() => resolveSeasonalTheme(new Date()), [])
  const activeThemeId = manualThemeId ?? resolvedThemeId
  const activeTheme = customThemeRegistry[activeThemeId]

  const persistThemeId = useCallback(async (themeId: CustomThemeId | null) => {
    try {
      if (themeId === null) {
        await AsyncStorage.removeItem(STORAGE_KEY)
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, themeId)
      }
    } catch (error) {
      console.error('Failed to persist theme selection:', error)
    }
  }, [])

  const selectTheme = useCallback((themeId: CustomThemeId | null) => {
    setManualThemeId(themeId)
    void persistThemeId(themeId)
  }, [persistThemeId])

  const value = useMemo<CustomThemeContextValue>(
    () => ({
      activeTheme,
      activeThemeId,
      resolvedThemeId,
      source: manualThemeId ? 'manual' : 'auto',
      manualThemeId,
      isHydrated,
      selectTheme,
      setManualThemeId: selectTheme,
      clearManualTheme: () => selectTheme(null),
      cycleTheme: () => {
        const currentIndex = manualThemeId ? customThemeOrder.indexOf(manualThemeId) : -1
        const nextThemeId = currentIndex === customThemeOrder.length - 1
          ? null
          : customThemeOrder[currentIndex + 1]

        selectTheme(nextThemeId)
      },
    }),
    [activeTheme, activeThemeId, isHydrated, manualThemeId, resolvedThemeId, selectTheme],
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
