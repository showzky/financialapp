import { backendRequest } from './backendClient'
import type {
  BorrowedLoan,
  BorrowedLoanSummary,
  CreateBorrowedLoanPayload,
  UpdateBorrowedLoanPayload,
} from '@shared'

export const borrowedLoanApi = {
  list: () => {
    return backendRequest<BorrowedLoan[]>('/borrowed-loans', { method: 'GET' })
  },

  getSummary: () => {
    return backendRequest<BorrowedLoanSummary>('/borrowed-loans/summary', { method: 'GET' })
  },

  create: (payload: CreateBorrowedLoanPayload) => {
    return backendRequest<BorrowedLoan>('/borrowed-loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  update: (id: string, payload: UpdateBorrowedLoanPayload) => {
    const encodedId = encodeURIComponent(id)
    return backendRequest<BorrowedLoan>(`/borrowed-loans/${encodedId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  markPaidOff: (id: string) => {
    const encodedId = encodeURIComponent(id)
    return backendRequest<BorrowedLoan>(`/borrowed-loans/${encodedId}/paid-off`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
  },

  remove: (id: string) => {
    const encodedId = encodeURIComponent(id)
    return backendRequest<void>(`/borrowed-loans/${encodedId}`, { method: 'DELETE' })
  },
}