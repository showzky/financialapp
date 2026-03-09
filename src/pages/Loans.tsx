import { useEffect, useMemo, useState } from 'react'
import { AddBorrowedLoanModal } from '@/components/AddBorrowedLoanModal'
import { BorrowedLoanTable } from '@/components/BorrowedLoanTable'
import { AddLoanModal } from '@/components/AddLoanModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { EditBorrowedLoanModal } from '@/components/EditBorrowedLoanModal'
import { EditLoanModal } from '@/components/EditLoanModal'
import { LoanTable } from '@/components/LoanTable'
import { RecurringAutomationToast } from '@/components/RecurringAutomationToast'
import { borrowedLoanApi } from '@/services/borrowedLoanApi'
import { loanApi } from '@/services/loanApi'
import type {
  BorrowedLoan,
  CreateBorrowedLoanPayload,
  CreateLoanPayload,
  Loan,
  UpdateBorrowedLoanPayload,
  UpdateLoanPayload,
} from '@/types/loan'
import { formatCurrency } from '@/utils/currency'

type LoanFilter = 'all' | 'outstanding' | 'due_soon' | 'overdue' | 'repaid'
type BorrowedLoanFilter = 'all' | 'active' | 'due_soon' | 'overdue' | 'paid_off'
type LoanTab = 'mine' | 'lent'

const filterLabels: Record<LoanFilter, string> = {
  all: 'All',
  outstanding: 'Outstanding',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  repaid: 'Repaid',
}

const borrowedFilterLabels: Record<BorrowedLoanFilter, string> = {
  all: 'All',
  active: 'Active',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  paid_off: 'Paid off',
}

