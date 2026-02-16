// ADD THIS: recurring automation hook (runs on app load/new pay period)
import { useEffect, useState } from 'react'
import { useBudgets } from '@/hooks/useBudgets'

const LAST_AUTOMATION_DAY_KEY = 'finance-last-recurring-day-v1'

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const useRecurringAutomation = () => {
  const { checkAndApplyRecurring } = useBudgets()
  const [automationMessage, setAutomationMessage] = useState<string | null>(null)

  useEffect(() => {
    // ADD THIS: run at most once per local calendar day
    const today = new Date()
    const dayKey = getLocalDateKey(today)
    const previousDayKey = window.localStorage.getItem(LAST_AUTOMATION_DAY_KEY)

    if (previousDayKey === dayKey) {
      return
    }

    const result = checkAndApplyRecurring(today)
    window.localStorage.setItem(LAST_AUTOMATION_DAY_KEY, dayKey)

    if (result.appliedCount > 0) {
      const previewNames = result.appliedNames.slice(0, 3).join(', ')
      const plusSuffix = result.appliedNames.length > 3 ? '…' : ''
      const timeoutId = window.setTimeout(() => {
        setAutomationMessage(
          `Today's recurring check applied ${result.appliedCount} transactions (${previewNames}${plusSuffix}).`,
        )
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [checkAndApplyRecurring])

  return {
    automationMessage,
    clearAutomationMessage: () => setAutomationMessage(null),
  }
}
