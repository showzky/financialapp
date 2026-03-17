import { db } from '../config/db.js'

export type AccountCategory = {
  id: string
  userId: string
  name: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const DEFAULT_CATEGORY_NAME = 'Bills'

export const accountCategoryModel = {
  async ensureDefault(userId: string): Promise<void> {
    const result = await db.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM account_categories
      WHERE user_id = $1
      `,
      [userId],
    )

    const count = Number(result.rows[0]?.count ?? '0')
    if (count > 0) {
      return
    }

    await db.query(
      `
      INSERT INTO account_categories (user_id, name, sort_order)
      VALUES ($1, $2, 0)
      ON CONFLICT (user_id, name) DO NOTHING
      `,
      [userId, DEFAULT_CATEGORY_NAME],
    )
  },

  async listByUser(userId: string): Promise<AccountCategory[]> {
    await this.ensureDefault(userId)

    const result = await db.query<AccountCategory>(
      `
      SELECT
        id,
        user_id AS "userId",
        name,
        sort_order AS "sortOrder",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM account_categories
      WHERE user_id = $1
      ORDER BY sort_order ASC, created_at ASC
      `,
      [userId],
    )

    return result.rows
  },

  async create(userId: string, name: string): Promise<AccountCategory> {
    const result = await db.query<AccountCategory>(
      `
      INSERT INTO account_categories (user_id, name, sort_order)
      VALUES (
        $1,
        $2,
        COALESCE(
          (
            SELECT MAX(sort_order) + 1
            FROM account_categories
            WHERE user_id = $1
          ),
          0
        )
      )
      RETURNING
        id,
        user_id AS "userId",
        name,
        sort_order AS "sortOrder",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [userId, name],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create account category')
    }

    return row
  },

  async rename(id: string, userId: string, name: string): Promise<AccountCategory | null> {
    const result = await db.query<AccountCategory>(
      `
      UPDATE account_categories
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING
        id,
        user_id AS "userId",
        name,
        sort_order AS "sortOrder",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [name, id, userId],
    )

    return result.rows[0] ?? null
  },

  async moveToBottom(id: string, userId: string): Promise<AccountCategory | null> {
    const result = await db.query<AccountCategory>(
      `
      UPDATE account_categories
      SET
        sort_order = COALESCE(
          (SELECT MAX(sort_order) + 1 FROM account_categories WHERE user_id = $2),
          0
        ),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        name,
        sort_order AS "sortOrder",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },
}
