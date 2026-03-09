import { useState, type FormEvent } from 'react'
import type { CreateBorrowedLoanPayload } from '@/types/loan'

type AddBorrowedLoanModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CreateBorrowedLoanPayload) => Promise<void>
}

const initialState = {
  lender: '',
  originalAmount: '',
  currentBalance: '',
  interestRate: '',
  payoffDate: '',
  notes: '',
}

export const AddBorrowedLoanModal = ({
  isOpen,
  onClose,
  onSubmit,
}: AddBorrowedLoanModalProps) => {
  const [formState, setFormState] = useState(initialState)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (!isOpen) {
    return null
  }

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

  const handleClose = () => {
    setFormState(initialState)
    setHasTriedSubmit(false)
    setIsSubmitting(false)
    setSubmitError('')
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasTriedSubmit(true)
    if (!isFormValid || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await onSubmit({
        lender,
        originalAmount,
        currentBalance,
        interestRate,
        payoffDate: formState.payoffDate,
        notes: notes.length > 0 ? notes : null,
      })
      handleClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to add loan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[#111114] p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Add personal loan"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#c9a84c]">Loans</p>
            <h2 className="text-xl font-semibold text-text-primary">Add personal loan</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close add personal loan modal"
            className="rounded-lg border border-[rgba(255,255,255,0.10)] p-2 text-text-muted transition hover:border-[rgba(255,255,255,0.20)] hover:text-text-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="borrowed-loan-lender" className="text-sm font-medium text-text-muted">
              Lender / institution
            </label>
            <input
              id="borrowed-loan-lender"
              type="text"
              value={formState.lender}
              onChange={(event) => setFormState((current) => ({ ...current, lender: event.target.value }))}
              placeholder="Storebrand, DNB, family member..."
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] px-4 py-3 text-text-primary outline-none focus:border-[rgba(91,163,201,0.5)]"
              autoFocus
            />
            {hasTriedSubmit && lender.length === 0 ? <p className="text-xs text-[#c96b6b]">Lender is required.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="borrowed-loan-original-amount" className="text-sm font-medium text-text-muted">
                Original amount
              </label>
              <input
                id="borrowed-loan-original-amount"
                type="number"
                min="0"
                step="0.01"
                value={formState.originalAmount}
                onChange={(event) => setFormState((current) => ({ ...current, originalAmount: event.target.value }))}
                placeholder="0.00"
                className="w-full rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] px-4 py-3 text-text-primary outline-none focus:border-[rgba(91,163,201,0.5)]"
              />
              {hasTriedSubmit && !isOriginalAmountValid ? <p className="text-xs text-[#c96b6b]">Enter a valid original amount.</p> : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="borrowed-loan-current-balance" className="text-sm font-medium text-text-muted">
                Current balance
              </label>
              <input
                id="borrowed-loan-current-balance"
                type="number"
                min="0"
                step="0.01"
                value={formState.currentBalance}
                onChange={(event) => setFormState((current) => ({ ...current, currentBalance: event.target.value }))}
                placeholder="0.00"
                className="w-full rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] px-4 py-3 text-text-primary outline-none focus:border-[rgba(91,163,201,0.5)]"
              />
              {hasTriedSubmit && !isCurrentBalanceValid ? <p className="text-xs text-[#c96b6b]">Enter a valid current balance.</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="borrowed-loan-interest-rate" className="text-sm font-medium text-text-muted">
              Interest rate (%)
            </label>
            <input
              id="borrowed-loan-interest-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formState.interestRate}
              onChange={(event) => setFormState((current) => ({ ...current, interestRate: event.target.value }))}
              placeholder="6"
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] px-4 py-3 text-text-primary outline-none focus:border-[rgba(91,163,201,0.5)]"
            />
            {hasTriedSubmit && !isInterestRateValid ? <p className="text-xs text-[#c96b6b]">Enter an interest rate between 0 and 100.</p> : null}
          </div>

          {hasTriedSubmit && !isBalanceRangeValid ? (
            <p className="text-xs text-[#c96b6b]">Current balance cannot exceed the original amount.</p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="borrowed-loan-payoff-date" className="text-sm font-medium text-text-muted">
              Payoff / due date
            </label>
            <input
              id="borrowed-loan-payoff-date"
              type="date"
              value={formState.payoffDate}
              onChange={(event) => setFormState((current) => ({ ...current, payoffDate: event.target.value }))}
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] px-4 py-3 text-text-primary outline-none focus:border-[rgba(91,163,201,0.5)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="borrowed-loan-notes" className="text-sm font-medium text-text-muted">
              Notes
            </label>
            <textarea
              id="borrowed-loan-notes"
              value={formState.notes}
              onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional context about terms or repayment plan"
              rows={3}
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] px-4 py-3 text-text-primary outline-none focus:border-[rgba(91,163,201,0.5)]"
            />
          </div>

          {submitError ? <p className="text-sm text-[#c96b6b]">{submitError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-[10px] border border-[#c9a84c] bg-[#c9a84c] px-4 py-3 text-sm font-semibold text-[#0a0a0b] transition hover:bg-[#e2c06a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving…' : 'Add personal loan'}
          </button>
        </form>
      </div>
    </div>
  )
}
