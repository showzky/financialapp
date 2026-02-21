import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { NeoCard } from '@/components/NeoCard'
import type { LoanSummary } from '@/types/loan'
import { formatCurrency } from '@/utils/currency'

type LoanAreaCardProps = {
  summary: LoanSummary | null
  currencySymbol: 'KR' | '$' | '€'
  isLoading?: boolean
  error?: string
}

export const LoanAreaCard = ({
  summary,
  currencySymbol,
  isLoading = false,
  error = '',
}: LoanAreaCardProps) => {
  const hasData = useMemo(() => summary !== null, [summary])
  const outstandingAmount = summary?.totalOutstandingAmount ?? 0

  return (
    <NeoCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-text-muted">Loans given</p>
          <p className="text-xl font-semibold text-text-primary">
            {hasData ? formatCurrency(outstandingAmount, currencySymbol) : '--'} outstanding
          </p>
          {isLoading ? <p className="text-xs text-text-muted">Loading loan summary…</p> : null}
          {!isLoading && error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
        <Link
          to="/loans"
          className="neo-card neo-pressable inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-text-primary"
        >
          Open loan area
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-neo bg-surface-strong px-3 py-2 shadow-neo-sm">
          <p className="text-xs text-text-muted">Active</p>
          <p className="text-lg font-semibold text-text-primary">{summary?.activeCount ?? 0}</p>
        </div>
        <div className="rounded-neo bg-surface-strong px-3 py-2 shadow-neo-sm">
          <p className="text-xs text-text-muted">Due soon</p>
          <p className="text-lg font-semibold text-amber-600">{summary?.dueSoonCount ?? 0}</p>
        </div>
        <div className="rounded-neo bg-surface-strong px-3 py-2 shadow-neo-sm">
          <p className="text-xs text-text-muted">Overdue</p>
          <p className="text-lg font-semibold text-red-600">{summary?.overdueCount ?? 0}</p>
        </div>
        <div className="rounded-neo bg-surface-strong px-3 py-2 shadow-neo-sm">
          <p className="text-xs text-text-muted">Repaid</p>
          <p className="text-lg font-semibold text-emerald-600">{summary?.repaidCount ?? 0}</p>
        </div>
      </div>
    </NeoCard>
  )
}
