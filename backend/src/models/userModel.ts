// ADD THIS: user data access layer using parameterized SQL
import { db } from '../config/db.js'

export type User = {
  id: string
  email: string
  displayName: string
  monthlyIncome: number
  createdAt: string
}

export type CreateUserInput = {
  id: string
  email: string
  displayName: string
  monthlyIncome?: number | undefined
}

export type UpdateUserInput = {
  displayName?: string | undefined
  monthlyIncome?: number | undefined
}

let hasEnsuredMonthlyIncomeColumn = false

const ensureMonthlyIncomeColumn = async (): Promise<void> => {
  if (hasEnsuredMonthlyIncomeColumn) return

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0
  `)

  hasEnsuredMonthlyIncomeColumn = true
}

export const userModel = {
  async upsertFromAuth(input: CreateUserInput): Promise<User> {
    await ensureMonthlyIncomeColumn()

    const result = await db.query<User>(
      `
      INSERT INTO users (id, email, display_name, monthly_income)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id)
      DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name
      RETURNING
        id,
        email,
        display_name AS "displayName",
        monthly_income::float8 AS "monthlyIncome",
        created_at AS "createdAt"
      `,
      [input.id, input.email, input.displayName, input.monthlyIncome ?? 0],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create user')
    }

    return row
  },

  async list(): Promise<User[]> {
    await ensureMonthlyIncomeColumn()

    const result = await db.query<User>(
      `
      SELECT
        id,
        email,
        display_name AS "displayName",
        monthly_income::float8 AS "monthlyIncome",
        created_at AS "createdAt"
      FROM users
      ORDER BY created_at DESC
      `,
    )

    return result.rows
  },

  async getById(id: string): Promise<User | null> {
    await ensureMonthlyIncomeColumn()

    const result = await db.query<User>(
      `
      SELECT
        id,
        email,
        display_name AS "displayName",
        monthly_income::float8 AS "monthlyIncome",
        created_at AS "createdAt"
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    )

    return result.rows[0] ?? null
  },

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    await ensureMonthlyIncomeColumn()

    const result = await db.query<User>(
      `
      UPDATE users
      SET
        display_name = COALESCE($2, display_name),
        monthly_income = COALESCE($3, monthly_income)
      WHERE id = $1
      RETURNING
        id,
        email,
        display_name AS "displayName",
        monthly_income::float8 AS "monthlyIncome",
        created_at AS "createdAt"
      `,
      [id, input.displayName ?? null, input.monthlyIncome ?? null],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [id],
    )

    return result.rowCount === 1
  },
}
