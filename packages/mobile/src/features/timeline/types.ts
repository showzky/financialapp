export type TimelineFilter = 'All' | '7 Days' | '30 Days'

export type TimelineUrgency = 'urgent' | 'soon' | 'planned'

export type TimelineEntry = {
  id: string
  categoryId: string
  source: 'planned' | 'scheduled_expense'
  transactionId?: string
  title: string
  category: string
  icon?: string | null
  color?: string | null
  iconColor?: string | null
  amount: number
  dueDate: Date
  recurring: boolean
  accent: string
  urgency: TimelineUrgency
  daysLeft: number
  paymentStatus: 'paid' | 'unpaid'
}

export type TimelineSection = {
  id: string
  title: string
  monthLabel: string
  rangeLabel: string
  totalAmount: number
  itemCount: number
  nearestDueLabel: string
  entries: TimelineEntry[]
}

export type TimelineInsight = {
  id: string
  title: string
  detail: string
  tone: 'info' | 'bill' | 'income'
}
