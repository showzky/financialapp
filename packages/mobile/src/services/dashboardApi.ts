import { backendClient } from './backendClient'
import {
  monthlyBudgetCategoryAssignmentApi,
  type MonthlyBudgetCategoryAssignment,
} from './monthlyBudgetCategoryAssignmentApi'
import { monthlyBudgetTargetApi } from './monthlyBudgetTargetApi'

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
  totalBudget: number
  totalSpent: number
  fixedCostsTotal: number
  remaining: number
  totalAllocated: number
  freeToAssign: number
  categoryCount: number
  loanBalance: number
  activeLoans: number
  categories: CategoryWithSpent[]
  budgetAssignments: CategoryWithSpent[]
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
  isPaid: boolean
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

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0)

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

function buildRolledUpSpendByCategory(
  categories: CategoryDto[],
  monthTransactions: TransactionDto[],
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const parentCategoryByName = new Map(
    categories
      .filter((category) => category.parentName === category.name)
      .map((category) => [category.name, category]),
  )
  const totals = new Map<string, number>()

  monthTransactions.forEach((transaction) => {
    const sourceCategory = categoryById.get(transaction.categoryId)
    if (!sourceCategory) {
      return
    }

    const amount = Number.isFinite(transaction.amount) ? transaction.amount : 0
    totals.set(sourceCategory.id, (totals.get(sourceCategory.id) ?? 0) + amount)

    if (
      sourceCategory.parentName !== sourceCategory.name &&
      sourceCategory.type === 'budget'
    ) {
      const parentCategory = parentCategoryByName.get(sourceCategory.parentName)
      if (parentCategory) {
        totals.set(parentCategory.id, (totals.get(parentCategory.id) ?? 0) + amount)
      }
    }
  })

  return totals
}

function toCategoryWithSpent(
  category: CategoryDto,
  allocated: number,
  spendByCategory: Map<string, number>,
): CategoryWithSpent {
  return {
    id: category.id,
    name: category.name,
    parentName: category.parentName,
    icon: category.icon,
    color: category.color,
    iconColor: category.iconColor,
    type: category.type,
    allocated,
    monthSpent: spendByCategory.get(category.id) ?? 0,
    dueDayOfMonth: Number.isFinite(category.dueDayOfMonth) ? Number(category.dueDayOfMonth) : null,
    sortOrder: Number.isFinite(category.sortOrder) ? category.sortOrder : 0,
    isDefault: Boolean(category.isDefault),
    isArchived: Boolean(category.isArchived),
  }
}

function buildAssignedBudgetCategories(
  categories: CategoryDto[],
  assignments: MonthlyBudgetCategoryAssignment[],
  spendByCategory: Map<string, number>,
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return assignments
    .map((assignment) => {
      const category = categoryById.get(assignment.categoryId)
      if (!category) {
        return null
      }

      return toCategoryWithSpent(
        category,
        Number.isFinite(assignment.allocated) ? assignment.allocated : 0,
        spendByCategory,
      )
    })
    .filter((category): category is CategoryWithSpent => Boolean(category))
    .sort(
      (left, right) =>
        (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.name.localeCompare(right.name),
    )
}

export const dashboardApi = {
  async get(selectedMonth: Date): Promise<DashboardData> {
    const now = new Date()
    const validMonth = ensureValidMonth(selectedMonth)
    const [user, categories, transactions, loanSummary, incomeEntries, monthlyBudgetTarget, budgetAssignments] =
      await Promise.all([
        backendClient.get<CurrentUserDto>('/users/me'),
        backendClient.get<CategoryDto[]>('/categories?kind=expense'),
        backendClient.get<TransactionDto[]>('/transactions'),
        backendClient.get<LoanSummaryDto>('/loans/summary'),
        backendClient.get<IncomeEntryDto[]>('/income-entries'),
        monthlyBudgetTargetApi.get(validMonth),
        monthlyBudgetCategoryAssignmentApi.list(validMonth),
      ])

    const { start, end } = toMonthBounds(validMonth)
    const monthTransactions = transactions.filter((transaction) =>
      transaction.isPaid &&
      isInRange(transaction.transactionDate, start, end) &&
      isEffectiveNow(transaction.transactionDate, now),
    )
    const monthIncomeEntries = incomeEntries.filter((incomeEntry) =>
      isInRange(incomeEntry.receivedAt, start, end),
    )
    const paidMonthIncomeEntries = monthIncomeEntries.filter(
      (incomeEntry) => incomeEntry.isPaid && isEffectiveNow(incomeEntry.receivedAt, now),
    )

    const spendByCategory = buildRolledUpSpendByCategory(categories, monthTransactions)
    const assignedBudgetCategories = buildAssignedBudgetCategories(categories, budgetAssignments, spendByCategory)
    const enrichedCategories = categories.map((category) =>
      toCategoryWithSpent(
        category,
        Number.isFinite(category.allocated) ? category.allocated : 0,
        spendByCategory,
      ),
    )

    const totalIncome =
      monthIncomeEntries.length > 0
        ? sum(paidMonthIncomeEntries.map((entry) => (Number.isFinite(entry.amount) ? entry.amount : 0)))
        : Number.isFinite(user.monthlyIncome)
          ? user.monthlyIncome
          : 0
    const totalSpent = sum(monthTransactions.map((transaction) => (Number.isFinite(transaction.amount) ? transaction.amount : 0)))
    const fixedCostsTotal = sum(
      categories
        .filter((category) => category.type === 'fixed')
        .map((category) => (Number.isFinite(category.allocated) ? category.allocated : 0)),
    )
    const assignedBudgetTotal = sum(
      budgetAssignments.map((assignment) => (Number.isFinite(assignment.allocated) ? assignment.allocated : 0)),
    )
    const totalBudget =
      typeof monthlyBudgetTarget === 'number'
        ? monthlyBudgetTarget
        : assignedBudgetTotal
    const totalAllocated = fixedCostsTotal + assignedBudgetTotal
    const remaining = totalIncome - totalSpent
    const freeToAssign = totalIncome - totalAllocated

    return {
      totalIncome,
      totalBudget,
      totalSpent,
      fixedCostsTotal,
      remaining,
      totalAllocated,
      freeToAssign,
      categoryCount: categories.length,
      loanBalance: Number.isFinite(loanSummary.totalOutstandingAmount)
        ? loanSummary.totalOutstandingAmount
        : 0,
      activeLoans: Number.isFinite(loanSummary.activeCount) ? loanSummary.activeCount : 0,
      categories: enrichedCategories,
      budgetAssignments: assignedBudgetCategories,
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
