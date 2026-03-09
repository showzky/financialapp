import { backendClient } from './backendClient'
import type {
  BillingCadence,
  CreateSubscriptionPayload,
  Subscription,
  SubscriptionStatus,
  ToggleSubscriptionStatusPayload,
  UpdateSubscriptionPayload,
} from '../shared/contracts/subscriptions'

export type {
  BillingCadence,
  CreateSubscriptionPayload,
  Subscription,
  SubscriptionStatus,
  ToggleSubscriptionStatusPayload,
  UpdateSubscriptionPayload,
} from '../shared/contracts/subscriptions'

type SubscriptionDto = {
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

const isValidStatus = (value: string): value is SubscriptionStatus =>
  value === 'active' || value === 'paused' || value === 'canceled'

const isValidCadence = (value: string): value is BillingCadence =>
  value === 'monthly' || value === 'yearly'

const toSubscription = (dto: SubscriptionDto): Subscription => ({
  id: dto.id,
  name: dto.name,
  provider: dto.provider,
  category: dto.category,
  status: isValidStatus(dto.status) ? dto.status : 'active',
  cadence: isValidCadence(dto.cadence) ? dto.cadence : 'monthly',
  priceCents: dto.priceCents,
  nextRenewalDate: dto.nextRenewalDate,
  notes: dto.notes ?? undefined,
})

export const subscriptionApi = {
  list: async () => {
    const rows = await backendClient.get<SubscriptionDto[]>('/subscriptions')
    return rows.map(toSubscription)
  },

  create: async (payload: CreateSubscriptionPayload) => {
    const row = await backendClient.post<SubscriptionDto>('/subscriptions', payload)
    return toSubscription(row)
  },

  update: async (id: string, payload: UpdateSubscriptionPayload) => {
    const safeId = encodeURIComponent(id)
    const row = await backendClient.patch<SubscriptionDto>(`/subscriptions/${safeId}`, payload)
    return toSubscription(row)
  },

  toggleStatus: async (id: string, payload: ToggleSubscriptionStatusPayload) => {
    const safeId = encodeURIComponent(id)
    const row = await backendClient.patch<SubscriptionDto>(
      `/subscriptions/${safeId}/toggle-status`,
      payload,
    )
    return toSubscription(row)
  },

  remove: async (id: string) => {
    const safeId = encodeURIComponent(id)
    await backendClient.delete(`/subscriptions/${safeId}`)
  },
}