// ADD THIS: History list page reading localStorage-backed records
import { useMemo, useState } from 'react'
import { HistoryRecordCard } from '@/components/HistoryRecordCard'
import { NeoCard } from '@/components/NeoCard'
import { useFinanceData } from '@/context/FinanceDataContext'
import { getCurrentPayPeriod } from '@/utils/payPeriod'

const toMonthInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export const History = () => {
  const {
    historyRecords,
    captureMode,
    captureCurrentPayPeriod,
    capturePayPeriodByMonth,
    deleteHistoryRecord,
  } = useFinanceData()
  const [manualMonth, setManualMonth] = useState(() => toMonthInputValue(new Date()))
  const [feedback, setFeedback] = useState<string>('')

  const currentPeriodLabel = useMemo(() => getCurrentPayPeriod().label, [])

  const handleCaptureResult = (
    result: ReturnType<typeof captureCurrentPayPeriod>,
    successMessage: string,
  ) => {
    if (result.status === 'duplicate') {
      setFeedback(`Already archived: ${result.existingRecord.label}.`)
      return
    }

    setFeedback(successMessage)
  }

  const handlePrimaryCapture = () => {
    if (captureMode === 'manual') {
      const [yearText, monthText] = manualMonth.split('-')
      const year = Number(yearText)
      const monthIndex = Number(monthText) - 1
      if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0) {
        setFeedback('Choose a valid month first.')
        return
      }

      handleCaptureResult(
        capturePayPeriodByMonth(year, monthIndex),
        'Manual pay period archived.',
      )
      return
    }

    handleCaptureResult(captureCurrentPayPeriod(), `Archived ${currentPeriodLabel}.`)
  }

  const handleManualCapture = () => {
    const [yearText, monthText] = manualMonth.split('-')
    const year = Number(yearText)
    const monthIndex = Number(monthText) - 1
    if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0) {
      setFeedback('Choose a valid month first.')
      return
    }

    handleCaptureResult(capturePayPeriodByMonth(year, monthIndex), 'Manual pay period archived.')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,19,37,0.94),rgba(7,16,31,0.94))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
                Monthly Records
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-text-primary">Archived snapshots</h1>
              <p className="mt-2 text-sm text-text-muted">
                Archive payday-based snapshots and backfill missed periods manually.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrimaryCapture}
              className="inline-flex items-center justify-center rounded-2xl border border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.12)] px-4 py-3 text-sm font-semibold text-accent transition hover:bg-[rgba(var(--accent-rgb),0.18)]"
            >
              {captureMode === 'manual' ? '+ Capture Selected Pay Period' : '+ Capture Current Pay Period'}
            </button>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
              Manual Backfill
            </p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="month"
                value={manualMonth}
                onChange={(event) => setManualMonth(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#111114] px-4 py-3 text-sm text-text-primary outline-none transition focus:border-[rgba(var(--accent-rgb),0.35)]"
              />
              <button
                type="button"
                onClick={handleManualCapture}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-text-primary transition hover:bg-white/10"
              >
                Capture Chosen Period
              </button>
              <p className="text-sm text-text-muted">Current payday period: {currentPeriodLabel}</p>
            </div>
            {feedback ? <p className="mt-3 text-sm text-[#e2c06a]">{feedback}</p> : null}
          </div>
        </div>
      </header>

      {historyRecords.length === 0 ? (
        <NeoCard className="p-6 text-center">
          <p className="text-sm text-text-muted">
            No history yet. Capture your first payday record.
          </p>
        </NeoCard>
      ) : (
        <div className="space-y-3">
          {historyRecords.map((record) => (
            <HistoryRecordCard key={record.id} record={record} onDelete={deleteHistoryRecord} />
          ))}
        </div>
      )}
    </div>
  )
}
