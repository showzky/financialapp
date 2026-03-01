import { backendClient } from './backendClient'

export type DashboardData = {
  totalIncome: number
  totalSpent: number
  remaining: number
  totalAllocated: number // ADDED THIS — sum of all category budgets
  freeToAssign: number   // ADDED THIS — totalIncome minus totalAllocated
  categoryCount: number
  loanBalance: number
  activeLoans: number
}

type CurrentUserDto = {
  id: string
  email: string
  displayName: string
  monthlyIncome: number
  createdAt: string
}

type CategoryDto = {
  id: string
  name: string
  type: 'budget' | 'fixed'
  allocated: number
  spent: number
  createdAt: string
}

type TransactionDto = {
  id: string
  categoryId: string
  amount: number
  note: string | null
  transactionDate: string
  createdAt: string
}

type LoanSummaryDto = {
  totalOutstandingAmount: number
  activeCount: number
  overdueCount: number
  dueSoonCount: number
  repaidCount: number
}

const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0)

const toMonthBounds = (selectedMonth: Date) => {
  const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

const isInRange = (dateValue: string, start: Date, end: Date) => {
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) return false
  return parsedDate >= start && parsedDate <= end
}

const ensureValidMonth = (selectedMonth: Date): Date => {
  if (!(selectedMonth instanceof Date) || Number.isNaN(selectedMonth.getTime())) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return selectedMonth
}

export const dashboardApi = {
  async get(selectedMonth: Date): Promise<DashboardData> {
    const [user, categories, transactions, loanSummary] = await Promise.all([
      backendClient.get<CurrentUserDto>('/users/me'),
      backendClient.get<CategoryDto[]>('/categories'),
      backendClient.get<TransactionDto[]>('/transactions'),
      backendClient.get<LoanSummaryDto>('/loans/summary'),
    ])

    const { start, end } = toMonthBounds(ensureValidMonth(selectedMonth))
    const monthTransactions = transactions.filter((transaction) =>
      isInRange(transaction.transactionDate, start, end),
    )
    const activeCategoryIds = new Set(monthTransactions.map((transaction) => transaction.categoryId))
    const monthCategoryCount = categories.filter((category) => activeCategoryIds.has(category.id)).length

    const totalIncome = Number.isFinite(user.monthlyIncome) ? user.monthlyIncome : 0
    const totalSpent = sum(monthTransactions.map((t) => (Number.isFinite(t.amount) ? t.amount : 0)))
    const remaining = totalIncome - totalSpent
    const totalAllocated = sum(categories.map((c) => (Number.isFinite(c.allocated) ? c.allocated : 0))) // ADDED THIS
    const freeToAssign = totalIncome - totalAllocated // ADDED THIS

    return {
      totalIncome,
      totalSpent,
      remaining,
      totalAllocated, // ADDED THIS
      freeToAssign,   // ADDED THIS
      categoryCount: monthCategoryCount,
      loanBalance: Number.isFinite(loanSummary.totalOutstandingAmount)
        ? loanSummary.totalOutstandingAmount
        : 0,
      activeLoans: Number.isFinite(loanSummary.activeCount) ? loanSummary.activeCount : 0,
    }
  },
}
