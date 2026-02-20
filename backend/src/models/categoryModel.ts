// ADD THIS: category data access layer using parameterized SQL
import { randomUUID } from 'node:crypto'
import { db } from '../config/db.js'

export type BudgetCategoryType = 'budget' | 'fixed'

export type BudgetCategory = {
  id: string
  userId: string
  name: string
  type: BudgetCategoryType
  allocated: number
  spent: number
  createdAt: string
}

export type CreateCategoryInput = {
  userId: string
  name: string
  type: BudgetCategoryType
  allocated?: number | undefined
  spent?: number | undefined
}

export type UpdateCategoryInput = {
  name?: string | undefined
  type?: BudgetCategoryType | undefined
  allocated?: number | undefined
  spent?: number | undefined
}

export const categoryModel = {
  async create(input: CreateCategoryInput): Promise<BudgetCategory> {
    const categoryId = randomUUID()

    const result = await db.query<BudgetCategory>(
      `
      INSERT INTO budget_categories (id, user_id, name, type, allocated, spent)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, name)
      DO UPDATE SET
        type = EXCLUDED.type,
        allocated = EXCLUDED.allocated,
        spent = EXCLUDED.spent
      RETURNING
        id,
        user_id AS "userId",
        name,
        type,
        allocated::float8 AS allocated,
        spent::float8 AS spent,
        created_at AS "createdAt"
      `,
      [categoryId, input.userId, input.name, input.type, input.allocated ?? 0, input.spent ?? 0],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create category')
    }

    return row
  },

  async listByUser(userId: string): Promise<BudgetCategory[]> {
    const result = await db.query<BudgetCategory>(
      `
      SELECT
        id,
        user_id AS "userId",
        name,
        type,
        allocated::float8 AS allocated,
        spent::float8 AS spent,
        created_at AS "createdAt"
      FROM budget_categories
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<BudgetCategory | null> {
    const result = await db.query<BudgetCategory>(
      `
      SELECT
        id,
        user_id AS "userId",
        name,
        type,
        allocated::float8 AS allocated,
        spent::float8 AS spent,
        created_at AS "createdAt"
      FROM budget_categories
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async update(id: string, userId: string, input: UpdateCategoryInput): Promise<BudgetCategory | null> {
    const result = await db.query<BudgetCategory>(
      `
      UPDATE budget_categories
      SET
        name = COALESCE($3, name),
        type = COALESCE($4, type),
        allocated = COALESCE($5, allocated),
        spent = COALESCE($6, spent)
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        name,
        type,
        allocated::float8 AS allocated,
        spent::float8 AS spent,
        created_at AS "createdAt"
      `,
      [id, userId, input.name ?? null, input.type ?? null, input.allocated ?? null, input.spent ?? null],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM budget_categories
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },
}
