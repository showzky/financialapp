import { describe, it, expect, vi, beforeEach } from 'vitest'
import { subscriptionApi } from '@/services/subscriptionApi'
import { backendRequest } from '@/services/backendClient'

vi.mock('@/services/backendClient', () => ({
  backendRequest: vi.fn(),
}))

const mockedBackendRequest = vi.mocked(backendRequest)

describe('subscriptionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps list response and applies safe fallback for unknown status/cadence', async () => {
    mockedBackendRequest.mockResolvedValueOnce([
      {
        id: 'sub-1',
        name: 'CineStream',
        provider: 'CineStream',
        category: 'streaming',
        status: 'unknown-status',
        cadence: 'strange-cadence',
        priceCents: 1000,
        nextRenewalDate: '2026-03-05',
        notes: null,
      },
    ])

    const rows = await subscriptionApi.list()

    expect(mockedBackendRequest).toHaveBeenCalledWith('/subscriptions')
    expect(rows[0]).toMatchObject({
      status: 'active',
      cadence: 'monthly',
      notes: undefined,
    })
  })

  it('calls create endpoint with POST payload', async () => {
    mockedBackendRequest.mockResolvedValueOnce({
      id: 'sub-2',
      name: 'Cloud Vault',
      provider: 'Vault Corp',
      category: 'storage',
      status: 'active',
      cadence: 'monthly',
      priceCents: 9900,
      nextRenewalDate: '2026-04-01',
      notes: null,
    })

    await subscriptionApi.create({
      name: 'Cloud Vault',
      provider: 'Vault Corp',
      category: 'storage',
      status: 'active',
      cadence: 'monthly',
      priceCents: 9900,
      nextRenewalDate: '2026-04-01',
      notes: null,
    })

    expect(mockedBackendRequest).toHaveBeenCalledWith('/subscriptions', {
      method: 'POST',
      body: expect.any(String),
    })
  })

  it('encodes id for update/delete/toggle paths', async () => {
    const rawId = 'sub/with space?'
    const safeId = encodeURIComponent(rawId)

    mockedBackendRequest
      .mockResolvedValueOnce({
        id: rawId,
        name: 'A',
        provider: 'B',
        category: 'C',
        status: 'active',
        cadence: 'monthly',
        priceCents: 100,
        nextRenewalDate: '2026-01-01',
      })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: rawId,
        name: 'A',
        provider: 'B',
        category: 'C',
        status: 'paused',
        cadence: 'monthly',
        priceCents: 100,
        nextRenewalDate: '2026-01-01',
      })

    await subscriptionApi.update(rawId, { name: 'Updated' })
    await subscriptionApi.delete(rawId)
    await subscriptionApi.toggleStatus(rawId, { status: 'paused' })

    expect(mockedBackendRequest).toHaveBeenNthCalledWith(1, `/subscriptions/${safeId}`, {
      method: 'PATCH',
      body: expect.any(String),
    })
    expect(mockedBackendRequest).toHaveBeenNthCalledWith(2, `/subscriptions/${safeId}`, {
      method: 'DELETE',
    })
    expect(mockedBackendRequest).toHaveBeenNthCalledWith(3, `/subscriptions/${safeId}/toggle-status`, {
      method: 'PATCH',
      body: expect.any(String),
    })
  })
})
