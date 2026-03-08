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

const DUPLICATE_CATEGORY_NAME_ERROR = 'CATEGORY_NAME_EXISTS'

type CategoryGroupRow = {
  id: string
  name: string
  sortOrder: number
}

const DEFAULT_CATEGORY_GROUPS = [
  { name: 'Housing', sortOrder: 1 },
  { name: 'Transport', sortOrder: 2 },
  { name: 'Living', sortOrder: 3 },
  { name: 'Debt', sortOrder: 4 },
  { name: 'Savings', sortOrder: 5 },
  { name: 'Other', sortOrder: 6 },
] as const

const inferGroupName = (categoryName: string): string => {
  const normalizedName = categoryName.trim().toLowerCase()

  if (/(rent|mortgage|house|housing|utility|utilities|electric|water|internet|home)/.test(normalizedName)) {
    return 'Housing'
  }

  if (/(transport|car|fuel|gas|diesel|uber|taxi|bus|train|parking|toll)/.test(normalizedName)) {
    return 'Transport'
  }

  if (/(grocer|food|living|shopping|clothes|phone|mobile|daycare|child)/.test(normalizedName)) {
    return 'Living'
  }

  if (/(debt|loan|credit|interest|repayment|installment)/.test(normalizedName)) {
    return 'Debt'
  }

  if (/(saving|invest|emergency|retire|buffer|fund)/.test(normalizedName)) {
    return 'Savings'
  }

  return 'Other'
}

const categorySelect = `
  budget_categories.id,
  budget_categories.user_id AS "userId",
  budget_categories.name,
  budget_categories.type,
  budget_categories.allocated::float8 AS allocated,
  CASE
    WHEN budget_categories.type = 'budget'
      THEN COALESCE(ledger.ledger_spent, budget_categories.spent)::float8
    ELSE budget_categories.spent::float8
  END AS spent,
  budget_categories.created_at AS "createdAt"
`

const categoryLedgerJoin = `
  LEFT JOIN LATERAL (
    SELECT GREATEST(
      COALESCE(
        SUM(
          CASE
            WHEN transactions.note LIKE '[dashboard-credit]%' THEN -transactions.amount
            ELSE transactions.amount
          END
        ),
        0
      ),
      0
    ) AS ledger_spent
    FROM transactions
    WHERE transactions.user_id = budget_categories.user_id
      AND transactions.category_id = budget_categories.id
  ) AS ledger ON TRUE
`

const ensureDefaultGroupsForUser = async (userId: string): Promise<CategoryGroupRow[]> => {
  for (const group of DEFAULT_CATEGORY_GROUPS) {
    await db.query(
      `
      INSERT INTO category_groups (user_id, name, sort_order)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, name)
      DO UPDATE SET sort_order = EXCLUDED.sort_order
      `,
      [userId, group.name, group.sortOrder],
    )
  }

  const groupsResult = await db.query<CategoryGroupRow>(
    `
    SELECT id, name, sort_order AS "sortOrder"
    FROM category_groups
    WHERE user_id = $1
    ORDER BY sort_order ASC, created_at ASC
    `,
    [userId],
  )

  if (groupsResult.rows.length === 0) {
    throw new Error('Failed to load category groups')
  }

  return groupsResult.rows
}

export const categoryModel = {
  async create(input: CreateCategoryInput): Promise<BudgetCategory> {
    const categoryId = randomUUID()
    const groups = await ensureDefaultGroupsForUser(input.userId)
    const inferredGroupName = inferGroupName(input.name)
    const matchingGroup =
      groups.find((group) => group.name === inferredGroupName) ??
      groups.find((group) => group.name === 'Other') ??
      groups[0]

    if (!matchingGroup) {
      throw new Error('Failed to resolve category group')
    }

    const existingResult = await db.query<{ id: string }>(
      `
      SELECT id
      FROM budget_categories
      WHERE user_id = $1 AND group_id = $2 AND LOWER(name) = LOWER($3)
      LIMIT 1
      `,
      [input.userId, matchingGroup.id, input.name],
    )

    if (existingResult.rows[0]) {
      throw new Error(DUPLICATE_CATEGORY_NAME_ERROR)
    }

    const result = await db.query<BudgetCategory>(
      `
      INSERT INTO budget_categories (id, user_id, name, type, allocated, spent, group_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        user_id AS "userId",
        name,
        type,
        allocated::float8 AS allocated,
        spent::float8 AS spent,
        created_at AS "createdAt"
      `,
      [
        categoryId,
        input.userId,
        input.name,
        input.type,
        input.allocated ?? 0,
        input.spent ?? 0,
        matchingGroup.id,
      ],
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
      SELECT ${categorySelect}
      FROM budget_categories
      ${categoryLedgerJoin}
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
      SELECT ${categorySelect}
      FROM budget_categories
      ${categoryLedgerJoin}
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
    input: UpdateCategoryInput,
  ): Promise<BudgetCategory | null> {
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
      [
        id,
        userId,
        input.name ?? null,
        input.type ?? null,
        input.allocated ?? null,
        input.spent ?? null,
      ],
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

export { DUPLICATE_CATEGORY_NAME_ERROR }
