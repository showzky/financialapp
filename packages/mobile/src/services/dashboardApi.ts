import { backendClient } from './backendClient'

export type CategoryWithSpent = {
  id: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  type: 'budget' | 'fixed'
  allocated: number
  monthSpent: number
  dueDayOfMonth?: number | null
  sortOrder: number
  isDefault: boolean
  isArchived: boolean
}

export type IncomeEntry = {
  id: string
  incomeCategoryId: string | null
  category: string
  parentName: string | null
  icon: string | null
  color: string | null
  iconColor: string | null
  name: string | null
  amount: number
  receivedAt: string
  accountName: string | null
  isPaid: boolean
}

export type DashboardData = {
  totalIncome: number
  totalSpent: number
  fixedCostsTotal: number
  remaining: number
  totalAllocated: number
  freeToAssign: number
  categoryCount: number
  loanBalance: number
  activeLoans: number
  categories: CategoryWithSpent[]
  incomeEntries: IncomeEntry[]
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
  parentName: string
  icon: string
  color: string
  iconColor: string
  type: 'budget' | 'fixed'
  allocated: number
  spent: number
  dueDayOfMonth?: number | null
  sortOrder: number
  isDefault: boolean
  isArchived: boolean
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

type IncomeEntryDto = {
  id: string
  incomeCategoryId: string | null
  category: string
  parentName: string | null
  icon: string | null
  color: string | null
  iconColor: string | null
  name: string | null
  amount: number
  receivedAt: string
  accountName: string | null
  isPaid: boolean
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

const isEffectiveNow = (dateValue: string, now: Date) => {
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) return true
  return parsedDate <= now
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
    const now = new Date()
    const [user, categories, transactions, loanSummary, incomeEntries] = await Promise.all([
      backendClient.get<CurrentUserDto>('/users/me'),
      backendClient.get<CategoryDto[]>('/categories?kind=expense'),
      backendClient.get<TransactionDto[]>('/transactions'),
      backendClient.get<LoanSummaryDto>('/loans/summary'),
      backendClient.get<IncomeEntryDto[]>('/income-entries'),
    ])

    const { start, end } = toMonthBounds(ensureValidMonth(selectedMonth))
    const monthTransactions = transactions.filter((transaction) =>
      isInRange(transaction.transactionDate, start, end) && isEffectiveNow(transaction.transactionDate, now),
    )
    const monthIncomeEntries = incomeEntries.filter((incomeEntry) =>
      isInRange(incomeEntry.receivedAt, start, end),
    )
    const paidMonthIncomeEntries = monthIncomeEntries.filter(
      (incomeEntry) => incomeEntry.isPaid && isEffectiveNow(incomeEntry.receivedAt, now),
    )
    const monthCategoryCount = categories.length // CHANGED THIS - count all categories, not just active

    const totalIncome =
      monthIncomeEntries.length > 0
        ? sum(paidMonthIncomeEntries.map((entry) => (Number.isFinite(entry.amount) ? entry.amount : 0)))
        : Number.isFinite(user.monthlyIncome)
          ? user.monthlyIncome
          : 0
    const totalSpent = sum(monthTransactions.map((t) => (Number.isFinite(t.amount) ? t.amount : 0)))
    const fixedCostsTotal = sum(
      categories
        .filter((category) => category.type === 'fixed')
        .map((category) => (Number.isFinite(category.allocated) ? category.allocated : 0)),
    )
    const remaining = totalIncome - totalSpent
    const totalAllocated = sum(categories.map((c) => (Number.isFinite(c.allocated) ? c.allocated : 0)))
    const freeToAssign = totalIncome - totalAllocated

    // Build a per-category spending map for the selected month
    const spendByCategory = new Map<string, number>()
    for (const t of monthTransactions) {
      const prev = spendByCategory.get(t.categoryId) ?? 0
      spendByCategory.set(t.categoryId, prev + (Number.isFinite(t.amount) ? t.amount : 0))
    }

    const enrichedCategories: CategoryWithSpent[] = categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentName: c.parentName,
      icon: c.icon,
      color: c.color,
      iconColor: c.iconColor,
      type: c.type,
      allocated: Number.isFinite(c.allocated) ? c.allocated : 0,
      monthSpent: spendByCategory.get(c.id) ?? 0,
      dueDayOfMonth: Number.isFinite(c.dueDayOfMonth) ? Number(c.dueDayOfMonth) : null,
      sortOrder: Number.isFinite(c.sortOrder) ? c.sortOrder : 0,
      isDefault: Boolean(c.isDefault),
      isArchived: Boolean(c.isArchived),
    }))

    return {
      totalIncome,
      totalSpent,
      fixedCostsTotal,
      remaining,
      totalAllocated,
      freeToAssign,
      categoryCount: monthCategoryCount,
      loanBalance: Number.isFinite(loanSummary.totalOutstandingAmount)
        ? loanSummary.totalOutstandingAmount
        : 0,
      activeLoans: Number.isFinite(loanSummary.activeCount) ? loanSummary.activeCount : 0,
      categories: enrichedCategories,
      incomeEntries: monthIncomeEntries.map((entry) => ({
        id: entry.id,
        incomeCategoryId: entry.incomeCategoryId,
        category: entry.category,
        parentName: entry.parentName,
        icon: entry.icon,
        color: entry.color,
        iconColor: entry.iconColor,
        name: entry.name,
        amount: Number.isFinite(entry.amount) ? entry.amount : 0,
        receivedAt: entry.receivedAt,
        accountName: entry.accountName,
        isPaid: entry.isPaid,
      })),
    }
  },
}
