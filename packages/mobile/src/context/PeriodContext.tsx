// @ts-nocheck
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'dashboard:selected-month'

const getStartOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)

type PeriodContextValue = {
  selectedMonth: Date
  setSelectedMonth: (date: Date) => Promise<void>
}

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined)

export const PeriodProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedMonth, setSelectedMonthState] = useState<Date>(getStartOfMonth(new Date()))

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY)
        if (!storedValue) return
        const parsed = new Date(storedValue)
        if (Number.isNaN(parsed.getTime())) return
        setSelectedMonthState(getStartOfMonth(parsed))
      } catch {}
    }

    void hydrate()
  }, [])

  const setSelectedMonth = async (date: Date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return
    }

    const normalized = getStartOfMonth(date)
    setSelectedMonthState(normalized)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, normalized.toISOString())
    } catch {}
  }

  const value = useMemo(
    () => ({
      selectedMonth,
      setSelectedMonth,
    }),
    [selectedMonth],
  )

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

export const usePeriod = () => {
  const context = useContext(PeriodContext)
  if (!context) {
    throw new Error('usePeriod must be used within PeriodProvider')
  }
  return context
}
