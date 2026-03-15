import type { CategoryWithSpent } from '../../services/dashboardApi'
import type { TransactionResponse } from '../../services/transactionApi'
import type { TimelineEntry, TimelineFilter, TimelineInsight, TimelineSection, TimelineUrgency } from './types'

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

function formatTimelineEntryTitle(category?: {
  name?: string | null
  parentName?: string | null
}) {
  const name = category?.name?.trim()
  const parentName = category?.parentName?.trim()

  if (!name) {
    return 'Expense'
  }

  if (parentName && parentName !== name) {
    return `${parentName} > ${name}`
  }

  return name
}

function formatTimelineCategoryLabel(category?: {
  name?: string | null
  parentName?: string | null
}) {
  const name = category?.name?.trim()
  const parentName = category?.parentName?.trim()

  if (parentName && name && parentName !== name) {
    return `${parentName} > ${name}`
  }

  return parentName || name || 'Other'
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
          title: formatTimelineEntryTitle(category),
          category: formatTimelineCategoryLabel(category),
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
      const title = transaction.note?.trim() || formatTimelineEntryTitle(category)
      const { group: categoryGroup, accent } = getTimelineCategoryMeta(category ?? {})
      const daysLeft = getDaysUntil(dueDate, now)

      return {
        id: `scheduled-${transaction.id}`,
        transactionId: transaction.id,
        categoryId: transaction.categoryId,
        source: 'scheduled_expense',
        title,
        category: formatTimelineCategoryLabel(category),
        icon: category?.icon,
        color: category?.color,
        iconColor: category?.iconColor,
        amount: Number.isFinite(transaction.amount) ? transaction.amount : 0,
        dueDate,
        recurring: false,
        accent,
        urgency: getUrgency(daysLeft),
        daysLeft,
        paymentStatus: transaction.isPaid && dueDate <= now ? 'paid' : 'unpaid',
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

export function buildTimelineInsights(
  sections: TimelineSection[],
  scheduledExpenses: TransactionResponse[],
  incomeEntries: Array<{ amount: number; isPaid: boolean; category: string | null; receivedAt: string }>,
): TimelineInsight[] {
  const insights: TimelineInsight[] = []
  const allEntries = sections.flatMap((section) => section.entries)

  const billHeavyDays = new Set(
    scheduledExpenses
      .filter((transaction) => transaction.countsTowardBills)
      .map((transaction) => new Date(transaction.transactionDate).toISOString().split('T')[0]),
  ).size

  if (billHeavyDays > 0) {
    insights.push({
      id: 'bill-heavy-days',
      title: `Orion noticed ${billHeavyDays} bill-heavy ${billHeavyDays === 1 ? 'day' : 'days'}`,
      detail: 'Bills-tagged activity is clustering this month, so your transfer planning may matter more than usual.',
      tone: 'bill',
    })
  }

  const paidIncomeEntries = incomeEntries.filter((entry) => entry.isPaid && Number.isFinite(entry.amount))
  const totalIncome = paidIncomeEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const topIncome = paidIncomeEntries.reduce<{ amount: number; category: string | null } | null>((max, entry) => {
    if (!max || entry.amount > max.amount) {
      return { amount: entry.amount, category: entry.category }
    }
    return max
  }, null)

  if (topIncome && totalIncome > 0 && topIncome.amount / totalIncome >= 0.45) {
    insights.push({
      id: 'income-spike',
      title: 'Income spike detected',
      detail: `${topIncome.category || 'One income source'} accounts for most of this month’s incoming cashflow.`,
      tone: 'income',
    })
  }

  const diningRelated = scheduledExpenses.filter((transaction) => {
    const note = transaction.note?.toLowerCase() ?? ''
    return note.includes('restaurant') || note.includes('food') || note.includes('dinner') || note.includes('lunch') || note.includes('coffee')
  })
  const diningTotal = diningRelated.reduce((sum, transaction) => sum + transaction.amount, 0)
  const expenseTotal = scheduledExpenses.reduce((sum, transaction) => sum + transaction.amount, 0)

  if (diningTotal > 0 && expenseTotal > 0 && diningTotal / expenseTotal >= 0.2) {
    insights.push({
      id: 'dining-pattern',
      title: 'Dining spend is above your usual pattern',
      detail: 'Food-adjacent spending is taking a larger share of this month’s transaction flow.',
      tone: 'info',
    })
  }

  if (insights.length === 0 && allEntries.length > 0) {
    insights.push({
      id: 'timeline-read',
      title: 'Orion is tracking the month',
      detail: `There are ${allEntries.length} scheduled money events in view, and the timeline is ready for deeper pattern reading.`,
      tone: 'info',
    })
  }

  return insights.slice(0, 3)
}
