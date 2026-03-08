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
}