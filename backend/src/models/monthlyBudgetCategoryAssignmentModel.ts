import { db } from '../config/db.js'

export type MonthlyBudgetCategoryAssignment = {
  id: string
  userId: string
  categoryId: string
  monthStart: string
  allocated: number
  createdAt: string
  updatedAt: string
}

export const monthlyBudgetCategoryAssignmentModel = {
  async listByUserAndMonth(
    userId: string,
    monthStart: string,
  ): Promise<MonthlyBudgetCategoryAssignment[]> {
    const result = await db.query<MonthlyBudgetCategoryAssignment>(
      `
      SELECT
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        month_start::text AS "monthStart",
        allocated::float8 AS allocated,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM monthly_budget_category_assignments
      WHERE user_id = $1 AND month_start = $2::date
      ORDER BY created_at ASC
      `,
      [userId, monthStart],
    )

    return result.rows
  },

  async upsert(
    userId: string,
    categoryId: string,
    monthStart: string,
    allocated: number,
  ): Promise<MonthlyBudgetCategoryAssignment> {
    const result = await db.query<MonthlyBudgetCategoryAssignment>(
      `
      INSERT INTO monthly_budget_category_assignments (user_id, category_id, month_start, allocated)
      VALUES ($1, $2, $3::date, $4)
      ON CONFLICT (user_id, category_id, month_start)
      DO UPDATE SET
        allocated = EXCLUDED.allocated,
        updated_at = NOW()
      RETURNING
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        month_start::text AS "monthStart",
        allocated::float8 AS allocated,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [userId, categoryId, monthStart, allocated],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to save monthly budget category assignment')
    }

    return row
  },

  async remove(userId: string, categoryId: string, monthStart: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM monthly_budget_category_assignments
      WHERE user_id = $1 AND category_id = $2 AND month_start = $3::date
      `,
      [userId, categoryId, monthStart],
    )

    return result.rowCount === 1
  },
}
