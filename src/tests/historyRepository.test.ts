import { createLocalStorageCaptureSettingsRepository } from '@/repositories/captureSettingsRepository'
import { createLocalStorageHistoryRepository } from '@/repositories/historyRepository'
import { computeHistorySummary } from '@/utils/history'
import { buildPayPeriodFromMonth } from '@/utils/payPeriod'

const buildSnapshot = (month = 'March 2026') => ({
  month,
  income: 30000,
  categories: [
    {
      id: 'rent',
      name: 'Rent',
      type: 'fixed' as const,
      allocated: 10000,
      spent: 0,
    },
    {
      id: 'food',
      name: 'Food',
      type: 'budget' as const,
      allocated: 5000,
      spent: 1200,
    },
  ],
})

describe('historyRepository', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('blocks duplicate captures for the same period key', () => {
    const repository = createLocalStorageHistoryRepository()
    const snapshot = buildSnapshot()
    const period = buildPayPeriodFromMonth(2026, 2)

    const first = repository.create({
      snapshot,
      summary: computeHistorySummary(snapshot),
      period,
    })

    const duplicate = repository.create({
      snapshot,
      summary: computeHistorySummary(snapshot),
      period,
    })

    expect(first.status).toBe('created')
    expect(duplicate.status).toBe('duplicate')
    expect(repository.list()).toHaveLength(1)
  })

  it('migrates legacy v1 records into payday metadata', () => {
    window.localStorage.setItem(
      'finance-history-records-v1',
      JSON.stringify([
        {
          id: 'legacy-1',
          dateRange: 'March 2026',
          createdAt: '2026-03-20T10:00:00.000Z',
          snapshot: buildSnapshot('March 2026'),
          summary: {
            allocated: 15000,
            spent: 1200,
            totalSaved: 15000,
          },
        },
      ]),
    )

    const repository = createLocalStorageHistoryRepository()
    const [record] = repository.list()

    expect(record.id).toBe('legacy-1')
    expect(record.periodKey).toBe('2026-03-13')
    expect(record.label).toBe('Mar 13-Apr 14')
  })
})

describe('captureSettingsRepository', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists capture mode settings', () => {
    const repository = createLocalStorageCaptureSettingsRepository()

    expect(repository.read().captureMode).toBe('current-payday')

    repository.write({ captureMode: 'manual' })

    expect(repository.read().captureMode).toBe('manual')
  })
})
