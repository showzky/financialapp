import { useEffect, useMemo, useState } from 'react'
import { AddLoanModal } from '@/components/AddLoanModal'
import { LoanTable } from '@/components/LoanTable'
import { loanApi } from '@/services/loanApi'
import type { CreateLoanPayload, Loan } from '@/types/loan'
import { formatCurrency } from '@/utils/currency'

type LoanFilter = 'all' | 'outstanding' | 'due_soon' | 'overdue' | 'repaid'

const filterLabels: Record<LoanFilter, string> = {
  all: 'All',
  outstanding: 'Outstanding',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  repaid: 'Repaid',
}

export const Loans = () => {
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [filter, setFilter] = useState<LoanFilter>('all')
  const [markingId, setMarkingId] = useState<string | null>(null)

  const loadLoans = async () => {
    setIsLoading(true)

    try {
      const rows = await loanApi.list()
      setLoans(rows)
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load loans')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLoans()
  }, [])

  const handleCreateLoan = async (payload: CreateLoanPayload) => {
    const created = await loanApi.create(payload)
    setLoans((current) => [created, ...current])
    setError('')
  }

  const handleMarkRepaid = async (id: string) => {
    setMarkingId(id)

    try {
      const updated = await loanApi.markRepaid(id)
      setLoans((current) => current.map((loan) => (loan.id === id ? updated : loan)))
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not mark loan as repaid')
    } finally {
      setMarkingId(null)
    }
  }

  const filteredLoans = useMemo(() => {
    if (filter === 'all') {
      return loans
    }

    return loans.filter((loan) => loan.status === filter)
  }, [filter, loans])

  const outstandingTotal = useMemo(
    () =>
      loans.filter((loan) => loan.status !== 'repaid').reduce((sum, loan) => sum + loan.amount, 0),
    [loans],
  )

  return (
    <div className="app-shell min-h-screen px-4 py-10 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Loan area</p>
            <h1 className="text-3xl font-semibold text-text-primary">Loans given to others</h1>
            <p className="text-sm text-text-muted">
              Outstanding total: {formatCurrency(outstandingTotal, 'KR')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="neo-card neo-pressable px-4 py-2 text-sm font-semibold text-text-primary"
          >
            + Add loan
          </button>
        </header>

        <section className="flex flex-wrap items-center gap-2">
          {(Object.keys(filterLabels) as LoanFilter[]).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setFilter(filterKey)}
              className={`neo-card px-3 py-2 text-xs font-semibold ${
                filter === filterKey ? 'text-accent-strong shadow-neo-inset' : 'text-text-muted'
              }`}
            >
              {filterLabels[filterKey]}
            </button>
          ))}
        </section>

        {error ? <div className="neo-card p-3 text-sm text-red-500">{error}</div> : null}

        {isLoading ? (
          <div className="neo-card p-6 text-sm text-text-muted">Loading loans…</div>
        ) : (
          <LoanTable
            loans={filteredLoans}
            currencySymbol="KR"
            onMarkRepaid={handleMarkRepaid}
            markingId={markingId}
          />
        )}

        <AddLoanModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateLoan}
        />
      </div>
    </div>
  )
}
