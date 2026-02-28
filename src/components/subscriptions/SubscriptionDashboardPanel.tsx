import React, { useMemo } from 'react'
import type { Subscription } from '@/types/subscription'
import { getLocaleCurrencyConfig } from '@/utils/localeFormatting'

export type SubscriptionDashboardPanelProps = {
  subscriptions: Subscription[]
  isLoading?: boolean
  loadError?: string
  locale?: string
  currency?: string
}

const monthlyEquivalentCents = (subscription: Subscription): number => {
  if (subscription.cadence === 'monthly') return subscription.priceCents
  return Math.round(subscription.priceCents / 12)
}

const getNextBillingRaw = (subscription: Subscription): string =>
  (subscription as unknown as { nextBillingDate?: string }).nextBillingDate ?? subscription.nextRenewalDate

const parseIsoDateOnly = (value: string): Date | null => {
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

const parseNextBillingDate = (value: string): Date | null => {
  const dateOnly = parseIsoDateOnly(value)
  if (dateOnly) return dateOnly

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const toLocalStartOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const isWithinNextDaysInclusive = (target: Date, days: number): boolean => {
  const today = toLocalStartOfDay(new Date())
  const targetDay = toLocalStartOfDay(target)
  const millisPerDay = 1000 * 60 * 60 * 24
  const deltaDays = Math.round((targetDay - today) / millisPerDay)
  return deltaDays >= 0 && deltaDays <= days
}

const formatCents = (cents: number, formatter: Intl.NumberFormat) => formatter.format(cents / 100)

type InsightPillProps = {
  label: string
  value: string
}

const InsightPill = ({ label, value }: InsightPillProps) => (
  <div className="glass-panel flex items-center justify-between gap-3 rounded-full px-4 py-2">
    <span className="text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
    <span className="hud-monospaced text-sm text-[var(--color-text-primary)]">{value}</span>
  </div>
)

export const SubscriptionDashboardPanel: React.FC<SubscriptionDashboardPanelProps> = ({
  subscriptions,
  isLoading = false,
  loadError = '',
  locale,
  currency,
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

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'active'),
    [subscriptions],
  )

  const billableSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'active' || subscription.status === 'paused'),
    [subscriptions],
  )

  const pausedCount = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'paused').length,
    [subscriptions],
  )

  const totalCount = subscriptions.length

  const monthlySpendCents = useMemo(
    () =>
      billableSubscriptions.reduce(
        (sum, subscription) => sum + monthlyEquivalentCents(subscription),
        0,
      ),
    [billableSubscriptions],
  )

  const estimatedYearlyCostCents = useMemo(() => {
    const monthlyTotal = billableSubscriptions
      .filter((subscription) => subscription.cadence === 'monthly')
      .reduce((sum, subscription) => sum + subscription.priceCents, 0)
    const yearlyTotal = billableSubscriptions
      .filter((subscription) => subscription.cadence === 'yearly')
      .reduce((sum, subscription) => sum + subscription.priceCents, 0)

    return monthlyTotal * 12 + yearlyTotal
  }, [billableSubscriptions])

  const renewalsNext7Days = useMemo(() => {
    return activeSubscriptions.filter((subscription) => {
      const parsed = parseNextBillingDate(getNextBillingRaw(subscription))
      if (!parsed) return false
      return isWithinNextDaysInclusive(parsed, 7)
    }).length
  }, [activeSubscriptions])

  const mostExpensiveMonthlyEquivalentCents = useMemo(() => {
    const candidates = subscriptions.filter((subscription) => subscription.status !== 'canceled')
    if (candidates.length === 0) return null

    return candidates.reduce<number>((max, subscription) => {
      const next = monthlyEquivalentCents(subscription)
      return Math.max(max, next)
    }, 0)
  }, [subscriptions])

  const hasLoadError = loadError.trim().length > 0

  const primaryValue = isLoading || hasLoadError ? '—' : formatCents(monthlySpendCents, currencyFormatter)
  const yearlyValue = isLoading || hasLoadError ? '—' : formatCents(estimatedYearlyCostCents, currencyFormatter)

  const helperLine = useMemo(() => {
    if (hasLoadError) {
      return 'Could not load subscriptions'
    }

    if (billableSubscriptions.length === 0) {
      return 'No active or paused subscriptions'
    }

    return 'Active + paused subscriptions'
  }, [billableSubscriptions.length, hasLoadError])

  return (
    <div className="hud-glass-card">
      <div className="flex items-center gap-2 mb-6">
        <span className="hud-status-dot" />
        <h3 className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--color-text-muted)] m-0">
          Subscription Dashboard
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          className="glass-panel rounded-[1.25rem] p-5 lg:col-span-2"
          aria-label="Subscription spend overview"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] m-0">
                Estimated yearly spend
              </p>
              <p className="text-sm text-[var(--color-text-muted)] m-0">Estimated monthly spend</p>
            </div>
            <div className="text-right">
              <p className="hud-monospaced text-sm text-[var(--color-text-primary)] m-0">{yearlyValue}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="hud-monospaced text-4xl font-semibold text-[var(--color-text-primary)] m-0">
              {primaryValue}
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{helperLine}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="glass-panel rounded-[1rem] px-4 py-3">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)] m-0">
                Active
              </p>
              <p className="hud-monospaced mt-1 text-lg text-[var(--color-text-primary)] m-0">
                {isLoading || hasLoadError ? '—' : String(activeSubscriptions.length)}
              </p>
            </div>
            <div className="glass-panel rounded-[1rem] px-4 py-3">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)] m-0">
                Monthly equivalent
              </p>
              <p className="hud-monospaced mt-1 text-lg text-[var(--color-text-primary)] m-0">
                {isLoading || hasLoadError ? '—' : formatCents(monthlySpendCents, currencyFormatter)}
              </p>
            </div>
            <div className="glass-panel rounded-[1rem] px-4 py-3">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)] m-0">
                Yearly projection
              </p>
              <p className="hud-monospaced mt-1 text-lg text-[var(--color-text-primary)] m-0">
                {yearlyValue}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[1.25rem] p-5" aria-label="Subscription insights">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <InsightPill
              label="Renewals next 7 days"
              value={isLoading || hasLoadError ? '—' : String(renewalsNext7Days)}
            />
            <InsightPill label="Paused" value={isLoading || hasLoadError ? '—' : String(pausedCount)} />
            <InsightPill
              label="Most expensive"
              value={
                isLoading || hasLoadError
                  ? '—'
                  : mostExpensiveMonthlyEquivalentCents === null
                    ? '—'
                    : formatCents(mostExpensiveMonthlyEquivalentCents, currencyFormatter)
              }
            />
            <InsightPill label="Total subscriptions" value={isLoading || hasLoadError ? '—' : String(totalCount)} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default SubscriptionDashboardPanel
