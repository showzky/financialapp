import React, { useMemo } from 'react'
import type { Subscription } from '@/types/subscription'
import {
  SubscriptionLedger,
  type SubscriptionLedgerProps,
} from '@/components/subscriptions/SubscriptionLedger'
import { SubscriptionSummaryCards } from '@/components/subscriptions/SubscriptionSummaryCards'
import { getLocaleCurrencyConfig } from '@/utils/localeFormatting'

export type SubscriptionDashboardPanelProps = {
  subscriptions: Subscription[]
  isLoading?: boolean
  loadError?: string
  locale?: string
  currency?: string
  onRetryLoad?: SubscriptionLedgerProps['onRetryLoad']
  onEdit?: SubscriptionLedgerProps['onEdit']
  onAdd?: SubscriptionLedgerProps['onAdd']
  onToggleStatus?: SubscriptionLedgerProps['onToggleStatus']
  onDelete?: SubscriptionLedgerProps['onDelete']
  pendingToggleId?: SubscriptionLedgerProps['pendingToggleId']
  pageSize?: SubscriptionLedgerProps['pageSize']
}

type InsightPillProps = {
  label: string
  value: string
}

type SubscriptionWithOptionalNextBilling = Subscription & {
  nextBillingDate?: string
}

const EMPTY_VALUE = '—'
const NOOP = (..._args: unknown[]) => {}

const monthlyEquivalentCents = (subscription: Subscription): number => {
  if (subscription.cadence === 'monthly') return subscription.priceCents
  return Math.round(subscription.priceCents / 12)
}

const getNextBillingRaw = (subscription: Subscription): string => {
  const typedSubscription = subscription as SubscriptionWithOptionalNextBilling
  return typedSubscription.nextBillingDate ?? subscription.nextRenewalDate
}

const parseIsoDateOnly = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const date = new Date(year, month - 1, day)
  const isValid =
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day

  return isValid ? date : null
}

const parseNextBillingDate = (value: string): Date | null => {
  const dateOnly = parseIsoDateOnly(value)
  if (dateOnly) return dateOnly

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed
}

const toLocalStartOfDay = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const isWithinNextDaysInclusive = (target: Date, days: number): boolean => {
  const today = toLocalStartOfDay(new Date())
  const targetDay = toLocalStartOfDay(target)
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  const deltaDays = Math.round((targetDay - today) / millisecondsPerDay)

  return deltaDays >= 0 && deltaDays <= days
}

const formatCents = (cents: number, formatter: Intl.NumberFormat): string => {
  return formatter.format(cents / 100)
}

const InsightPill = ({ label, value }: InsightPillProps) => (
  <div className="obsidian-pill flex items-center justify-between gap-3 px-4 py-3">
    <span className="text-xs font-medium text-[#b8b4ae]">{label}</span>
    <span className="obsidian-metric text-sm">{value}</span>
  </div>
)

