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
      <header className="obsidian-panel p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="obsidian-kicker">Monthly Records</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#f0ede8]">Archived snapshots</h1>
              <p className="mt-2 text-sm text-[#b8b4ae]">
                Archive payday-based snapshots and backfill missed periods manually.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrimaryCapture}
              className="obsidian-button obsidian-button--gold px-4 py-3 text-sm font-semibold"
            >
              {captureMode === 'manual' ? '+ Capture Selected Pay Period' : '+ Capture Current Pay Period'}
            </button>
          </div>

          <div>
            <p className="obsidian-kicker">Manual Backfill</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="month"
                value={manualMonth}
                onChange={(event) => setManualMonth(event.target.value)}
                className="obsidian-field max-w-[12rem] px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={handleManualCapture}
                className="obsidian-button px-4 py-3 text-sm font-semibold"
              >
                Capture Chosen Period
              </button>
              <p className="text-sm text-[#b8b4ae]">Current payday period: {currentPeriodLabel}</p>
            </div>
            {feedback ? (
              <div className="obsidian-subpanel mt-3 border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.08)] px-4 py-3 text-sm text-[#e2c06a]">
                {feedback}
              </div>
            ) : null}
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
