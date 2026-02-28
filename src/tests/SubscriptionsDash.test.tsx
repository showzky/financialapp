import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { SubscriptionsDash } from '@/pages/SubscriptionsDash'
import { subscriptionApi } from '@/services/subscriptionApi'
import { trackEvent } from '@/services/telemetry'
import type { Subscription } from '@/types/subscription'

vi.mock('@/services/subscriptionApi', () => ({
  subscriptionApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleStatus: vi.fn(),
  },
}))

vi.mock('@/services/telemetry', () => ({
  trackEvent: vi.fn(),
}))

const mockedList = vi.mocked(subscriptionApi.list)
const mockedCreate = vi.mocked(subscriptionApi.create)
const mockedUpdate = vi.mocked(subscriptionApi.update)
const mockedDelete = vi.mocked(subscriptionApi.delete)
const mockedToggleStatus = vi.mocked(subscriptionApi.toggleStatus)
const mockedTrackEvent = vi.mocked(trackEvent)

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

const toIsoLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('SubscriptionsDash loading and error flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedCreate.mockImplementation(async (payload) => ({
      id: 'sub-created',
      name: payload.name,
      provider: payload.provider,
      category: payload.category,
      status: payload.status,
      cadence: payload.cadence,
      priceCents: payload.priceCents,
      nextRenewalDate: payload.nextRenewalDate,
      notes: payload.notes ?? undefined,
    }))
    mockedUpdate.mockImplementation(async (id, payload) => ({
      id,
      name: payload.name ?? 'CineStream',
      provider: payload.provider ?? 'CineStream',
      category: payload.category ?? 'streaming',
      status: payload.status ?? 'active',
      cadence: payload.cadence ?? 'monthly',
      priceCents: payload.priceCents ?? 12900,
      nextRenewalDate: payload.nextRenewalDate ?? '2026-03-05',
      notes: payload.notes ?? undefined,
    }))
    mockedDelete.mockResolvedValue(undefined)
    mockedToggleStatus.mockImplementation(async (id, payload) => {
      const original = sampleRows.find((row) => row.id === id) ?? sampleRows[0]
      return {
        ...original,
        status: payload.status,
      }
    })
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
    expect(screen.getByRole('heading', { name: 'Subscription overview' })).toBeInTheDocument()
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscriptions_load_success', { count: 2 })

    // scanning sweep used to live at the top of this page; ensure it's gone
    expect(document.querySelector('.animate-scan')).toBeNull()
  })

  it('renders summary cards with derived metrics from active subscriptions only', async () => {
    const rows: Subscription[] = [
      {
        id: 'sub-1',
        name: 'CineStream',
        provider: 'CineStream',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 12900,
        nextRenewalDate: '2026-03-12',
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
        name: 'Design Cloud',
        provider: 'Creative Inc',
        category: 'design',
        status: 'active',
        cadence: 'yearly',
        priceCents: 120000,
        nextRenewalDate: '2026-03-25',
      },
    ]
    mockedList.mockResolvedValueOnce(rows)

    render(<SubscriptionsDash />)

    const summaryHeading = screen.getByRole('heading', { name: 'Subscription overview' })
    const summarySection = summaryHeading.closest('section')
    expect(summarySection).not.toBeNull()

    await waitFor(() => {
      expect(within(summarySection as HTMLElement).getByText(/229(?:[.,]00)?/)).toBeInTheDocument()
    })

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText('67% services active')).toBeInTheDocument()
    expect(screen.getByText('from active subscriptions')).toBeInTheDocument()
  })

  it('shows earliest active renewal date and today helper for next billing', async () => {
    const today = new Date()
    const todayIso = toIsoLocalDate(today)
    const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
    const nextWeekIso = toIsoLocalDate(nextWeek)

    const rows: Subscription[] = [
      {
        id: 'sub-1',
        name: 'CineStream',
        provider: 'CineStream',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 12900,
        nextRenewalDate: todayIso,
      },
      {
        id: 'sub-2',
        name: 'Gym Access',
        provider: 'IronWorks',
        category: 'fitness',
        status: 'active',
        cadence: 'monthly',
        priceCents: 34900,
        nextRenewalDate: nextWeekIso,
      },
    ]

    mockedList.mockResolvedValueOnce(rows)
    render(<SubscriptionsDash />)

    const expectedTodayLabel = new Intl.DateTimeFormat(navigator.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    const summaryHeading = screen.getByRole('heading', { name: 'Subscription overview' })
    const summarySection = summaryHeading.closest('section')
    expect(summarySection).not.toBeNull()

    await waitFor(() => {
      expect(within(summarySection as HTMLElement).getByText(expectedTodayLabel)).toBeInTheDocument()
    })

    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('shows estimated yearly spend for active and paused subscriptions', async () => {
    mockedList.mockResolvedValueOnce([
      {
        id: 'sub-1',
        name: 'Work Suite',
        provider: 'Work Suite',
        category: 'productivity',
        status: 'active',
        cadence: 'monthly',
        priceCents: 62900,
        nextRenewalDate: '2026-03-01',
      },
      {
        id: 'sub-2',
        name: 'Annual Vault',
        provider: 'Annual Vault',
        category: 'storage',
        status: 'paused',
        cadence: 'yearly',
        priceCents: 300000,
        nextRenewalDate: '2026-06-01',
      },
      {
        id: 'sub-3',
        name: 'Canceled Mega',
        provider: 'Canceled Mega',
        category: 'misc',
        status: 'canceled',
        cadence: 'monthly',
        priceCents: 999999,
        nextRenewalDate: '2026-03-12',
      },
    ])

    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('Estimated yearly spend')).toBeInTheDocument()
    })

    // Expected yearly: monthly 629 * 12 + yearly 3000 = 10548 (canceled excluded)
    const spendSection = screen.getByLabelText('Subscription spend overview')
    expect(within(spendSection).getAllByText(/10[,\s\u00a0]?548/).length).toBeGreaterThan(0)
    expect(within(spendSection).getByText(/Active \+ paused subscriptions/i)).toBeInTheDocument()
  })

  it('counts renewals in the next 7 days inclusive and ignores invalid dates', async () => {
    const today = new Date()
    const todayIso = toIsoLocalDate(today)
    const sevenDays = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
    const sevenDaysIso = toIsoLocalDate(sevenDays)
    const eightDays = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8)
    const eightDaysIso = toIsoLocalDate(eightDays)

    mockedList.mockResolvedValueOnce([
      {
        id: 'sub-1',
        name: 'Today Renewal',
        provider: 'Today Renewal',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 1000,
        nextRenewalDate: todayIso,
      },
      {
        id: 'sub-2',
        name: 'Seven Days',
        provider: 'Seven Days',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 1000,
        nextRenewalDate: sevenDaysIso,
      },
      {
        id: 'sub-3',
        name: 'Eight Days',
        provider: 'Eight Days',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 1000,
        nextRenewalDate: eightDaysIso,
      },
      {
        id: 'sub-4',
        name: 'Invalid',
        provider: 'Invalid',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 1000,
        nextRenewalDate: 'not-a-date',
      },
    ])

    render(<SubscriptionsDash />)

    await waitFor(() => {
      const pill = screen.getByText('Renewals next 7 days').closest('div')
      expect(pill).not.toBeNull()
      expect(within(pill as HTMLElement).getByText('2')).toBeInTheDocument()
    })
  })

  it('counts renewals when next renewal includes a timestamp', async () => {
    const today = new Date()
    const within7 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 22, 0, 0)
    const within7Iso = within7.toISOString()

    mockedList.mockResolvedValueOnce([
      {
        id: 'sub-1',
        name: 'Timestamped Renewal',
        provider: 'Timestamped Renewal',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 1000,
        nextRenewalDate: within7Iso,
      },
    ])

    render(<SubscriptionsDash />)

    await waitFor(() => {
      const pill = screen.getByText('Renewals next 7 days').closest('div')
      expect(pill).not.toBeNull()
      expect(within(pill as HTMLElement).getByText('1')).toBeInTheDocument()
    })
  })

  it('computes most expensive using monthly-equivalent and excludes canceled', async () => {
    mockedList.mockResolvedValueOnce([
      {
        id: 'sub-1',
        name: 'Basic',
        provider: 'Basic',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 10000,
        nextRenewalDate: '2026-03-05',
      },
      {
        id: 'sub-2',
        name: 'Annual Plus',
        provider: 'Annual Plus',
        category: 'tools',
        status: 'paused',
        cadence: 'yearly',
        priceCents: 240000,
        nextRenewalDate: '2026-03-10',
      },
      {
        id: 'sub-3',
        name: 'Canceled Mega',
        provider: 'Canceled Mega',
        category: 'misc',
        status: 'canceled',
        cadence: 'monthly',
        priceCents: 99999999,
        nextRenewalDate: '2026-03-12',
      },
    ])

    render(<SubscriptionsDash />)

    await waitFor(() => {
      const pill = screen.getByText('Most expensive').closest('div')
      expect(pill).not.toBeNull()
      expect(within(pill as HTMLElement).getByText(/200/)).toBeInTheDocument()
    })
  })

  it('shows load error when list call fails', async () => {
    mockedList.mockRejectedValueOnce(new Error('HUD Alert: Failed to fetch subscriptions'))

    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('HUD Alert: Failed to fetch subscriptions')).toBeInTheDocument()
    })
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByText('data unavailable').length).toBeGreaterThanOrEqual(3)
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscriptions_load_error', {
      message: 'HUD Alert: Failed to fetch subscriptions',
    })
  })

  it('shows empty-state values in summary cards when there are no subscriptions', async () => {
    mockedList.mockResolvedValueOnce([])
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('No subscriptions yet. Add your first subscription.')).toBeInTheDocument()
    })

    expect(screen.getByText('0 / 0')).toBeInTheDocument()
    expect(screen.getByText('No upcoming billing')).toBeInTheDocument()
    expect(screen.getByText('0% services active')).toBeInTheDocument()
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

  it('shows pagination controls when a successful load has many subscriptions', async () => {
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

    mockedList.mockResolvedValueOnce(manyRows)

    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('Page 1 / 2')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument()
  })

  it('opens confirm modal on delete and keeps row until confirmed', async () => {
    mockedList.mockResolvedValueOnce(sampleRows)
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('CineStream')).toBeInTheDocument()
    })

    const cineRow = screen.getByText('CineStream').closest('tr')
    expect(cineRow).not.toBeNull()
    fireEvent.click(within(cineRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }))

    expect(screen.getByText('Delete subscription?')).toBeInTheDocument()
    expect(screen.getByText('CineStream')).toBeInTheDocument()

    const confirmDialog = screen.getByRole('dialog', { name: 'Delete subscription?' })
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Delete subscription?')).not.toBeInTheDocument()
    expect(screen.getByText('CineStream')).toBeInTheDocument()
  })

  it('deletes only after confirmation and shows delete toast', async () => {
    mockedList.mockResolvedValueOnce(sampleRows)
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('CineStream')).toBeInTheDocument()
    })

    const cineRow = screen.getByText('CineStream').closest('tr')
    expect(cineRow).not.toBeNull()
    fireEvent.click(within(cineRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }))
    const confirmDialog = screen.getByRole('dialog', { name: 'Delete subscription?' })
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.queryByText('CineStream')).not.toBeInTheDocument()
    })

    expect(mockedDelete).toHaveBeenCalledWith('sub-1')
    expect(screen.getByText('Subscription deleted')).toBeInTheDocument()
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscription_delete_success', { id: 'sub-1' })
  })

  it('shows pause and activate toast messages', async () => {
    mockedList.mockResolvedValueOnce(sampleRows)
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('Gym Access')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await waitFor(() => {
      expect(mockedToggleStatus).toHaveBeenCalledWith('sub-1', { status: 'paused' })
    })
    expect(screen.getByText('Status changed to paused')).toBeInTheDocument()
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscription_toggle_success', {
      id: 'sub-1',
      nextStatus: 'paused',
    })

    const gymRow = screen.getByText('Gym Access').closest('tr')
    expect(gymRow).not.toBeNull()
    fireEvent.click(within(gymRow as HTMLTableRowElement).getByRole('button', { name: 'Activate' }))
    await waitFor(() => {
      expect(mockedToggleStatus).toHaveBeenCalledWith('sub-2', { status: 'active' })
    })
    expect(screen.getByText('Status changed to active')).toBeInTheDocument()
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscription_toggle_success', {
      id: 'sub-2',
      nextStatus: 'active',
    })
  })

  it('shows update toast when editing a subscription', async () => {
    mockedList.mockResolvedValueOnce(sampleRows)
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('CineStream')).toBeInTheDocument()
    })

    const cineRow = screen.getByText('CineStream').closest('tr')
    expect(cineRow).not.toBeNull()
    fireEvent.click(within(cineRow as HTMLTableRowElement).getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'CineStream Plus' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(screen.getByText('Subscription updated')).toBeInTheDocument()
    })
    expect(mockedUpdate).toHaveBeenCalledWith('sub-1', expect.objectContaining({ name: 'CineStream Plus' }))
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscription_update_success', { id: 'sub-1' })
  })

  it('shows add toast and does not render the old hud alert banner', async () => {
    mockedList.mockResolvedValueOnce(sampleRows)
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('Gym Access')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add subscription' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Cloud Vault' } })
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'Vault Corp' } })
    fireEvent.change(screen.getByLabelText('Price (KR)'), { target: { value: '99' } })
    const saveForm = screen.getByLabelText('Name').closest('form')
    expect(saveForm).not.toBeNull()
    fireEvent.click(within(saveForm as HTMLFormElement).getByRole('button', { name: 'Add subscription' }))

    await waitFor(() => {
      expect(screen.getByText('Subscription added')).toBeInTheDocument()
    })

    expect(mockedCreate).toHaveBeenCalled()
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscription_create_success', { id: 'sub-created' })
    expect(screen.queryByText(/HUD Alert:/i)).not.toBeInTheDocument()
  })

  it('keeps delete modal open and shows error toast when delete fails', async () => {
    mockedList.mockResolvedValueOnce(sampleRows)
    mockedDelete.mockRejectedValueOnce(new Error('Failed to delete'))
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('CineStream')).toBeInTheDocument()
    })

    const cineRow = screen.getByText('CineStream').closest('tr')
    expect(cineRow).not.toBeNull()
    fireEvent.click(within(cineRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }))

    const confirmDialog = screen.getByRole('dialog', { name: 'Delete subscription?' })
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByText('Failed to delete')).toBeInTheDocument()
    })

    expect(screen.getByRole('dialog', { name: 'Delete subscription?' })).toBeInTheDocument()
    expect(screen.getByText('CineStream')).toBeInTheDocument()
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscription_delete_error', {
      id: 'sub-1',
      message: 'Failed to delete',
    })
  })

  it('keeps modal open and surfaces save errors when create fails', async () => {
    mockedList.mockResolvedValueOnce(sampleRows)
    mockedCreate.mockRejectedValueOnce(new Error('Connection failed, try again'))
    render(<SubscriptionsDash />)

    await waitFor(() => {
      expect(screen.getByText('Gym Access')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add subscription' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Cloud Vault' } })
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'Vault Corp' } })
    fireEvent.change(screen.getByLabelText('Price (KR)'), { target: { value: '99' } })

    const saveForm = screen.getByLabelText('Name').closest('form')
    expect(saveForm).not.toBeNull()
    fireEvent.click(within(saveForm as HTMLFormElement).getByRole('button', { name: 'Add subscription' }))

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0]).toHaveTextContent('Connection failed, try again')
    })

    expect(screen.getByRole('button', { name: 'Close subscription modal' })).toBeInTheDocument()
    expect(screen.getByText('Subscription node')).toBeInTheDocument()
    expect(mockedTrackEvent).toHaveBeenCalledWith('subscription_create_error', {
      message: 'Connection failed, try again',
    })
  })
})
