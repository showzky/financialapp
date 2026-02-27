import { db } from '../config/db.js'

export type SubscriptionStatus = 'active' | 'paused' | 'canceled'
export type BillingCadence = 'monthly' | 'yearly'

export type Subscription = {
  id: string
  userId: string
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: BillingCadence
  priceCents: number
  nextRenewalDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

const subscriptionSelect = `
  id,
  user_id AS "userId",
  name,
  provider,
  category,
  status,
  cadence,
  price_cents AS "priceCents",
  next_renewal_date AS "nextRenewalDate",
  notes,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

export const subscriptionModel = {
  async listByUser(userId: string): Promise<Subscription[]> {
    const result = await db.query<Subscription>(
      `
      SELECT ${subscriptionSelect}
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY next_renewal_date ASC, created_at DESC
      `,
      [userId],
    )

    return result.rows
  },
}

