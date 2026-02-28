import React, { useEffect, useMemo, useState } from 'react'
import { getLocaleCurrencyConfig } from '@/utils/localeFormatting'

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
  locale?: string
  currency?: string
  pageSize?: number
  isLoading?: boolean
  loadError?: string
  onRetryLoad?: () => void
  onEdit: (subscription: Subscription) => void
  onAdd: () => void
  onToggleStatus: (subscription: Subscription) => void
  onDelete?: (subscription: Subscription) => void
}

const monthlyEquivalentCents = (sub: Subscription): number => {
  if (sub.cadence === 'monthly') return sub.priceCents
  return Math.round(sub.priceCents / 12)
}

const formatCents = (cents: number, formatter: Intl.NumberFormat) => formatter.format(cents / 100)

const parseIsoDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

const formatRenewalDate = (value: string, formatter: Intl.DateTimeFormat): string => {
  const parsed = parseIsoDate(value)
  if (!parsed) return value
  return formatter.format(parsed)
}

const statusLabel = (status: SubscriptionStatus): string => {
  if (status === 'active') return 'active'
  if (status === 'paused') return 'paused'
  return 'canceled'
}

type SortKey = 'name' | 'price' | 'next' | 'status'
type SortDirection = 'asc' | 'desc'
const statusSortOrder: Record<SubscriptionStatus, number> = {
  active: 0,
  paused: 1,
  canceled: 2,
}

const compareStrings = (left: string, right: string): number => left.localeCompare(right)

