import { useState, type FormEvent } from 'react'
import type { CreateLoanPayload } from '@/types/loan'

type AddLoanModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CreateLoanPayload) => Promise<void>
}

const initialState = {
  recipient: '',
  amount: '',
  dateGiven: '',
  expectedRepaymentDate: '',
}

export const AddLoanModal = ({ isOpen, onClose, onSubmit }: AddLoanModalProps) => {
  const [formState, setFormState] = useState(initialState)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (!isOpen) {
    return null
  }

  const recipient = formState.recipient.trim()
  const normalizedAmount = formState.amount.trim()
  const amountValue = Number(normalizedAmount)
  const isAmountValid = normalizedAmount !== '' && Number.isFinite(amountValue) && amountValue > 0
  const isDateGivenValid = formState.dateGiven !== ''
  const isExpectedDateValid = formState.expectedRepaymentDate !== ''
  const isDateRangeValid =
    isDateGivenValid && isExpectedDateValid
      ? formState.expectedRepaymentDate >= formState.dateGiven
      : true

  const isFormValid =
    recipient.length > 0 &&
    isAmountValid &&
    isDateRangeValid &&
    isDateGivenValid &&
    isExpectedDateValid

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
        recipient,
        amount: amountValue,
        dateGiven: formState.dateGiven,
        expectedRepaymentDate: formState.expectedRepaymentDate,
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
          <h2 className="text-xl font-semibold text-text-primary">Add loan</h2>
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
            <label htmlFor="loan-recipient" className="text-sm font-medium text-text-muted">
              Recipient
            </label>
            <input
              id="loan-recipient"
              type="text"
              value={formState.recipient}
              onChange={(event) =>
                setFormState((current) => ({ ...current, recipient: event.target.value }))
              }
              placeholder="Name of recipient"
              className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
            {hasTriedSubmit && recipient.length === 0 ? (
              <p className="text-xs text-red-500">Recipient is required.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="loan-amount" className="text-sm font-medium text-text-muted">
              Amount
            </label>
            <input
              id="loan-amount"
              type="number"
              min="0"
              step="0.01"
              value={formState.amount}
              onChange={(event) =>
                setFormState((current) => ({ ...current, amount: event.target.value }))
              }
              placeholder="0.00"
              className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
            />
            {hasTriedSubmit && !isAmountValid ? (
              <p className="text-xs text-red-500">Enter a valid amount.</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="loan-date-given" className="text-sm font-medium text-text-muted">
                Date given
              </label>
              <input
                id="loan-date-given"
                type="date"
                value={formState.dateGiven}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, dateGiven: event.target.value }))
                }
                className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="loan-date-expected" className="text-sm font-medium text-text-muted">
                Expected repayment
              </label>
              <input
                id="loan-date-expected"
                type="date"
                value={formState.expectedRepaymentDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    expectedRepaymentDate: event.target.value,
                  }))
                }
                className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          {hasTriedSubmit && !isDateRangeValid ? (
            <p className="text-xs text-red-500">
              Expected repayment date must be on or after date given.
            </p>
          ) : null}

          {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="neo-card neo-pressable w-full px-4 py-3 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving…' : 'Add loan'}
          </button>
        </form>
      </div>
    </div>
  )
}
