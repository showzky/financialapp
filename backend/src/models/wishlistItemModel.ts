import { db } from '../config/db.js'

export type WishlistItem = {
  id: string
  userId: string
  title: string
  url: string
  normalizedUrl: string
  price: number | null
  imageUrl: string
  category: string
  notes: string | null
  priority: 'High' | 'Medium' | 'Low'
  status: 'active' | 'purchased'
  purchasedAt: string | null
  purchasedAmount: number | null
  savedAmount: number
  metadataStatus: 'fresh' | 'stale' | 'unknown'
  metadataLastCheckedAt: string | null
  metadataLastSuccessAt: string | null
  latestTrackedPrice: number | null
  previousTrackedPrice: number | null
  priceTrendDirection: 'up' | 'down' | 'flat' | 'unknown'
  priceTrendPercent: number | null
  createdAt: string
  updatedAt: string
}

export type CreateWishlistItemInput = {
  userId: string
  title: string
  url: string
  normalizedUrl: string
  price: number | null
  imageUrl?: string
  category?: string
  notes?: string | null
  priority?: 'High' | 'Medium' | 'Low'
  savedAmount?: number
}

export type UpdateWishlistItemInput = {
  title?: string | undefined
  url?: string | undefined
  normalizedUrl?: string | undefined
  price?: number | null | undefined
  imageUrl?: string | undefined
  category?: string | undefined
  notes?: string | null | undefined
  priority?: 'High' | 'Medium' | 'Low' | undefined
  savedAmount?: number | undefined
}

const wishlistSelect = `
  id,
  user_id AS "userId",
  title,
  url,
  normalized_url AS "normalizedUrl",
  price::float8 AS price,
  image_url AS "imageUrl",
  category,
  notes,
  priority,
  status,
  purchased_at AS "purchasedAt",
  purchased_amount::float8 AS "purchasedAmount",
  saved_amount::float8 AS "savedAmount",
  metadata_status AS "metadataStatus",
  metadata_last_checked_at AS "metadataLastCheckedAt",
  metadata_last_success_at AS "metadataLastSuccessAt",
  price::float8 AS "latestTrackedPrice",
  NULL::float8 AS "previousTrackedPrice",
  'unknown'::text AS "priceTrendDirection",
  NULL::float8 AS "priceTrendPercent",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

const wishlistSelectWithTrend = `
  wi.id,
  wi.user_id AS "userId",
  wi.title,
  wi.url,
  wi.normalized_url AS "normalizedUrl",
  wi.price::float8 AS price,
  wi.image_url AS "imageUrl",
  wi.category,
  wi.notes,
  wi.priority,
  wi.status,
  wi.purchased_at AS "purchasedAt",
  wi.purchased_amount::float8 AS "purchasedAmount",
  wi.saved_amount::float8 AS "savedAmount",
  wi.metadata_status AS "metadataStatus",
  wi.metadata_last_checked_at AS "metadataLastCheckedAt",
  wi.metadata_last_success_at AS "metadataLastSuccessAt",
  COALESCE(trend.latest_price, wi.price::float8) AS "latestTrackedPrice",
  trend.previous_price AS "previousTrackedPrice",
  CASE
    WHEN trend.previous_price IS NULL OR COALESCE(trend.latest_price, wi.price::float8) IS NULL THEN 'unknown'
    WHEN COALESCE(trend.latest_price, wi.price::float8) > trend.previous_price THEN 'up'
    WHEN COALESCE(trend.latest_price, wi.price::float8) < trend.previous_price THEN 'down'
    ELSE 'flat'
  END AS "priceTrendDirection",
  CASE
    WHEN trend.previous_price IS NULL
      OR trend.previous_price = 0
      OR COALESCE(trend.latest_price, wi.price::float8) IS NULL THEN NULL
    ELSE ROUND(
      ((COALESCE(trend.latest_price, wi.price::float8)::numeric - trend.previous_price::numeric)
      / trend.previous_price::numeric) * 100,
      2
    )::float8
  END AS "priceTrendPercent",
  wi.created_at AS "createdAt",
  wi.updated_at AS "updatedAt"
`

const trendJoinSql = `
  LEFT JOIN LATERAL (
    SELECT
      MAX(CASE WHEN ranked.rn = 1 THEN ranked.price END)::float8 AS latest_price,
      MAX(CASE WHEN ranked.rn = 2 THEN ranked.price END)::float8 AS previous_price
    FROM (
      SELECT
        snapshot.price,
        ROW_NUMBER() OVER (ORDER BY snapshot.captured_at DESC, snapshot.id DESC) AS rn
      FROM wishlist_price_snapshots snapshot
      WHERE snapshot.wishlist_item_id = wi.id
    ) ranked
    WHERE ranked.rn <= 2
  ) trend ON TRUE
