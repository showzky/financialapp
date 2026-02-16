// ADD THIS: payday period utilities (15th, adjusted to previous Friday on weekends)
const adjustedPaydayForMonth = (year: number, monthIndex: number) => {
  const payday = new Date(year, monthIndex, 15)
  const weekday = payday.getDay()

  if (weekday === 6) {
    payday.setDate(payday.getDate() - 1) // Saturday -> Friday
  } else if (weekday === 0) {
    payday.setDate(payday.getDate() - 2) // Sunday -> Friday
  }

  payday.setHours(0, 0, 0, 0)
  return payday
}

export const getCurrentPayPeriodStart = (referenceDate = new Date()) => {
  const currentMonthPayday = adjustedPaydayForMonth(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
  )

  if (referenceDate >= currentMonthPayday) {
    return currentMonthPayday
  }

  return adjustedPaydayForMonth(referenceDate.getFullYear(), referenceDate.getMonth() - 1)
}

export const getCurrentPayPeriodKey = (referenceDate = new Date()) => {
  const start = getCurrentPayPeriodStart(referenceDate)
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
    start.getDate(),
  ).padStart(2, '0')}`
}