export const SubscriptionLedger: React.FC<SubscriptionLedgerProps> = ({
  subscriptions,
  locale,
  currency,
  pageSize = 10,
  isLoading = false,
  loadError = '',
  onRetryLoad,
  onAdd,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('next')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, sortKey, sortDirection])

  const localeCurrency = useMemo(
    () => getLocaleCurrencyConfig({ locale, currency }),
    [locale, currency],
  )

  const currencyFormatter = useMemo(
    () => {
      try {
        return new Intl.NumberFormat(localeCurrency.locale, {
          style: 'currency',
          currency: localeCurrency.currency,
        })
      } catch {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'NOK',
        })
      }
    },
    [localeCurrency],
  )

  const dateFormatter = useMemo(
    () => {
      try {
        return new Intl.DateTimeFormat(localeCurrency.locale, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        })
      } catch {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        })
      }
    },
    [localeCurrency.locale],
  )

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
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
  }, [debouncedSearch, statusFilter, subscriptions])

  const sorted = useMemo(() => {
    const next = filtered.slice().sort((left, right) => {
      let result = 0

      if (sortKey === 'name') {
        result = compareStrings(left.name, right.name)
        if (result === 0) result = compareStrings(left.id, right.id)
      } else if (sortKey === 'price') {
        result = left.priceCents - right.priceCents
        if (result === 0) result = compareStrings(left.nextRenewalDate, right.nextRenewalDate)
        if (result === 0) result = compareStrings(left.id, right.id)
      } else if (sortKey === 'status') {
        result = statusSortOrder[left.status] - statusSortOrder[right.status]
        if (result === 0) result = compareStrings(left.nextRenewalDate, right.nextRenewalDate)
        if (result === 0) result = compareStrings(left.id, right.id)
      } else {
        result = compareStrings(left.nextRenewalDate, right.nextRenewalDate)
        if (result === 0) result = compareStrings(left.id, right.id)
      }

      return sortDirection === 'asc' ? result : -result
    })

    return next
  }, [filtered, sortDirection, sortKey])

  const totalItems = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * pageSize
  const pageEnd = pageStart + pageSize
  const paginatedRows = sorted.slice(pageStart, pageEnd)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  const getAriaSort = (key: SortKey): 'none' | 'ascending' | 'descending' => {
    if (sortKey !== key) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  const skeletonRows = [1, 2, 3, 4]
  const hasFilters = searchInput.trim().length > 0 || statusFilter !== 'all'
  const shouldShowPagination =
    !isLoading && !loadError && subscriptions.length > 0 && filtered.length > 0 && totalPages > 1

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
            onClick={onAdd}
            className="glass-panel w-full px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10 sm:w-auto"
            aria-label="Add subscription"
          >
            Add Subscription
          </button>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name/provider/category..."
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
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                setDebouncedSearch('')
                setStatusFilter('all')
                setCurrentPage(1)
              }}
              className="glass-panel w-full px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-all hover:bg-white/10 sm:w-auto"
              aria-label="Clear search and status filters"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4" aria-sort={getAriaSort('name')}>
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-text-primary)]"
                  aria-label="Sort by name"
                >
                  Node
                </button>
              </th>
              <th className="py-3 pr-4" aria-sort={getAriaSort('price')}>
                <button
                  type="button"
                  onClick={() => handleSort('price')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-text-primary)]"
                  aria-label="Sort by price"
                >
                  Price
                </button>
              </th>
              <th className="py-3 pr-4" aria-sort={getAriaSort('next')}>
                <button
                  type="button"
                  onClick={() => handleSort('next')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-text-primary)]"
                  aria-label="Sort by next renewal date"
                >
                  Next
                </button>
              </th>
              <th className="py-3 pr-4" aria-sort={getAriaSort('status')}>
                <button
                  type="button"
                  onClick={() => handleSort('status')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-text-primary)]"
                  aria-label="Sort by status"
                >
                  Status
                </button>
              </th>
              <th className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[var(--color-text-primary)]">
            {isLoading ? (
              skeletonRows.map((row) => (
                <tr
                  key={`skeleton-${row}`}
                  className="border-b border-white/5 animate-pulse"
                  data-testid="subscription-skeleton-row"
                >
                  <td className="py-4 pr-4">
                    <div className="h-4 w-28 rounded bg-white/10" />
                    <div className="mt-2 h-3 w-36 rounded bg-white/5" />
                  </td>
                  <td className="py-4 pr-4">
                    <div className="h-4 w-20 rounded bg-white/10" />
                    <div className="mt-2 h-3 w-24 rounded bg-white/5" />
                  </td>
                  <td className="py-4 pr-4">
                    <div className="h-4 w-24 rounded bg-white/10" />
                  </td>
                  <td className="py-4 pr-4">
                    <div className="h-6 w-16 rounded bg-white/10" />
                  </td>
                  <td className="py-4">
                    <div className="ml-auto flex w-fit gap-2">
                      <div className="h-8 w-14 rounded bg-white/10" />
                      <div className="h-8 w-16 rounded bg-white/10" />
                      <div className="h-8 w-14 rounded bg-white/10" />
                    </div>
                  </td>
                </tr>
              ))
            ) : loadError ? (
              <tr>
                <td colSpan={5} className="py-6">
                  <div
                    className="glass-panel flex flex-col gap-3 border border-red-400/30 px-4 py-3 text-red-200 sm:flex-row sm:items-center sm:justify-between"
                    role="status"
                    aria-live="polite"
                  >
                    <span>{loadError}</span>
                    <button
                      type="button"
                      onClick={onRetryLoad}
                      className="glass-panel px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:bg-white/10"
                      aria-label="Retry loading subscriptions"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6">
                  <div className="text-center text-[var(--color-text-muted)]" role="status" aria-live="polite">
                    No subscriptions yet. Add your first subscription.
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 && hasFilters ? (
              <tr>
                <td colSpan={5} className="py-6">
                  <div className="text-center text-[var(--color-text-muted)]" role="status" aria-live="polite">
                    No subscriptions match your current search/filter.
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((sub) => (
                <tr key={sub.id} className="border-b border-white/5">
                  <td className="py-4 pr-4">
                    <div className="hud-monospaced">{sub.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {sub.provider} - {sub.category}
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="hud-monospaced">
                      {formatCents(sub.priceCents, currencyFormatter)}
                      <span className="text-[var(--color-text-muted)]">
                        {sub.cadence === 'monthly' ? ' /mo' : ' /yr'}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Eq: {formatCents(monthlyEquivalentCents(sub), currencyFormatter)} /mo
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="hud-monospaced">{formatRenewalDate(sub.nextRenewalDate, dateFormatter)}</div>
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
                      {onDelete ? (
                        <button
                          type="button"
                          onClick={() => onDelete(sub)}
                          className="glass-panel px-3 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-white/10"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {shouldShowPagination ? (
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <div>
            Showing {pageStart + 1}-{Math.min(pageEnd, totalItems)} of {totalItems}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="glass-panel px-3 py-2 font-semibold text-text-primary transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Go to previous page"
            >
              Prev
            </button>
            <span className="hud-monospaced" aria-live="polite">
              Page {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="glass-panel px-3 py-2 font-semibold text-text-primary transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SubscriptionLedger
