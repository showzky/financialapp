// ADD THIS: category controllers with input validation and safe responses
import { z } from 'zod'
import type { Request, Response } from 'express'
import { categoryModel } from '../models/categoryModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

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

  const payload = createCategorySchema.parse(req.body)
  const created = await categoryModel.create({ ...payload, userId: req.auth.userId })

  res.status(201).json(created)
})

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await categoryModel.listByUser(req.auth.userId)

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

  const updated = await categoryModel.update(id, req.auth.userId, payload)
  if (!updated) {
    throw new AppError('Category not found', 404)
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
