// ADD THIS: Modular card row for history records with open/delete actions
import { Link } from 'react-router-dom'
import { NeoCard } from '@/components/NeoCard'
import type { HistoryRecord } from '@/types/budget'
import { formatCurrency } from '@/utils/currency'

type HistoryRecordCardProps = {
  record: HistoryRecord
  onDelete: (id: string) => void
}

export const HistoryRecordCard = ({ record, onDelete }: HistoryRecordCardProps) => {
  const handleDelete = () => {
    // ADD THIS: lightweight safety confirmation
    const confirmed = window.confirm('Delete this monthly record? This cannot be undone.')
    if (!confirmed) return
    onDelete(record.id)
  }

  return (
    <NeoCard className="grid items-center gap-4 p-4 md:grid-cols-[1.2fr_1fr_auto_auto]">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Pay period</p>
        <p className="text-lg font-semibold text-text-primary">{record.dateRange}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Summary</p>
        <p className="text-sm text-text-primary">
          Saved {formatCurrency(record.summary.totalSaved)} • Spent{' '}
          {formatCurrency(record.summary.spent)}/ {formatCurrency(record.summary.allocated)}
        </p>
      </div>

      <Link
        to={`/history/${record.id}`}
        className="glass-panel px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10"
      >
        Open
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        className="glass-panel px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-white/10"
      >
        Delete
      </button>
    </NeoCard>
  )
}
