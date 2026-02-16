// ADD THIS: Shapes for budget data
export type BudgetCategoryType = 'budget' | 'fixed'

export type BudgetCategory = {
  id: string
  name: string
  type: BudgetCategoryType
  allocated: number
  spent: number
}

export type BudgetState = {
  month: string
  income: number
  categories: BudgetCategory[]
}

// ADD THIS: archived monthly dashboard snapshot record
export type HistoryRecord = {
  id: string
  dateRange: string
  createdAt: string
  snapshot: BudgetState
  summary: {
    allocated: number
    spent: number
    totalSaved: number
  }
}
