import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { BorrowedLoan, UpdateBorrowedLoanPayload } from '@/types/loan'

type EditBorrowedLoanModalProps = {
  isOpen: boolean
  loan: BorrowedLoan | null
  onClose: () => void
  onSubmit: (id: string, payload: UpdateBorrowedLoanPayload) => Promise<void>
}

type EditBorrowedLoanFormState = {
  lender: string
  originalAmount: string
  currentBalance: string
  interestRate: string
  payoffDate: string
  notes: string
}

const emptyState: EditBorrowedLoanFormState = {
  lender: '',
  originalAmount: '',
  currentBalance: '',
  interestRate: '',
  payoffDate: '',
  notes: '',
}

const toFormState = (loan: BorrowedLoan): EditBorrowedLoanFormState => ({
  lender: loan.lender,
  originalAmount: String(loan.originalAmount),
  currentBalance: String(loan.currentBalance),
  interestRate: String(loan.interestRate),
  payoffDate: loan.payoffDate.slice(0, 10),
  notes: loan.notes ?? '',
})

export const EditBorrowedLoanModal = ({
  isOpen,
  loan,
  onClose,
  onSubmit,
}: EditBorrowedLoanModalProps) => {
  const [formState, setFormState] = useState<EditBorrowedLoanFormState>(emptyState)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (isOpen && loan) {
      setFormState(toFormState(loan))
      setHasTriedSubmit(false)
      setIsSubmitting(false)
      setSubmitError('')
    }
  }, [isOpen, loan])

  const lender = formState.lender.trim()
  const notes = formState.notes.trim()
  const originalAmount = Number(formState.originalAmount.trim())
  const currentBalance = Number(formState.currentBalance.trim())
  const interestRate = Number(formState.interestRate.trim())
  const isOriginalAmountValid = formState.originalAmount.trim() !== '' && Number.isFinite(originalAmount) && originalAmount > 0
  const isCurrentBalanceValid = formState.currentBalance.trim() !== '' && Number.isFinite(currentBalance) && currentBalance >= 0
  const isInterestRateValid =
    formState.interestRate.trim() !== '' && Number.isFinite(interestRate) && interestRate >= 0 && interestRate <= 100
  const isBalanceRangeValid = isOriginalAmountValid && isCurrentBalanceValid ? currentBalance <= originalAmount : true
  const isPayoffDateValid = formState.payoffDate !== ''

  const isFormValid =
    lender.length > 0 &&
    isOriginalAmountValid &&
    isCurrentBalanceValid &&
    isInterestRateValid &&
    isBalanceRangeValid &&
    isPayoffDateValid

  const hasChanges = useMemo(() => {
    if (!loan) {
      return false
    }

    return (
      lender !== loan.lender ||
      originalAmount !== loan.originalAmount ||
      currentBalance !== loan.currentBalance ||
      interestRate !== loan.interestRate ||
      formState.payoffDate !== loan.payoffDate.slice(0, 10) ||
      notes !== (loan.notes ?? '')
    )
  }, [currentBalance, formState.payoffDate, interestRate, lender, loan, notes, originalAmount])

  if (!isOpen || !loan) {
    return null
  }

  const handleClose = () => {
    setFormState(emptyState)
    setHasTriedSubmit(false)
    setIsSubmitting(false)
    setSubmitError('')
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasTriedSubmit(true)
    if (!isFormValid || !hasChanges || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await onSubmit(loan.id, {
        lender,
        originalAmount,
        currentBalance,
        interestRate,
        payoffDate: formState.payoffDate,
        notes: notes.length > 0 ? notes : null,
      })
      handleClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to update loan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[22px] bg-gradient-to-br from-white/20 to-transparent p-[1px] shadow-[0_0_35px_rgba(var(--accent-rgb),0.2)]">
        <div className="rounded-[21px] border border-white/10 bg-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Edit personal loan</p>
              <h2 className="text-xl font-semibold text-text-primary">Update details</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close edit borrowed loan modal"
              className="rounded-lg border border-white/15 p-2 text-text-muted transition hover:border-white/30 hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="edit-borrowed-loan-lender" className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                Lender / institution
              </label>
              <input
                id="edit-borrowed-loan-lender"
                type="text"
                value={formState.lender}
                onChange={(event) => setFormState((current) => ({ ...current, lender: event.target.value }))}
                className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                autoFocus
              />
              {hasTriedSubmit && lender.length === 0 ? <p className="text-xs text-error">Lender is required.</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="edit-borrowed-loan-original-amount" className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                  Original amount
                </label>
                <input
                  id="edit-borrowed-loan-original-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.originalAmount}
                  onChange={(event) => setFormState((current) => ({ ...current, originalAmount: event.target.value }))}
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                />
                {hasTriedSubmit && !isOriginalAmountValid ? <p className="text-xs text-error">Enter a valid original amount.</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-borrowed-loan-current-balance" className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                  Current balance
                </label>
                <input
                  id="edit-borrowed-loan-current-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.currentBalance}
                  onChange={(event) => setFormState((current) => ({ ...current, currentBalance: event.target.value }))}
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                />
                {hasTriedSubmit && !isCurrentBalanceValid ? <p className="text-xs text-error">Enter a valid current balance.</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-borrowed-loan-interest-rate" className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                Interest rate (%)
              </label>
              <input
                id="edit-borrowed-loan-interest-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formState.interestRate}
                onChange={(event) => setFormState((current) => ({ ...current, interestRate: event.target.value }))}
                className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
              />
              {hasTriedSubmit && !isInterestRateValid ? <p className="text-xs text-error">Enter an interest rate between 0 and 100.</p> : null}
            </div>

            {hasTriedSubmit && !isBalanceRangeValid ? <p className="text-xs text-error">Current balance cannot exceed the original amount.</p> : null}

            <div className="space-y-2">
              <label htmlFor="edit-borrowed-loan-payoff-date" className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                Payoff / due date
              </label>
              <input
                id="edit-borrowed-loan-payoff-date"
                type="date"
                value={formState.payoffDate}
                onChange={(event) => setFormState((current) => ({ ...current, payoffDate: event.target.value }))}
                className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-borrowed-loan-notes" className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                Notes
              </label>
              <textarea
                id="edit-borrowed-loan-notes"
                value={formState.notes}
                onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-3 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
              />
            </div>

            {submitError ? <p className="text-sm text-error">{submitError}</p> : null}

            <button
              type="submit"
              disabled={!hasChanges || isSubmitting}
              className="btn-shimmer relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-accent via-accent-strong to-accent px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_18px_rgba(var(--accent-rgb),0.32)] transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
