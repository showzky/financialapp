import { z } from 'zod'
import type { Request, Response } from 'express'
import { categoryModel, DUPLICATE_CATEGORY_NAME_ERROR } from '../models/categoryModel.js'
import {
  incomeCategoryModel,
  DUPLICATE_INCOME_CATEGORY_NAME_ERROR,
} from '../models/incomeCategoryModel.js'
import {
  INCOME_PARENT_CATEGORIES,
  EXPENSE_PARENT_CATEGORIES,
  isValidParentCategory,
  type CategoryKind,
} from '../models/categoryCatalog.js'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'
import { env } from '../config/env.js'

const categoryTypeSchema = z.enum(['budget', 'fixed'])
const categoryKindSchema = z.enum(['expense', 'income'])

const createCategorySchema = z.object({
  kind: categoryKindSchema,
  name: z.string().trim().min(1).max(100),
  parentName: z.string().trim().max(100).optional(),
  icon: z.string().trim().min(1).max(100),
  color: z.string().trim().min(1).max(32),
  iconColor: z.string().trim().min(1).max(32),
  type: categoryTypeSchema.optional(),
  allocated: z.number().finite().nonnegative().optional(),
  spent: z.number().finite().nonnegative().optional(),
  dueDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isDefault: z.boolean().optional(),
  isArchived: z.boolean().optional(),
})

const updateCategorySchema = z
  .object({
    kind: categoryKindSchema.optional(),
    name: z.string().trim().min(1).max(100).optional(),
    parentName: z.string().trim().max(100).optional(),
    icon: z.string().trim().min(1).max(100).optional(),
    color: z.string().trim().min(1).max(32).optional(),
    iconColor: z.string().trim().min(1).max(32).optional(),
    type: categoryTypeSchema.optional(),
    allocated: z.number().finite().nonnegative().optional(),
    spent: z.number().finite().nonnegative().optional(),
    dueDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    isDefault: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.kind !== undefined ||
      value.name !== undefined ||
      value.parentName !== undefined ||
      value.icon !== undefined ||
      value.color !== undefined ||
      value.iconColor !== undefined ||
      value.type !== undefined ||
      value.allocated !== undefined ||
      value.spent !== undefined ||
      value.dueDayOfMonth !== undefined ||
      value.sortOrder !== undefined ||
      value.isDefault !== undefined ||
      value.isArchived !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

const listCategoriesQuerySchema = z.object({
  kind: categoryKindSchema.default('expense'),
})

const categoryIdSchema = z.object({ id: z.string().trim().min(1) })

function validateParentCategory(kind: CategoryKind, parentName: string) {
  if (!isValidParentCategory(kind, parentName)) {
    const options = kind === 'expense' ? EXPENSE_PARENT_CATEGORIES : INCOME_PARENT_CATEGORIES
    throw new AppError(`Invalid parent category. Expected one of: ${options.join(', ')}`, 400)
  }
}

async function ensureUser(req: Request) {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const existingUser = await userModel.getById(req.auth.userId)
  if (!existingUser) {
    await userModel.upsertFromAuth({
      id: req.auth.userId,
      email: req.auth.email ?? `${req.auth.userId}@financetracker.local`,
      displayName: req.auth.email?.split('@')[0] ?? env.LOCAL_AUTH_USER_NAME,
    })
  }

  return req.auth.userId
}

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const payload = createCategorySchema.parse(req.body)
  const resolvedParentName = payload.parentName?.trim() || payload.name.trim()

  if (payload.parentName?.trim()) {
    validateParentCategory(payload.kind, payload.parentName)
  }

  try {
    const created =
      payload.kind === 'expense'
        ? await categoryModel.create({
            userId,
            name: payload.name,
            parentName: resolvedParentName,
            icon: payload.icon,
            color: payload.color,
            iconColor: payload.iconColor,
            type: payload.type ?? 'budget',
            allocated: payload.allocated,
            spent: payload.spent,
            dueDayOfMonth: payload.dueDayOfMonth ?? undefined,
            sortOrder: payload.sortOrder,
            isDefault: payload.isDefault,
            isArchived: payload.isArchived,
          })
        : await incomeCategoryModel.create({
            userId,
            name: payload.name,
            parentName: resolvedParentName,
            icon: payload.icon,
            color: payload.color,
            iconColor: payload.iconColor,
            sortOrder: payload.sortOrder,
            isDefault: payload.isDefault,
            isArchived: payload.isArchived,
          })

    res.status(201).json(created)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === DUPLICATE_CATEGORY_NAME_ERROR || message === DUPLICATE_INCOME_CATEGORY_NAME_ERROR) {
      throw new AppError('A category with this name already exists', 409)
    }
    throw new AppError(message, 500)
  }
})

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { kind } = listCategoriesQuerySchema.parse(req.query)

  const rows = kind === 'expense' ? await categoryModel.listByUser(userId) : await incomeCategoryModel.listByUser(userId)
  res.status(200).json(rows)
})

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { id } = categoryIdSchema.parse(req.params)
  const { kind } = listCategoriesQuerySchema.parse(req.query)
  const row = kind === 'expense' ? await categoryModel.getById(id, userId) : await incomeCategoryModel.getById(id, userId)

  if (!row) {
    throw new AppError('Category not found', 404)
  }

  res.status(200).json(row)
})

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { id } = categoryIdSchema.parse(req.params)
  const payload = updateCategorySchema.parse(req.body)
  const kind = payload.kind ?? listCategoriesQuerySchema.parse(req.query).kind
  const existing =
    kind === 'expense'
      ? await categoryModel.getById(id, userId)
      : await incomeCategoryModel.getById(id, userId)

  if (!existing) {
    throw new AppError('Category not found', 404)
  }

  const resolvedName = payload.name ?? existing.name
  const resolvedParentName =
    payload.parentName === undefined
      ? undefined
      : payload.parentName.trim() || resolvedName

  if (payload.parentName?.trim()) {
    validateParentCategory(kind, payload.parentName)
  }

  const updated =
    kind === 'expense'
      ? await categoryModel.update(id, userId, {
          name: payload.name,
          parentName: resolvedParentName,
          icon: payload.icon,
          color: payload.color,
          iconColor: payload.iconColor,
          type: payload.type,
          allocated: payload.allocated,
          spent: payload.spent,
          dueDayOfMonth: payload.dueDayOfMonth,
          sortOrder: payload.sortOrder,
          isDefault: payload.isDefault,
          isArchived: payload.isArchived,
        })
      : await incomeCategoryModel.update(id, userId, {
          name: payload.name,
          parentName: resolvedParentName,
          icon: payload.icon,
          color: payload.color,
          iconColor: payload.iconColor,
          sortOrder: payload.sortOrder,
          isDefault: payload.isDefault,
          isArchived: payload.isArchived,
        })

  if (!updated) {
    throw new AppError('Category not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { id } = categoryIdSchema.parse(req.params)
  const { kind } = listCategoriesQuerySchema.parse(req.query)

  const removed = kind === 'expense' ? await categoryModel.remove(id, userId) : await incomeCategoryModel.remove(id, userId)
  if (!removed) {
    throw new AppError('Category not found', 404)
  }

  res.status(204).send()
})

export const resetDefaultCategories = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const [expenseCategories, incomeCategories] = await Promise.all([
    categoryModel.resetDefaults(userId),
    incomeCategoryModel.resetDefaults(userId),
  ])

  res.status(200).json({
    expenseCategories,
    incomeCategories,
  })
})
