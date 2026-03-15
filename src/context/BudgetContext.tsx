// ADD THIS: Lightweight budget context with sample state
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BudgetCategoryType, BudgetState } from '@/types/budget'
import type { RecurringTransaction } from '@/types/recurring'
import {
  DASHBOARD_CREDIT_NOTE,
  DASHBOARD_EXPENSE_NOTE,
  type BudgetTransaction,
} from '@/types/transaction'
import { hasBackendConfig } from '@/services/backendClient'
import { categoryApi } from '@/services/categoryApi'
import { incomeEntryApi } from '@/services/incomeEntryApi'
import { monthlyBudgetCategoryAssignmentApi } from '@/services/monthlyBudgetCategoryAssignmentApi'
import { transactionApi } from '@/services/transactionApi'
import { userApi } from '@/services/userApi'

const defaultDashboardState: BudgetState = {
  month: new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  }),
  income: 0,
  categories: [],
}

const createInitialState = (): BudgetState => ({
  ...defaultDashboardState,
  categories: defaultDashboardState.categories.map((category) => ({ ...category })),
})

const RECURRING_STORAGE_KEY = 'finance-recurring-transactions-v1'

const isValidDayOfMonth = (day: unknown): day is number =>
  typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 31

const isValidDayOfWeek = (day: unknown): day is number =>
  typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6

const normalizeRecurring = (item: RecurringTransaction): RecurringTransaction => {
  // ADD THIS: migrate old stored rules that did not include recurring date fields
  const hasValidLastApplied = !Number.isNaN(new Date(item.lastAppliedDate).getTime())

  if (item.frequency === 'monthly') {
    return {
      ...item,
      recurringDayOfMonth: isValidDayOfMonth(item.recurringDayOfMonth)
        ? item.recurringDayOfMonth
        : 1,
      recurringDayOfWeek: undefined,
      lastAppliedDate: hasValidLastApplied ? item.lastAppliedDate : '',
    }
  }

  return {
    ...item,
    recurringDayOfMonth: undefined,
    recurringDayOfWeek: isValidDayOfWeek(item.recurringDayOfWeek) ? item.recurringDayOfWeek : 1,
    lastAppliedDate: hasValidLastApplied ? item.lastAppliedDate : '',
  }
}

const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const getDaysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate()

const isDueOnDate = (item: RecurringTransaction, date: Date) => {
  // ADD THIS: schedule matching by user-selected recurring date
  if (item.frequency === 'monthly') {
    const targetDay = Math.min(
      item.recurringDayOfMonth ?? 1,
      getDaysInMonth(date.getFullYear(), date.getMonth()),
    )
    return date.getDate() === targetDay
  }

  return date.getDay() === (item.recurringDayOfWeek ?? 1)
}

const sampleRecurringTransactions: RecurringTransaction[] = [
  {
    id: 'rec-income-salary',
    name: 'Salary',
    amount: 6400,
    type: 'income',
    categoryID: '',
    frequency: 'monthly',
    recurringDayOfMonth: 15,
    lastAppliedDate: '',
  },
  {
    id: 'rec-expense-rent',
    name: 'Rent',
    amount: 1800,
    type: 'expense',
    categoryID: 'housing',
    frequency: 'monthly',
    recurringDayOfMonth: 1,
    lastAppliedDate: '',
  },
]

const readRecurringFromStorage = (): RecurringTransaction[] => {
  if (typeof window === 'undefined') return sampleRecurringTransactions

  try {
    const raw = window.localStorage.getItem(RECURRING_STORAGE_KEY)
    if (!raw) return sampleRecurringTransactions
    const parsed = JSON.parse(raw) as RecurringTransaction[]
    if (!Array.isArray(parsed)) return sampleRecurringTransactions
    return parsed.map((item) => normalizeRecurring(item))
  } catch {
    return sampleRecurringTransactions
  }
}

const getCurrentMonthBounds = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end, now }
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

