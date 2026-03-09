import type { HistoryRecord } from '@/types/budget'
import type {
  CreateHistoryRecordInput,
  HistoryCaptureResult,
  HistoryRepository,
  HistoryPeriod,
} from '@/types/history'
import { buildHistoryRecord } from '@/utils/history'
import {
  buildPayPeriodFromDate,
  buildPayPeriodFromMonth,
  formatPayPeriodLabel,
  getCurrentPayPeriod,
  parseMonthLabel,
} from '@/utils/payPeriod'

const HISTORY_STORAGE_KEY = 'finance-history-records-v2'
const LEGACY_HISTORY_STORAGE_KEY = 'finance-history-records-v1'

type LegacyHistoryRecord = {
  id?: string
  dateRange?: string
  createdAt?: string
  snapshot?: {
    month?: string
    income?: number
    categories?: unknown[]
  }
  summary?: HistoryRecord['summary']
}

const isHistoryRecord = (value: unknown): value is HistoryRecord => {
  if (!value || typeof value !== 'object') return false

  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'periodKey' in value &&
    typeof value.periodKey === 'string' &&
    'periodStart' in value &&
    typeof value.periodStart === 'string' &&
    'periodEnd' in value &&
    typeof value.periodEnd === 'string' &&
    'label' in value &&
    typeof value.label === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'string' &&
    'snapshot' in value &&
    typeof value.snapshot === 'object' &&
    Boolean(value.snapshot) &&
    'summary' in value &&
    typeof value.summary === 'object' &&
    Boolean(value.summary)
  )
}

const resolveLegacyPeriod = (record: LegacyHistoryRecord): HistoryPeriod => {
  const parsedMonth = parseMonthLabel(record.snapshot?.month ?? record.dateRange ?? '')
  if (parsedMonth) {
    const period = buildPayPeriodFromMonth(parsedMonth.year, parsedMonth.monthIndex)
    return {
      ...period,
      label: formatPayPeriodLabel(period),
    }
  }

  const fallbackDate = record.createdAt ? new Date(record.createdAt) : new Date()
  const period = buildPayPeriodFromDate(
    Number.isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate,
  )

  return {
    ...period,
    label: formatPayPeriodLabel(period),
  }
}

export const normalizeHistoryRecords = (raw: unknown): HistoryRecord[] => {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item, index) => {
    if (isHistoryRecord(item)) {
      return [
        {
          ...item,
          label: item.label || formatPayPeriodLabel(item),
        },
      ]
    }

    if (!item || typeof item !== 'object') return []

    const legacyRecord = item as LegacyHistoryRecord
    if (!legacyRecord.snapshot || typeof legacyRecord.snapshot !== 'object') return []

    const period = resolveLegacyPeriod(legacyRecord)
    const snapshot = {
      month:
        typeof legacyRecord.snapshot.month === 'string'
          ? legacyRecord.snapshot.month
          : getCurrentPayPeriod().label,
      income:
        typeof legacyRecord.snapshot.income === 'number' ? legacyRecord.snapshot.income : 0,
      categories: Array.isArray(legacyRecord.snapshot.categories)
        ? legacyRecord.snapshot.categories
        : [],
    }

    const summary = legacyRecord.summary ?? {
      allocated: 0,
      spent: 0,
      totalSaved: Math.max(snapshot.income, 0),
    }

    return [
      buildHistoryRecord({
        id:
          typeof legacyRecord.id === 'string' && legacyRecord.id
            ? legacyRecord.id
            : `legacy-${index}`,
        createdAt:
          typeof legacyRecord.createdAt === 'string' ? legacyRecord.createdAt : new Date().toISOString(),
        snapshot,
        summary,
        period,
      }),
    ]
  })
}

const readRecordsFromStorage = (): HistoryRecord[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (raw) {
      return normalizeHistoryRecords(JSON.parse(raw))
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY)
    if (!legacyRaw) return []

    return normalizeHistoryRecords(JSON.parse(legacyRaw))
  } catch {
    return []
  }
}

const persistRecords = (records: HistoryRecord[]) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records))
}

const sortRecords = (records: HistoryRecord[]) =>
  [...records].sort((left, right) => right.periodStart.localeCompare(left.periodStart))

export const createLocalStorageHistoryRepository = (): HistoryRepository => {
  let records = sortRecords(readRecordsFromStorage())
  let hasPersistedMigration = false

  const ensurePersisted = () => {
    if (hasPersistedMigration) return
    hasPersistedMigration = true
    persistRecords(records)
  }

  const create = (input: CreateHistoryRecordInput): HistoryCaptureResult => {
    const existingRecord = records.find((record) => record.periodKey === input.period.periodKey)
    if (existingRecord) {
      return { status: 'duplicate', existingRecord }
    }

    const record = buildHistoryRecord(input)
    records = sortRecords([record, ...records])
    persistRecords(records)
    return { status: 'created', record }
  }

  ensurePersisted()

  return {
    list: () => records,
    getById: (id) => records.find((record) => record.id === id),
    getByPeriodKey: (periodKey) => records.find((record) => record.periodKey === periodKey),
    create,
    remove: (id) => {
      records = records.filter((record) => record.id !== id)
      persistRecords(records)
    },
  }
}
