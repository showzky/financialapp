// ADD THIS: transaction data access layer using parameterized SQL
import { db } from '../config/db.js'

export type Transaction = {
  id: string
  userId: string
  categoryId: string
  amount: number
  note: string | null
  transactionDate: string
  createdAt: string
}

export type CreateTransactionInput = {
  userId: string
  categoryId: string
  amount: number
  note?: string | undefined
  transactionDate: string
}

export type UpdateTransactionInput = {
  categoryId?: string | undefined
  amount?: number | undefined
  note?: string | null | undefined
  transactionDate?: string | undefined
}

export const transactionModel = {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    const result = await db.query<Transaction>(
      `
      INSERT INTO transactions (user_id, category_id, amount, note, transaction_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        amount::float8 AS amount,
        note,
        transaction_date AS "transactionDate",
        created_at AS "createdAt"
      `,
      [input.userId, input.categoryId, input.amount, input.note ?? null, input.transactionDate],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create transaction')
    }

    return row
  },

  async listByUser(userId: string): Promise<Transaction[]> {
    const result = await db.query<Transaction>(
      `
      SELECT
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        amount::float8 AS amount,
        note,
        transaction_date AS "transactionDate",
        created_at AS "createdAt"
      FROM transactions
      WHERE user_id = $1
      ORDER BY transaction_date DESC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<Transaction | null> {
    const result = await db.query<Transaction>(
      `
      SELECT
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        amount::float8 AS amount,
        note,
        transaction_date AS "transactionDate",
        created_at AS "createdAt"
      FROM transactions
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
    input: UpdateTransactionInput,
  ): Promise<Transaction | null> {
    const result = await db.query<Transaction>(
      `
      UPDATE transactions
      SET
        category_id = COALESCE($3, category_id),
        amount = COALESCE($4, amount),
        note = COALESCE($5, note),
        transaction_date = COALESCE($6, transaction_date)
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        amount::float8 AS amount,
        note,
        transaction_date AS "transactionDate",
        created_at AS "createdAt"
      `,
      [
        id,
        userId,
        input.categoryId ?? null,
        input.amount ?? null,
        input.note ?? null,
        input.transactionDate ?? null,
      ],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM transactions
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },
}
