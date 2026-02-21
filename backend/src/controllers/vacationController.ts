import { z } from 'zod'
import type { Request, Response } from 'express'
import { vacationModel } from '../models/vacationModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const expenseCategories = ['flights', 'food', 'hotel', 'miscellaneous'] as const
type ExpenseCategory = (typeof expenseCategories)[number]

const normalizeExpenseCategory = (value: string): ExpenseCategory => {
  const normalized = value.trim().toLowerCase()
  return expenseCategories.includes(normalized as ExpenseCategory)
    ? (normalized as ExpenseCategory)
    : 'miscellaneous'
}

const buildDescriptionWithCustomCategory = (
  description: string | undefined,
  rawCategory: string,
): string | undefined => {
  const normalized = rawCategory.trim().toLowerCase()
  const isKnown = expenseCategories.includes(normalized as ExpenseCategory)
  if (isKnown) {
    return description
  }

  const customLabel = rawCategory.trim()
  const customPrefix = `[Custom Category: ${customLabel}]`
  return description?.trim() ? `${customPrefix} ${description.trim()}` : customPrefix
}

const idSchema = z.object({ id: z.string().trim().min(1) })

const createVacationSchema = z.object({
  name: z.string().trim().min(1),
  targetAmount: z.number().finite().positive(),
  startDate: z.string().trim().date(),
  endDate: z.string().trim().date(),
})

const addFundsSchema = z.object({ amount: z.number().finite().positive() })
const adjustFundsSchema = z.object({
  deltaAmount: z
    .number()
    .finite()
    .refine((value) => value !== 0, 'Adjustment must be non-zero'),
  note: z.string().trim().max(200).optional(),
})

const createExpenseSchema = z.object({
  category: z.string().trim().min(1),
  amount: z.number().finite().positive(),
  description: z.string().trim().optional(),
  date: z.string().trim().date(),
})

const updateExpenseSchema = z.object({
  category: z.string().trim().min(1).optional(),
  amount: z.number().finite().positive().optional(),
  description: z.string().trim().optional().nullable(),
  date: z.string().trim().date().optional(),
})

const expenseIdSchema = z.object({ expenseId: z.string().trim().min(1) })

// VACATION FUND HANDLERS
export const listVacations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)
  const rows = await vacationModel.listByUser(req.auth.userId)
  res.status(200).json(rows)
})

export const createVacation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)
  const payload = createVacationSchema.parse(req.body)
  const created = await vacationModel.create({ ...payload, userId: req.auth.userId })
  res.status(201).json(created)
})

export const addFunds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)
  const { id } = idSchema.parse(req.params)
  const { amount } = addFundsSchema.parse(req.body)
  // ensure vacation belongs to user
  const vac = await vacationModel.getById(id, req.auth.userId)
  if (!vac) throw new AppError('Vacation not found', 404)
  const updated = await vacationModel.addFunds(id, req.auth.userId, amount)
  res.status(200).json(updated)
})

export const adjustFunds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)

  const { id } = idSchema.parse(req.params)
  const { deltaAmount } = adjustFundsSchema.parse(req.body)
  const vac = await vacationModel.getById(id, req.auth.userId)
  if (!vac) throw new AppError('Vacation not found', 404)

  const updated = await vacationModel.adjustFunds(id, req.auth.userId, deltaAmount)
  if (!updated) {
    throw new AppError('Insufficient funds for this correction', 400)
  }

  res.status(200).json(updated)
})

// EXPENSE HANDLERS
export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)
  const { id } = idSchema.parse(req.params)
  const vac = await vacationModel.getById(id, req.auth.userId)
  if (!vac) throw new AppError('Vacation not found', 404)
  const rows = await vacationModel.listExpenses(id)
  res.status(200).json(rows)
})

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)
  const { id } = idSchema.parse(req.params)
  const vac = await vacationModel.getById(id, req.auth.userId)
  if (!vac) throw new AppError('Vacation not found', 404)
  const payload = createExpenseSchema.parse(req.body)
  const normalizedCategory = normalizeExpenseCategory(payload.category)
  const normalizedDescription = buildDescriptionWithCustomCategory(
    payload.description,
    payload.category,
  )
  const created = await vacationModel.createExpense({
    vacationId: id,
    category: normalizedCategory,
    amount: payload.amount,
    description: normalizedDescription,
    date: payload.date,
  })
  res.status(201).json(created)
})

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)
  const { id } = idSchema.parse(req.params)
  const { expenseId } = expenseIdSchema.parse(req.params)
  const vac = await vacationModel.getById(id, req.auth.userId)
  if (!vac) throw new AppError('Vacation not found', 404)
  const payload = updateExpenseSchema.parse(req.body)
  const updated = await vacationModel.updateExpense(expenseId, id, {
    category: payload.category ? normalizeExpenseCategory(payload.category) : undefined,
    amount: payload.amount,
    description:
      payload.category !== undefined
        ? buildDescriptionWithCustomCategory(
            payload.description === null ? undefined : payload.description,
            payload.category,
          )
        : payload.description,
    date: payload.date,
  })
  if (!updated) throw new AppError('Expense not found', 404)
  res.status(200).json(updated)
})

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401)
  const { id } = idSchema.parse(req.params)
  const { expenseId } = expenseIdSchema.parse(req.params)
  const vac = await vacationModel.getById(id, req.auth.userId)
  if (!vac) throw new AppError('Vacation not found', 404)
  const removed = await vacationModel.deleteExpense(expenseId, id)
  if (!removed) throw new AppError('Expense not found', 404)
  res.status(204).send()
})
