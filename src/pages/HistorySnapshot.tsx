// ADD THIS: Read-only historical dashboard view for a selected history record
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FinanceDashboardSnapshot } from '@/components/FinanceDashboardSnapshot'
import { NeoCard } from '@/components/NeoCard'
import { useFinanceData } from '@/context/FinanceDataContext'

export const HistorySnapshot = () => {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const { getHistoryRecordById, deleteHistoryRecord } = useFinanceData()

  const record = params.id ? getHistoryRecordById(params.id) : undefined

  if (!record) {
    return (
      <NeoCard className="mx-auto max-w-6xl p-6 glass-panel">
        <h1 className="text-xl font-semibold text-text-primary">Snapshot not found</h1>
        <p className="mt-2 text-sm text-text-muted">This historical record no longer exists.</p>
        <Link
          to="/history"
          className="glass-panel mt-4 inline-flex px-4 py-2 text-sm transition-all hover:bg-white/10"
        >
          Back to History
        </Link>
      </NeoCard>
    )
  }

  const handleDelete = () => {
    // ADD THIS: allow deleting while inspecting a snapshot
    const confirmed = window.confirm('Delete this historical snapshot?')
    if (!confirmed) return
    deleteHistoryRecord(record.id)
    navigate('/history')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="history-header glass-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Historical View</p>
            <h1 className="text-2xl font-semibold text-text-primary">{record.dateRange}</h1>
            <p className="text-sm text-text-muted">Read-only snapshot of your past month</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="glass-panel px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-white/10"
            >
              Delete Record
            </button>
            <Link
              to="/"
              className="glass-panel px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10"
            >
              Back to Active Dashboard
            </Link>
          </div>
        </div>
      </header>

      <FinanceDashboardSnapshot data={record.snapshot} />
    </div>
  )
}
