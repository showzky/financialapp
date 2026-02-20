import { db } from '../config/db.js'

type RecordSnapshotInput = {
  wishlistItemId: string
  userId: string
  price: number
}

type LatestPriceRow = {
  price: number
}

export const wishlistPriceSnapshotModel = {
  async recordSnapshotIfChanged(input: RecordSnapshotInput): Promise<boolean> {
    const latest = await db.query<LatestPriceRow>(
      `
      SELECT price::float8 AS price
      FROM wishlist_price_snapshots
      WHERE wishlist_item_id = $1
      ORDER BY captured_at DESC, id DESC
      LIMIT 1
      `,
      [input.wishlistItemId],
    )

    const latestPrice = latest.rows[0]?.price ?? null
    if (latestPrice !== null && latestPrice === input.price) {
      return false
    }

    await db.query(
      `
      INSERT INTO wishlist_price_snapshots (wishlist_item_id, user_id, price)
      VALUES ($1, $2, $3)
      `,
      [input.wishlistItemId, input.userId, input.price],
    )

    return true
  },
}
