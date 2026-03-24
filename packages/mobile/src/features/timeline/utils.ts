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

export type TimelineMonthTheme = {
  sky: [string, string, string]
  hillBack: string
  hillMid: string
  hillFront: string
  moon: string
  glow: string
  arc: string
  tree: string
  dot: string
  season: 'winter' | 'spring' | 'summer' | 'autumn'
}

export function getTimelineMonthTheme(sectionId: string): TimelineMonthTheme {
  // sectionId format: "year-monthIndex" where monthIndex is 0-based (0=Jan, 11=Dec)
  const monthIndex = Number(sectionId.split('-')[1] ?? 0)
  const themes: TimelineMonthTheme[] = [
    // January (0) — cold steel-blue winter night
    {
      sky: ['rgba(14,20,40,0.98)', 'rgba(18,24,50,0.98)', 'rgba(10,14,28,0.98)'],
      hillBack: 'rgba(38,52,90,0.72)',
      hillMid: 'rgba(28,40,72,0.92)',
      hillFront: 'rgba(14,22,44,1)',
      moon: 'rgba(220,232,255,0.95)',
      glow: 'rgba(180,200,255,0.22)',
      arc: 'rgba(160,190,255,0.28)',
      tree: 'rgba(10,14,30,0.9)',
      dot: '#a0c4ff',
      season: 'winter',
    },
    // February (1) — twilight violet, aurora hints
    {
      sky: ['rgba(32,22,58,0.98)', 'rgba(28,18,50,0.98)', 'rgba(18,12,34,0.98)'],
      hillBack: 'rgba(80,55,130,0.72)',
      hillMid: 'rgba(60,38,108,0.92)',
      hillFront: 'rgba(28,16,56,1)',
      moon: 'rgba(230,210,255,0.92)',
      glow: 'rgba(190,160,255,0.24)',
      arc: 'rgba(200,180,255,0.30)',
      tree: 'rgba(16,10,32,0.9)',
      dot: '#c4a8ff',
      season: 'winter',
    },
    // March (2) — dawn blush, cherry blossom
    {
      sky: ['rgba(48,28,48,0.98)', 'rgba(72,36,52,0.96)', 'rgba(40,22,36,0.98)'],
      hillBack: 'rgba(140,80,100,0.62)',
      hillMid: 'rgba(110,56,76,0.88)',
      hillFront: 'rgba(52,26,36,1)',
      moon: 'rgba(255,218,200,0.90)',
      glow: 'rgba(255,180,160,0.20)',
      arc: 'rgba(255,160,180,0.32)',
      tree: 'rgba(28,14,18,0.9)',
      dot: '#ffb8d0',
      season: 'spring',
    },
    // April (3) — bright green hills, rainbow arc
    {
      sky: ['rgba(22,38,62,0.96)', 'rgba(28,48,74,0.96)', 'rgba(18,30,50,0.98)'],
      hillBack: 'rgba(60,120,70,0.72)',
      hillMid: 'rgba(44,96,56,0.92)',
      hillFront: 'rgba(22,52,30,1)',
      moon: 'rgba(220,240,200,0.88)',
      glow: 'rgba(180,230,180,0.18)',
      arc: 'rgba(160,220,200,0.28)',
      tree: 'rgba(14,32,18,0.9)',
      dot: '#90e890',
      season: 'spring',
    },
    // May (4) — warm golden morning, flowers
    {
      sky: ['rgba(38,32,18,0.96)', 'rgba(64,50,20,0.96)', 'rgba(30,24,12,0.98)'],
      hillBack: 'rgba(100,130,60,0.68)',
      hillMid: 'rgba(76,108,40,0.90)',
      hillFront: 'rgba(36,56,18,1)',
      moon: 'rgba(255,240,180,0.92)',
      glow: 'rgba(255,220,100,0.20)',
      arc: 'rgba(255,200,80,0.30)',
      tree: 'rgba(20,32,10,0.9)',
      dot: '#f0d060',
      season: 'spring',
    },
    // June (5) — sunset coral, sun setting
    {
      sky: ['rgba(60,28,18,0.98)', 'rgba(84,38,20,0.96)', 'rgba(40,18,10,0.98)'],
      hillBack: 'rgba(120,70,40,0.70)',
      hillMid: 'rgba(90,48,24,0.92)',
      hillFront: 'rgba(40,20,10,1)',
      moon: 'rgba(255,200,140,0.95)',
      glow: 'rgba(255,160,80,0.28)',
      arc: 'rgba(255,140,100,0.36)',
      tree: 'rgba(22,12,6,0.9)',
      dot: '#ffb060',
      season: 'summer',
    },
    // July (6) — intense amber-gold, peak summer
    {
      sky: ['rgba(58,34,8,0.98)', 'rgba(80,46,10,0.96)', 'rgba(38,22,4,0.98)'],
      hillBack: 'rgba(130,84,28,0.68)',
      hillMid: 'rgba(100,64,16,0.92)',
      hillFront: 'rgba(46,28,6,1)',
      moon: 'rgba(255,210,100,0.95)',
      glow: 'rgba(255,180,40,0.30)',
      arc: 'rgba(255,200,60,0.40)',
      tree: 'rgba(24,14,4,0.9)',
      dot: '#ffc840',
      season: 'summer',
    },
    // August (7) — late golden hour, harvest warmth
    {
      sky: ['rgba(50,30,14,0.98)', 'rgba(72,42,18,0.96)', 'rgba(34,20,8,0.98)'],
      hillBack: 'rgba(110,76,36,0.70)',
      hillMid: 'rgba(84,56,22,0.92)',
      hillFront: 'rgba(38,24,10,1)',
      moon: 'rgba(255,205,130,0.92)',
      glow: 'rgba(240,170,80,0.24)',
      arc: 'rgba(230,180,100,0.32)',
      tree: 'rgba(22,12,5,0.9)',
      dot: '#e8a850',
      season: 'summer',
    },
    // September (8) — amber autumn sky, early leaves
    {
      sky: ['rgba(44,24,12,0.98)', 'rgba(62,32,14,0.96)', 'rgba(30,16,8,0.98)'],
      hillBack: 'rgba(130,80,30,0.72)',
      hillMid: 'rgba(100,56,18,0.92)',
      hillFront: 'rgba(44,22,8,1)',
      moon: 'rgba(255,200,140,0.90)',
      glow: 'rgba(220,140,60,0.22)',
      arc: 'rgba(200,130,60,0.34)',
      tree: 'rgba(26,14,6,0.9)',
      dot: '#e09040',
      season: 'autumn',
    },
    // October (9) — deep rust/burgundy, falling leaves
    {
      sky: ['rgba(36,14,10,0.98)', 'rgba(52,18,12,0.98)', 'rgba(24,10,6,0.98)'],
      hillBack: 'rgba(110,44,22,0.72)',
      hillMid: 'rgba(80,28,14,0.94)',
      hillFront: 'rgba(34,12,6,1)',
      moon: 'rgba(240,180,140,0.88)',
      glow: 'rgba(200,100,60,0.20)',
      arc: 'rgba(180,90,50,0.32)',
      tree: 'rgba(22,8,4,0.9)',
      dot: '#d06840',
      season: 'autumn',
    },
    // November (10) — foggy grey-purple, misty and bare
    {
      sky: ['rgba(24,20,28,0.98)', 'rgba(32,26,36,0.98)', 'rgba(16,14,20,0.98)'],
      hillBack: 'rgba(70,60,80,0.68)',
      hillMid: 'rgba(52,44,62,0.90)',
      hillFront: 'rgba(24,20,30,1)',
      moon: 'rgba(200,190,210,0.80)',
      glow: 'rgba(160,150,180,0.16)',
      arc: 'rgba(150,140,170,0.24)',
      tree: 'rgba(14,12,18,0.9)',
      dot: '#b0a8c0',
      season: 'autumn',
    },
    // December (11) — midnight navy, bright stars, snow
    {
      sky: ['rgba(8,14,32,0.98)', 'rgba(12,18,42,0.98)', 'rgba(6,10,22,0.98)'],
      hillBack: 'rgba(30,44,80,0.72)',
      hillMid: 'rgba(22,34,64,0.92)',
      hillFront: 'rgba(10,16,36,1)',
      moon: 'rgba(210,228,255,0.96)',
      glow: 'rgba(160,188,255,0.26)',
      arc: 'rgba(180,210,255,0.32)',
      tree: 'rgba(6,10,22,0.9)',
      dot: '#80b0ff',
      season: 'winter',
    },
  ]

  return themes[monthIndex % 12]
}

