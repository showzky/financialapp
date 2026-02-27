import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SubscriptionLedger, type Subscription } from '@/components/subscriptions/SubscriptionLedger'

const sampleSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    name: 'CineStream',
    provider: 'CineStream',
    category: 'streaming',
    status: 'active',
    cadence: 'monthly',
    priceCents: 12900,
    nextRenewalDate: '2026-03-05',
  },
]

describe('SubscriptionLedger loading and error states', () => {
  it('shows skeleton rows when loading', () => {
    render(
      <SubscriptionLedger
        subscriptions={sampleSubscriptions}
        isLoading={true}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    expect(screen.getAllByTestId('subscription-skeleton-row').length).toBeGreaterThan(0)
    expect(
      screen.queryByText('No subscriptions match your current search/filter.'),
    ).not.toBeInTheDocument()
  })

  it('shows error and retry action', () => {
    const onRetryLoad = vi.fn()

    render(
      <SubscriptionLedger
        subscriptions={sampleSubscriptions}
        loadError="HUD Alert: Could not load subscriptions"
        onRetryLoad={onRetryLoad}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('HUD Alert: Could not load subscriptions')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading subscriptions' }))
    expect(onRetryLoad).toHaveBeenCalledTimes(1)
  })

  it('shows no-data empty state when backend returns no subscriptions', () => {
    render(
      <SubscriptionLedger
        subscriptions={[]}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('No subscriptions yet. Add your first subscription.')).toBeInTheDocument()
    expect(screen.queryByTestId('subscription-skeleton-row')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry loading subscriptions' })).not.toBeInTheDocument()
  })

  it('shows filtered empty state when subscriptions exist but filters remove all matches', () => {
    render(
      <SubscriptionLedger
        subscriptions={sampleSubscriptions}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Search name/provider/category...'), {
      target: { value: 'not-a-match' },
    })

    expect(screen.getByText('No subscriptions match your current search/filter.')).toBeInTheDocument()
  })

  it('renders locale currency and locale date formatting', () => {
    const locale = 'en-US'
    const currency = 'NOK'

    render(
      <SubscriptionLedger
        subscriptions={sampleSubscriptions}
        locale={locale}
        currency={currency}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    const expectedPrice = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(sampleSubscriptions[0].priceCents / 100)

    const expectedDate = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(2026, 2, 5))

    expect(
      screen.getAllByText((content) => content.replace(/\u00A0/g, ' ').includes(expectedPrice.replace(/\u00A0/g, ' ')))
        .length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(expectedDate)).toBeInTheDocument()
  })

  it('falls back safely when locale or currency is invalid', () => {
    render(
      <SubscriptionLedger
        subscriptions={sampleSubscriptions}
        locale="invalid-locale-###"
        currency="BAD"
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('CineStream')).toBeInTheDocument()
  })
})

