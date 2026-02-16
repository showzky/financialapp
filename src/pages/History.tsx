// ADD THIS: History list page reading localStorage-backed records
import { HistoryRecordCard } from '@/components/HistoryRecordCard'
import { NeoCard } from '@/components/NeoCard'
import { useFinanceData } from '@/context/FinanceDataContext'

export const History = () => {
  const { historyRecords, createSnapshotFromActive, deleteHistoryRecord } = useFinanceData()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center justify-between rounded-neo bg-surface p-4 shadow-neo-md">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Monthly Records</h1>
          <p className="text-sm text-text-muted">
            Archived pay-period snapshots from local storage
          </p>
        </div>
        <button
          type="button"
          onClick={createSnapshotFromActive}
          className="neo-card neo-pressable px-4 py-2 text-sm font-semibold text-text-primary"
        >
          + Capture Current Month
        </button>
      </header>

      {historyRecords.length === 0 ? (
        <NeoCard className="p-6 text-center">
          <p className="text-sm text-text-muted">
            No history yet. Capture your first monthly record.
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
