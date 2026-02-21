export type LoanStatus = 'outstanding' | 'due_soon' | 'overdue' | 'repaid'

export type Loan = {
  id: string
  recipient: string
  amount: number
  dateGiven: string
  expectedRepaymentDate: string
  repaidAt: string | null
  status: LoanStatus
  daysRemaining: number | null
  createdAt: string
  updatedAt: string
}

export type CreateLoanPayload = {
  recipient: string
  amount: number
  dateGiven: string
  expectedRepaymentDate: string
}

export type UpdateLoanPayload = {
  recipient?: string
  amount?: number
  dateGiven?: string
  expectedRepaymentDate?: string
}

export type LoanSummary = {
  totalOutstandingAmount: number
  activeCount: number
  overdueCount: number
  dueSoonCount: number
  repaidCount: number
}
