import { db } from '../config/db.js'

export type IncomeEntry = {
  id: string
  userId: string
  incomeCategoryId: string | null
  category: string
  parentName: string | null
  icon: string | null
  color: string | null
  iconColor: string | null
  name: string | null
  amount: number
  receivedAt: string
  accountName: string | null
  isPaid: boolean
  createdAt: string
}

export type CreateIncomeEntryInput = {
  userId: string
  incomeCategoryId?: string | null | undefined
  category: string
  name?: string | null | undefined
  amount: number
  receivedAt: string
  accountName?: string | null | undefined
  isPaid?: boolean | undefined
}

export type UpdateIncomeEntryInput = {
  incomeCategoryId?: string | null | undefined
  category?: string | undefined
  name?: string | null | undefined
  amount?: number | undefined
  receivedAt?: string | undefined
  accountName?: string | null | undefined
  isPaid?: boolean | undefined
}

export const incomeEntryModel = {
  async create(input: CreateIncomeEntryInput): Promise<IncomeEntry> {
    const result = await db.query<IncomeEntry>(
      `
      INSERT INTO income_entries (user_id, income_category_id, category, name, amount, received_at, account_name, is_paid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        user_id AS "userId",
        income_category_id AS "incomeCategoryId",
        category,
        NULL::text AS "parentName",
        NULL::text AS icon,
        NULL::text AS color,
        NULL::text AS "iconColor",
        name,
        amount::float8 AS amount,
        received_at AS "receivedAt",
        account_name AS "accountName",
        is_paid AS "isPaid",
        created_at AS "createdAt"
      `,
      [input.userId, input.incomeCategoryId ?? null, input.category, input.name ?? null, input.amount, input.receivedAt, input.accountName ?? null, input.isPaid ?? true],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create income entry')
    }

    return row
  },

  async listByUser(userId: string): Promise<IncomeEntry[]> {
    const result = await db.query<IncomeEntry>(
      `
      SELECT
        income_entries.id,
        income_entries.user_id AS "userId",
        income_entries.income_category_id AS "incomeCategoryId",
        income_entries.category,
        income_categories.parent_name AS "parentName",
        income_categories.icon,
        income_categories.color,
        income_categories.icon_color AS "iconColor",
        income_entries.name,
        income_entries.amount::float8 AS amount,
        income_entries.received_at AS "receivedAt",
        income_entries.account_name AS "accountName",
        income_entries.is_paid AS "isPaid",
        income_entries.created_at AS "createdAt"
      FROM income_entries
      LEFT JOIN income_categories
        ON income_categories.id = income_entries.income_category_id
      WHERE income_entries.user_id = $1
      ORDER BY income_entries.received_at DESC, income_entries.created_at DESC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<IncomeEntry | null> {
    const result = await db.query<IncomeEntry>(
      `
      SELECT
        income_entries.id,
        income_entries.user_id AS "userId",
        income_entries.income_category_id AS "incomeCategoryId",
        income_entries.category,
        income_categories.parent_name AS "parentName",
        income_categories.icon,
        income_categories.color,
        income_categories.icon_color AS "iconColor",
        income_entries.name,
        income_entries.amount::float8 AS amount,
        income_entries.received_at AS "receivedAt",
        income_entries.account_name AS "accountName",
        income_entries.is_paid AS "isPaid",
        income_entries.created_at AS "createdAt"
      FROM income_entries
      LEFT JOIN income_categories
        ON income_categories.id = income_entries.income_category_id
      WHERE income_entries.id = $1 AND income_entries.user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async update(id: string, userId: string, input: UpdateIncomeEntryInput): Promise<IncomeEntry | null> {
    const result = await db.query<IncomeEntry>(
        `
      UPDATE income_entries
      SET
        income_category_id = COALESCE($3, income_category_id),
        category = COALESCE($4, category),
        name = COALESCE($5, name),
        amount = COALESCE($6, amount),
        received_at = COALESCE($7, received_at),
        account_name = COALESCE($8, account_name),
        is_paid = COALESCE($9, is_paid)
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        income_category_id AS "incomeCategoryId",
        category,
        NULL::text AS "parentName",
        NULL::text AS icon,
        NULL::text AS color,
        NULL::text AS "iconColor",
        name,
        amount::float8 AS amount,
        received_at AS "receivedAt",
        account_name AS "accountName",
        is_paid AS "isPaid",
        created_at AS "createdAt"
      `,
      [id, userId, input.incomeCategoryId ?? null, input.category ?? null, input.name ?? null, input.amount ?? null, input.receivedAt ?? null, input.accountName ?? null, input.isPaid ?? null],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM income_entries
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },
}
