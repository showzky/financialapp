// ADD THIS: Sample Vitest to validate tooling
import { describe, expect, it } from 'vitest'
import { formatCurrency } from '@/utils/currency'

describe('formatCurrency', () => {
  it('formats numbers with KR prefix for NOK', () => {
    expect(formatCurrency(1234)).toBe('KR 1,234')
  })
})
