// ADD THIS: Shared finance data context for active + historical dashboard states
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useBudgetContext } from '@/context/BudgetContext'
import { createLocalStorageCaptureSettingsRepository } from '@/repositories/captureSettingsRepository'
import { createLocalStorageHistoryRepository } from '@/repositories/historyRepository'
import type { BudgetState, CaptureMode, HistoryRecord } from '@/types/budget'
import type { HistoryCaptureResult } from '@/types/history'
import { cloneBudgetState, computeHistorySummary } from '@/utils/history'
import { buildPayPeriodFromMonth, getCurrentPayPeriod } from '@/utils/payPeriod'

const historyRepository = createLocalStorageHistoryRepository()
const captureSettingsRepository = createLocalStorageCaptureSettingsRepository()

const FinanceDataContext = createContext<
  | {
      historyRecords: HistoryRecord[]
      captureMode: CaptureMode
      setCaptureMode: (mode: CaptureMode) => void
      captureCurrentPayPeriod: () => HistoryCaptureResult
      capturePayPeriodByMonth: (year: number, monthIndex: number) => HistoryCaptureResult
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
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => historyRepository.list())
  const [captureMode, setCaptureModeState] = useState<CaptureMode>(
    () => captureSettingsRepository.read().captureMode,
  )

  const captureSnapshot = (period: ReturnType<typeof getCurrentPayPeriod>): HistoryCaptureResult => {
    const snapshot = cloneBudgetState(state)
    const snapshotWithMonth: BudgetState = {
      ...snapshot,
      month: period.label,
    }
    const result = historyRepository.create({
      snapshot: snapshotWithMonth,
      summary: computeHistorySummary(snapshotWithMonth),
      period,
    })

    setHistoryRecords(historyRepository.list())
    return result
  }

  const setCaptureMode = (mode: CaptureMode) => {
    const next = captureSettingsRepository.write({ captureMode: mode })
    setCaptureModeState(next.captureMode)
  }

  const captureCurrentPayPeriod = () => captureSnapshot(getCurrentPayPeriod())

  const capturePayPeriodByMonth = (year: number, monthIndex: number) =>
    captureSnapshot(buildPayPeriodFromMonth(year, monthIndex))

  const deleteHistoryRecord = (id: string) => {
    // ADD THIS: remove a monthly record by id
    historyRepository.remove(id)
    setHistoryRecords(historyRepository.list())
  }

  const getHistoryRecordById = useMemo(
    () => (id: string) => historyRecords.find((record) => record.id === id),
    [historyRecords],
  )

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
        captureMode,
        setCaptureMode,
        captureCurrentPayPeriod,
        capturePayPeriodByMonth,
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
