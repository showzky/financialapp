import {
  adjustedPaydayForMonth,
  buildPayPeriodFromDate,
  buildPayPeriodFromMonth,
  parseMonthLabel,
} from '@/utils/payPeriod'

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

describe('payPeriod utilities', () => {
  it('adjusts weekend payday to the previous friday', () => {
    expect(toDateKey(adjustedPaydayForMonth(2026, 1))).toBe('2026-02-13')
    expect(toDateKey(adjustedPaydayForMonth(2026, 10))).toBe('2026-11-13')
  })

  it('builds a full pay period from a reference date', () => {
    expect(buildPayPeriodFromDate(new Date('2026-03-09T12:00:00')).periodKey).toBe('2026-02-13')
    expect(buildPayPeriodFromDate(new Date('2026-03-09T12:00:00')).periodEnd).toBe('2026-03-12')
  })

  it('builds a pay period from a month label source', () => {
    const parsed = parseMonthLabel('March 2026')
    expect(parsed).toEqual({ year: 2026, monthIndex: 2 })

    const period = buildPayPeriodFromMonth(parsed!.year, parsed!.monthIndex)
    expect(period.periodStart).toBe('2026-03-13')
    expect(period.periodEnd).toBe('2026-04-14')
  })
})
