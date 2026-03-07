import type {
  BorrowedLoan,
  BorrowedLoanSummary,
  CreateBorrowedLoanPayload,
  UpdateBorrowedLoanPayload,
} from '../shared'
import { backendClient } from './backendClient'

export type {
  BorrowedLoan,
  BorrowedLoanSummary,
  CreateBorrowedLoanPayload,
  UpdateBorrowedLoanPayload,
} from '../shared'

export const borrowedLoanApi = {
  list: async () => {
    return backendClient.get<BorrowedLoan[]>('/borrowed-loans')
  },

  getSummary: async () => {
    return backendClient.get<BorrowedLoanSummary>('/borrowed-loans/summary')
  },

  create: async (payload: CreateBorrowedLoanPayload) => {
    return backendClient.post<BorrowedLoan>('/borrowed-loans', payload)
  },

  update: async (id: string, payload: UpdateBorrowedLoanPayload) => {
    const encodedId = encodeURIComponent(id)
    return backendClient.patch<BorrowedLoan>(`/borrowed-loans/${encodedId}`, payload)
  },

  markPaidOff: async (id: string) => {
    const encodedId = encodeURIComponent(id)
    return backendClient.patch<BorrowedLoan>(`/borrowed-loans/${encodedId}/paid-off`, {})
  },

  remove: async (id: string) => {
    const encodedId = encodeURIComponent(id)
    return backendClient.delete(`/borrowed-loans/${encodedId}`)
  },
}
