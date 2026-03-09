// ADD THIS: payday period utilities (15th, adjusted to previous Friday on weekends)
export const adjustedPaydayForMonth = (year: number, monthIndex: number) => {
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

const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

const toIsoDate = (date: Date) => toLocalDateKey(date)

const monthLabelFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

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
  return toLocalDateKey(start)
}

export type PayPeriod = {
  periodKey: string
  periodStart: string
  periodEnd: string
  label: string
}

export const buildPayPeriod = (periodStart: Date): PayPeriod => {
  const start = new Date(periodStart)
  start.setHours(0, 0, 0, 0)

  const nextPayday = adjustedPaydayForMonth(start.getFullYear(), start.getMonth() + 1)
  const end = new Date(nextPayday)
  end.setDate(end.getDate() - 1)
  end.setHours(0, 0, 0, 0)

  return {
    periodKey: toLocalDateKey(start),
    periodStart: toIsoDate(start),
    periodEnd: toIsoDate(end),
    label: formatPayPeriodLabel({
      periodKey: toLocalDateKey(start),
      periodStart: toIsoDate(start),
      periodEnd: toIsoDate(end),
      label: '',
    }),
  }
}

export const buildPayPeriodFromDate = (referenceDate = new Date()) =>
  buildPayPeriod(getCurrentPayPeriodStart(referenceDate))

export const buildPayPeriodFromMonth = (year: number, monthIndex: number) =>
  buildPayPeriod(adjustedPaydayForMonth(year, monthIndex))

export const getCurrentPayPeriod = (referenceDate = new Date()) =>
  buildPayPeriodFromDate(referenceDate)

export const formatPayPeriodLabel = ({
  periodStart,
  periodEnd,
}: Pick<PayPeriod, 'periodStart' | 'periodEnd'>) => {
  const start = new Date(`${periodStart}T00:00:00`)
  const end = new Date(`${periodEnd}T00:00:00`)
  return `${monthLabelFormatter.format(start)}-${monthLabelFormatter.format(end)}`
}

export const parseMonthLabel = (value: string) => {
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (!match) return null

  const parsed = new Date(`${match[1]} 1, ${match[2]}`)
  if (Number.isNaN(parsed.getTime())) return null

  return {
    year: parsed.getFullYear(),
    monthIndex: parsed.getMonth(),
  }
}
