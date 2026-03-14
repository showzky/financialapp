import type { VacationExpense } from '../types/vacation'

const currencyFormatter = new Intl.NumberFormat('no-NO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat('no-NO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  notation: 'compact',
})

const knownCategoryColors: Record<string, string> = {
  flights: '#c96b6b',
  food: '#c9a84c',
  hotel: '#5ebd97',
  miscellaneous: '#5ba3c9',
}

const fallbackCategoryColors = ['#d4874a', '#9b7ec8', '#e2c06a', '#4a9b6f', '#6f88d9']

export const extractCustomCategoryName = (description?: string | null): string | null => {
  if (!description) return null
  const match = description.match(/^\[Custom Category:\s*(.+?)\]/)
  return match ? match[1].trim() : null
}

export const cleanVacationDescription = (description?: string | null): string => {
  if (!description) return ''
  return description.replace(/^\[Custom Category:\s*.+?\]\s*/, '').trim()
}

export const getVacationExpenseDisplayCategory = (expense: VacationExpense): string => {
  if (expense.category !== 'miscellaneous') {
    return expense.category
  }

  return extractCustomCategoryName(expense.description) ?? expense.category
}

export const formatVacationCurrency = (amountInCents: number): string => {
  return `KR ${currencyFormatter.format(Math.floor(amountInCents / 100))}`
}

export const formatVacationCompactCurrency = (amountInCents: number): string => {
  return compactCurrencyFormatter.format(Math.floor(amountInCents / 100))
}

export const formatVacationCategoryLabel = (category: string): string => {
  return category
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getVacationCategoryColor = (category: string): string => {
  const normalized = category.trim().toLowerCase()
  const knownColor = knownCategoryColors[normalized]
  if (knownColor) {
    return knownColor
  }

  let hash = 0
  for (let index = 0; index < normalized.length; index += 1) {
    hash = normalized.charCodeAt(index) + ((hash << 5) - hash)
  }

  return fallbackCategoryColors[Math.abs(hash) % fallbackCategoryColors.length]
}
