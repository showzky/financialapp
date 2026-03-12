/**
 * Calculates the amount remaining per day of the trip.
 *
 * Logic:
 * 1. If today is before the start date, days left = the full trip duration.
 * 2. If today is within the trip dates, days left = until the end of the trip (inclusive).
 * 3. If today is after the end date, days left = 0.
 * 4. If remaining budget is negative, allowance is 0.
 *
 * All dates are treated as normalized to the start of their respective days.
 */
export function calculateDaysRemaining(
  startDateStr: string,
  endDateStr: string,
  currentDate: Date = new Date(),
  overrideDays?: number | null,
): number {
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)

  const normalizedCurrent = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  )
  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  if (normalizedCurrent > normalizedEnd) {
    return 0
  }

  const calculationStart = normalizedCurrent < normalizedStart ? normalizedStart : normalizedCurrent
  const msInDay = 24 * 60 * 60 * 1000
  const diffInMs = normalizedEnd.getTime() - calculationStart.getTime()
  const computedDaysRemaining = Math.max(0, Math.floor(diffInMs / msInDay) + 1)

  if (overrideDays !== undefined && overrideDays !== null) {
    const parsed = Math.floor(Number(overrideDays))
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed
    }
  }

  return computedDaysRemaining
}

export function calculateDailyAllowance(
  remainingBudget: number,
  startDateStr: string,
  endDateStr: string,
  currentDate: Date = new Date(),
  /**
   * Optional override for number of days to divide the remaining budget by.
   * When provided and valid (integer >= 1), this value is used instead of
   * the computed days remaining. This supports UI-provided overrides such as
   * an inline editor value.
   */
  overrideDays?: number | null,
): number {
  if (remainingBudget <= 0) return 0
  const daysToUse = calculateDaysRemaining(startDateStr, endDateStr, currentDate, overrideDays)

  if (daysToUse === 0) return 0

  return remainingBudget / daysToUse
}
