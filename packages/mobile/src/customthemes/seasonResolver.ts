import type { CustomThemeId } from './types'

function getEasterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function isWithinRange(target: Date, start: Date, end: Date) {
  return target >= start && target <= end
}

export function resolveSeasonalTheme(date = new Date()): CustomThemeId {
  const year = date.getFullYear()
  const easterSunday = getEasterSunday(year)
  const easterStart = addDays(easterSunday, -7)
  const easterEnd = addDays(easterSunday, 1)

  if (isWithinRange(date, easterStart, easterEnd)) {
    return 'easter'
  }

  const month = date.getMonth()

  if (month >= 2 && month <= 4) {
    return 'spring'
  }

  if (month >= 5 && month <= 7) {
    return 'summer'
  }

  return 'winter'
}
