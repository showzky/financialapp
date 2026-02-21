import { describe, expect, it } from 'vitest'
import { formatLoanTimeRemaining, getLoanStatusLabel } from '@/utils/loanStatus'

describe('formatLoanTimeRemaining', () => {
  it('returns repaid label for repaid status', () => {
    expect(formatLoanTimeRemaining('repaid', null)).toBe('Repaid')
  })

  it('returns overdue label for negative days', () => {
    expect(formatLoanTimeRemaining('overdue', -3)).toBe('3 day(s) overdue')
  })

  it('returns due today when days are zero', () => {
    expect(formatLoanTimeRemaining('due_soon', 0)).toBe('Due today')
  })

  it('returns days left when positive', () => {
    expect(formatLoanTimeRemaining('outstanding', 12)).toBe('12 day(s) left')
  })
})

describe('getLoanStatusLabel', () => {
  it('maps each status to a readable label', () => {
    expect(getLoanStatusLabel('outstanding')).toBe('Outstanding')
    expect(getLoanStatusLabel('due_soon')).toBe('Due soon')
    expect(getLoanStatusLabel('overdue')).toBe('Overdue')
    expect(getLoanStatusLabel('repaid')).toBe('Repaid')
  })
})
