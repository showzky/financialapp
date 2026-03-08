import { describe, expect, it } from 'vitest'
import { parseRevolutCsv } from '@/components/flow/revolutCsv'

describe('parseRevolutCsv', () => {
  it('extracts rows and totals from a Revolut-style csv export', () => {
    const summary = parseRevolutCsv([
      'Completed Date,Description,Amount,Currency',
      '2026-03-08,Coffee,-59.00,NOK',
      '2026-03-08,Refund,100.00,NOK',
    ].join('\n'))

    expect(summary.rows).toHaveLength(2)
    expect(summary.totalSpent).toBe(59)
    expect(summary.totalIncome).toBe(100)
    expect(summary.rows[0]).toMatchObject({
      description: 'Coffee',
      amount: -59,
      currency: 'NOK',
    })
  })
})