`

export const wishlistItemModel = {
  async findByNormalizedUrl(
    userId: string,
    normalizedUrl: string,
    excludeId?: string,
  ): Promise<WishlistItem | null> {
    if (excludeId) {
      const result = await db.query<WishlistItem>(
        `
        SELECT ${wishlistSelect}
        FROM wishlist_items
        WHERE user_id = $1
          AND normalized_url = $2
          AND status = 'active'
          AND id <> $3
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [userId, normalizedUrl, excludeId],
      )

      return result.rows[0] ?? null
    }

    const result = await db.query<WishlistItem>(
      `
      SELECT ${wishlistSelect}
      FROM wishlist_items
      WHERE user_id = $1
        AND normalized_url = $2
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId, normalizedUrl],
    )

    return result.rows[0] ?? null
  },

  async create(input: CreateWishlistItemInput): Promise<WishlistItem> {
    const result = await db.query<WishlistItem>(
      `
      INSERT INTO wishlist_items (
        user_id,
        title,
        url,
        normalized_url,
        price,
        image_url,
        category,
        notes,
        priority,
        saved_amount,
        metadata_status,
        metadata_last_checked_at,
        metadata_last_success_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'fresh', NOW(), NOW())
      RETURNING ${wishlistSelect}
      `,
      [
        input.userId,
        input.title,
        input.url,
        input.normalizedUrl,
        input.price,
        input.imageUrl ?? '',
        input.category ?? '',
        input.notes ?? null,
        input.priority ?? 'Medium',
        input.savedAmount ?? 0,
      ],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create wishlist item')
    }

    return row
  },

  async listByUser(userId: string): Promise<WishlistItem[]> {
    const result = await db.query<WishlistItem>(
      `
      SELECT ${wishlistSelectWithTrend}
      FROM wishlist_items wi
      ${trendJoinSql}
      WHERE wi.user_id = $1
      ORDER BY wi.created_at DESC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<WishlistItem | null> {
    const result = await db.query<WishlistItem>(
      `
      SELECT ${wishlistSelect}
      FROM wishlist_items
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async update(
    id: string,
    userId: string,
    input: UpdateWishlistItemInput,
  ): Promise<WishlistItem | null> {
    const hasPriceUpdate = input.price !== undefined
    const hasNotesUpdate = input.notes !== undefined
    const shouldRefreshMetadata =
      input.title !== undefined ||
      input.url !== undefined ||
      hasPriceUpdate ||
      input.imageUrl !== undefined

    const result = await db.query<WishlistItem>(
      `
      UPDATE wishlist_items
      SET
        title = COALESCE($3, title),
        url = COALESCE($4, url),
        normalized_url = COALESCE($11, normalized_url),
        price = CASE WHEN $9 THEN $5 ELSE price END,
        image_url = COALESCE($6, image_url),
        category = COALESCE($7, category),
        priority = COALESCE($8, priority),
        saved_amount = COALESCE($10, saved_amount),
        notes = CASE WHEN $13 THEN $12 ELSE notes END,
        metadata_status = CASE WHEN $14 THEN 'fresh' ELSE metadata_status END,
        metadata_last_checked_at = CASE WHEN $14 THEN NOW() ELSE metadata_last_checked_at END,
        metadata_last_success_at = CASE WHEN $14 THEN NOW() ELSE metadata_last_success_at END,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${wishlistSelect}
      `,
      [
        id,
        userId,
        input.title ?? null,
        input.url ?? null,
        input.price === undefined ? null : input.price,
        input.imageUrl ?? null,
        input.category ?? null,
        input.priority ?? null,
        hasPriceUpdate,
        input.savedAmount ?? null,
        input.normalizedUrl ?? null,
        input.notes === undefined ? null : input.notes,
        hasNotesUpdate,
        shouldRefreshMetadata,
      ],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM wishlist_items
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },

  async markPurchased(
    id: string,
    userId: string,
    purchasedAmount: number,
  ): Promise<WishlistItem | null> {
    const result = await db.query<WishlistItem>(
      `
      UPDATE wishlist_items
      SET
        status = 'purchased',
        purchased_at = COALESCE(purchased_at, NOW()),
        purchased_amount = $3,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${wishlistSelect}
      `,
      [id, userId, purchasedAmount],
    )

    return result.rows[0] ?? null
  },

  async restorePurchased(id: string, userId: string): Promise<WishlistItem | null> {
    const result = await db.query<WishlistItem>(
      `
      UPDATE wishlist_items
      SET
        status = 'active',
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${wishlistSelect}
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },
}
