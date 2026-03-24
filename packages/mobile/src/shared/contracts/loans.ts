export type LoanStatus = 'outstanding' | 'due_soon' | 'overdue' | 'repaid'

export type Loan = {
  id: string
  recipient: string
  amount: number
  dateGiven: string
  expectedRepaymentDate: string
  notes: string | null
  iconUrl?: string | null
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
  notes?: string | null
  iconUrl?: string | null
}

export type UpdateLoanPayload = {
  recipient?: string
  amount?: number
  dateGiven?: string
  expectedRepaymentDate?: string
  notes?: string | null
  iconUrl?: string | null
}

export type LoanSummary = {
  totalOutstandingAmount: number
  activeCount: number
  overdueCount: number
  dueSoonCount: number
  repaidCount: number
}

export type BorrowedLoanStatus = 'active' | 'due_soon' | 'overdue' | 'paid_off'

export type BorrowedLoan = {
  id: string
  lender: string
  originalAmount: number
  currentBalance: number
  interestRate: number
  payoffDate: string
  notes: string | null
  iconUrl?: string | null
  paidOffAt: string | null
  status: BorrowedLoanStatus
  daysRemaining: number | null
  createdAt: string
  updatedAt: string
}

export type CreateBorrowedLoanPayload = {
  lender: string
  originalAmount: number
  currentBalance: number
  interestRate: number
  payoffDate: string
  notes?: string | null
  iconUrl?: string | null
}

export type UpdateBorrowedLoanPayload = {
  lender?: string
  originalAmount?: number
  currentBalance?: number
  interestRate?: number
  payoffDate?: string
  notes?: string | null
  iconUrl?: string | null
}

export type BorrowedLoanSummary = {
  totalCurrentBalance: number
  activeCount: number
  overdueCount: number
  dueSoonCount: number
  paidOffCount: number
}
