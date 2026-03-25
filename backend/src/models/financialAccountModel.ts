import { db } from '../config/db.js'

export type FinancialAccountIcon = {
  kind: 'preset' | 'company' | 'image'
  label: string
  imageUrl?: string | null
  companyQuery?: string | null
} | null

export type FinancialAccountReminder =
  | { type: 'none' }
  | { type: 'preset'; label: string }
  | {
      type: 'custom'
      quantity: number
      unit: 'days' | 'weeks'
      hour: number
      label: string
    }

export type FinancialAccount = {
  id: string
  userId: string
  categoryId: string
  categoryName: string
  name: string
  mode: 'credit' | 'balance'
  amount: number
  creditLimit: number | null
  paymentDayOfMonth: number | null
  reminder: FinancialAccountReminder
  icon: FinancialAccountIcon
  accountType: string
  color: string
  notes: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type FinancialAccountInput = {
  userId: string
  categoryId: string
  name: string
  mode: 'credit' | 'balance'
  amount: number
  creditLimit: number | null
  paymentDayOfMonth: number | null
  reminder: FinancialAccountReminder
  icon: FinancialAccountIcon
  accountType: string
  color: string
  notes: string
}

export type UpdateFinancialAccountInput = Partial<Omit<FinancialAccountInput, 'userId'>> & {
  name?: string
}

const selectColumns = `
  financial_accounts.id,
  financial_accounts.user_id AS "userId",
  financial_accounts.category_id AS "categoryId",
  account_categories.name AS "categoryName",
  financial_accounts.name,
  financial_accounts.mode,
  (
    COALESCE(latest_balance_adjustment.target_amount, financial_accounts.amount)::float8
    + COALESCE(account_income_totals.total_income, 0)::float8
    - COALESCE(account_expense_totals.total_expense, 0)::float8
  ) AS amount,
  financial_accounts.credit_limit::float8 AS "creditLimit",
  financial_accounts.payment_day_of_month AS "paymentDayOfMonth",
  financial_accounts.reminder,
  CASE
    WHEN financial_accounts.icon_kind IS NULL THEN NULL
    ELSE jsonb_build_object(
      'kind', financial_accounts.icon_kind,
      'label', COALESCE(financial_accounts.icon_label, ''),
      'imageUrl', financial_accounts.icon_image_url,
      'companyQuery', financial_accounts.icon_company_query
    )
  END AS icon,
  financial_accounts.account_type AS "accountType",
  financial_accounts.color,
  financial_accounts.notes,
  financial_accounts.sort_order AS "sortOrder",
  financial_accounts.created_at AS "createdAt",
  financial_accounts.updated_at AS "updatedAt"
`

export const financialAccountModel = {
  async listByUser(userId: string): Promise<FinancialAccount[]> {
    const result = await db.query<FinancialAccount>(
      `
      SELECT
        ${selectColumns}
      FROM financial_accounts
      INNER JOIN account_categories
        ON account_categories.id = financial_accounts.category_id
      LEFT JOIN LATERAL (
        SELECT
          account_balance_adjustments.target_amount,
          account_balance_adjustments.created_at
        FROM account_balance_adjustments
        WHERE account_balance_adjustments.account_id = financial_accounts.id
        ORDER BY account_balance_adjustments.created_at DESC
        LIMIT 1
      ) AS latest_balance_adjustment ON true
      LEFT JOIN LATERAL (
        SELECT
          SUM(income_entries.amount)::float8 AS total_income
        FROM income_entries
        WHERE income_entries.account_id = financial_accounts.id
          AND income_entries.user_id = financial_accounts.user_id
          AND income_entries.is_paid = true
          AND income_entries.created_at > COALESCE(latest_balance_adjustment.created_at, financial_accounts.created_at)
      ) AS account_income_totals ON true
      LEFT JOIN LATERAL (
        SELECT
          SUM(transactions.amount)::float8 AS total_expense
        FROM transactions
        WHERE transactions.account_id = financial_accounts.id
          AND transactions.user_id = financial_accounts.user_id
          AND transactions.is_paid = true
          AND transactions.created_at > COALESCE(latest_balance_adjustment.created_at, financial_accounts.created_at)
      ) AS account_expense_totals ON true
      WHERE financial_accounts.user_id = $1
      ORDER BY account_categories.sort_order ASC, financial_accounts.sort_order ASC, financial_accounts.created_at ASC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<FinancialAccount | null> {
    const result = await db.query<FinancialAccount>(
      `
      SELECT
        ${selectColumns}
      FROM financial_accounts
      INNER JOIN account_categories
        ON account_categories.id = financial_accounts.category_id
      LEFT JOIN LATERAL (
        SELECT
          account_balance_adjustments.target_amount,
          account_balance_adjustments.created_at
        FROM account_balance_adjustments
        WHERE account_balance_adjustments.account_id = financial_accounts.id
        ORDER BY account_balance_adjustments.created_at DESC
        LIMIT 1
      ) AS latest_balance_adjustment ON true
      LEFT JOIN LATERAL (
        SELECT
          SUM(income_entries.amount)::float8 AS total_income
        FROM income_entries
        WHERE income_entries.account_id = financial_accounts.id
          AND income_entries.user_id = financial_accounts.user_id
          AND income_entries.is_paid = true
          AND income_entries.created_at > COALESCE(latest_balance_adjustment.created_at, financial_accounts.created_at)
      ) AS account_income_totals ON true
      LEFT JOIN LATERAL (
        SELECT
          SUM(transactions.amount)::float8 AS total_expense
        FROM transactions
        WHERE transactions.account_id = financial_accounts.id
          AND transactions.user_id = financial_accounts.user_id
          AND transactions.is_paid = true
          AND transactions.created_at > COALESCE(latest_balance_adjustment.created_at, financial_accounts.created_at)
      ) AS account_expense_totals ON true
      WHERE financial_accounts.id = $1 AND financial_accounts.user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async create(input: FinancialAccountInput): Promise<FinancialAccount> {
    const result = await db.query<{ id: string }>(
      `
      INSERT INTO financial_accounts (
        user_id,
        category_id,
        name,
        mode,
        amount,
        credit_limit,
        payment_day_of_month,
        reminder,
        icon_kind,
        icon_label,
        icon_image_url,
        icon_company_query,
        account_type,
        color,
        notes,
        sort_order
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb,
        $9, $10, $11, $12, $13, $14, $15,
        COALESCE(
          (
            SELECT MAX(sort_order) + 1
            FROM financial_accounts
            WHERE user_id = $1 AND category_id = $2
          ),
          0
        )
      )
      RETURNING id
      `,
      [
        input.userId,
        input.categoryId,
        input.name,
        input.mode,
        input.amount,
        input.creditLimit,
        input.paymentDayOfMonth,
        JSON.stringify(input.reminder),
        input.icon?.kind ?? null,
        input.icon?.label ?? null,
        input.icon?.imageUrl ?? null,
        input.icon?.companyQuery ?? null,
        input.accountType,
        input.color,
        input.notes,
      ],
    )

    const createdId = result.rows[0]?.id
    if (!createdId) {
      throw new Error('Failed to create account')
    }

    const created = await this.getById(createdId, input.userId)
    if (!created) {
      throw new Error('Failed to load created account')
    }

    return created
  },

  async update(id: string, userId: string, input: UpdateFinancialAccountInput): Promise<FinancialAccount | null> {
    const existing = await this.getById(id, userId)
    if (!existing) {
      return null
    }

    await db.query(
      `
      UPDATE financial_accounts
      SET
        category_id = COALESCE($3, category_id),
        name = COALESCE($4, name),
        mode = COALESCE($5, mode),
        amount = COALESCE($6, amount),
        credit_limit = $7,
        payment_day_of_month = $8,
        reminder = COALESCE($9::jsonb, reminder),
        icon_kind = $10,
        icon_label = $11,
        icon_image_url = $12,
        icon_company_query = $13,
        account_type = COALESCE($14, account_type),
        color = COALESCE($15, color),
        notes = COALESCE($16, notes),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      `,
      [
        id,
        userId,
        input.categoryId ?? null,
        input.name ?? null,
        input.mode ?? null,
        input.amount ?? null,
        input.creditLimit ?? existing.creditLimit,
        input.paymentDayOfMonth ?? existing.paymentDayOfMonth,
        input.reminder ? JSON.stringify(input.reminder) : null,
        input.icon === undefined ? existing.icon?.kind ?? null : input.icon?.kind ?? null,
        input.icon === undefined ? existing.icon?.label ?? null : input.icon?.label ?? null,
        input.icon === undefined ? existing.icon?.imageUrl ?? null : input.icon?.imageUrl ?? null,
        input.icon === undefined ? existing.icon?.companyQuery ?? null : input.icon?.companyQuery ?? null,
        input.accountType ?? null,
        input.color ?? null,
        input.notes ?? null,
      ],
    )

    return this.getById(id, userId)
  },

  async updateAmount(id: string, userId: string, amount: number): Promise<FinancialAccount | null> {
    await db.query(
      `
      UPDATE financial_accounts
      SET
        amount = $3,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId, amount],
    )

    return this.getById(id, userId)
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM financial_accounts
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },
}
