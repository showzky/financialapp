// @ts-nocheck
import { backendClient } from './backendClient'

export type CreateTransactionPayload = {
  categoryId: string
  amount: number
  transactionDate: string // YYYY-MM-DD
  note?: string
}

export type CreateCategoryPayload = {
  name: string
  type: 'budget' | 'fixed'
  allocated: number
}

export type CategoryResponse = {
  id: string
  name: string
  type: 'budget' | 'fixed'
  allocated: number
  spent: number
  createdAt: string
}

export const transactionApi = {
  async createTransaction(payload: CreateTransactionPayload): Promise<{ success: boolean }> {
    return backendClient.post('/transactions', payload)
  },

  async createCategory(payload: CreateCategoryPayload): Promise<CategoryResponse> {
    return backendClient.post('/categories', payload)
  },

  async updateCategory(
    id: string,
    payload: Partial<CreateCategoryPayload>
  ): Promise<CategoryResponse> {
    return backendClient.patch(`/categories/${id}`, payload)
  },

  async deleteCategory(id: string): Promise<void> {
    return backendClient.delete(`/categories/${id}`)
  },
}
