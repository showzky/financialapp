export type VacationExpenseCategory = 'flights' | 'food' | 'hotel' | 'miscellaneous'

export interface VacationFund {
  id: string
  userId: string
  name: string
  targetAmount: number // in cents
  currentAmount: number // in cents
  startDate: string
  endDate: string
  /** trip length in days; may be overridden by user */
  durationDays?: number
  createdAt: string
  updatedAt: string
}

export interface VacationExpense {
  id: string
  vacationId: string
  category: VacationExpenseCategory
  amount: number // in cents
  description: string | null
  date: string
  isVacation: true // Always true for vacation expenses
  createdAt: string
}

export interface VacationSummary {
  totalBudget: number // in cents
  totalSpent: number // in cents
  remainingBudget: number // in cents
  daysRemaining: number
  dailyAllowance: number // in cents
  progressPercentage: number
}
