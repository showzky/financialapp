import type {
  BorrowedLoan,
  CreateBorrowedLoanPayload,
  UpdateBorrowedLoanPayload,
} from '../services/borrowedLoanApi'

export type BorrowedLoanFormValues = {
  lender: string
  originalAmount: string
  currentBalance: string
  payoffDate: string
  notes: string
}

export type BorrowedLoanFormErrors = {
  lender: string
  originalAmount: string
  currentBalance: string
  payoffDate: string
  notes: string
}

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

export const isValidIsoDate = (value: string) => {
  if (!isoDateRegex.test(value)) {
    return false
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const getBorrowedLoanFormErrors = (
  values: BorrowedLoanFormValues,
): BorrowedLoanFormErrors => {
  const parsedOriginalAmount = Number(values.originalAmount)
  const parsedCurrentBalance = Number(values.currentBalance)

  return {
    lender: !values.lender.trim() ? 'Lender is required' : '',
    originalAmount:
      !values.originalAmount ||
      !Number.isFinite(parsedOriginalAmount) ||
      parsedOriginalAmount <= 0
        ? 'Enter a valid original amount'
        : '',
    currentBalance:
      !values.currentBalance ||
      !Number.isFinite(parsedCurrentBalance) ||
      parsedCurrentBalance < 0
        ? 'Enter a valid current balance'
        : parsedCurrentBalance > parsedOriginalAmount
        ? 'Current balance cannot exceed original amount'
        : '',
    payoffDate: !isValidIsoDate(values.payoffDate) ? 'Use format YYYY-MM-DD' : '',
    notes: values.notes.length > 400 ? 'Max 400 characters' : '',
  }
}

export const buildCreateBorrowedLoanPayload = (
  values: BorrowedLoanFormValues,
): CreateBorrowedLoanPayload => ({
  lender: values.lender.trim(),
  originalAmount: Number(values.originalAmount),
  currentBalance: Number(values.currentBalance),
  payoffDate: values.payoffDate,
  notes: values.notes.trim() || undefined,
})

export const buildUpdateBorrowedLoanPayload = (
  loan: BorrowedLoan,
  values: BorrowedLoanFormValues,
): UpdateBorrowedLoanPayload => {
  const payload: UpdateBorrowedLoanPayload = {}

  if (values.lender.trim() !== loan.lender) payload.lender = values.lender.trim()
  if (Number(values.originalAmount) !== loan.originalAmount) {
    payload.originalAmount = Number(values.originalAmount)
  }
  if (Number(values.currentBalance) !== loan.currentBalance) {
    payload.currentBalance = Number(values.currentBalance)
  }
  if (values.payoffDate !== loan.payoffDate.slice(0, 10)) payload.payoffDate = values.payoffDate
  if (values.notes !== (loan.notes ?? '')) payload.notes = values.notes.trim() || null

  return payload
}
