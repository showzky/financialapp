import type { LoanStatus } from '@/types/loan'

export const formatLoanTimeRemaining = (
  status: LoanStatus,
  daysRemaining: number | null,
): string => {
  if (status === 'repaid') {
    return 'Repaid'
  }

  if (daysRemaining === null) {
    return '—'
  }

  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} day(s) overdue`
  }

  if (daysRemaining === 0) {
    return 'Due today'
  }

  return `${daysRemaining} day(s) left`
}

export const getLoanStatusLabel = (status: LoanStatus): string => {
  const labels: Record<LoanStatus, string> = {
    outstanding: 'Outstanding',
    due_soon: 'Due soon',
    overdue: 'Overdue',
    repaid: 'Repaid',
  }

  return labels[status]
}
