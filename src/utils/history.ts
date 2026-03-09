import type { BudgetState, HistoryRecord, HistorySummary } from '@/types/budget'
import type { CreateHistoryRecordInput } from '@/types/history'

export const computeHistorySummary = (snapshot: BudgetState): HistorySummary => {
  const allocated = snapshot.categories.reduce((sum, category) => sum + category.allocated, 0)
  const spent = snapshot.categories.reduce((sum, category) => sum + category.spent, 0)
  const totalSaved = Math.max(snapshot.income - allocated, 0)
  return { allocated, spent, totalSaved }
}

export const cloneBudgetState = (state: BudgetState): BudgetState => ({
  ...state,
  categories: state.categories.map((category) => ({ ...category })),
})

export const buildHistoryRecord = ({
  snapshot,
  summary,
  period,
  createdAt = new Date().toISOString(),
  id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
}: CreateHistoryRecordInput): HistoryRecord => ({
  id,
  periodKey: period.periodKey,
  periodStart: period.periodStart,
  periodEnd: period.periodEnd,
  label: period.label,
  createdAt,
  snapshot: cloneBudgetState(snapshot),
  summary,
})
