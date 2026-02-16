// ADD THIS: Shared finance data context for active + historical dashboard states
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useBudgetContext } from '@/context/BudgetContext'
import type { BudgetState, HistoryRecord } from '@/types/budget'

const HISTORY_STORAGE_KEY = 'finance-history-records-v1'

const computeSummary = (snapshot: BudgetState) => {
  const allocated = snapshot.categories.reduce((sum, category) => sum + category.allocated, 0)
  const spent = snapshot.categories.reduce((sum, category) => sum + category.spent, 0)
  const totalSaved = Math.max(snapshot.income - allocated, 0)
  return { allocated, spent, totalSaved }
}

const buildSnapshotDateRange = (snapshot: BudgetState) => {
  // ADD THIS: lightweight date range cue for record cards
  if (snapshot.month) return snapshot.month
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

const cloneState = (state: BudgetState): BudgetState => ({
  ...state,
  categories: state.categories.map((category) => ({ ...category })),
})

const readHistoryFromStorage = (): HistoryRecord[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

const FinanceDataContext = createContext<
  | {
      historyRecords: HistoryRecord[]
      createSnapshotFromActive: () => void
      deleteHistoryRecord: (id: string) => void
      getHistoryRecordById: (id: string) => HistoryRecord | undefined
      getDisplayState: (historyId?: string) => {
        state: BudgetState
        readOnly: boolean
        isHistorical: boolean
      }
    }
  | undefined
>(undefined)

export const FinanceDataProvider = ({ children }: { children: ReactNode }) => {
  const { state } = useBudgetContext()
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(readHistoryFromStorage)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRecords))
  }, [historyRecords])

  const createSnapshotFromActive = () => {
    // ADD THIS: store monthly record snapshot in localStorage-backed array
    const snapshot = cloneState(state)
    const record: HistoryRecord = {
      id: `${Date.now()}`,
      dateRange: buildSnapshotDateRange(snapshot),
      createdAt: new Date().toISOString(),
      snapshot,
      summary: computeSummary(snapshot),
    }

    setHistoryRecords((current) => [record, ...current])
  }

  const deleteHistoryRecord = (id: string) => {
    // ADD THIS: remove a monthly record by id
    setHistoryRecords((current) => current.filter((record) => record.id !== id))
  }

  const getHistoryRecordById = (id: string) => historyRecords.find((record) => record.id === id)

  const getDisplayState = (historyId?: string) => {
    if (!historyId) {
      return {
        state,
        readOnly: false,
        isHistorical: false,
      }
    }

    const record = getHistoryRecordById(historyId)

    if (!record) {
      return {
        state,
        readOnly: true,
        isHistorical: true,
      }
    }

    return {
      state: record.snapshot,
      readOnly: true,
      isHistorical: true,
    }
  }

  return (
    <FinanceDataContext.Provider
      value={{
        historyRecords,
        createSnapshotFromActive,
        deleteHistoryRecord,
        getHistoryRecordById,
        getDisplayState,
      }}
    >
      {children}
    </FinanceDataContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- ADD THIS: colocate provider and hook
export const useFinanceData = () => {
  const context = useContext(FinanceDataContext)
  if (!context) {
    throw new Error('useFinanceData must be used inside FinanceDataProvider')
  }
  return context
}
