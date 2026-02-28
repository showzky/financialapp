import React, { useMemo } from 'react'
import { getLocaleCurrencyConfig } from '@/utils/localeFormatting'
import type { Subscription } from '@/types/subscription'

export type SubscriptionSummaryCardsProps = {
  subscriptions: Subscription[]
  locale?: string
  currency?: string
  isLoading?: boolean
  loadError?: string
}

const monthlyEquivalentCents = (subscription: Subscription): number => {
  if (subscription.cadence === 'monthly') return subscription.priceCents
  return Math.round(subscription.priceCents / 12)
}

const parseIsoDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

const toLocalStartOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const getDaysAway = (target: Date): number => {
  const millisPerDay = 1000 * 60 * 60 * 24
  const today = toLocalStartOfDay(new Date())
  const targetDay = toLocalStartOfDay(target)
  return Math.max(0, Math.round((targetDay - today) / millisPerDay))
}

const iconClassName = 'h-4 w-4 text-[var(--color-text-muted)]'

const CardIconSpend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
    <path d="M3.5 7.5h17v9h-17z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 10h17M8 13.5h3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CardIconActive = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
    <path d="m5 14 7-4 7 4-7 4-7-4Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m5 10 7-4 7 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CardIconBilling = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
    <path d="M7 3.5v3M17 3.5v3M4 8.5h16M5.5 6.5h13a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const SubscriptionSummaryCards: React.FC<SubscriptionSummaryCardsProps> = ({
  subscriptions,
  locale,
  currency,
  isLoading = false,
  loadError = '',
}) => {
  const localeCurrency = useMemo(() => getLocaleCurrencyConfig({ locale, currency }), [locale, currency])

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(localeCurrency.locale, {
        style: 'currency',
        currency: localeCurrency.currency,
      })
    } catch {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'NOK',
      })
    }
  }, [localeCurrency])

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(localeCurrency.locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    } catch {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    }
  }, [localeCurrency.locale])

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'active'),
    [subscriptions],
  )

  const monthlySpendCents = useMemo(
    () =>
      activeSubscriptions.reduce(
        (sum, subscription) => sum + monthlyEquivalentCents(subscription),
        0,
      ),
    [activeSubscriptions],
  )

  const totalServices = subscriptions.length
  const activeServices = activeSubscriptions.length
  const utilization = totalServices > 0 ? Math.round((activeServices / totalServices) * 100) : 0

  const nextBillingDate = useMemo(() => {
    const validDates = activeSubscriptions
      .map((subscription) => parseIsoDate(subscription.nextRenewalDate))
      .filter((date): date is Date => date !== null)

    if (validDates.length === 0) return null
    return new Date(Math.min(...validDates.map((date) => date.getTime())))
  }, [activeSubscriptions])

  const nextBillingLabel = nextBillingDate ? dateFormatter.format(nextBillingDate) : 'No upcoming billing'
  const nextBillingDaysLabel = nextBillingDate
    ? (() => {
        const daysAway = getDaysAway(nextBillingDate)
        if (daysAway === 0) return 'today'
        return `in ${daysAway} day(s)`
      })()
    : 'No active renewals'

  const hasLoadError = loadError.trim().length > 0

  const renderValue = (value: string) => {
    if (isLoading) {
      return <div className="h-10 w-32 animate-pulse rounded bg-white/10" aria-hidden="true" />
    }
    if (hasLoadError) {
      return <span className="hud-monospaced text-4xl font-semibold text-[var(--color-text-primary)]">—</span>
    }
    return <span className="hud-monospaced text-4xl font-semibold text-[var(--color-text-primary)]">{value}</span>
  }

  const helperTextClass = hasLoadError ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]'

  return (
    <section aria-labelledby="subscription-overview-heading">
      <h2 id="subscription-overview-heading" className="sr-only">
        Subscription overview
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <article className="hud-glass-card">
          <div className="mb-4 flex items-center gap-2">
            <CardIconSpend />
            <p className="text-[0.8rem] text-[var(--color-text-muted)]">Total Monthly Spend</p>
          </div>
          <div className="mb-3">{renderValue(currencyFormatter.format(monthlySpendCents / 100))}</div>
          <p aria-live="polite" className={`text-sm ${helperTextClass}`}>
            {hasLoadError ? 'data unavailable' : 'from active subscriptions'}
          </p>
        </article>

        <article className="hud-glass-card">
          <div className="mb-4 flex items-center gap-2">
            <CardIconActive />
            <p className="text-[0.8rem] text-[var(--color-text-muted)]">Active Services</p>
          </div>
          <div className="mb-3">{renderValue(`${activeServices} / ${totalServices}`)}</div>
          <p aria-live="polite" className={`text-sm ${helperTextClass}`}>
            {hasLoadError ? 'data unavailable' : `${utilization}% services active`}
          </p>
        </article>

        <article className="hud-glass-card">
          <div className="mb-4 flex items-center gap-2">
            <CardIconBilling />
            <p className="text-[0.8rem] text-[var(--color-text-muted)]">Next Billing</p>
          </div>
          <div className="mb-3">{renderValue(nextBillingLabel)}</div>
          <p aria-live="polite" className={`text-sm ${helperTextClass}`}>
            {hasLoadError ? 'data unavailable' : nextBillingDaysLabel}
          </p>
        </article>
      </div>
    </section>
  )
}

export default SubscriptionSummaryCards
