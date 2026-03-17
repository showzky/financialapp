// ADD THIS: transaction data access layer using parameterized SQL
import { db } from '../config/db.js'

export type Transaction = {
  id: string
  userId: string
  categoryId: string
  categoryName: string | null
  accountId: string | null
  accountName: string | null
  amount: number
  note: string | null
  transactionDate: string
  isPaid: boolean
  countsTowardBills: boolean
  createdAt: string
}

export type CreateTransactionInput = {
  userId: string
  categoryId: string
  accountId?: string | null | undefined
  amount: number
  note?: string | undefined
  transactionDate: string
  isPaid?: boolean | undefined
  countsTowardBills?: boolean | undefined
}

export type UpdateTransactionInput = {
  categoryId?: string | undefined
  accountId?: string | null | undefined
  amount?: number | undefined
  note?: string | null | undefined
  transactionDate?: string | undefined
  isPaid?: boolean | undefined
  countsTowardBills?: boolean | undefined
}

export const transactionModel = {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    const result = await db.query<Transaction>(
      `
      INSERT INTO transactions (user_id, category_id, account_id, amount, note, transaction_date, is_paid, counts_toward_bills)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        NULL::text AS "categoryName",
        account_id AS "accountId",
        NULL::text AS "accountName",
        amount::float8 AS amount,
        note,
        transaction_date AS "transactionDate",
        is_paid AS "isPaid",
        counts_toward_bills AS "countsTowardBills",
        created_at AS "createdAt"
      `,
      [
        input.userId,
        input.categoryId,
        input.accountId ?? null,
        input.amount,
        input.note ?? null,
        input.transactionDate,
        input.isPaid ?? true,
        input.countsTowardBills ?? false,
      ],
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
        transactions.id,
        transactions.user_id AS "userId",
        transactions.category_id AS "categoryId",
        budget_categories.name AS "categoryName",
        transactions.account_id AS "accountId",
        financial_accounts.name AS "accountName",
        transactions.amount::float8 AS amount,
        transactions.note,
        transactions.transaction_date AS "transactionDate",
        transactions.is_paid AS "isPaid",
        transactions.counts_toward_bills AS "countsTowardBills",
        transactions.created_at AS "createdAt"
      FROM transactions
      LEFT JOIN budget_categories
        ON budget_categories.id = transactions.category_id
      LEFT JOIN financial_accounts
        ON financial_accounts.id = transactions.account_id
      WHERE transactions.user_id = $1
      ORDER BY transactions.transaction_date DESC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<Transaction | null> {
    const result = await db.query<Transaction>(
      `
      SELECT
        transactions.id,
        transactions.user_id AS "userId",
        transactions.category_id AS "categoryId",
        budget_categories.name AS "categoryName",
        transactions.account_id AS "accountId",
        financial_accounts.name AS "accountName",
        transactions.amount::float8 AS amount,
        transactions.note,
        transactions.transaction_date AS "transactionDate",
        transactions.is_paid AS "isPaid",
        transactions.counts_toward_bills AS "countsTowardBills",
        transactions.created_at AS "createdAt"
      FROM transactions
      LEFT JOIN budget_categories
        ON budget_categories.id = transactions.category_id
      LEFT JOIN financial_accounts
        ON financial_accounts.id = transactions.account_id
      WHERE transactions.id = $1 AND transactions.user_id = $2
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
        account_id = COALESCE($4, account_id),
        amount = COALESCE($5, amount),
        note = COALESCE($6, note),
        transaction_date = COALESCE($7, transaction_date),
        is_paid = COALESCE($8, is_paid),
        counts_toward_bills = COALESCE($9, counts_toward_bills)
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        category_id AS "categoryId",
        NULL::text AS "categoryName",
        account_id AS "accountId",
        NULL::text AS "accountName",
        amount::float8 AS amount,
        note,
        transaction_date AS "transactionDate",
        is_paid AS "isPaid",
        counts_toward_bills AS "countsTowardBills",
        created_at AS "createdAt"
      `,
      [
        id,
        userId,
        input.categoryId ?? null,
        input.accountId ?? null,
        input.amount ?? null,
        input.note ?? null,
        input.transactionDate ?? null,
        input.isPaid ?? null,
        input.countsTowardBills ?? null,
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

  async removeByCategory(categoryId: string, userId: string): Promise<number> {
    const result = await db.query(
      `
      DELETE FROM transactions
      WHERE category_id = $1 AND user_id = $2
      `,
      [categoryId, userId],
    )

    return result.rowCount ?? 0
  },

  async listByAccount(userId: string, accountId: string): Promise<Transaction[]> {
    const result = await db.query<Transaction>(
      `
      SELECT
        transactions.id,
        transactions.user_id AS "userId",
        transactions.category_id AS "categoryId",
        budget_categories.name AS "categoryName",
        transactions.account_id AS "accountId",
        financial_accounts.name AS "accountName",
        transactions.amount::float8 AS amount,
        transactions.note,
        transactions.transaction_date AS "transactionDate",
        transactions.is_paid AS "isPaid",
        transactions.counts_toward_bills AS "countsTowardBills",
        transactions.created_at AS "createdAt"
      FROM transactions
      LEFT JOIN budget_categories
        ON budget_categories.id = transactions.category_id
      LEFT JOIN financial_accounts
        ON financial_accounts.id = transactions.account_id
      WHERE transactions.user_id = $1 AND transactions.account_id = $2
      ORDER BY transactions.transaction_date DESC, transactions.created_at DESC
      `,
      [userId, accountId],
    )

    return result.rows
  },
}
