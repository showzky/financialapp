import { db } from '../config/db.js'
import { DEFAULT_INCOME_CATEGORIES, type CategorySeed } from './categoryCatalog.js'

export type IncomeCategory = {
  id: string
  userId: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  sortOrder: number
  isDefault: boolean
  isArchived: boolean
  createdAt: string
}

export type CreateIncomeCategoryInput = {
  userId: string
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  sortOrder?: number | undefined
  isDefault?: boolean | undefined
  isArchived?: boolean | undefined
}

export type UpdateIncomeCategoryInput = {
  name?: string | undefined
  parentName?: string | undefined
  icon?: string | undefined
  color?: string | undefined
  iconColor?: string | undefined
  sortOrder?: number | undefined
  isDefault?: boolean | undefined
  isArchived?: boolean | undefined
}

const DUPLICATE_INCOME_CATEGORY_NAME_ERROR = 'INCOME_CATEGORY_NAME_EXISTS'

async function getNextSortOrder(userId: string) {
  const result = await db.query<{ nextSortOrder: number }>(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS "nextSortOrder"
    FROM income_categories
    WHERE user_id = $1
    `,
    [userId],
  )

  return result.rows[0]?.nextSortOrder ?? 1
}

async function ensureDefaultIncomeCategories(userId: string) {
  const countResult = await db.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM income_categories
    WHERE user_id = $1
    `,
    [userId],
  )

  if ((Number(countResult.rows[0]?.count ?? '0')) > 0) {
    return
  }

  for (const seed of DEFAULT_INCOME_CATEGORIES) {
    await incomeCategoryModel.create(seedCategoryInput(userId, seed))
  }
}

export const incomeCategoryModel = {
  async create(input: CreateIncomeCategoryInput): Promise<IncomeCategory> {
    const nextSortOrder = input.sortOrder ?? (await getNextSortOrder(input.userId))

    try {
      const result = await db.query<IncomeCategory>(
        `
        INSERT INTO income_categories (
          user_id,
          name,
          parent_name,
          icon,
          color,
          icon_color,
          sort_order,
          is_default,
          is_archived
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          id,
          user_id AS "userId",
          name,
          parent_name AS "parentName",
          icon,
          color,
          icon_color AS "iconColor",
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
          nextSortOrder,
          input.isDefault ?? false,
          input.isArchived ?? false,
        ],
      )

      const row = result.rows[0]
      if (!row) {
        throw new Error('Failed to create income category')
      }

      return row
    } catch (error) {
      if (error instanceof Error && /duplicate key/i.test(error.message)) {
        throw new Error(DUPLICATE_INCOME_CATEGORY_NAME_ERROR)
      }
      throw error
    }
  },

  async listByUser(userId: string): Promise<IncomeCategory[]> {
    await ensureDefaultIncomeCategories(userId)
    const result = await db.query<IncomeCategory>(
      `
      SELECT
        id,
        user_id AS "userId",
        name,
        parent_name AS "parentName",
        icon,
        color,
        icon_color AS "iconColor",
        sort_order AS "sortOrder",
        is_default AS "isDefault",
        is_archived AS "isArchived",
        created_at AS "createdAt"
      FROM income_categories
      WHERE user_id = $1 AND is_archived = FALSE
      ORDER BY sort_order ASC, created_at ASC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<IncomeCategory | null> {
    const result = await db.query<IncomeCategory>(
      `
      SELECT
        id,
        user_id AS "userId",
        name,
        parent_name AS "parentName",
        icon,
        color,
        icon_color AS "iconColor",
        sort_order AS "sortOrder",
        is_default AS "isDefault",
        is_archived AS "isArchived",
        created_at AS "createdAt"
      FROM income_categories
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async update(id: string, userId: string, input: UpdateIncomeCategoryInput): Promise<IncomeCategory | null> {
    const result = await db.query<IncomeCategory>(
      `
      UPDATE income_categories
      SET
        name = COALESCE($3, name),
        parent_name = COALESCE($4, parent_name),
        icon = COALESCE($5, icon),
        color = COALESCE($6, color),
        icon_color = COALESCE($7, icon_color),
        sort_order = COALESCE($8, sort_order),
        is_default = COALESCE($9, is_default),
        is_archived = COALESCE($10, is_archived)
      WHERE id = $1 AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        name,
        parent_name AS "parentName",
        icon,
        color,
        icon_color AS "iconColor",
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
      DELETE FROM income_categories
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },

  async resetDefaults(userId: string): Promise<IncomeCategory[]> {
    await db.query('DELETE FROM income_entries WHERE user_id = $1', [userId])
    await db.query('DELETE FROM income_categories WHERE user_id = $1', [userId])

    for (const seed of DEFAULT_INCOME_CATEGORIES) {
      await this.create(seedCategoryInput(userId, seed))
    }

    return this.listByUser(userId)
  },
}

function seedCategoryInput(userId: string, seed: CategorySeed): CreateIncomeCategoryInput {
  return {
    userId,
    name: seed.name,
    parentName: seed.parentName,
    icon: seed.icon,
    color: seed.color,
    iconColor: seed.iconColor,
    sortOrder: seed.sortOrder,
    isDefault: true,
    isArchived: false,
  }
}

export { DUPLICATE_INCOME_CATEGORY_NAME_ERROR }
