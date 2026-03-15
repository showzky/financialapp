import { backendClient } from './backendClient'

type MonthlyBudgetTargetResponse = {
  month: string
  totalBudget: number | null
}

function toMonthKey(selectedMonth: Date) {
  const year = selectedMonth.getFullYear()
  const month = String(selectedMonth.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export const monthlyBudgetTargetApi = {
  async get(selectedMonth: Date): Promise<number | null> {
    const month = toMonthKey(selectedMonth)
    const response = await backendClient.get<MonthlyBudgetTargetResponse>(`/monthly-budget-targets?month=${month}`)
    return typeof response.totalBudget === 'number' ? response.totalBudget : null
  },

  async set(selectedMonth: Date, totalBudget: number): Promise<number> {
    const month = toMonthKey(selectedMonth)
    const response = await backendClient.patch<MonthlyBudgetTargetResponse>(`/monthly-budget-targets?month=${month}`, {
      totalBudget,
    })
    return response.totalBudget ?? totalBudget
  },
}
