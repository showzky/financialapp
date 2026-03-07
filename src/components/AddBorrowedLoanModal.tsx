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
  const isOriginalAmountValid = formState.originalAmount.trim() !== '' && Number.isFinite(originalAmount) && originalAmount > 0
  const isCurrentBalanceValid = formState.currentBalance.trim() !== '' && Number.isFinite(currentBalance) && currentBalance >= 0
  const isBalanceRangeValid = isOriginalAmountValid && isCurrentBalanceValid ? currentBalance <= originalAmount : true
  const isPayoffDateValid = formState.payoffDate !== ''

  const isFormValid = lender.length > 0 && isOriginalAmountValid && isCurrentBalanceValid && isBalanceRangeValid && isPayoffDateValid

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a44]/25 p-4 backdrop-blur-sm">
      <div className="neo-card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Add personal loan</h2>
          <button
            type="button"
            onClick={handleClose}
            className="neo-card neo-pressable px-3 py-1 text-sm font-semibold text-text-muted"
          >
            Close
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
              className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
            {hasTriedSubmit && lender.length === 0 ? <p className="text-xs text-red-500">Lender is required.</p> : null}
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
                className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              />
              {hasTriedSubmit && !isOriginalAmountValid ? <p className="text-xs text-red-500">Enter a valid original amount.</p> : null}
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
                className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              />
              {hasTriedSubmit && !isCurrentBalanceValid ? <p className="text-xs text-red-500">Enter a valid current balance.</p> : null}
            </div>
          </div>

          {hasTriedSubmit && !isBalanceRangeValid ? (
            <p className="text-xs text-red-500">Current balance cannot exceed the original amount.</p>
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
              className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
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
              className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="neo-card neo-pressable w-full px-4 py-3 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving…' : 'Add personal loan'}
          </button>
        </form>
      </div>
    </div>
  )
}