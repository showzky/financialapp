import { db } from '../config/db.js'

export type MonthlyBudgetTarget = {
  id: string
  userId: string
  monthStart: string
  totalBudget: number
  createdAt: string
  updatedAt: string
}

export const monthlyBudgetTargetModel = {
  async getByUserAndMonth(userId: string, monthStart: string): Promise<MonthlyBudgetTarget | null> {
    const result = await db.query<MonthlyBudgetTarget>(
      `
      SELECT
        id,
        user_id AS "userId",
        month_start::text AS "monthStart",
        total_budget::float8 AS "totalBudget",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM monthly_budget_targets
      WHERE user_id = $1 AND month_start = $2::date
      LIMIT 1
      `,
      [userId, monthStart],
    )

    return result.rows[0] ?? null
  },

  async upsert(userId: string, monthStart: string, totalBudget: number): Promise<MonthlyBudgetTarget> {
    const result = await db.query<MonthlyBudgetTarget>(
      `
      INSERT INTO monthly_budget_targets (user_id, month_start, total_budget)
      VALUES ($1, $2::date, $3)
      ON CONFLICT (user_id, month_start)
      DO UPDATE SET
        total_budget = EXCLUDED.total_budget,
        updated_at = NOW()
      RETURNING
        id,
        user_id AS "userId",
        month_start::text AS "monthStart",
        total_budget::float8 AS "totalBudget",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [userId, monthStart, totalBudget],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to save monthly budget target')
    }

    return row
  },
}
