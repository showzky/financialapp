import { backendClient } from './backendClient'

export type Loan = {
  id: string
  recipient: string
  amount: number
  dateGiven: string
  expectedRepaymentDate: string
  repaidAt: string | null
  status: 'outstanding' | 'due_soon' | 'overdue' | 'repaid'
  daysRemaining: number | null
  createdAt: string
  updatedAt: string
}

export type LoanSummary = {
  totalOutstandingAmount: number
  activeCount: number
  overdueCount: number
  dueSoonCount: number
  repaidCount: number
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

export const loanApi = {
  list: async () => {
    return backendClient.get<Loan[]>('/loans')
  },

  getSummary: async () => {
    return backendClient.get<LoanSummary>('/loans/summary')
  },

  create: async (payload: CreateLoanPayload) => {
    return backendClient.post<Loan>('/loans', payload)
  },

  update: async (id: string, payload: UpdateLoanPayload) => {
    return backendClient.patch<Loan>(`/loans/${id}`, payload)
  },

  markRepaid: async (id: string) => {
    return backendClient.patch<Loan>(`/loans/${id}/repaid`, {})
  },

  remove: async (id: string) => {
    return backendClient.delete(`/loans/${id}`)
  },
}
