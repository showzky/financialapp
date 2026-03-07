import type {
  BorrowedLoan,
  BorrowedLoanSummary,
} from '../services/borrowedLoanApi'
import type { Loan, LoanSummary } from '../services/loanApi'

export type LoansScreenConfirmModal =
  | { type: 'repaid'; loan: Loan }
  | { type: 'paid-off'; loan: BorrowedLoan }
  | { type: 'delete-borrowed'; loan: BorrowedLoan }

export type LoansScreenFetchState = {
  loans: Loan[]
  summary: LoanSummary | null
  borrowedLoans: BorrowedLoan[]
  borrowedSummary: BorrowedLoanSummary | null
  lentError: string
  borrowedError: string
}

const getErrorMessage = (reason: unknown, fallback: string) =>
  reason instanceof Error ? reason.message : fallback

export const resolveLoansScreenFetchState = (input: {
  lentListResult: PromiseSettledResult<Loan[]>
  lentSummaryResult: PromiseSettledResult<LoanSummary>
  borrowedListResult: PromiseSettledResult<BorrowedLoan[]>
  borrowedSummaryResult: PromiseSettledResult<BorrowedLoanSummary>
}): LoansScreenFetchState => {
  const state: LoansScreenFetchState = {
    loans: input.lentListResult.status === 'fulfilled' ? input.lentListResult.value : [],
    summary: input.lentSummaryResult.status === 'fulfilled' ? input.lentSummaryResult.value : null,
    borrowedLoans:
      input.borrowedListResult.status === 'fulfilled' ? input.borrowedListResult.value : [],
    borrowedSummary:
      input.borrowedSummaryResult.status === 'fulfilled'
        ? input.borrowedSummaryResult.value
        : null,
    lentError: '',
    borrowedError: '',
  }

  if (input.lentListResult.status === 'rejected') {
    state.lentError = getErrorMessage(input.lentListResult.reason, 'Failed to load lent loans')
  } else if (input.lentSummaryResult.status === 'rejected') {
    state.lentError = getErrorMessage(input.lentSummaryResult.reason, 'Failed to load lent summary')
  }

  if (input.borrowedListResult.status === 'rejected') {
    state.borrowedError = getErrorMessage(
      input.borrowedListResult.reason,
      'Failed to load personal loans',
    )
  } else if (input.borrowedSummaryResult.status === 'rejected') {
    state.borrowedError = getErrorMessage(
      input.borrowedSummaryResult.reason,
      'Failed to load personal loan summary',
    )
  }

  return state
}

export const resolveConfirmAction = (modal: LoansScreenConfirmModal) => {
  if (modal.type === 'repaid') {
    return { type: 'repaid' as const, id: modal.loan.id }
  }

  if (modal.type === 'paid-off') {
    return { type: 'paid-off' as const, id: modal.loan.id }
  }

  if (modal.loan.status !== 'paid_off') {
    throw new Error('Only paid-off personal loans can be deleted')
  }

  return { type: 'delete-borrowed' as const, id: modal.loan.id }
}
