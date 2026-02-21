import { useEffect, useMemo, useState } from 'react'
import { AddLoanModal } from '@/components/AddLoanModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { LoanTable } from '@/components/LoanTable'
import { RecurringAutomationToast } from '@/components/RecurringAutomationToast'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

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

  // `LoanTable` declares onDelete as a callback returning a Promise<void> so
  // our handler must match that signature. The logic here is synchronous but
  // marking the function `async` causes it to implicitly return a
  // `Promise<void>` and keeps TypeScript happy.
  const requestDelete = async (id: string) => {
    setPendingDeleteId(id)
  }

  const executeDelete = async (id: string) => {
    setDeletingId(id)
    setPendingDeleteId(null)
    try {
      await loanApi.remove(id)
      setLoans((current) => current.filter((l) => l.id !== id))
      setSuccessMessage('Loan deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete loan')
    } finally {
      setDeletingId(null)
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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            aria-label="Add new loan"
            className="inline-flex items-center justify-center rounded-xl border border-primary/50 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
              className={`glass-panel px-3 py-2 text-xs font-semibold transition-all ${
                filter === filterKey
                  ? 'bg-primary/20 text-text-primary border-primary/40'
                  : 'text-text-muted hover:bg-white/5'
              }`}
            >
              {filterLabels[filterKey]}
            </button>
          ))}
        </section>

        {error ? <div className="glass-panel p-3 text-sm text-error">{error}</div> : null}

        {successMessage && (
          <RecurringAutomationToast
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
        )}

        {isLoading ? (
          <div className="glass-panel p-6 text-sm text-text-muted">Loading loans…</div>
        ) : (
          <LoanTable
            loans={filteredLoans}
            currencySymbol="KR"
            onMarkRepaid={handleMarkRepaid}
            markingId={markingId}
            onDelete={requestDelete}
            deletingId={deletingId}
          />
        )}

        <AddLoanModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateLoan}
        />

        {pendingDeleteId && (
          <ConfirmModal
            isOpen={true}
            title="Delete Loan?"
            body="Are you sure you want to remove this loan? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={() => executeDelete(pendingDeleteId)}
            onCancel={() => setPendingDeleteId(null)}
          />
        )}
      </div>
    </div>
  )
}
