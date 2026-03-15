import { backendClient } from './backendClient'

export type CategoryKind = 'expense' | 'income'
export type ExpenseCategoryType = 'budget' | 'fixed'

export type CategoryDto = {
  id: string
  userId: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  sortOrder: number
  isDefault: boolean
  isArchived: boolean
  createdAt: string
  type?: ExpenseCategoryType
  allocated?: number
  spent?: number
  dueDayOfMonth?: number | null
}

export type CreateCategoryPayload = {
  kind: CategoryKind
  name: string
  parentName?: string
  icon: string
  color: string
  iconColor: string
  sortOrder?: number
  isDefault?: boolean
  isArchived?: boolean
  type?: ExpenseCategoryType
  allocated?: number
  spent?: number
  dueDayOfMonth?: number | null
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>

const categoryListCache: Partial<Record<CategoryKind, CategoryDto[]>> = {}

function setCachedCategories(kind: CategoryKind, categories: CategoryDto[]) {
  categoryListCache[kind] = categories
}

function clearCategoryCache(kind?: CategoryKind) {
  if (kind) {
    delete categoryListCache[kind]
    return
  }

  delete categoryListCache.expense
  delete categoryListCache.income
}

export const categoryApi = {
  getCachedCategories(kind: CategoryKind): CategoryDto[] | null {
    return categoryListCache[kind] ?? null
  },

  async listCategories(kind: CategoryKind): Promise<CategoryDto[]> {
    const rows = await backendClient.get<CategoryDto[]>(`/categories?kind=${kind}`)
    setCachedCategories(kind, rows)
    return rows
  },

  async getCategory(id: string, kind: CategoryKind): Promise<CategoryDto> {
    return backendClient.get<CategoryDto>(`/categories/${id}?kind=${kind}`)
  },

  async createCategory(payload: CreateCategoryPayload): Promise<CategoryDto> {
    const result = await backendClient.post<CategoryDto>('/categories', payload)
    clearCategoryCache(payload.kind)
    return result
  },

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryDto> {
    const query = payload.kind ? `?kind=${payload.kind}` : ''
    const result = await backendClient.patch<CategoryDto>(`/categories/${id}${query}`, payload)
    clearCategoryCache(payload.kind)
    return result
  },

  async deleteCategory(id: string, kind: CategoryKind): Promise<void> {
    await backendClient.delete(`/categories/${id}?kind=${kind}`)
    clearCategoryCache(kind)
  },

  async resetDefaults(): Promise<{
    expenseCategories: CategoryDto[]
    incomeCategories: CategoryDto[]
  }> {
    const result = await backendClient.post<{
      expenseCategories: CategoryDto[]
      incomeCategories: CategoryDto[]
    }>('/categories/reset-defaults', {})
    clearCategoryCache()
    return result
  },
}
