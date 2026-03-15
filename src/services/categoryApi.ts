// ADD THIS: category API integration for backend persistence
import type { BudgetCategory, BudgetCategoryType } from '@/types/budget'
import { backendRequest } from './backendClient'

type RemoteCategory = {
  id: string
  userId: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  type: BudgetCategoryType
  allocated: number
  spent: number
  dueDayOfMonth?: number | null
  sortOrder?: number
  isDefault?: boolean
  isArchived?: boolean
  createdAt: string
}

type CreateCategoryPayload = {
  kind: 'expense'
  name: string
  parentName?: string
  icon: string
  color: string
  iconColor: string
  type: BudgetCategoryType
  allocated?: number
  spent?: number
  dueDayOfMonth?: number
}

type UpdateCategoryPayload = {
  name?: string
  parentName?: string
  icon?: string
  color?: string
  iconColor?: string
  type?: BudgetCategoryType
  allocated?: number
  spent?: number
  dueDayOfMonth?: number | null
}

const toBudgetCategory = (value: RemoteCategory): BudgetCategory => ({
  id: value.id,
  name: value.name,
  parentName: value.parentName,
  icon: value.icon,
  color: value.color,
  iconColor: value.iconColor,
  type: value.type,
  allocated: value.allocated,
  spent: value.spent,
  dueDayOfMonth: value.dueDayOfMonth ?? null,
  sortOrder: value.sortOrder ?? 0,
  isDefault: value.isDefault ?? false,
  isArchived: value.isArchived ?? false,
})

export const categoryApi = {
  async list(): Promise<BudgetCategory[]> {
    const rows = await backendRequest<RemoteCategory[]>('/categories?kind=expense', { method: 'GET' })
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
    const updated = await backendRequest<RemoteCategory>(`/categories/${id}?kind=expense`, {
      method: 'PATCH',
      body: JSON.stringify({ kind: 'expense', ...payload }),
    })

    return toBudgetCategory(updated)
  },

  async remove(id: string): Promise<void> {
    await backendRequest<void>(`/categories/${id}?kind=expense`, { method: 'DELETE' })
  },
}
