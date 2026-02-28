import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  SubscriptionLedger,
  type Subscription,
  type SubscriptionLedgerProps,
} from '@/components/subscriptions/SubscriptionLedger'

const baseSubscriptions: Subscription[] = [
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
  {
    id: 'sub-2',
    name: 'Gym Access',
    provider: 'IronWorks',
    category: 'fitness',
    status: 'paused',
    cadence: 'monthly',
    priceCents: 34900,
    nextRenewalDate: '2026-03-17',
  },
  {
    id: 'sub-3',
    name: 'LocalStorages',
    provider: 'Typescript',
    category: 'coding',
    status: 'canceled',
    cadence: 'yearly',
    priceCents: 99900,
    nextRenewalDate: '2026-03-27',
  },
]

const renderLedger = (props?: Partial<SubscriptionLedgerProps>) =>
  render(
    <SubscriptionLedger
      subscriptions={baseSubscriptions}
      onAdd={vi.fn()}
      onEdit={vi.fn()}
      onToggleStatus={vi.fn()}
      onDelete={vi.fn()}
      {...props}
    />,
  )

describe('SubscriptionLedger loading, filtering, sorting, and pagination', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('shows skeleton rows when loading', () => {
    renderLedger({ isLoading: true })

    expect(screen.getAllByTestId('subscription-skeleton-row').length).toBeGreaterThan(0)
    expect(
      screen.queryByText('No subscriptions match your current search/filter.'),
    ).not.toBeInTheDocument()
  })

  it('shows error and retry action', () => {
    const onRetryLoad = vi.fn()

    renderLedger({
      loadError: 'HUD Alert: Could not load subscriptions',
      onRetryLoad,
    })

    expect(screen.getByText('HUD Alert: Could not load subscriptions')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading subscriptions' }))
    expect(onRetryLoad).toHaveBeenCalledTimes(1)
  })

  it('shows no-data empty state when backend returns no subscriptions', () => {
    renderLedger({ subscriptions: [] })

    expect(screen.getByText('No subscriptions yet. Add your first subscription.')).toBeInTheDocument()
    expect(screen.queryByTestId('subscription-skeleton-row')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry loading subscriptions' })).not.toBeInTheDocument()
  })

  it('applies search only after debounce delay', () => {
    renderLedger()

    fireEvent.change(screen.getByPlaceholderText('Search name/provider/category...'), {
      target: { value: 'not-a-match' },
    })

    expect(screen.getByText('CineStream')).toBeInTheDocument()
    expect(screen.queryByText('No subscriptions match your current search/filter.')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(260)
    })

    expect(screen.getByText('No subscriptions match your current search/filter.')).toBeInTheDocument()
  })

  it('clears search and status filters with clear action', () => {
    renderLedger()

    const searchInput = screen.getByPlaceholderText('Search name/provider/category...')
    fireEvent.change(searchInput, { target: { value: 'gym' } })
    act(() => {
      vi.advanceTimersByTime(260)
    })
    fireEvent.change(screen.getByDisplayValue('All'), { target: { value: 'paused' } })

    expect(screen.getByRole('button', { name: 'Clear search and status filters' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear search and status filters' }))

    expect(screen.getByPlaceholderText('Search name/provider/category...')).toHaveValue('')
    expect(screen.getByDisplayValue('All')).toBeInTheDocument()
    expect(screen.getByText('CineStream')).toBeInTheDocument()
  })

  it('sorts by name ascending then descending', () => {
    renderLedger()
    const getFirstName = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.querySelector('td .hud-monospaced')?.textContent ?? '')
        .filter(Boolean)[0]

    fireEvent.click(screen.getByRole('button', { name: 'Sort by name' }))
    expect(getFirstName()).toBe('CineStream')

    fireEvent.click(screen.getByRole('button', { name: 'Sort by name' }))
    expect(getFirstName()).toBe('LocalStorages')
  })

  it('sorts by price ascending then descending', () => {
    renderLedger()
    const getFirstName = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.querySelector('td .hud-monospaced')?.textContent ?? '')
        .filter(Boolean)[0]

    fireEvent.click(screen.getByRole('button', { name: 'Sort by price' }))
    expect(getFirstName()).toBe('CineStream')

    fireEvent.click(screen.getByRole('button', { name: 'Sort by price' }))
    expect(getFirstName()).toBe('LocalStorages')
  })

  it('sorts by status using active -> paused -> canceled order', () => {
    renderLedger()

    fireEvent.click(screen.getByRole('button', { name: 'Sort by status' }))

    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.querySelector('td .hud-monospaced')?.textContent ?? '')
      .filter(Boolean)

    expect(names[0]).toBe('CineStream')
    expect(names[1]).toBe('Gym Access')
    expect(names[2]).toBe('LocalStorages')
  })

  it('shows pagination and navigates pages', () => {
    const manyRows: Subscription[] = Array.from({ length: 12 }, (_, index) => ({
      id: `sub-${index + 1}`,
      name: `Sub ${String(index + 1).padStart(2, '0')}`,
      provider: 'Provider',
      category: 'streaming',
      status: 'active',
      cadence: 'monthly',
      priceCents: 10000 + index,
      nextRenewalDate: `2026-03-${String((index % 28) + 1).padStart(2, '0')}`,
    }))

    renderLedger({ subscriptions: manyRows, pageSize: 10 })

    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))

    expect(screen.getByText('Page 2 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
  })

  it('resets to page 1 when filters change after paging', () => {
    const manyRows: Subscription[] = Array.from({ length: 12 }, (_, index) => ({
      id: `sub-${index + 1}`,
      name: `Sub ${String(index + 1).padStart(2, '0')}`,
      provider: 'Provider',
      category: index % 2 === 0 ? 'streaming' : 'fitness',
      status: index % 2 === 0 ? 'active' : 'paused',
      cadence: 'monthly',
      priceCents: 10000 + index,
      nextRenewalDate: `2026-03-${String((index % 28) + 1).padStart(2, '0')}`,
    }))

    renderLedger({ subscriptions: manyRows, pageSize: 5 })

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(screen.getByText('Page 2 / 3')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('All'), { target: { value: 'paused' } })
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument()
  })
})
