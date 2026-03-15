import { db } from '../config/db.js'
import { DEFAULT_EXPENSE_CATEGORIES, type CategorySeed } from './categoryCatalog.js'

export type BudgetCategoryType = 'budget' | 'fixed'

export type BudgetCategory = {
  id: string
  userId: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  type: BudgetCategoryType
  allocated: number
  spent: number
  dueDayOfMonth: number | null
  sortOrder: number
  isDefault: boolean
  isArchived: boolean
  createdAt: string
}

export type CreateCategoryInput = {
  userId: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  type: BudgetCategoryType
  allocated?: number | undefined
  spent?: number | undefined
  dueDayOfMonth?: number | undefined
  sortOrder?: number | undefined
  isDefault?: boolean | undefined
  isArchived?: boolean | undefined
}

export type UpdateCategoryInput = {
  name?: string | undefined
  parentName?: string | undefined
  icon?: string | undefined
  color?: string | undefined
  iconColor?: string | undefined
  type?: BudgetCategoryType | undefined
  allocated?: number | undefined
  spent?: number | undefined
  dueDayOfMonth?: number | null | undefined
  sortOrder?: number | undefined
  isDefault?: boolean | undefined
  isArchived?: boolean | undefined
}

const DUPLICATE_CATEGORY_NAME_ERROR = 'CATEGORY_NAME_EXISTS'

const categorySelect = `
  budget_categories.id,
  budget_categories.user_id AS "userId",
  budget_categories.name,
  budget_categories.parent_name AS "parentName",
  budget_categories.icon,
  budget_categories.color,
  budget_categories.icon_color AS "iconColor",
  budget_categories.type,
  budget_categories.allocated::float8 AS allocated,
  CASE
    WHEN budget_categories.type = 'budget'
      THEN COALESCE(ledger.ledger_spent, budget_categories.spent)::float8
    ELSE budget_categories.spent::float8
  END AS spent,
  budget_categories.due_day_of_month AS "dueDayOfMonth",
  budget_categories.sort_order AS "sortOrder",
  budget_categories.is_default AS "isDefault",
  budget_categories.is_archived AS "isArchived",
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
    INNER JOIN budget_categories AS source_categories
      ON source_categories.id = transactions.category_id
    WHERE transactions.user_id = budget_categories.user_id
      AND (
        transactions.category_id = budget_categories.id
        OR (
          budget_categories.type = 'budget'
          AND budget_categories.parent_name = budget_categories.name
          AND source_categories.user_id = budget_categories.user_id
          AND source_categories.parent_name = budget_categories.name
          AND source_categories.name <> budget_categories.name
          AND source_categories.type = 'budget'
        )
      )
  ) AS ledger ON TRUE
`

async function getNextSortOrder(userId: string) {
  const result = await db.query<{ nextSortOrder: number }>(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS "nextSortOrder"
    FROM budget_categories
    WHERE user_id = $1
    `,
    [userId],
  )

  return result.rows[0]?.nextSortOrder ?? 1
}

async function ensureDefaultCategories(userId: string) {
  const countResult = await db.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM budget_categories
    WHERE user_id = $1
    `,
    [userId],
  )

  if ((Number(countResult.rows[0]?.count ?? '0')) > 0) {
    return
  }

  for (const seed of DEFAULT_EXPENSE_CATEGORIES) {
    await categoryModel.create(seedCategoryInput(userId, seed))
  }
}

