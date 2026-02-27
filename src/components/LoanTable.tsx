import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { Loan } from '@/types/loan'
import { formatLoanTimeRemaining, getLoanStatusLabel } from '@/utils/loanStatus'
import { formatCurrency } from '@/utils/currency'
import { formatCETDateTime } from '@/utils/date'

type LoanTableProps = {
  loans: Loan[]
  currencySymbol: 'KR' | '$' | '€'
  onMarkRepaid: (id: string) => Promise<void>
  markingId: string | null
  onEdit?: (loan: Loan) => void
  updatingId?: string | null
  highlightedLoanId?: string | null
  onDelete?: (id: string) => Promise<void>
  deletingId?: string | null
  emptyMessage?: string
}

const statusClasses: Record<Loan['status'], string> = {
  outstanding: 'bg-surface-strong text-text-primary',
  due_soon: 'bg-warning/10 text-warning',
  overdue: 'bg-error/10 text-error',
  repaid: 'bg-success/10 text-success',
}

const editButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-[rgba(var(--accent-rgb),0.45)] bg-transparent px-2.5 py-2 text-[rgba(var(--accent-rgb),1)] transition hover:border-[rgba(var(--accent-rgb),0.85)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] disabled:cursor-not-allowed disabled:opacity-60'

export const LoanTable = ({
  loans,
  currencySymbol,
  onMarkRepaid,
  markingId,
  onEdit,
  updatingId,
  highlightedLoanId,
  onDelete,
  deletingId,
  emptyMessage = 'No loans yet. Add a loan to start tracking repayments.',
}: LoanTableProps) => {
  const nonRepaid = loans.filter((l) => l.status !== 'repaid')
  const repaidLoans = loans.filter((l) => l.status === 'repaid')
  const [showRepaid, setShowRepaid] = useState(false)
  const repaidScrollable = repaidLoans.length >= 5

  if (loans.length === 0) {
    return <div className="glass-panel p-6 text-sm text-text-muted">{emptyMessage}</div>
  }

  return (
    <div className="glass-panel overflow-hidden">
      <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted md:grid">
        <span>Recipient</span>
        <span>Amount</span>
        <span>Time remaining</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/10">
        {nonRepaid.map((loan) => {
          const isMarking = markingId === loan.id
          const isUpdating = updatingId === loan.id
          const canMarkRepaid = loan.status !== 'repaid'

          return (
            <div
              key={loan.id}
              className={`grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto] md:items-center ${
                highlightedLoanId === loan.id ? 'loan-row-updated' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">{loan.recipient}</p>
                <p className="text-xs text-text-muted">
                  Given {formatCETDateTime(loan.dateGiven)} • Due{' '}
                  {formatCETDateTime(loan.expectedRepaymentDate)}
                </p>
              </div>

              <p className="text-sm font-semibold text-text-primary">
                {formatCurrency(loan.amount, currencySymbol)}
              </p>

              <p className="text-sm text-text-primary">
                {formatLoanTimeRemaining(loan.status, loan.daysRemaining)}
              </p>

              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[loan.status]}`}
              >
                {getLoanStatusLabel(loan.status)}
              </span>

              <div className="md:text-right">
                <div className="flex items-center gap-2 md:justify-end">
                  {onEdit && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onEdit(loan)}
                      aria-label={`Edit loan for ${loan.recipient}`}
                      className={editButtonClass}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!canMarkRepaid || isMarking}
                    onClick={() => onMarkRepaid(loan.id)}
                    className="glass-panel px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMarking ? 'Saving...' : canMarkRepaid ? 'Mark repaid' : 'Completed'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {repaidLoans.length > 0 && (
          <>
            <div className="px-4 py-2">
              <button
                type="button"
                onClick={() => setShowRepaid((c) => !c)}
                className="glass-panel flex w-full items-center justify-between rounded-full px-4 py-2 text-sm font-semibold text-text-primary transition-transform duration-200 hover:scale-[1.01] focus:outline-none"
              >
                <span>Repaid loans ({repaidLoans.length})</span>
                <span
                  className={`transition-transform duration-200 ${showRepaid ? 'rotate-180' : 'rotate-0'}`}
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                    <path
                      d="M10 6.5l5 5H5l5-5Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>

            <div
              className={`overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${
                showRepaid
                  ? 'max-h-[2000px] translate-y-0 opacity-100'
                  : '-translate-y-4 max-h-0 opacity-0'
              }`}
            >
              <div
                className={`${repaidScrollable ? 'scrollbar-success max-h-80 overflow-y-auto' : ''}`}
              >
                {repaidLoans.map((loan) => {
                  const isDeleting = deletingId === loan.id
                  const isUpdating = updatingId === loan.id

                  return (
                    <div
                      key={loan.id}
                      className={`grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto] md:items-center ${
                        highlightedLoanId === loan.id ? 'loan-row-updated' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{loan.recipient}</p>
                        <p className="text-xs text-text-muted">
                          Given {formatCETDateTime(loan.dateGiven)} • Due{' '}
                          {formatCETDateTime(loan.expectedRepaymentDate)}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-text-primary">
                        {formatCurrency(loan.amount, currencySymbol)}
                      </p>

                      <p className="text-sm text-text-primary">
                        {formatLoanTimeRemaining(loan.status, loan.daysRemaining)}
                      </p>

                      <span
                        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[loan.status]}`}
                      >
                        {getLoanStatusLabel(loan.status)}
                      </span>

                      <div className="md:text-right">
                        <div className="flex items-center gap-2 md:justify-end">
                          {onEdit && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onEdit(loan)}
                              aria-label={`Edit loan for ${loan.recipient}`}
                              className={editButtonClass}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => onDelete(loan.id)}
                              className="glass-panel px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