export const Loans = () => {
  const [tab, setTab] = useState<LoanTab>('lent')
  const [loans, setLoans] = useState<Loan[]>([])
  const [borrowedLoans, setBorrowedLoans] = useState<BorrowedLoan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false)
  const [isAddBorrowedLoanModalOpen, setIsAddBorrowedLoanModalOpen] = useState(false)
  const [filter, setFilter] = useState<LoanFilter>('all')
  const [borrowedFilter, setBorrowedFilter] = useState<BorrowedLoanFilter>('all')
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [markingBorrowedId, setMarkingBorrowedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingBorrowedId, setUpdatingBorrowedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingBorrowedId, setDeletingBorrowedId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingBorrowedDeleteId, setPendingBorrowedDeleteId] = useState<string | null>(null)
  const [pendingBorrowedPaidOffId, setPendingBorrowedPaidOffId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null)
  const [editingBorrowedLoanId, setEditingBorrowedLoanId] = useState<string | null>(null)
  const [highlightedLoanId, setHighlightedLoanId] = useState<string | null>(null)
  const [highlightedBorrowedLoanId, setHighlightedBorrowedLoanId] = useState<string | null>(null)

  const loadLoans = async () => {
    setIsLoading(true)
    try {
      const [lentResult, borrowedResult] = await Promise.allSettled([
        loanApi.list(),
        borrowedLoanApi.list(),
      ])

      const errors: string[] = []

      if (lentResult.status === 'fulfilled') {
        setLoans(lentResult.value)
      } else {
        setLoans([])
        errors.push(
          lentResult.reason instanceof Error ? lentResult.reason.message : 'Could not load lent loans',
        )
      }

      if (borrowedResult.status === 'fulfilled') {
        setBorrowedLoans(borrowedResult.value)
      } else {
        setBorrowedLoans([])
        errors.push(
          borrowedResult.reason instanceof Error
            ? borrowedResult.reason.message
            : 'Could not load personal loans',
        )
      }

      setError(errors.join(' • '))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load loans')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLoans()
  }, [])

  useEffect(() => {
    if (!highlightedLoanId) {
      return
    }
    const timer = window.setTimeout(() => setHighlightedLoanId(null), 1300)
    return () => window.clearTimeout(timer)
  }, [highlightedLoanId])

  useEffect(() => {
    if (!highlightedBorrowedLoanId) {
      return
    }
    const timer = window.setTimeout(() => setHighlightedBorrowedLoanId(null), 1300)
    return () => window.clearTimeout(timer)
  }, [highlightedBorrowedLoanId])

  const handleCreateLoan = async (payload: CreateLoanPayload) => {
    const created = await loanApi.create(payload)
    setLoans((current) => [created, ...current])
    setError('')
  }

  const handleCreateBorrowedLoan = async (payload: CreateBorrowedLoanPayload) => {
    const created = await borrowedLoanApi.create(payload)
    setBorrowedLoans((current) => [created, ...current])
    setError('')
  }

  const handleOpenEdit = (loan: Loan) => {
    setEditingLoanId(loan.id)
  }

  const handleCloseEdit = () => {
    setEditingLoanId(null)
  }

  const handleOpenEditBorrowedLoan = (loan: BorrowedLoan) => {
    setEditingBorrowedLoanId(loan.id)
  }

  const handleCloseBorrowedEdit = () => {
    setEditingBorrowedLoanId(null)
  }

  const handleUpdateLoan = async (id: string, payload: UpdateLoanPayload) => {
    setUpdatingId(id)
    try {
      const updated = await loanApi.update(id, payload)
      setLoans((current) => current.map((loan) => (loan.id === id ? updated : loan)))
      setHighlightedLoanId(id)
      setSuccessMessage('Loan updated')
      setError('')
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Could not update loan'
      setError(message)
      throw updateError instanceof Error ? updateError : new Error(message)
    } finally {
      setUpdatingId(null)
    }
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

  const handleUpdateBorrowedLoan = async (id: string, payload: UpdateBorrowedLoanPayload) => {
    setUpdatingBorrowedId(id)
    try {
      const updated = await borrowedLoanApi.update(id, payload)
      setBorrowedLoans((current) => current.map((loan) => (loan.id === id ? updated : loan)))
      setHighlightedBorrowedLoanId(id)
      setSuccessMessage('Personal loan updated')
      setError('')
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : 'Could not update personal loan'
      setError(message)
      throw updateError instanceof Error ? updateError : new Error(message)
    } finally {
      setUpdatingBorrowedId(null)
    }
  }

  const handleMarkPaidOff = async (id: string) => {
    setPendingBorrowedPaidOffId(id)
  }

  const executeMarkPaidOff = async (id: string) => {
    setMarkingBorrowedId(id)
    setPendingBorrowedPaidOffId(null)
    try {
      const updated = await borrowedLoanApi.markPaidOff(id)
      setBorrowedLoans((current) => current.map((loan) => (loan.id === id ? updated : loan)))
      setSuccessMessage('Personal loan marked as paid off')
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not mark loan as paid off')
    } finally {
      setMarkingBorrowedId(null)
    }
  }

  const requestDelete = async (id: string) => {
    setPendingDeleteId(id)
  }

  const requestBorrowedDelete = async (id: string) => {
    setPendingBorrowedDeleteId(id)
  }

  const executeDelete = async (id: string) => {
    setDeletingId(id)
    setPendingDeleteId(null)
    try {
      await loanApi.remove(id)
      setLoans((current) => current.filter((loan) => loan.id !== id))
      setSuccessMessage('Loan deleted')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete loan')
    } finally {
      setDeletingId(null)
    }
  }

  const executeBorrowedDelete = async (id: string) => {
    setDeletingBorrowedId(id)
    setPendingBorrowedDeleteId(null)
    try {
      await borrowedLoanApi.remove(id)
      setBorrowedLoans((current) => current.filter((loan) => loan.id !== id))
      setSuccessMessage('Personal loan deleted')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete personal loan')
    } finally {
      setDeletingBorrowedId(null)
    }
  }

  const filteredLoans = useMemo(() => {
    let result = loans
    if (filter !== 'all') {
      result = result.filter((loan) => loan.status === filter)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((loan) => loan.recipient.toLowerCase().includes(query))
    }
    return result
  }, [filter, loans, searchQuery])

  const filteredBorrowedLoans = useMemo(() => {
    let result = borrowedLoans
    if (borrowedFilter !== 'all') {
      result = result.filter((loan) => loan.status === borrowedFilter)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((loan) => loan.lender.toLowerCase().includes(query))
    }
    return result
  }, [borrowedFilter, borrowedLoans, searchQuery])

  const editingLoan = useMemo(
    () => loans.find((loan) => loan.id === editingLoanId) ?? null,
    [editingLoanId, loans],
  )

  const editingBorrowedLoan = useMemo(
    () => borrowedLoans.find((loan) => loan.id === editingBorrowedLoanId) ?? null,
    [borrowedLoans, editingBorrowedLoanId],
  )

  const outstandingTotal = useMemo(
    () =>
      loans.filter((loan) => loan.status !== 'repaid').reduce((sum, loan) => sum + loan.amount, 0),
    [loans],
  )

  const borrowedOutstandingTotal = useMemo(
    () =>
      borrowedLoans
        .filter((loan) => loan.status !== 'paid_off')
        .reduce((sum, loan) => sum + loan.currentBalance, 0),
    [borrowedLoans],
  )

  const activeLentCount = useMemo(
    () => loans.filter((loan) => loan.status !== 'repaid').length,
    [loans],
  )

  const activeBorrowedCount = useMemo(
    () => borrowedLoans.filter((loan) => loan.status !== 'paid_off').length,
    [borrowedLoans],
  )

  const searchPlaceholder = tab === 'mine' ? 'Search by lender...' : 'Search by recipient...'
  const headingTitle = tab === 'mine' ? 'My loans' : 'Loans given to others'
  const headingDescription =
    tab === 'mine'
      ? `Current balance: ${formatCurrency(borrowedOutstandingTotal, 'KR')}`
      : `Outstanding total: ${formatCurrency(outstandingTotal, 'KR')}`

  return (
    <div className="app-shell min-h-screen px-4 py-10 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#c9a84c]">Loan area</p>
            <h1 className="text-3xl font-semibold text-text-primary">Loans</h1>
            <p className="text-sm text-text-muted">Track both money you owe and money you have lent out.</p>
          </div>

          <button
            type="button"
            onClick={() =>
              tab === 'mine' ? setIsAddBorrowedLoanModalOpen(true) : setIsAddLoanModalOpen(true)
            }
            aria-label={tab === 'mine' ? 'Add new personal loan' : 'Add new lent loan'}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#c9a84c] bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-[#0a0a0b] transition-all hover:bg-[#e2c06a] focus-visible:outline-none"
          >
            {tab === 'mine' ? '+ Add personal loan' : '+ Add loan'}
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className={`rounded-[16px] border bg-[#111114] p-5 transition ${tab === 'mine' ? 'border-[rgba(94,189,151,0.35)]' : 'border-[rgba(255,255,255,0.055)]'}`}>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#c9a84c]">My loans</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              {formatCurrency(borrowedOutstandingTotal, 'KR')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{activeBorrowedCount} active personal loan(s)</p>
          </div>
          <div className={`rounded-[16px] border bg-[#111114] p-5 transition ${tab === 'lent' ? 'border-[rgba(201,168,76,0.35)]' : 'border-[rgba(255,255,255,0.055)]'}`}>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#c9a84c]">Lent out</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              {formatCurrency(outstandingTotal, 'KR')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{activeLentCount} active lent loan(s)</p>
          </div>
        </section>

        <section className="flex w-full max-w-md gap-1 rounded-[14px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-1.5">
          <button
            type="button"
            onClick={() => setTab('mine')}
            className={`flex-1 rounded-[10px] px-4 py-2 text-sm font-semibold transition ${
              tab === 'mine' ? 'bg-[#c9a84c] text-[#0a0a0b]' : 'text-text-muted hover:bg-white/5'
            }`}
          >
            My loans
          </button>
          <button
            type="button"
            onClick={() => setTab('lent')}
            className={`flex-1 rounded-[10px] px-4 py-2 text-sm font-semibold transition ${
              tab === 'lent' ? 'bg-[#c9a84c] text-[#0a0a0b]' : 'text-text-muted hover:bg-white/5'
            }`}
          >
            Lent
          </button>
        </section>

        <section className="space-y-1">
          <h2 className="text-2xl font-semibold text-text-primary">{headingTitle}</h2>
          <p className="text-sm text-text-muted">{headingDescription}</p>
        </section>

        <div className="relative max-w-md">
          <input
            type="text"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted/70 outline-none focus:border-[rgba(255,255,255,0.10)]"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <section className="flex flex-wrap items-center gap-2">
          {tab === 'mine'
            ? (Object.keys(borrowedFilterLabels) as BorrowedLoanFilter[]).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setBorrowedFilter(filterKey)}
                  className={`rounded-[8px] border px-3 py-2 text-xs font-semibold transition-all ${
                    borrowedFilter === filterKey
                      ? 'border-[rgba(201,168,76,0.45)] bg-[rgba(201,168,76,0.08)] text-[#c9a84c]'
                      : 'border-[rgba(255,255,255,0.055)] bg-transparent text-text-muted hover:border-[rgba(255,255,255,0.10)]'
                  }`}
                >
                  {borrowedFilterLabels[filterKey]}
                </button>
              ))
            : (Object.keys(filterLabels) as LoanFilter[]).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setFilter(filterKey)}
                  className={`rounded-[8px] border px-3 py-2 text-xs font-semibold transition-all ${
                    filter === filterKey
                      ? 'border-[rgba(201,168,76,0.45)] bg-[rgba(201,168,76,0.08)] text-[#c9a84c]'
                      : 'border-[rgba(255,255,255,0.055)] bg-transparent text-text-muted hover:border-[rgba(255,255,255,0.10)]'
                  }`}
                >
                  {filterLabels[filterKey]}
                </button>
              ))}
        </section>

        {error ? <div className="rounded-[10px] border border-[rgba(201,107,107,0.22)] bg-[rgba(201,107,107,0.08)] p-3 text-sm text-[#c96b6b]">{error}</div> : null}

        {successMessage && (
          <RecurringAutomationToast
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
        )}

        {isLoading ? (
          <div className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-6 text-sm text-text-muted">Loading loans...</div>
        ) : tab === 'mine' ? (
          <BorrowedLoanTable
            loans={filteredBorrowedLoans}
            currencySymbol="KR"
            onMarkPaidOff={handleMarkPaidOff}
            markingId={markingBorrowedId}
            onEdit={handleOpenEditBorrowedLoan}
            updatingId={updatingBorrowedId}
            highlightedLoanId={highlightedBorrowedLoanId}
            onDelete={requestBorrowedDelete}
            deletingId={deletingBorrowedId}
            emptyMessage={
              searchQuery
                ? `No personal loans match "${searchQuery}"`
                : borrowedFilter !== 'all'
                  ? `No personal loans with status "${borrowedFilterLabels[borrowedFilter]}"`
                  : undefined
            }
          />
        ) : (
          <LoanTable
            loans={filteredLoans}
            currencySymbol="KR"
            onMarkRepaid={handleMarkRepaid}
            markingId={markingId}
            onEdit={handleOpenEdit}
            updatingId={updatingId}
            highlightedLoanId={highlightedLoanId}
            onDelete={requestDelete}
            deletingId={deletingId}
            emptyMessage={
              searchQuery
                ? `No loans match "${searchQuery}"`
                : filter !== 'all'
                  ? `No loans with status "${filterLabels[filter]}"`
                  : undefined
            }
          />
        )}

        <AddLoanModal
          isOpen={isAddLoanModalOpen}
          onClose={() => setIsAddLoanModalOpen(false)}
          onSubmit={handleCreateLoan}
        />

        <AddBorrowedLoanModal
          isOpen={isAddBorrowedLoanModalOpen}
          onClose={() => setIsAddBorrowedLoanModalOpen(false)}
          onSubmit={handleCreateBorrowedLoan}
        />

        <EditLoanModal
          isOpen={editingLoanId !== null}
          loan={editingLoan}
          onClose={handleCloseEdit}
          onSubmit={handleUpdateLoan}
        />

        <EditBorrowedLoanModal
          isOpen={editingBorrowedLoanId !== null}
          loan={editingBorrowedLoan}
          onClose={handleCloseBorrowedEdit}
          onSubmit={handleUpdateBorrowedLoan}
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

        {pendingBorrowedDeleteId && (
          <ConfirmModal
            isOpen={true}
            title="Delete Personal Loan?"
            body="Are you sure you want to remove this personal loan? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={() => executeBorrowedDelete(pendingBorrowedDeleteId)}
            onCancel={() => setPendingBorrowedDeleteId(null)}
          />
        )}

        {pendingBorrowedPaidOffId && (
          <ConfirmModal
            isOpen={true}
            title="Mark Personal Loan as Paid Off?"
            body="Are you sure you want to mark this personal loan as paid off?"
            confirmText="Mark paid off"
            cancelText="Cancel"
            onConfirm={() => executeMarkPaidOff(pendingBorrowedPaidOffId)}
            onCancel={() => setPendingBorrowedPaidOffId(null)}
          />
        )}
      </div>
    </div>
  )
}
