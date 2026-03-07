import { describe, expect, it } from 'vitest'
import {
  formatBorrowedLoanTimeRemaining,
  getBorrowedLoanStatusLabel,
} from '@/utils/borrowedLoanStatus'

describe('formatBorrowedLoanTimeRemaining', () => {
  it('returns paid off label for paid-off status', () => {
    expect(formatBorrowedLoanTimeRemaining('paid_off', null)).toBe('Paid off')
  })

  it('returns overdue label for negative days', () => {
    expect(formatBorrowedLoanTimeRemaining('overdue', -3)).toBe('3 day(s) overdue')
  })

  it('returns due today when days are zero', () => {
    expect(formatBorrowedLoanTimeRemaining('due_soon', 0)).toBe('Due today')
  })

  it('returns days left when positive', () => {
    expect(formatBorrowedLoanTimeRemaining('active', 12)).toBe('12 day(s) left')
  })
})

describe('getBorrowedLoanStatusLabel', () => {
  it('maps each status to a readable label', () => {
    expect(getBorrowedLoanStatusLabel('active')).toBe('Active')
    expect(getBorrowedLoanStatusLabel('due_soon')).toBe('Due soon')
    expect(getBorrowedLoanStatusLabel('overdue')).toBe('Overdue')
    expect(getBorrowedLoanStatusLabel('paid_off')).toBe('Paid off')
  })
})