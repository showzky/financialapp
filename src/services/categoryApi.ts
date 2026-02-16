// ADD THIS: category API integration for backend persistence
import type { BudgetCategory, BudgetCategoryType } from '@/types/budget'
import { backendRequest } from './backendClient'

type RemoteCategory = {
  id: string
  userId: string
  name: string
  type: BudgetCategoryType
  allocated: number
  spent: number
  createdAt: string
}

type CreateCategoryPayload = {
  name: string
  type: BudgetCategoryType
  allocated?: number
  spent?: number
}

type UpdateCategoryPayload = {
  name?: string
  type?: BudgetCategoryType
  allocated?: number
  spent?: number
}

const toBudgetCategory = (value: RemoteCategory): BudgetCategory => ({
  id: value.id,
  name: value.name,
  type: value.type,
  allocated: value.allocated,
  spent: value.spent,
})

export const categoryApi = {
  async list(): Promise<BudgetCategory[]> {
    const rows = await backendRequest<RemoteCategory[]>('/categories', { method: 'GET' })
    return rows.map(toBudgetCategory)
  },

  async create(payload: CreateCategoryPayload): Promise<BudgetCategory> {
    const created = await backendRequest<RemoteCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return toBudgetCategory(created)
  },

  async update(id: string, payload: UpdateCategoryPayload): Promise<BudgetCategory> {
    const updated = await backendRequest<RemoteCategory>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return toBudgetCategory(updated)
  },

  async remove(id: string): Promise<void> {
    await backendRequest<void>(`/categories/${id}`, { method: 'DELETE' })
  },
}