export function formatDueLabel(date: Date) {
  return weekdayFormatter.format(date)
}

export function formatDayHeader(date: Date, now: Date): string {
  const d = new Date(date)
  const today = new Date(now)
  d.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / DAY_MS)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return weekdayFormatter.format(date)
}

export type WeekBand = {
  key: string
  label: string
  isCurrentWeek: boolean
  entries: TimelineEntry[]
}

export function buildWeekBands(year: number, month: number, entries: TimelineEntry[], now: Date): WeekBand[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayInThisMonth = now.getFullYear() === year && now.getMonth() === month
  const todayDay = now.getDate()

  const bands: WeekBand[] = []
  let start = 1

  while (start <= daysInMonth) {
    const end = Math.min(start + 6, daysInMonth)
    const startDate = new Date(year, month, start)
    const endDate = new Date(year, month, end)

    const isCurrentWeek = todayInThisMonth && todayDay >= start && todayDay <= end

    const label = isCurrentWeek
      ? 'This week'
      : start === end
        ? rangeFormatter.format(startDate)
        : `${rangeFormatter.format(startDate)} – ${rangeFormatter.format(endDate)}`

    const bandEntries = entries.filter((e) => {
      const d = e.dueDate.getDate()
      return e.dueDate.getFullYear() === year && e.dueDate.getMonth() === month && d >= start && d <= end
    })

    bands.push({ key: `${year}-${month}-w${start}`, label, isCurrentWeek, entries: bandEntries })
    start += 7
  }

  return bands
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
  if (filter === 'All') return true
  const daysLimit = filter === '7 Days' ? 7 : 30
  return Math.abs(entry.daysLeft) <= daysLimit
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

  // Pre-populate all months in the window so empty months still render
  const sectionMap = new Map<string, TimelineEntry[]>()
  for (let offset = 0; offset < monthCount; offset++) {
    const d = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + offset, 1)
    sectionMap.set(`${d.getFullYear()}-${d.getMonth()}`, [])
  }

  for (const entry of timelineEntries) {
    const key = `${entry.dueDate.getFullYear()}-${entry.dueDate.getMonth()}`
    const group = sectionMap.get(key)
    if (group) group.push(entry)
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
