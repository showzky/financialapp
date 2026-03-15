import type { CategoryWithSpent } from '../../services/dashboardApi'
import type { TransactionResponse } from '../../services/transactionApi'
import type { TimelineEntry, TimelineFilter, TimelineSection, TimelineUrgency } from './types'

const DAY_MS = 1000 * 60 * 60 * 24

const rangeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
})

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export function formatTimelineCurrency(amount: number) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMonthTitle(date: Date) {
  return monthFormatter.format(date)
}

export function formatDueLabel(date: Date) {
  return weekdayFormatter.format(date)
}

function getDaysUntil(date: Date, now: Date) {
  const due = new Date(date)
  const today = new Date(now)
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / DAY_MS)
}

function getUrgency(daysLeft: number): TimelineUrgency {
  if (daysLeft <= 3) return 'urgent'
  if (daysLeft <= 7) return 'soon'
  return 'planned'
}

function getRangeLabel(entries: TimelineEntry[]) {
  if (entries.length === 0) return 'No scheduled payments'
  if (entries.length === 1) return rangeFormatter.format(entries[0].dueDate)
  return `${rangeFormatter.format(entries[0].dueDate)} - ${rangeFormatter.format(entries[entries.length - 1].dueDate)}`
}

function getNearestDueLabel(entries: TimelineEntry[]) {
  if (entries.length === 0) return '--'
  return rangeFormatter.format(entries[0].dueDate)
}

function getEntryAccent(color?: string | null, iconColor?: string | null) {
  return iconColor || color || '#6ed3d1'
}

export function getTimelineCategoryMeta(category: {
  parentName?: string | null
  color?: string | null
  iconColor?: string | null
}) {
  const group = category.parentName || 'Other'
  return {
    group,
    accent: getEntryAccent(category.color, category.iconColor),
  }
}

function matchesFilter(entry: TimelineEntry, filter: TimelineFilter) {
  if (filter === 'All') return entry.daysLeft >= 0
  const daysLimit = filter === '7 Days' ? 7 : 30
  return entry.daysLeft >= 0 && entry.daysLeft <= daysLimit
}

function buildPaymentKey(categoryId: string, date: Date) {
  return `${categoryId}-${date.getFullYear()}-${date.getMonth()}`
}

export function buildTimelineSections(
  categories: CategoryWithSpent[],
  scheduledExpenses: TransactionResponse[],
  baseMonth: Date,
  filter: TimelineFilter,
  now: Date,
  paidEntryKeys: Set<string> = new Set(),
  monthCount = 3,
): TimelineSection[] {
  const lastMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + monthCount, 0, 23, 59, 59, 999)
  const categoryMap = new Map(categories.map((category) => [category.id, category]))

  const recurringEntries = categories
    .filter((category) => category.type === 'fixed' && category.dueDayOfMonth && category.dueDayOfMonth > 0)
    .flatMap((category) =>
      Array.from({ length: monthCount }, (_, offset) => {
        const sectionDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + offset, 1)
        const daysInMonth = new Date(sectionDate.getFullYear(), sectionDate.getMonth() + 1, 0).getDate()
        const dueDate = new Date(
          sectionDate.getFullYear(),
          sectionDate.getMonth(),
          Math.min(category.dueDayOfMonth ?? 1, daysInMonth),
        )
        const { group: categoryGroup, accent } = getTimelineCategoryMeta(category)
        const daysLeft = getDaysUntil(dueDate, now)

        return {
          id: `${category.id}-${sectionDate.getFullYear()}-${sectionDate.getMonth()}`,
          categoryId: category.id,
          source: 'planned',
          title: category.name,
          category: categoryGroup,
          icon: category.icon,
          color: category.color,
          iconColor: category.iconColor,
          amount: Number.isFinite(category.allocated) ? category.allocated : 0,
          dueDate,
          recurring: true,
          accent,
          urgency: getUrgency(daysLeft),
          daysLeft,
          paymentStatus: paidEntryKeys.has(buildPaymentKey(category.id, dueDate)) ? 'paid' : 'unpaid',
        } satisfies TimelineEntry
      }),
    )

  const scheduledExpenseEntries = scheduledExpenses
    .map((transaction) => {
      const dueDate = new Date(transaction.transactionDate)
      const category = categoryMap.get(transaction.categoryId)
      const title = transaction.note?.trim() || category?.name || 'Expense'
      const { group: categoryGroup, accent } = getTimelineCategoryMeta(category ?? {})
      const daysLeft = getDaysUntil(dueDate, now)

      return {
        id: `scheduled-${transaction.id}`,
        transactionId: transaction.id,
        categoryId: transaction.categoryId,
        source: 'scheduled_expense',
        title,
        category: categoryGroup,
        icon: category?.icon,
        color: category?.color,
        iconColor: category?.iconColor,
        amount: Number.isFinite(transaction.amount) ? transaction.amount : 0,
        dueDate,
        recurring: false,
        accent,
        urgency: getUrgency(daysLeft),
        daysLeft,
        paymentStatus: dueDate <= now ? 'paid' : 'unpaid',
      } satisfies TimelineEntry
    })
    .filter((entry) => entry.dueDate >= new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1) && entry.dueDate <= lastMonth)

  const timelineEntries = [...recurringEntries, ...scheduledExpenseEntries]
    .filter((entry) => matchesFilter(entry, filter))
    .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())

  const sectionMap = new Map<string, TimelineEntry[]>()

  for (const entry of timelineEntries) {
    const key = `${entry.dueDate.getFullYear()}-${entry.dueDate.getMonth()}`
    const group = sectionMap.get(key) ?? []
    group.push(entry)
    sectionMap.set(key, group)
  }

  return [...sectionMap.entries()].map(([key, entries]) => {
    const [year, month] = key.split('-').map(Number)
    const monthDate = new Date(year, month, 1)

    return {
      id: key,
      title: formatMonthTitle(monthDate),
      monthLabel: formatMonthTitle(monthDate),
      rangeLabel: getRangeLabel(entries),
      totalAmount: entries.reduce((sum, entry) => sum + entry.amount, 0),
      itemCount: entries.length,
      nearestDueLabel: getNearestDueLabel(entries),
      entries,
    } satisfies TimelineSection
  })
}

export function getUrgencyMeta(urgency: TimelineUrgency) {
  if (urgency === 'urgent') {
    return {
      label: 'Urgent',
      dotColor: 'rgba(194, 70, 70, 0.28)',
      textColor: '#ffb1a6',
    }
  }

  if (urgency === 'soon') {
    return {
      label: 'Soon',
      dotColor: 'rgba(201, 168, 76, 0.22)',
      textColor: '#f7d98a',
    }
  }

  return {
    label: 'Planned',
    dotColor: 'rgba(91, 163, 201, 0.18)',
    textColor: '#a8d7ff',
  }
}

export function getTimelinePaymentMeta(status: TimelineEntry['paymentStatus']) {
  if (status === 'paid') {
    return {
      label: 'Paid',
      dotColor: 'rgba(94,189,151,0.2)',
      textColor: '#78d89c',
    }
  }

  return {
    label: 'Unpaid',
    dotColor: 'rgba(201,107,107,0.18)',
    textColor: '#ff9892',
  }
}
