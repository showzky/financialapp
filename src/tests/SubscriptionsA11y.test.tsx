import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SubscriptionLedger, type Subscription } from '@/components/subscriptions/SubscriptionLedger'

const rows: Subscription[] = [
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

describe('Subscriptions accessibility smoke', () => {
  it('exposes accessible search/filter controls and sortable headers', () => {
    render(
      <SubscriptionLedger
        subscriptions={rows}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Search subscriptions' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filter subscriptions by status' })).toBeInTheDocument()

    const sortByName = screen.getByRole('button', { name: 'Sort by name' })
    const nameHeader = sortByName.closest('th')
    expect(nameHeader).not.toBeNull()
    expect(nameHeader).toHaveAttribute('aria-sort', 'none')

    fireEvent.click(sortByName)
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  })
})
