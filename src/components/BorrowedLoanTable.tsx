import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { BorrowedLoan } from '@/types/loan'
import { formatCurrency } from '@/utils/currency'
import { formatCETDateTime } from '@/utils/date'
import {
  formatBorrowedLoanTimeRemaining,
  getBorrowedLoanStatusLabel,
} from '@/utils/borrowedLoanStatus'

type BorrowedLoanTableProps = {
  loans: BorrowedLoan[]
  currencySymbol: 'KR' | '$' | '€'
  onMarkPaidOff: (id: string) => Promise<void>
  markingId: string | null
  onEdit?: (loan: BorrowedLoan) => void
  updatingId?: string | null
  highlightedLoanId?: string | null
  onDelete?: (id: string) => Promise<void>
  deletingId?: string | null
  emptyMessage?: string
}

const statusClasses: Record<BorrowedLoan['status'], string> = {
  active: 'bg-[#202026] text-[#6b6862]',
  due_soon: 'bg-[rgba(220,160,50,0.12)] text-[#dca032] border border-[rgba(220,160,50,0.22)]',
  overdue: 'bg-[rgba(201,107,107,0.12)] text-[#c96b6b] border border-[rgba(201,107,107,0.22)]',
  paid_off: 'bg-[rgba(94,189,151,0.12)] text-[#5ebd97] border border-[rgba(94,189,151,0.22)]',
}

const editButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-[rgba(var(--accent-rgb),0.45)] bg-transparent px-2.5 py-2 text-[rgba(var(--accent-rgb),1)] transition hover:border-[rgba(var(--accent-rgb),0.85)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] disabled:cursor-not-allowed disabled:opacity-60'

export const BorrowedLoanTable = ({
  loans,
  currencySymbol,
  onMarkPaidOff,
  markingId,
  onEdit,
  updatingId,
  highlightedLoanId,
  onDelete,
  deletingId,
  emptyMessage = 'No personal loans yet. Add a loan to start tracking your balance.',
}: BorrowedLoanTableProps) => {
  const activeLoans = loans.filter((loan) => loan.status !== 'paid_off')
  const paidOffLoans = loans.filter((loan) => loan.status === 'paid_off')
  const [showPaidOff, setShowPaidOff] = useState(false)
  const paidOffScrollable = paidOffLoans.length >= 5

  if (loans.length === 0) {
    return <div className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-6 text-sm text-text-muted">{emptyMessage}</div>
  }

  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] overflow-hidden">
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted md:grid">
        <span>Lender</span>
        <span>Current balance</span>
        <span>Payoff target</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/10">
        {activeLoans.map((loan) => {
          const isMarking = markingId === loan.id
          const isUpdating = updatingId === loan.id

          return (
            <div
              key={loan.id}
              className={`grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center ${
                highlightedLoanId === loan.id ? 'loan-row-updated' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">{loan.lender}</p>
                <p className="text-xs text-text-muted">
                  Original {formatCurrency(loan.originalAmount, currencySymbol)}
                  {loan.notes ? ` • ${loan.notes}` : ''}
                </p>
              </div>

              <p className="text-sm font-semibold text-text-primary">
                {formatCurrency(loan.currentBalance, currencySymbol)}
              </p>

              <div>
                <p className="text-sm text-text-primary">{formatCETDateTime(loan.payoffDate)}</p>
                <p className="text-xs text-text-muted">
                  {formatBorrowedLoanTimeRemaining(loan.status, loan.daysRemaining)}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[loan.status]}`}
              >
                {getBorrowedLoanStatusLabel(loan.status)}
              </span>

              <div className="md:text-right">
                <div className="flex items-center gap-2 md:justify-end">
                  {onEdit && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onEdit(loan)}
                      aria-label={`Edit borrowed loan from ${loan.lender}`}
                      className={editButtonClass}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isMarking}
                    onClick={() => onMarkPaidOff(loan.id)}
                    className="rounded-[8px] border border-[rgba(255,255,255,0.055)] bg-[#202026] px-3 py-2 text-xs font-semibold text-text-muted transition hover:border-[rgba(255,255,255,0.10)] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMarking ? 'Saving...' : 'Mark paid off'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {paidOffLoans.length > 0 && (
          <>
            <div className="px-4 py-2">
              <button
                type="button"
                onClick={() => setShowPaidOff((current) => !current)}
                className="flex w-full items-center justify-between rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#202026] px-4 py-2 text-sm font-semibold text-text-muted transition hover:border-[rgba(255,255,255,0.10)] hover:text-text-primary focus:outline-none"
              >
                <span>Paid off loans ({paidOffLoans.length})</span>
                <span
                  className={`transition-transform duration-200 ${showPaidOff ? 'rotate-180' : 'rotate-0'}`}
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
                showPaidOff
                  ? 'max-h-[2000px] translate-y-0 opacity-100'
                  : '-translate-y-4 max-h-0 opacity-0'
              }`}
            >
              <div className={`${paidOffScrollable ? 'scrollbar-success max-h-80 overflow-y-auto' : ''}`}>
                {paidOffLoans.map((loan) => {
                  const isDeleting = deletingId === loan.id
                  const isUpdating = updatingId === loan.id

                  return (
                    <div
                      key={loan.id}
                      className={`grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center ${
                        highlightedLoanId === loan.id ? 'loan-row-updated' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{loan.lender}</p>
                        <p className="text-xs text-text-muted">
                          Original {formatCurrency(loan.originalAmount, currencySymbol)}
                          {loan.notes ? ` • ${loan.notes}` : ''}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-text-primary">
                        {formatCurrency(loan.currentBalance, currencySymbol)}
                      </p>

                      <div>
                        <p className="text-sm text-text-primary">{formatCETDateTime(loan.payoffDate)}</p>
                        <p className="text-xs text-text-muted">
                          {formatBorrowedLoanTimeRemaining(loan.status, loan.daysRemaining)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[loan.status]}`}
                      >
                        {getBorrowedLoanStatusLabel(loan.status)}
                      </span>

                      <div className="md:text-right">
                        <div className="flex items-center gap-2 md:justify-end">
                          {onEdit && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onEdit(loan)}
                              aria-label={`Edit borrowed loan from ${loan.lender}`}
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
                              className="rounded-[8px] border border-[rgba(201,107,107,0.20)] bg-[rgba(201,107,107,0.08)] px-3 py-2 text-xs font-semibold text-[#c96b6b] transition hover:bg-[rgba(201,107,107,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
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