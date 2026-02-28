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
  notes?: string
}
