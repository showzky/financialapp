import React, { useMemo, useState } from 'react'
import { formatCurrency } from '@/utils/currency'

export type BillingCadence = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'canceled'

export type Subscription = {
  id: string
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: BillingCadence
  priceCents: number
  nextRenewalDate: string // YYYY-MM-DD
  notes?: string
}

export type SubscriptionLedgerProps = {
  subscriptions: Subscription[]
  currencySymbol?: string
  onEdit: (subscription: Subscription) => void
  onAdd: () => void
  onToggleStatus: (subscription: Subscription) => void
  onDelete?: (subscription: Subscription) => void
}

const monthlyEquivalentCents = (sub: Subscription): number => {
  if (sub.cadence === 'monthly') return sub.priceCents
  return Math.round(sub.priceCents / 12)
}

const formatCents = (cents: number, symbol: string) => formatCurrency(Math.round(cents / 100), symbol)

const statusLabel = (status: SubscriptionStatus): string => {
  if (status === 'active') return 'active'
  if (status === 'paused') return 'paused'
  return 'canceled'
}

export const SubscriptionLedger: React.FC<SubscriptionLedgerProps> = ({
  subscriptions,
  currencySymbol = 'KR',
  onAdd,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subscriptions
      .filter((s) => (statusFilter === 'all' ? true : s.status === statusFilter))
      .filter((s) => {
        if (q.length === 0) return true
        return (
          s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        )
      })
      .slice()
      .sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate))
  }, [search, statusFilter, subscriptions])

  return (
    <div className="hud-glass-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="hud-status-dot" />
          <h3 className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--color-text-muted)] m-0">
            Subscription Ledger
          </h3>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            // TODO (wire-up): connect this to open your "Add Subscription" modal in the parent page.
            onClick={onAdd}
            className="glass-panel w-full px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10 sm:w-auto"
            aria-label="Add subscription"
          >
            Add Subscription
          </button>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name/provider/category…"
            className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)] placeholder-text-muted sm:w-72"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus | 'all')}
            className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)] sm:w-44"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4">Node</th>
              <th className="py-3 pr-4">Price</th>
              <th className="py-3 pr-4">Next</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[var(--color-text-primary)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--color-text-muted)]">
                  No subscriptions match this scan.
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr key={sub.id} className="border-b border-white/5">
                  <td className="py-4 pr-4">
                    <div className="hud-monospaced">{sub.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {sub.provider} • {sub.category}
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="hud-monospaced">
                      {formatCents(sub.priceCents, currencySymbol)}
                      <span className="text-[var(--color-text-muted)]">
                        {sub.cadence === 'monthly' ? ' /mo' : ' /yr'}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Eq: {formatCents(monthlyEquivalentCents(sub), currencySymbol)} /mo
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="hud-monospaced">{sub.nextRenewalDate}</div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="glass-panel inline-flex px-3 py-1 text-xs">
                      {statusLabel(sub.status)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(sub)}
                        className="glass-panel px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:bg-white/10"
                      >
                        Edit
                      </button>
                     
                      <button
                        type="button"
                        onClick={() => onToggleStatus(sub)}
                        className="glass-panel px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:bg-white/10"
                      >
                        {sub.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                       <button type="button" onClick={() => onDelete?.(sub)} className="glass-panel px-3 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-white/10">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SubscriptionLedger
