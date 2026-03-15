import { backendClient } from './backendClient'
import { categoryApi, type CategoryDto, type CreateCategoryPayload as CreateManagedCategoryPayload } from './categoryApi'

export type CreateTransactionPayload = {
  categoryId: string
  amount: number
  transactionDate: string // YYYY-MM-DD
  note?: string
  isPaid?: boolean
  countsTowardBills?: boolean
}

export type TransactionResponse = {
  id: string
  userId: string
  categoryId: string
  amount: number
  note: string | null
  transactionDate: string
  isPaid: boolean
  countsTowardBills: boolean
  createdAt: string
}

export type CreateCategoryPayload = CreateManagedCategoryPayload
export type CategoryResponse = CategoryDto

export const transactionApi = {
  async createTransaction(payload: CreateTransactionPayload): Promise<TransactionResponse> {
    return backendClient.post('/transactions', payload)
  },

  async listTransactions(): Promise<TransactionResponse[]> {
    return backendClient.get('/transactions')
  },

  async updateTransaction(
    id: string,
    payload: Partial<CreateTransactionPayload> & { note?: string | null }
  ): Promise<TransactionResponse> {
    return backendClient.patch(`/transactions/${id}`, payload)
  },

  async deleteTransaction(id: string): Promise<void> {
    return backendClient.delete(`/transactions/${id}`)
  },

  async createCategory(payload: CreateCategoryPayload): Promise<CategoryResponse> {
    return categoryApi.createCategory(payload)
  },

  async updateCategory(
    id: string,
    payload: Partial<CreateCategoryPayload>
  ): Promise<CategoryResponse> {
    return categoryApi.updateCategory(id, payload)
  },

  async deleteCategory(id: string): Promise<void> {
    return categoryApi.deleteCategory(id, 'expense')
  },
}
