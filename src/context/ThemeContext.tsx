import React, { createContext, useContext, useEffect, useState } from 'react'
import { applyThemePreset, getThemePresetById } from '@/styles/themePresets'

export type Theme = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  isDark: boolean
  selectedPresetId: string
  setSelectedPresetId: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'app:theme'
const STORAGE_KEY_PRESET = 'app:themePreset'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
    } catch {}
    return 'system'
  })

  const [selectedPresetId, setSelectedPresetIdState] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRESET)
      if (raw) return raw
    } catch {}
    return getThemePresetById('aurora-mist').id
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}

    const apply = () => {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolvedIsDark = theme === 'system' ? prefersDark : theme === 'dark'
      document.documentElement.setAttribute('data-theme', resolvedIsDark ? 'dark' : 'light')

      try {
        const preset = getThemePresetById(selectedPresetId)
        applyThemePreset(document.documentElement, preset)
      } catch {}
    }

    apply()

    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
    const listener = () => apply()
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', listener)
      return () => mql.removeEventListener('change', listener)
    }
    return undefined
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)

  const setSelectedPresetId = (id: string) => {
    setSelectedPresetIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY_PRESET, id)
    } catch {}
  }

  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'system' ? prefersDark : theme === 'dark'

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, selectedPresetId, setSelectedPresetId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default ThemeContext
