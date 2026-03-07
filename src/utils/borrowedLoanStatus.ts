import type { BorrowedLoanStatus } from '@/types/loan'

export const formatBorrowedLoanTimeRemaining = (
  status: BorrowedLoanStatus,
  daysRemaining: number | null,
): string => {
  if (status === 'paid_off') {
    return 'Paid off'
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

export const getBorrowedLoanStatusLabel = (status: BorrowedLoanStatus): string => {
  const labels: Record<BorrowedLoanStatus, string> = {
    active: 'Active',
    due_soon: 'Due soon',
    overdue: 'Overdue',
    paid_off: 'Paid off',
  }

  return labels[status]
}