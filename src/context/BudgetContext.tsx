// ADD THIS: Lightweight budget context with sample state
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { BudgetCategoryType, BudgetState } from '@/types/budget'
import type { RecurringTransaction } from '@/types/recurring'

const sampleState: BudgetState = {
  month: 'February 2026',
  income: 6400,
  categories: [
    { id: 'housing', name: 'Housing', type: 'fixed', allocated: 1800, spent: 0 },
    { id: 'groceries', name: 'Groceries', type: 'budget', allocated: 650, spent: 520 },
    { id: 'transport', name: 'Transport', type: 'budget', allocated: 300, spent: 210 },
    { id: 'savings', name: 'Savings', type: 'fixed', allocated: 900, spent: 0 },
    { id: 'entertainment', name: 'Entertainment', type: 'budget', allocated: 300, spent: 180 },
  ],
}

const createInitialState = (): BudgetState => ({
  ...sampleState,
  categories: sampleState.categories.map((category) => ({ ...category })),
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

const BudgetContext = createContext<
  | {
      state: BudgetState
      totals: { allocated: number; spent: number; remaining: number }
      addCategory: (name: string, type: BudgetCategoryType) => void
      updateIncome: (income: number) => void
      updateCategoryAmounts: (id: string, updates: { allocated?: number; spent?: number }) => void
      removeCategory: (id: string) => void
      reorderCategories: (orderedIds: string[]) => void
      resetDashboard: () => void
      recurringTransactions: RecurringTransaction[]
      addRecurringTransaction: (entry: Omit<RecurringTransaction, 'id' | 'lastAppliedDate'>) => void
      updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
      deleteRecurringTransaction: (id: string) => void
      checkAndApplyRecurring: (referenceDate?: Date) => {
        appliedCount: number
        appliedNames: string[]
      }
    }
  | undefined
>(undefined)

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<BudgetState>(createInitialState) // ADD THIS: editable global state
  const [recurringTransactions, setRecurringTransactions] =
    useState<RecurringTransaction[]>(readRecurringFromStorage)

  const addCategory = (name: string, type: BudgetCategoryType) => {
    // ADD THIS: create category from user input in modal
    const trimmedName = name.trim()
    if (!trimmedName) return

    const id = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    setState((current) => {
      const alreadyExists = current.categories.some(
        (category) => category.name.toLowerCase() === trimmedName.toLowerCase(),
      )
      if (alreadyExists) return current

      return {
        ...current,
        categories: [
          ...current.categories,
          {
            id: `${id || 'category'}-${Date.now()}`,
            name: trimmedName,
            type,
            allocated: 0,
            spent: 0,
          },
        ],
      }
    })
  }

  const updateIncome = (income: number) => {
    // ADD THIS: update monthly income from modal input
    if (!Number.isFinite(income) || income < 0) return
    setState((current) => ({
      ...current,
      income,
    }))
  }

  const updateCategoryAmounts = (id: string, updates: { allocated?: number; spent?: number }) => {
    // ADD THIS: update category budget/spent values and recalculate UI automatically
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

        return {
          ...category,
          allocated: nextAllocated,
          spent: clampedSpent,
        }
      }),
    }))
  }

  const removeCategory = (id: string) => {
    // ADD THIS: remove category from state array
    setState((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== id),
    }))
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
    // ADD THIS: restore dashboard to initial sample data
    setState(createInitialState())
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

  return (
    <BudgetContext.Provider
      value={{
        state,
        totals,
        addCategory,
        updateIncome,
        updateCategoryAmounts,
        removeCategory,
        reorderCategories,
        resetDashboard,
        recurringTransactions,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        checkAndApplyRecurring,
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
