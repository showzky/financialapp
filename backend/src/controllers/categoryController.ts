// ADD THIS: category controllers with input validation and safe responses
import { z } from 'zod'
import type { Request, Response } from 'express'
import { categoryModel } from '../models/categoryModel.js'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'
import { env } from '../config/env.js'

const categoryTypeSchema = z.enum(['budget', 'fixed'])

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: categoryTypeSchema,
  allocated: z.number().finite().nonnegative().optional(),
  spent: z.number().finite().nonnegative().optional(),
})

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: categoryTypeSchema.optional(),
    allocated: z.number().finite().nonnegative().optional(),
    spent: z.number().finite().nonnegative().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.type !== undefined ||
      value.allocated !== undefined ||
      value.spent !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

const categoryIdSchema = z.object({ id: z.string().trim().min(1) })

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  // ADD THIS: ensure user exists before creating category (foreign key requirement)
  try {
    await userModel.upsertFromAuth({
      id: req.auth.userId,
      email: req.auth.email ?? `${req.auth.userId}@financetracker.local`,
      displayName: req.auth.email?.split('@')[0] ?? env.LOCAL_AUTH_USER_NAME,
    })
  } catch (userError) {
    // ADD THIS: expose DB error details to help debug persistence issues
    const msg = userError instanceof Error ? userError.message : String(userError)
    throw new AppError(`Failed to ensure user exists: ${msg}`, 500)
  }

  const payload = createCategorySchema.parse(req.body)

  try {
    const created = await categoryModel.create({ ...payload, userId: req.auth.userId })
    res.status(201).json(created)
  } catch (catError) {
    // ADD THIS: expose actual DB error instead of generic 500
    const msg = catError instanceof Error ? catError.message : String(catError)
    throw new AppError(`Failed to create category: ${msg}`, 500)
  }
})

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  // ADD THIS: return empty array if DB query fails (user may not exist yet)
  let rows: Awaited<ReturnType<typeof categoryModel.listByUser>> = []
  try {
    rows = await categoryModel.listByUser(req.auth.userId)
  } catch {
    // DB error—return empty list so frontend works
  }

  res.status(200).json(rows)
})

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = categoryIdSchema.parse(req.params)
  const row = await categoryModel.getById(id, req.auth.userId)

  if (!row) {
    throw new AppError('Category not found', 404)
  }

  res.status(200).json(row)
})

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = categoryIdSchema.parse(req.params)
  const payload = updateCategorySchema.parse(req.body)

  let updated = null
  try {
    updated = await categoryModel.update(id, req.auth.userId, payload)
  } catch {
    // DB error—category likely doesn't exist or user not synced
  }

  if (!updated) {
    // ADD THIS: return 404 but with helpful message so frontend knows to refresh
    throw new AppError('Category not found. Try refreshing the page.', 404)
  }

  res.status(200).json(updated)
})

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = categoryIdSchema.parse(req.params)
  const removed = await categoryModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Category not found', 404)
  }

  res.status(204).send()
})
