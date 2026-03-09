// ADD THIS: History list page reading localStorage-backed records
import { HistoryRecordCard } from '@/components/HistoryRecordCard'
import { NeoCard } from '@/components/NeoCard'
import { useFinanceData } from '@/context/FinanceDataContext'

export const History = () => {
  const { historyRecords, createSnapshotFromActive, deleteHistoryRecord } = useFinanceData()

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,19,37,0.94),rgba(7,16,31,0.94))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
              Monthly Records
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-text-primary">Archived snapshots</h1>
            <p className="mt-2 text-sm text-text-muted">
              Manual captures of prior months. These stay read-only once archived.
            </p>
          </div>
          <button
            type="button"
            onClick={createSnapshotFromActive}
            className="inline-flex items-center rounded-2xl border border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.12)] px-4 py-3 text-sm font-semibold text-accent transition hover:bg-[rgba(var(--accent-rgb),0.18)]"
          >
            + Capture Current Month
          </button>
        </div>
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
