import { describe, expect, it } from 'vitest'
import { calculateDailyAllowance } from '../utils/vacationMath'

describe('calculateDailyAllowance', () => {
  const startDate = '2026-06-01'
  const endDate = '2026-06-10' // 10 days total (June 1st to 10th inclusive)

  it('calculates full allowance before the trip starts', () => {
    // Before June 1st, should use the total duration of 10 days
    const currentDate = new Date('2026-05-15')
    const remainingBudget = 100000 // e.g. 1000.00 in cents
    // 100000 / 10 = 10000
    expect(calculateDailyAllowance(remainingBudget, startDate, endDate, currentDate)).toBe(10000)
  })

  it('calculates remaining allowance during the trip', () => {
    // On June 5th, there are 6 days remaining: 5, 6, 7, 8, 9, 10
    const currentDate = new Date('2026-06-05')
    const remainingBudget = 60000
    // 60000 / 6 = 10000
    expect(calculateDailyAllowance(remainingBudget, startDate, endDate, currentDate)).toBe(10000)
  })

  it('handles last day of the trip', () => {
    // On June 10th, 1 day remains (today)
    const currentDate = new Date('2026-06-10')
    const remainingBudget = 15000
    // 15000 / 1 = 15000
    expect(calculateDailyAllowance(remainingBudget, startDate, endDate, currentDate)).toBe(15000)
  })

  it('returns 0 when days remaining is zero (after trip ends)', () => {
    // June 11th is past the end date
    const currentDate = new Date('2026-06-11')
    const remainingBudget = 5000
    expect(calculateDailyAllowance(remainingBudget, startDate, endDate, currentDate)).toBe(0)
  })

  it('returns 0 for negative remaining budget', () => {
    const currentDate = new Date('2026-06-05')
    const remainingBudget = -500
    expect(calculateDailyAllowance(remainingBudget, startDate, endDate, currentDate)).toBe(0)
  })

  it('returns 0 if total/remaining budget is zero', () => {
    const currentDate = new Date('2026-06-01')
    const remainingBudget = 0
    expect(calculateDailyAllowance(remainingBudget, startDate, endDate, currentDate)).toBe(0)
  })

  it("handles vacation that hasn't started yet", () => {
    const currentDate = new Date('2026-01-01')
    const remainingBudget = 200000
    // Still divides by 10 days
    expect(calculateDailyAllowance(remainingBudget, startDate, endDate, currentDate)).toBe(20000)
  })
})
