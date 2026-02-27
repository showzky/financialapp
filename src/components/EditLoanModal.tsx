import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Loan, UpdateLoanPayload } from '@/types/loan'

type EditLoanModalProps = {
  isOpen: boolean
  loan: Loan | null
  onClose: () => void
  onSubmit: (id: string, payload: UpdateLoanPayload) => Promise<void>
}

type EditLoanFormState = {
  recipient: string
  amount: string
  dateGiven: string
  expectedRepaymentDate: string
}

const emptyState: EditLoanFormState = {
  recipient: '',
  amount: '',
  dateGiven: '',
  expectedRepaymentDate: '',
}

const toFormState = (loan: Loan): EditLoanFormState => ({
  recipient: loan.recipient,
  amount: String(loan.amount),
  dateGiven: loan.dateGiven.slice(0, 10),
  expectedRepaymentDate: loan.expectedRepaymentDate.slice(0, 10),
})

export const EditLoanModal = ({ isOpen, loan, onClose, onSubmit }: EditLoanModalProps) => {
  const [formState, setFormState] = useState<EditLoanFormState>(emptyState)
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

  const hasChanges = useMemo(() => {
    if (!loan) {
      return false
    }

    return (
      recipient !== loan.recipient ||
      amountValue !== loan.amount ||
      formState.dateGiven !== loan.dateGiven.slice(0, 10) ||
      formState.expectedRepaymentDate !== loan.expectedRepaymentDate.slice(0, 10)
    )
  }, [amountValue, formState.dateGiven, formState.expectedRepaymentDate, loan, recipient])

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
        recipient,
        amount: amountValue,
        dateGiven: formState.dateGiven,
        expectedRepaymentDate: formState.expectedRepaymentDate,
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
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Edit loan</p>
              <h2 className="text-xl font-semibold text-text-primary">Update details</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close edit loan modal"
              className="rounded-lg border border-white/15 p-2 text-text-muted transition hover:border-white/30 hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="edit-loan-recipient"
                className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
              >
                Recipient
              </label>
              <input
                id="edit-loan-recipient"
                type="text"
                value={formState.recipient}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, recipient: event.target.value }))
                }
                className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                autoFocus
              />
              {hasTriedSubmit && recipient.length === 0 ? (
                <p className="text-xs text-error">Recipient is required.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-loan-amount"
                className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
              >
                Amount
              </label>
              <input
                id="edit-loan-amount"
                type="number"
                min="0"
                step="0.01"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, amount: event.target.value }))
                }
                className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
              />
              {hasTriedSubmit && !isAmountValid ? (
                <p className="text-xs text-error">Enter a valid amount.</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="edit-loan-date-given"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
                  Date given
                </label>
                <input
                  id="edit-loan-date-given"
                  type="date"
                  value={formState.dateGiven}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, dateGiven: event.target.value }))
                  }
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="edit-loan-date-expected"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
                  Expected repayment
                </label>
                <input
                  id="edit-loan-date-expected"
                  type="date"
                  value={formState.expectedRepaymentDate}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      expectedRepaymentDate: event.target.value,
                    }))
                  }
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                />
              </div>
            </div>

            {hasTriedSubmit && !isDateRangeValid ? (
              <p className="text-xs text-error">
                Expected repayment date must be on or after date given.
              </p>
            ) : null}

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
