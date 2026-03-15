export type BudgetTransaction = {
  id: string
  userId: string
  categoryId: string
  amount: number
  note: string | null
  transactionDate: string
  isPaid: boolean
  createdAt: string
}

export type CreateBudgetTransactionPayload = {
  categoryId: string
  amount: number
  transactionDate: string
  note?: string
}

export type AppliedImportTargetKind = 'transaction' | 'wishlist' | 'local'

export const DASHBOARD_EXPENSE_NOTE_PREFIX = '[dashboard-expense]'
export const DASHBOARD_CREDIT_NOTE_PREFIX = '[dashboard-credit]'

export const DASHBOARD_EXPENSE_NOTE =
  '[dashboard-expense] Dashboard spent entry'

export const DASHBOARD_CREDIT_NOTE =
  '[dashboard-credit] Dashboard spent correction'