const buildRolledUpSpendByCategory = (
  categories: BudgetState['categories'],
  currentMonthTransactions: BudgetTransaction[],
) => {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const parentCategoryByName = new Map(
    categories
      .filter((category) => category.parentName === category.name)
      .map((category) => [category.name, category]),
  )
  const totals = new Map<string, number>()

  currentMonthTransactions.forEach((transaction) => {
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

const BudgetContext = createContext<
  | {
      state: BudgetState
      totals: { allocated: number; spent: number; remaining: number }
      addCategory: (input: {
        name: string
        type: BudgetCategoryType
        parentName?: string
        icon: string
        color: string
        iconColor: string
        dueDayOfMonth?: number
      }) => void
      updateIncome: (income: number) => void
      updateCategoryAmounts: (id: string, updates: { allocated?: number; spent?: number }) => void
      purgeCategoryExpenses: (categoryId: string) => void
      removeCategory: (id: string) => void
      reorderCategories: (orderedIds: string[]) => void
      resetDashboard: () => void
      transactions: BudgetTransaction[]
      recurringTransactions: RecurringTransaction[]
      addRecurringTransaction: (entry: Omit<RecurringTransaction, 'id' | 'lastAppliedDate'>) => void
      updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
      deleteRecurringTransaction: (id: string) => void
      checkAndApplyRecurring: (referenceDate?: Date) => {
        appliedCount: number
        appliedNames: string[]
      }
      appendTransaction: (transaction: BudgetTransaction) => void // ADDED THIS
      removeTransaction: (transactionId: string) => void
    }
  | undefined
>(undefined)

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<BudgetState>(createInitialState) // ADD THIS: editable global state
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([])
  const [recurringTransactions, setRecurringTransactions] =
    useState<RecurringTransaction[]>(readRecurringFromStorage)

  useEffect(() => {
    // ADD THIS: hydrate local categories from backend when api + access token are available
    if (!hasBackendConfig()) return

    void Promise.allSettled([
      userApi.getMe(),
      categoryApi.list(),
      transactionApi.list(),
      incomeEntryApi.list(),
      monthlyBudgetCategoryAssignmentApi.list(new Date()),
    ]).then(([
      userResult,
      categoriesResult,
      transactionsResult,
      incomeEntriesResult,
      budgetAssignmentsResult,
    ]) => {
      const remoteUser = userResult.status === 'fulfilled' ? userResult.value : null
      const remoteCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
      const remoteTransactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value : []
      const remoteIncomeEntries = incomeEntriesResult.status === 'fulfilled' ? incomeEntriesResult.value : []
      const remoteBudgetAssignments =
        budgetAssignmentsResult.status === 'fulfilled' ? budgetAssignmentsResult.value : []

      setTransactions(remoteTransactions)

      const { start, end, now } = getCurrentMonthBounds()
      const currentMonthTransactions = remoteTransactions.filter(
        (transaction) =>
          transaction.isPaid &&
          isInRange(transaction.transactionDate, start, end) &&
          isEffectiveNow(transaction.transactionDate, now),
      )

      const spendByCategory = buildRolledUpSpendByCategory(remoteCategories, currentMonthTransactions)

      const currentMonthIncomeEntries = remoteIncomeEntries.filter((entry) =>
        isInRange(entry.receivedAt, start, end),
      )

      const paidCurrentMonthIncome = currentMonthIncomeEntries
        .filter((entry) => entry.isPaid && isEffectiveNow(entry.receivedAt, now))
        .reduce((sum, entry) => sum + (Number.isFinite(entry.amount) ? entry.amount : 0), 0)

      const assignmentByCategoryId = new Map(
        remoteBudgetAssignments.map((assignment) => [assignment.categoryId, assignment]),
      )
      const displayedCategories = remoteCategories
        .filter((category) => {
          if (category.type === 'fixed') {
            return true
          }

          return assignmentByCategoryId.has(category.id)
        })
        .map((category) => ({
          ...category,
          allocated:
            category.type === 'budget'
              ? assignmentByCategoryId.get(category.id)?.allocated ?? 0
              : category.allocated,
          spent: spendByCategory.get(category.id) ?? 0,
        }))

      setState((current) => ({
        ...current,
        income:
          currentMonthIncomeEntries.length > 0
            ? paidCurrentMonthIncome
            : Number.isFinite(remoteUser?.monthlyIncome)
              ? Math.max(0, remoteUser?.monthlyIncome ?? 0)
              : current.income,
        categories: displayedCategories,
      }))
    }).catch(() => {
      // ADD THIS: keep local state if backend is unreachable or token is invalid
    })
  }, [])

  const addCategory = (input: {
    name: string
    type: BudgetCategoryType
    parentName?: string
    icon: string
    color: string
    iconColor: string
    dueDayOfMonth?: number
  }) => {
    // ADD THIS: create category from user input in modal
    const trimmedName = input.name.trim()
    if (!trimmedName) return

    const id = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    let tempCategoryId = ''

    setState((current) => {
      const alreadyExists = current.categories.some(
        (category) => category.name.toLowerCase() === trimmedName.toLowerCase(),
      )
      if (alreadyExists) return current

      tempCategoryId = `${id || 'category'}-${Date.now()}`

      return {
        ...current,
        categories: [
          ...current.categories,
          {
            id: tempCategoryId,
            name: trimmedName,
            parentName: input.parentName?.trim() || trimmedName,
            icon: input.icon,
            color: input.color,
            iconColor: input.iconColor,
            type: input.type,
            allocated: 0,
            spent: 0,
            dueDayOfMonth: input.dueDayOfMonth ?? null,
            sortOrder: current.categories.length + 1,
            isDefault: false,
            isArchived: false,
          },
        ],
      }
    })

    // ADD THIS: persist category remotely if backend auth context is available
    if (!hasBackendConfig() || !tempCategoryId) return

    void categoryApi
      .create({
        kind: 'expense',
        name: trimmedName,
        parentName: input.parentName?.trim() || undefined,
        icon: input.icon,
        color: input.color,
        iconColor: input.iconColor,
        type: input.type,
        allocated: 0,
        spent: 0,
        dueDayOfMonth: input.dueDayOfMonth,
      })
      .then((created) => {
        setState((current) => ({
          ...current,
          categories: current.categories.map((category) =>
            category.id === tempCategoryId ? created : category,
          ),
        }))
      })
      .catch(() => {
        // ADD THIS: keep optimistic local category even if backend sync fails
      })
  }

  const updateIncome = (income: number) => {
    // ADD THIS: update monthly income from modal input
    if (!Number.isFinite(income) || income < 0) return
    setState((current) => ({
      ...current,
      income,
    }))

    // ADD THIS: sync income update to backend profile so refresh keeps latest value
    if (!hasBackendConfig()) return

    void userApi.updateMe({ monthlyIncome: income }).catch(() => {
      // ADD THIS: keep local income if backend sync fails
    })
  }

  const updateCategoryAmounts = (id: string, updates: { allocated?: number; spent?: number }) => {
    // ADD THIS: update category budget/spent values and recalculate UI automatically
    let transactionDelta = 0
    let transactionNote: string | undefined

    setState((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== id) return category

        const nextAllocated =
          updates.allocated === undefined
            ? category.allocated
            : Math.max(0, Number(updates.allocated) || 0)

        const nextSpent =
          updates.spent === undefined ? category.spent : Math.max(0, Number(updates.spent) || 0)

        const clampedSpent =
          category.type === 'fixed' ? 0 : Math.min(nextSpent, Math.max(nextAllocated, 0))

        if (category.type === 'budget' && updates.spent !== undefined) {
          const delta = clampedSpent - category.spent

          if (delta > 0) {
            transactionDelta = delta
            transactionNote = DASHBOARD_EXPENSE_NOTE
          } else if (delta < 0) {
            transactionDelta = Math.abs(delta)
            transactionNote = DASHBOARD_CREDIT_NOTE
          }
        }

        return {
          ...category,
          allocated: nextAllocated,
          spent: clampedSpent,
        }
      }),
    }))

    // ADD THIS: sync amount updates to backend when configured
    if (!hasBackendConfig()) return

    const currentMonth = new Date()
    const payload: { allocated?: number; spent?: number } = {}
    if (updates.allocated !== undefined) {
      payload.allocated = Math.max(0, Number(updates.allocated) || 0)
    }
    if (updates.spent !== undefined) {
      payload.spent = Math.max(0, Number(updates.spent) || 0)
    }

    if (payload.allocated === undefined && payload.spent === undefined) return

    const category = state.categories.find((item) => item.id === id)

    const allocationSync =
      payload.allocated === undefined
        ? Promise.resolve()
        : category?.type === 'budget'
          ? monthlyBudgetCategoryAssignmentApi.set(currentMonth, id, payload.allocated)
          : categoryApi.update(id, { allocated: payload.allocated })

    void Promise.resolve(allocationSync)
      .then(() => {
        if (payload.spent === undefined && (!transactionDelta || !transactionNote)) {
          return
        }

        if (!transactionDelta || !transactionNote) {
          return
        }

        return transactionApi
          .create({
            categoryId: id,
            amount: transactionDelta,
            note: transactionNote,
            transactionDate: new Date().toISOString().slice(0, 10),
          })
          .then((createdTransaction) => {
            setTransactions((current) => [createdTransaction, ...current])
          })
      })
      .catch(() => {
        // ADD THIS: keep local values if backend sync fails
      })
  }

  const removeCategory = (id: string) => {
    // ADD THIS: remove category from state array
    const category = state.categories.find((item) => item.id === id)
    setState((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== id),
    }))

    // ADD THIS: remove category in backend when configured
    if (!hasBackendConfig()) return

    const removePromise =
      category?.type === 'budget'
        ? monthlyBudgetCategoryAssignmentApi.remove(new Date(), id)
        : categoryApi.remove(id)

    void removePromise.catch(() => {
      // ADD THIS: keep local deletion to avoid UI blocking if backend call fails
    })
  }

  const purgeCategoryExpenses = (categoryId: string) => {
    setTransactions((current) => current.filter((transaction) => transaction.categoryId !== categoryId))

    setState((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              spent: 0,
            }
          : category,
      ),
    }))

    if (!hasBackendConfig()) return

    void transactionApi.removeByCategory(categoryId).catch(() => {
      // ADD THIS: keep optimistic reset even if backend sync fails
    })
  }

  const reorderCategories = (orderedIds: string[]) => {
    // ADD THIS: persist drag-and-drop order into state
    setState((current) => {
      const categoryById = new Map(current.categories.map((category) => [category.id, category]))
      const reordered = orderedIds
        .map((id) => categoryById.get(id))
        .filter((category): category is NonNullable<typeof category> => Boolean(category))

      if (reordered.length !== current.categories.length) {
        return current
      }

      return {
        ...current,
        categories: reordered,
      }
    })
  }

  const resetDashboard = () => {
    // ADD THIS: restore dashboard to initial empty state
    const categoryIds = state.categories.map((category) => category.id)
    const transactionIds = transactions.map((transaction) => transaction.id)

    setState(createInitialState())
    setTransactions([])
    setRecurringTransactions([])
    persistRecurring([])

    if (!hasBackendConfig()) return

    void userApi.updateMe({ monthlyIncome: 0 }).catch(() => {
      // ADD THIS: keep local reset if backend sync fails
    })

    transactionIds.forEach((id) => {
      void transactionApi.remove(id).catch(() => {
        // ADD THIS: keep local reset if backend transaction cleanup fails
      })
    })

    categoryIds.forEach((id) => {
      void categoryApi.remove(id).catch(() => {
        // ADD THIS: keep local reset if backend category cleanup fails
      })
    })
  }

  const persistRecurring = (next: RecurringTransaction[]) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(next))
  }

  const addRecurringTransaction = (entry: Omit<RecurringTransaction, 'id' | 'lastAppliedDate'>) => {
    // ADD THIS: create recurring rule with never-applied timestamp
    const next: RecurringTransaction[] = [
      ...recurringTransactions,
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        lastAppliedDate: '',
        recurringDayOfMonth:
          entry.frequency === 'monthly' ? (entry.recurringDayOfMonth ?? 1) : undefined,
        recurringDayOfWeek:
          entry.frequency === 'weekly' ? (entry.recurringDayOfWeek ?? 1) : undefined,
      },
    ]
    setRecurringTransactions(next)
    persistRecurring(next)
  }

  const updateRecurringTransaction = (id: string, updates: Partial<RecurringTransaction>) => {
    // ADD THIS: update recurring rule by id
    const next = recurringTransactions.map((rule) =>
      rule.id === id
        ? normalizeRecurring({
            ...rule,
            ...updates,
          })
        : rule,
    )
    setRecurringTransactions(next)
    persistRecurring(next)
  }

  const deleteRecurringTransaction = (id: string) => {
    // ADD THIS: remove recurring rule
    const next = recurringTransactions.filter((rule) => rule.id !== id)
    setRecurringTransactions(next)
    persistRecurring(next)
  }

  const checkAndApplyRecurring = (referenceDate = new Date()) => {
    // ADD THIS: automation engine, applies only items due on today's recurring date
    const todayKey = toLocalDateKey(referenceDate)
    const dueItems = recurringTransactions.filter((item) => {
      const lastApplied = new Date(item.lastAppliedDate)
      const lastAppliedKey = Number.isNaN(lastApplied.getTime()) ? '' : toLocalDateKey(lastApplied)
      if (lastAppliedKey === todayKey) return false
      return isDueOnDate(item, referenceDate)
    })

    if (dueItems.length === 0) {
      return { appliedCount: 0, appliedNames: [] }
    }

    setState((current) => {
      let nextIncome = current.income
      const categoryById = new Map(
        current.categories.map((category) => [category.id, { ...category }]),
      )

      dueItems.forEach((item) => {
        if (item.type === 'income') {
          nextIncome += item.amount
          return
        }

        const category = item.categoryID ? categoryById.get(item.categoryID) : undefined

        if (!category) {
          const fallbackId = `auto-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          categoryById.set(fallbackId, {
            id: fallbackId,
            name: item.name,
            type: 'fixed',
            allocated: Math.max(0, item.amount),
            spent: 0,
          })
          return
        }

        category.allocated += Math.max(0, item.amount)
        if (category.type === 'budget') {
          category.spent = Math.min(category.spent + Math.max(0, item.amount), category.allocated)
        }
        categoryById.set(category.id, category)
      })

      return {
        ...current,
        income: nextIncome,
        categories: Array.from(categoryById.values()),
      }
    })

    const stamp = referenceDate.toISOString()
    const dueIds = new Set(dueItems.map((item) => item.id))
    const nextRecurring = recurringTransactions.map((item) =>
      dueIds.has(item.id)
        ? {
            ...item,
            lastAppliedDate: stamp,
          }
        : item,
    )

    setRecurringTransactions(nextRecurring)
    persistRecurring(nextRecurring)

    return {
      appliedCount: dueItems.length,
      appliedNames: dueItems.map((item) => item.name),
    }
  }

  const totals = useMemo(() => {
    const allocated = state.categories.reduce((sum, cat) => sum + cat.allocated, 0)
    const spent = state.categories.reduce((sum, cat) => sum + cat.spent, 0)
    const remaining = allocated - spent
    return { allocated, spent, remaining }
  }, [state]) // ADD THIS: derived totals

  // ADDED THIS: append a single imported transaction and bump category spent locally
  const appendTransaction = (transaction: BudgetTransaction) => {
    setTransactions((current) => [transaction, ...current])

    setState((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== transaction.categoryId) return category

        return {
          ...category,
          spent: category.spent + transaction.amount,
        }
      }),
    }))
  }

  const removeTransaction = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId)

    setTransactions((current) => current.filter((item) => item.id !== transactionId))

    if (!transaction) {
      return
    }

    setState((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== transaction.categoryId) {
          return category
        }

        return {
          ...category,
          spent: Math.max(0, category.spent - transaction.amount),
        }
      }),
    }))
  }

  return (
    <BudgetContext.Provider
      value={{
        state,
        totals,
        addCategory,
        updateIncome,
        updateCategoryAmounts,
        purgeCategoryExpenses,
        removeCategory,
        reorderCategories,
        resetDashboard,
        transactions,
        recurringTransactions,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        checkAndApplyRecurring,
        appendTransaction, // ADDED THIS
        removeTransaction,
      }}
    >
      {children}
    </BudgetContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- ADD THIS: colocate hook with provider
export const useBudgetContext = () => {
  const context = useContext(BudgetContext)
  if (!context) {
    throw new Error('useBudgetContext must be used within BudgetProvider')
  }
  return context
}
