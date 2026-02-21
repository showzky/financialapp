import { useState } from 'react'
import type { Loan } from '@/types/loan'
import { formatLoanTimeRemaining, getLoanStatusLabel } from '@/utils/loanStatus'
import { formatCurrency } from '@/utils/currency'
import { formatCETDateTime } from '@/utils/date'

type LoanTableProps = {
  loans: Loan[]
  currencySymbol: 'KR' | '$' | '€'
  onMarkRepaid: (id: string) => Promise<void>
  markingId: string | null
  onDelete?: (id: string) => Promise<void>
  deletingId?: string | null
}

const statusClasses: Record<Loan['status'], string> = {
  outstanding: 'bg-surface-strong text-text-primary',
  due_soon: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  repaid: 'bg-emerald-100 text-emerald-700',
}

export const LoanTable = ({
  loans,
  currencySymbol,
  onMarkRepaid,
  markingId,
  onDelete,
  deletingId,
}: LoanTableProps) => {
  // split out repaid vs non-repaid for optional collapsing
  const nonRepaid = loans.filter((l) => l.status !== 'repaid')
  const repaidLoans = loans.filter((l) => l.status === 'repaid')

  const [showRepaid, setShowRepaid] = useState(false)

  // when the repaid section grows too tall we restrict height and enable scrolling
  const repaidScrollable = repaidLoans.length >= 5

  if (loans.length === 0) {
    return (
      <div className="neo-card p-6 text-sm text-text-muted">
        No loans yet. Add a loan to start tracking repayments.
      </div>
    )
  }

  return (
    <div className="neo-card overflow-hidden">
      <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-3 border-b border-surface-strong px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted md:grid">
        <span>Recipient</span>
        <span>Amount</span>
        <span>Time remaining</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-surface-strong">
        {/* render non-repaid rows always */}
        {nonRepaid.map((loan) => {
          const isMarking = markingId === loan.id
          const canMarkRepaid = loan.status !== 'repaid'

          return (
            <div
              key={loan.id}
              className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto] md:items-center"
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
                <button
                  type="button"
                  disabled={!canMarkRepaid || isMarking}
                  onClick={() => onMarkRepaid(loan.id)}
                  className="neo-card neo-pressable px-3 py-2 text-xs font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMarking ? 'Saving…' : canMarkRepaid ? 'Mark repaid' : 'Completed'}
                </button>
              </div>
            </div>
          )
        })}

        {/* optional collapsible repaid section */}
        {repaidLoans.length > 0 && (
          <>
            <div className="px-4 py-2">
              <button
                type="button"
                onClick={() => setShowRepaid((c) => !c)}
                className="flex w-full items-center justify-between rounded-full border border-surface-strong bg-surface py-2 px-4 text-sm font-semibold text-text-primary transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
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
                  ? 'max-h-[2000px] opacity-100 translate-y-0'
                  : 'max-h-0 opacity-0 -translate-y-4'
              }`}
            >
              <div
                className={`${repaidScrollable ? 'max-h-80 overflow-y-auto scrollbar-success' : ''}`}
              >
                {repaidLoans.map((loan) => {
                  const isDeleting = deletingId === loan.id

                  return (
                    <div
                      key={loan.id}
                      className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto] md:items-center"
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
                        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusClasses[loan.status]
                        }`}
                      >
                        {getLoanStatusLabel(loan.status)}
                      </span>

                      <div className="md:text-right">
                        {onDelete && (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onDelete(loan.id)}
                            className="neo-card neo-pressable px-3 py-2 text-xs font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
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
