import { db } from '../config/db.js'

export type WishlistItem = {
  id: string
  userId: string
  title: string
  url: string
  price: number | null
  imageUrl: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  savedAmount: number
  createdAt: string
  updatedAt: string
}

export type CreateWishlistItemInput = {
  userId: string
  title: string
  url: string
  price: number | null
  imageUrl?: string
  category?: string
  priority?: 'High' | 'Medium' | 'Low'
  savedAmount?: number
}

export type UpdateWishlistItemInput = {
  title?: string | undefined
  url?: string | undefined
  price?: number | null | undefined
  imageUrl?: string | undefined
  category?: string | undefined
  priority?: 'High' | 'Medium' | 'Low' | undefined
  savedAmount?: number | undefined
}

const wishlistSelect = `
  id,
  user_id AS "userId",
  title,
  url,
  price::float8 AS price,
  image_url AS "imageUrl",
  category,
  priority,
  saved_amount::float8 AS "savedAmount",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

export const wishlistItemModel = {
  async create(input: CreateWishlistItemInput): Promise<WishlistItem> {
    const result = await db.query<WishlistItem>(
      `
      INSERT INTO wishlist_items (user_id, title, url, price, image_url, category, priority, saved_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${wishlistSelect}
      `,
      [
        input.userId,
        input.title,
        input.url,
        input.price,
        input.imageUrl ?? '',
        input.category ?? '',
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
      SELECT ${wishlistSelect}
      FROM wishlist_items
      WHERE user_id = $1
      ORDER BY created_at DESC
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

  async update(id: string, userId: string, input: UpdateWishlistItemInput): Promise<WishlistItem | null> {
    const hasPriceUpdate = input.price !== undefined

    const result = await db.query<WishlistItem>(
      `
      UPDATE wishlist_items
      SET
        title = COALESCE($3, title),
        url = COALESCE($4, url),
        price = CASE WHEN $9 THEN $5 ELSE price END,
        image_url = COALESCE($6, image_url),
        category = COALESCE($7, category),
        priority = COALESCE($8, priority),
        saved_amount = COALESCE($10, saved_amount),
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
}
