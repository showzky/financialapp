import { backendClient } from './backendClient'
import type { CreateLoanPayload, Loan, LoanSummary, UpdateLoanPayload } from '../shared'

export type { CreateLoanPayload, Loan, LoanSummary, UpdateLoanPayload } from '../shared'

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