export const categoryModel = {
  async create(input: CreateCategoryInput): Promise<BudgetCategory> {
    const nextSortOrder = input.sortOrder ?? (await getNextSortOrder(input.userId))

    try {
      const result = await db.query<BudgetCategory>(
        `
        INSERT INTO budget_categories (
          user_id,
          name,
          parent_name,
          icon,
          color,
          icon_color,
          type,
          allocated,
          spent,
          due_day_of_month,
          sort_order,
          is_default,
          is_archived
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING
          id,
          user_id AS "userId",
          name,
          parent_name AS "parentName",
          icon,
          color,
          icon_color AS "iconColor",
          type,
          allocated::float8 AS allocated,
          spent::float8 AS spent,
          due_day_of_month AS "dueDayOfMonth",
          sort_order AS "sortOrder",
          is_default AS "isDefault",
          is_archived AS "isArchived",
          created_at AS "createdAt"
        `,
        [
          input.userId,
          input.name,
          input.parentName,
          input.icon,
          input.color,
          input.iconColor,
          input.type,
          input.allocated ?? 0,
          input.spent ?? 0,
          input.dueDayOfMonth ?? null,
          nextSortOrder,
          input.isDefault ?? false,
          input.isArchived ?? false,
        ],
      )

      const row = result.rows[0]
      if (!row) {
        throw new Error('Failed to create category')
      }

      return row
    } catch (error) {
      if (error instanceof Error && /duplicate key/i.test(error.message)) {
        throw new Error(DUPLICATE_CATEGORY_NAME_ERROR)
      }
      throw error
    }
  },

  async listByUser(userId: string): Promise<BudgetCategory[]> {
    await ensureDefaultCategories(userId)
    const result = await db.query<BudgetCategory>(
      `
      SELECT ${categorySelect}
      FROM budget_categories
      ${categoryLedgerJoin}
      WHERE user_id = $1 AND is_archived = FALSE
      ORDER BY sort_order ASC, created_at ASC
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

  async update(id: string, userId: string, input: UpdateCategoryInput): Promise<BudgetCategory | null> {
    const result = await db.query<BudgetCategory>(
      `
      UPDATE budget_categories
      SET
        name = COALESCE($3, name),
        parent_name = COALESCE($4, parent_name),
        icon = COALESCE($5, icon),
        color = COALESCE($6, color),
        icon_color = COALESCE($7, icon_color),
        type = COALESCE($8, type),
        allocated = COALESCE($9, allocated),
        spent = COALESCE($10, spent),
        due_day_of_month = COALESCE($11, due_day_of_month),
        sort_order = COALESCE($12, sort_order),
        is_default = COALESCE($13, is_default),
        is_archived = COALESCE($14, is_archived)
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        name,
        parent_name AS "parentName",
        icon,
        color,
        icon_color AS "iconColor",
        type,
        allocated::float8 AS allocated,
        spent::float8 AS spent,
        due_day_of_month AS "dueDayOfMonth",
        sort_order AS "sortOrder",
        is_default AS "isDefault",
        is_archived AS "isArchived",
        created_at AS "createdAt"
      `,
      [
        id,
        userId,
        input.name ?? null,
        input.parentName ?? null,
        input.icon ?? null,
        input.color ?? null,
        input.iconColor ?? null,
        input.type ?? null,
        input.allocated ?? null,
        input.spent ?? null,
        input.dueDayOfMonth ?? null,
        input.sortOrder ?? null,
        input.isDefault ?? null,
        input.isArchived ?? null,
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

  async resetDefaults(userId: string): Promise<BudgetCategory[]> {
    await db.query('DELETE FROM transactions WHERE user_id = $1', [userId])
    await db.query('DELETE FROM budget_categories WHERE user_id = $1', [userId])

    for (const seed of DEFAULT_EXPENSE_CATEGORIES) {
      await this.create(seedCategoryInput(userId, seed))
    }

    return this.listByUser(userId)
  },
}

function seedCategoryInput(userId: string, seed: CategorySeed): CreateCategoryInput {
  return {
    userId,
    name: seed.name,
    parentName: seed.parentName,
    icon: seed.icon,
    color: seed.color,
    iconColor: seed.iconColor,
    type: seed.type ?? 'budget',
    allocated: 0,
    spent: 0,
    dueDayOfMonth: seed.dueDayOfMonth,
    sortOrder: seed.sortOrder,
    isDefault: true,
    isArchived: false,
  }
}

export { DUPLICATE_CATEGORY_NAME_ERROR }
