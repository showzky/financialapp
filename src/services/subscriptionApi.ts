import { backendRequest } from '@/services/backendClient'
import type { Subscription, BillingCadence, SubscriptionStatus } from '@/components/subscriptions/SubscriptionLedger'

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
}

