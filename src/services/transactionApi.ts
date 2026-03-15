import type { BudgetTransaction, CreateBudgetTransactionPayload } from '@/types/transaction'
import { backendRequest } from './backendClient'

export const transactionApi = {
  async list(): Promise<BudgetTransaction[]> {
    return backendRequest<BudgetTransaction[]>('/transactions', { method: 'GET' })
  },

  async create(payload: CreateBudgetTransactionPayload): Promise<BudgetTransaction> {
    return backendRequest<BudgetTransaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async remove(id: string): Promise<void> {
    return backendRequest<void>(`/transactions/${id}`, {
      method: 'DELETE',
    })
  },

  async removeByCategory(categoryId: string): Promise<{ removedCount: number }> {
    return backendRequest<{ removedCount: number }>(`/transactions/by-category/${categoryId}`, {
      method: 'DELETE',
    })
  },
}
