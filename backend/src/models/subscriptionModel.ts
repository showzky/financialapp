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

export type CreateSubscriptionInput = {
  userId: string
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: BillingCadence
  priceCents: number
  nextRenewalDate: string
  notes?: string | null
}

export type UpdateSubscriptionInput = {
  name?: string | undefined
  provider?: string | undefined
  category?: string | undefined
  status?: SubscriptionStatus | undefined
  cadence?: BillingCadence | undefined
  priceCents?: number | undefined
  nextRenewalDate?: string | undefined
  notes?: string | null | undefined
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

  async getById(id: string, userId: string): Promise<Subscription | null> {
    const result = await db.query<Subscription>(
      `
      SELECT ${subscriptionSelect}
      FROM subscriptions
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const result = await db.query<Subscription>(
      `
      INSERT INTO subscriptions (
        user_id,
        name,
        provider,
        category,
        status,
        cadence,
        price_cents,
        next_renewal_date,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${subscriptionSelect}
      `,
      [
        input.userId,
        input.name,
        input.provider,
        input.category,
        input.status,
        input.cadence,
        input.priceCents,
        input.nextRenewalDate,
        input.notes ?? null,
      ],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create subscription')
    }

    return row
  },

  async update(id: string, userId: string, input: UpdateSubscriptionInput): Promise<Subscription | null> {
    const hasPriceUpdate = input.priceCents !== undefined
    const hasNotesUpdate = input.notes !== undefined

    const result = await db.query<Subscription>(
      `
      UPDATE subscriptions
      SET
        name = COALESCE($3, name),
        provider = COALESCE($4, provider),
        category = COALESCE($5, category),
        status = COALESCE($6, status),
        cadence = COALESCE($7, cadence),
        price_cents = CASE WHEN $8 THEN $9 ELSE price_cents END,
        next_renewal_date = COALESCE($10, next_renewal_date),
        notes = CASE WHEN $11 THEN $12 ELSE notes END,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${subscriptionSelect}
      `,
      [
        id,
        userId,
        input.name ?? null,
        input.provider ?? null,
        input.category ?? null,
        input.status ?? null,
        input.cadence ?? null,
        hasPriceUpdate,
        input.priceCents ?? null,
        input.nextRenewalDate ?? null,
        hasNotesUpdate,
        input.notes ?? null,
      ],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM subscriptions
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },

  async toggleStatus(
    id: string,
    userId: string,
    status: SubscriptionStatus,
  ): Promise<Subscription | null> {
    const result = await db.query<Subscription>(
      `
      UPDATE subscriptions
      SET
        status = $3,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${subscriptionSelect}
      `,
      [id, userId, status],
    )

    return result.rows[0] ?? null
  },
}

