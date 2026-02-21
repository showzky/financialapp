import { backendRequest } from './backendClient'
import type { CreateLoanPayload, Loan, LoanSummary, UpdateLoanPayload } from '@/types/loan'

export const loanApi = {
  list: () => {
    return backendRequest<Loan[]>('/loans', { method: 'GET' })
  },

  getSummary: () => {
    return backendRequest<LoanSummary>('/loans/summary', { method: 'GET' })
  },

  create: (payload: CreateLoanPayload) => {
    return backendRequest<Loan>('/loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  update: (id: string, payload: UpdateLoanPayload) => {
    return backendRequest<Loan>(`/loans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  markRepaid: (id: string) => {
    return backendRequest<Loan>(`/loans/${id}/repaid`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
  },

  remove: (id: string) => {
    return backendRequest<void>(`/loans/${id}`, { method: 'DELETE' })
  },
}
