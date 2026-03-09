import type { BudgetState, CaptureMode, HistoryRecord, HistorySummary } from '@/types/budget'

export type HistoryPeriod = {
  periodKey: string
  periodStart: string
  periodEnd: string
  label: string
}

export type CreateHistoryRecordInput = {
  snapshot: BudgetState
  summary: HistorySummary
  period: HistoryPeriod
  createdAt?: string
  id?: string
}

export type HistoryCaptureResult =
  | { status: 'created'; record: HistoryRecord }
  | { status: 'duplicate'; existingRecord: HistoryRecord }

export type HistoryRepository = {
  list: () => HistoryRecord[]
  getById: (id: string) => HistoryRecord | undefined
  getByPeriodKey: (periodKey: string) => HistoryRecord | undefined
  create: (input: CreateHistoryRecordInput) => HistoryCaptureResult
  remove: (id: string) => void
}

export type CaptureSettings = {
  captureMode: CaptureMode
}

export type CaptureSettingsRepository = {
  read: () => CaptureSettings
  write: (settings: CaptureSettings) => CaptureSettings
}
