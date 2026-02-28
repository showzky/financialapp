import { backendRequest } from '@/services/backendClient'
import type { Subscription, BillingCadence, SubscriptionStatus } from '@/types/subscription'

export type SubscriptionDto = {
  id: string
  name: string
  provider: string
  category: string
  status: SubscriptionStatus | string
  cadence: BillingCadence | string
  priceCents: number
  nextRenewalDate: string
  notes?: string | null
}

export type CreateSubscriptionPayload = {
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: BillingCadence
  priceCents: number
  nextRenewalDate: string
  notes?: string | null
}

export type UpdateSubscriptionPayload = {
  name?: string
  provider?: string
  category?: string
  status?: SubscriptionStatus
  cadence?: BillingCadence
  priceCents?: number
  nextRenewalDate?: string
  notes?: string | null
}

export type ToggleSubscriptionStatusPayload = {
  status: SubscriptionStatus
}

const isValidStatus = (value: string): value is SubscriptionStatus =>
  value === 'active' || value === 'paused' || value === 'canceled'

const isValidCadence = (value: string): value is BillingCadence =>
  value === 'monthly' || value === 'yearly'

const toSubscription = (dto: SubscriptionDto): Subscription => {
  const status = isValidStatus(dto.status) ? dto.status : 'active'
  const cadence = isValidCadence(dto.cadence) ? dto.cadence : 'monthly'

  return {
    id: dto.id,
    name: dto.name,
    provider: dto.provider,
    category: dto.category,
    status,
    cadence,
    priceCents: dto.priceCents,
    nextRenewalDate: dto.nextRenewalDate,
    notes: dto.notes ?? undefined,
  }
}

export const subscriptionApi = {
  list: async (): Promise<Subscription[]> => {
    const rows = await backendRequest<SubscriptionDto[]>('/subscriptions')
    return rows.map(toSubscription)
  },

  create: async (payload: CreateSubscriptionPayload): Promise<Subscription> => {
    const row = await backendRequest<SubscriptionDto>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return toSubscription(row)
  },

  update: async (id: string, payload: UpdateSubscriptionPayload): Promise<Subscription> => {
    const safeId = encodeURIComponent(id)
    const row = await backendRequest<SubscriptionDto>(`/subscriptions/${safeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return toSubscription(row)
  },

  delete: async (id: string): Promise<void> => {
    const safeId = encodeURIComponent(id)
    await backendRequest<void>(`/subscriptions/${safeId}`, {
      method: 'DELETE',
    })
  },

  toggleStatus: async (
    id: string,
    payload: ToggleSubscriptionStatusPayload,
  ): Promise<Subscription> => {
    const safeId = encodeURIComponent(id)
    const row = await backendRequest<SubscriptionDto>(`/subscriptions/${safeId}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return toSubscription(row)
  },
}

