// ADD THIS: data access layer for vacation funds and expenses
import { db } from '../config/db.js'

export type VacationFund = {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export type VacationExpense = {
  id: string
  vacationId: string
  category: string
  amount: number
  description: string | null
  date: string
  isVacation: boolean
  createdAt: string
}

export type CreateVacationInput = Omit<
  VacationFund,
  'id' | 'currentAmount' | 'createdAt' | 'updatedAt'
>
export type UpdateVacationInput = Partial<
  Omit<VacationFund, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>

export const vacationModel = {
  async create(input: CreateVacationInput): Promise<VacationFund> {
    const result = await db.query<VacationFund>(
      `
      INSERT INTO vacation_funds (user_id, name, target_amount, current_amount, start_date, end_date)
      VALUES ($1,$2,$3,$3,$4,$5)
      RETURNING
        id,
        user_id AS "userId",
        name,
        target_amount::float8 AS "targetAmount",
        current_amount::float8 AS "currentAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [input.userId, input.name, input.targetAmount, input.startDate, input.endDate],
    )
    const row = result.rows[0]
    if (!row) throw new Error('failed to create vacation fund')
    return row
  },

  async listByUser(userId: string): Promise<VacationFund[]> {
    const result = await db.query<VacationFund>(
      `
      SELECT
        id,
        user_id AS "userId",
        name,
        target_amount::float8 AS "targetAmount",
        current_amount::float8 AS "currentAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM vacation_funds
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId],
    )
    return result.rows
  },

  async getById(id: string, userId: string): Promise<VacationFund | null> {
    const result = await db.query<VacationFund>(
      `
      SELECT
        id,
        user_id AS "userId",
        name,
        target_amount::float8 AS "targetAmount",
        current_amount::float8 AS "currentAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM vacation_funds
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )
    return result.rows[0] ?? null
  },

  async addFunds(vacationId: string, userId: string, amount: number): Promise<VacationFund | null> {
    return this.adjustFunds(vacationId, userId, amount)
  },

  async adjustFunds(
    vacationId: string,
    userId: string,
    deltaAmount: number,
  ): Promise<VacationFund | null> {
    const result = await db.query<VacationFund>(
      `
      UPDATE vacation_funds
      SET current_amount = current_amount + $3
      WHERE id = $1 AND user_id = $2 AND current_amount + $3 >= 0
      RETURNING
        id,
        user_id AS "userId",
        name,
        target_amount::float8 AS "targetAmount",
        current_amount::float8 AS "currentAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [vacationId, userId, deltaAmount],
    )
    return result.rows[0] ?? null
  },

  // Expenses
  async listExpenses(vacationId: string): Promise<VacationExpense[]> {
    const result = await db.query<VacationExpense>(
      `
      SELECT
        id,
        vacation_id AS "vacationId",
        category,
        amount::float8 AS amount,
        description,
        date,
        true AS "isVacation",
        created_at AS "createdAt"
      FROM vacation_expenses
      WHERE vacation_id = $1
      ORDER BY date DESC
      `,
      [vacationId],
    )
    return result.rows
  },

  async createExpense(expense: {
    vacationId: string
    category: string
    amount: number
    description?: string | null | undefined
    date: string
  }): Promise<VacationExpense> {
    const result = await db.query<VacationExpense>(
      `
      INSERT INTO vacation_expenses (vacation_id, category, amount, description, date)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING
        id,
        vacation_id AS "vacationId",
        category,
        amount::float8 AS amount,
        description,
        date,
        true AS "isVacation",
        created_at AS "createdAt"
      `,
      [
        expense.vacationId,
        expense.category,
        expense.amount,
        expense.description ?? null,
        expense.date,
      ],
    )
    const row = result.rows[0]
    if (!row) throw new Error('failed to create vacation expense')
    return row
  },

  async updateExpense(
    id: string,
    vacationId: string,
    input: {
      category?: string | undefined
      amount?: number | undefined
      description?: string | null | undefined
      date?: string | undefined
    },
  ): Promise<VacationExpense | null> {
    const result = await db.query<VacationExpense>(
      `
      UPDATE vacation_expenses
      SET
        category = COALESCE($3, category),
        amount = COALESCE($4, amount),
        description = COALESCE($5, description),
        date = COALESCE($6, date)
      WHERE id = $1 AND vacation_id = $2
      RETURNING
        id,
        vacation_id AS "vacationId",
        category,
        amount::float8 AS amount,
        description,
        date,
        true AS "isVacation",
        created_at AS "createdAt"
      `,
      [
        id,
        vacationId,
        input.category ?? null,
        input.amount ?? null,
        input.description ?? null,
        input.date ?? null,
      ],
    )
    return result.rows[0] ?? null
  },

  async deleteExpense(id: string, vacationId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM vacation_expenses
      WHERE id = $1 AND vacation_id = $2
      `,
      [id, vacationId],
    )
    return result.rowCount === 1
  },
}
