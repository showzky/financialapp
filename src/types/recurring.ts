// ADD THIS: recurring transaction models
export type RecurringTransactionType = 'income' | 'expense'
export type RecurringFrequency = 'monthly' | 'weekly'

export type RecurringTransaction = {
  id: string
  name: string
  amount: number
  type: RecurringTransactionType
  categoryID: string
  frequency: RecurringFrequency
  recurringDayOfMonth?: number // ADD THIS: monthly schedule day (1-31)
  recurringDayOfWeek?: number // ADD THIS: weekly schedule day (0-6, Sunday-Saturday)
  lastAppliedDate: string
}
