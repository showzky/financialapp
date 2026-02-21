import { backendRequest } from './backendClient'
import type { CreateLoanPayload, Loan, LoanSummary, UpdateLoanPayload } from '@/types/loan'

export const loanApi = {
  list: (params?: { isVacation?: boolean }) => {
    const query = new URLSearchParams()
    query.append('isVacation', String(params?.isVacation ?? false))
    return backendRequest<Loan[]>(`/loans?${query.toString()}`, { method: 'GET' })
  },

  getSummary: (params?: { isVacation?: boolean }) => {
    const query = new URLSearchParams()
    query.append('isVacation', String(params?.isVacation ?? false))
    return backendRequest<LoanSummary>(`/loans/summary?${query.toString()}`, { method: 'GET' })
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