export const SubscriptionDashboardPanel: React.FC<SubscriptionDashboardPanelProps> = ({
  subscriptions,
  isLoading = false,
  loadError = '',
  locale,
  currency,
  onRetryLoad,
  onEdit,
  onAdd,
  onToggleStatus,
  onDelete,
  pendingToggleId,
  pageSize,
}) => {
  const localeCurrency = useMemo(
    () => getLocaleCurrencyConfig({ locale, currency }),
    [locale, currency],
  )

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
  }, [localeCurrency.currency, localeCurrency.locale])

  const {
    activeSubscriptions,
    billableSubscriptions,
    pausedCount,
    canceledCount,
  } = useMemo(() => {
    const active: Subscription[] = []
    const billable: Subscription[] = []
    let paused = 0
    let canceled = 0

    for (const subscription of subscriptions) {
      if (subscription.status === 'active') {
        active.push(subscription)
        billable.push(subscription)
      } else if (subscription.status === 'paused') {
        paused += 1
        billable.push(subscription)
      } else if (subscription.status === 'canceled') {
        canceled += 1
      }
    }

    return {
      activeSubscriptions: active,
      billableSubscriptions: billable,
      pausedCount: paused,
      canceledCount: canceled,
    }
  }, [subscriptions])

  const totalCount = subscriptions.length

  const monthlySpendCents = useMemo(
    () =>
      billableSubscriptions.reduce((sum, subscription) => {
        return sum + monthlyEquivalentCents(subscription)
      }, 0),
    [billableSubscriptions],
  )

  const estimatedYearlyCostCents = useMemo(() => {
    return billableSubscriptions.reduce((sum, subscription) => {
      if (subscription.cadence === 'monthly') {
        return sum + subscription.priceCents * 12
      }

      return sum + subscription.priceCents
    }, 0)
  }, [billableSubscriptions])

  const renewalsNext7Days = useMemo(() => {
    return activeSubscriptions.filter((subscription) => {
      const parsed = parseNextBillingDate(getNextBillingRaw(subscription))
      if (!parsed) return false

      return isWithinNextDaysInclusive(parsed, 7)
    }).length
  }, [activeSubscriptions])

  const mostExpensiveMonthlyEquivalentCents = useMemo(() => {
    const candidates = subscriptions.filter(
      (subscription) => subscription.status !== 'canceled',
    )

    if (candidates.length === 0) return null

    return candidates.reduce<number>((max, subscription) => {
      const next = monthlyEquivalentCents(subscription)
      return Math.max(max, next)
    }, 0)
  }, [subscriptions])

  const hasLoadError = loadError.trim().length > 0
  const isUnavailable = isLoading || hasLoadError

  const primaryValue = isUnavailable
    ? EMPTY_VALUE
    : formatCents(monthlySpendCents, currencyFormatter)

  const yearlyValue = isUnavailable
    ? EMPTY_VALUE
    : formatCents(estimatedYearlyCostCents, currencyFormatter)

  const mostExpensiveValue =
    isUnavailable || mostExpensiveMonthlyEquivalentCents === null
      ? EMPTY_VALUE
      : formatCents(mostExpensiveMonthlyEquivalentCents, currencyFormatter)

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
    <div className="obsidian-panel p-5 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="obsidian-dot" />
        <h3 className="obsidian-kicker m-0">Subscription Dashboard</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          className="obsidian-subpanel p-5 lg:col-span-2"
          aria-label="Subscription spend overview"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="obsidian-kicker m-0">Estimated monthly spend</p>
            </div>

            <div className="text-right">
              <p className="m-0 text-xs text-[#b8b4ae]">Yearly estimate</p>
              <p className="obsidian-metric m-0 text-sm">{yearlyValue}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="obsidian-metric m-0 text-4xl font-semibold sm:text-5xl">
              {primaryValue}
            </p>
            <p className="mt-2 text-xs text-[#b8b4ae]">{helperLine}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="obsidian-subpanel px-4 py-4">
              <p className="obsidian-kicker m-0">Active</p>
              <p className="obsidian-metric mt-2 text-lg">
                {isUnavailable ? EMPTY_VALUE : String(activeSubscriptions.length)}
              </p>
              <p className="mt-1 text-xs text-[#b8b4ae]">of {totalCount} total</p>
            </div>

            <div className="obsidian-subpanel px-4 py-4">
              <p className="obsidian-kicker m-0">Total subscriptions</p>
              <p className="obsidian-metric mt-2 text-lg">
                {isUnavailable ? EMPTY_VALUE : String(totalCount)}
              </p>
              <p className="mt-1 text-xs text-[#b8b4ae]">
                {pausedCount} paused · {canceledCount} canceled
              </p>
            </div>

            <div className="obsidian-subpanel px-4 py-4">
              <p className="obsidian-kicker m-0">Most expensive</p>
              <p className="obsidian-metric mt-2 text-lg">{mostExpensiveValue}</p>
              <p className="mt-1 text-xs text-[#b8b4ae]">Highest monthly equiv.</p>
            </div>
          </div>
        </section>

        <section className="obsidian-subpanel p-5" aria-label="Subscription insights">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <InsightPill
              label="Renewals next 7 days"
              value={isUnavailable ? EMPTY_VALUE : String(renewalsNext7Days)}
            />
            <InsightPill
              label="Paused"
              value={isUnavailable ? EMPTY_VALUE : String(pausedCount)}
            />
            <InsightPill label="Yearly estimate" value={yearlyValue} />
            <InsightPill
              label="Total subscriptions"
              value={isUnavailable ? EMPTY_VALUE : String(totalCount)}
            />
          </div>
        </section>
      </div>

      <div className="mt-6">
        <SubscriptionSummaryCards
          subscriptions={subscriptions}
          locale={locale}
          currency={currency}
          isLoading={isLoading}
          loadError={loadError}
        />

        <div className="mt-6">
          <SubscriptionLedger
            subscriptions={subscriptions}
            locale={locale}
            currency={currency}
            pageSize={pageSize}
            isLoading={isLoading}
            loadError={loadError}
            onRetryLoad={onRetryLoad}
            onEdit={onEdit ?? NOOP}
            onAdd={onAdd ?? NOOP}
            onToggleStatus={onToggleStatus ?? NOOP}
            onDelete={onDelete}
            pendingToggleId={pendingToggleId}
          />
        </div>
      </div>
    </div>
  )
}

export default SubscriptionDashboardPanel