import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { SubscriptionsDash } from '@/pages/SubscriptionsDash'
import { subscriptionApi } from '@/services/subscriptionApi'
import type { Subscription } from '@/components/subscriptions/SubscriptionLedger'

vi.mock('@/services/subscriptionApi', () => ({
  subscriptionApi: {
    list: vi.fn(),
  },
}))

const mockedList = vi.mocked(subscriptionApi.list)

const sampleRows: Subscription[] = [
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
]

describe('SubscriptionsDash loading and error flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading first and then renders subscriptions on success', async () => {
    let resolveList: ((value: Subscription[]) => void) | undefined
    const listPromise = new Promise<Subscription[]>((resolve) => {
      resolveList = resolve
    })
    mockedList.mockReturnValueOnce(listPromise)

    render(<SubscriptionsDash />)

    expect(screen.getAllByTestId('subscription-skeleton-row').length).toBeGreaterThan(0)

    resolveList?.(sampleRows)

    await waitFor(() => {
      expect(screen.getByText('CineStream')).toBeInTheDocument()
      expect(screen.getByText('Gym Access')).toBeInTheDocument()
    })
  })

  it('shows load error when list call fails', async () => {
    mockedList.mockRejectedValueOnce(new Error('HUD Alert: Failed to fetch subscriptions'))

    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('HUD Alert: Failed to fetch subscriptions')).toBeInTheDocument()
    })
  })

  it('retries and recovers after initial failure', async () => {
    mockedList
      .mockRejectedValueOnce(new Error('HUD Alert: Failed to fetch subscriptions'))
      .mockResolvedValueOnce(sampleRows)

    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('HUD Alert: Failed to fetch subscriptions')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retry loading subscriptions' }))

    await waitFor(() => {
      expect(screen.getByText('CineStream')).toBeInTheDocument()
    })
  })
})

