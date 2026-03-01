import { backendClient } from './backendClient'

export type DashboardData = {
  totalIncome: number
  totalSpent: number
  remaining: number
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

export const dashboardApi = {
  async get(): Promise<DashboardData> {
    const [user, categories, transactions, loanSummary] = await Promise.all([
      backendClient.get<CurrentUserDto>('/users/me'),
      backendClient.get<CategoryDto[]>('/categories'),
      backendClient.get<TransactionDto[]>('/transactions'),
      backendClient.get<LoanSummaryDto>('/loans/summary'),
    ])

    const totalIncome = Number.isFinite(user.monthlyIncome) ? user.monthlyIncome : 0
    const totalSpent = sum(transactions.map((t) => (Number.isFinite(t.amount) ? t.amount : 0)))
    const remaining = totalIncome - totalSpent

    return {
      totalIncome,
      totalSpent,
      remaining,
      categoryCount: categories.length,
      loanBalance: Number.isFinite(loanSummary.totalOutstandingAmount)
        ? loanSummary.totalOutstandingAmount
        : 0,
      activeLoans: Number.isFinite(loanSummary.activeCount) ? loanSummary.activeCount : 0,
    }
  },
}
