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
    <NeoCard className="obsidian-card grid items-center gap-4 p-4 md:grid-cols-[1.2fr_1fr_auto_auto]">
      <div>
        <p className="obsidian-kicker">Pay period</p>
        <p className="text-lg font-semibold text-[#f0ede8]">{record.label}</p>
        <p className="mt-1 text-xs text-[#b8b4ae]">
          {record.periodStart} to {record.periodEnd}
        </p>
      </div>

      <div>
        <p className="obsidian-kicker">Summary</p>
        <p className="text-sm text-[#f0ede8]">
          Saved {formatCurrency(record.summary.totalSaved)} • Spent{' '}
          {formatCurrency(record.summary.spent)}/ {formatCurrency(record.summary.allocated)}
        </p>
      </div>

      <Link
        to={`/history/${record.id}`}
        className="obsidian-button px-4 py-2 text-sm font-semibold"
      >
        Open
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        className="obsidian-button obsidian-button--danger px-4 py-2 text-sm font-semibold"
      >
        Delete
      </button>
    </NeoCard>
  )
}
