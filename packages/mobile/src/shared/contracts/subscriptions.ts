export type BillingCadence = 'monthly' | 'yearly'

export type SubscriptionStatus = 'active' | 'paused' | 'canceled'

export type Subscription = {
  id: string
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: BillingCadence
  priceCents: number
  nextRenewalDate: string
  // optional alternative billing date present in some data flows
  nextBillingDate?: string
  notes?: string
}

export type CreateSubscriptionPayload = {
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: BillingCadence
  priceCents: number
  nextRenewalDate: string
  nextBillingDate?: string
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
  nextBillingDate?: string
  notes?: string | null
}

export type ToggleSubscriptionStatusPayload = {
  status: SubscriptionStatus
}