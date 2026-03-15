import { backendRequest } from './backendClient'

export type MonthlyBudgetCategoryAssignment = {
  id: string
  userId: string
  categoryId: string
  monthStart: string
  allocated: number
  createdAt: string
  updatedAt: string
}

function toMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export const monthlyBudgetCategoryAssignmentApi = {
  async list(selectedMonth: Date): Promise<MonthlyBudgetCategoryAssignment[]> {
    const month = toMonthParam(selectedMonth)
    const response = await backendRequest<{
      month: string
      assignments: MonthlyBudgetCategoryAssignment[]
    }>(`/monthly-budget-category-assignments?month=${month}`, {
      method: 'GET',
    })

    return response.assignments
  },

  async set(
    selectedMonth: Date,
    categoryId: string,
    allocated: number,
  ): Promise<MonthlyBudgetCategoryAssignment> {
    const month = toMonthParam(selectedMonth)
    const response = await backendRequest<{
      month: string
      assignment: MonthlyBudgetCategoryAssignment
    }>(`/monthly-budget-category-assignments/${categoryId}?month=${month}`, {
      method: 'PATCH',
      body: JSON.stringify({ allocated }),
    })

    return response.assignment
  },

  async remove(selectedMonth: Date, categoryId: string): Promise<void> {
    const month = toMonthParam(selectedMonth)
    await backendRequest<void>(`/monthly-budget-category-assignments/${categoryId}?month=${month}`, {
      method: 'DELETE',
    })
  },
}
