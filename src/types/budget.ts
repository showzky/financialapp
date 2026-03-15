// ADD THIS: Shapes for budget data
export type BudgetCategoryType = 'budget' | 'fixed'

export type BudgetCategory = {
  id: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  type: BudgetCategoryType
  allocated: number
  spent: number
  dueDayOfMonth?: number | null
  sortOrder?: number
  isDefault?: boolean
  isArchived?: boolean
}

export type BudgetState = {
  month: string
  income: number
  categories: BudgetCategory[]
}

export type HistorySummary = {
  allocated: number
  spent: number
  totalSaved: number
}

export type CaptureMode = 'manual' | 'current-payday'

// ADD THIS: archived payday snapshot record
export type HistoryRecord = {
  id: string
  periodKey: string
  periodStart: string
  periodEnd: string
  label: string
  createdAt: string
  snapshot: BudgetState
  summary: HistorySummary
}
