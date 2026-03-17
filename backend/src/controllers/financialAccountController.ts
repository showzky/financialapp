import { z } from 'zod'
import type { Request, Response } from 'express'
import { db } from '../config/db.js'
import { env } from '../config/env.js'
import { accountBalanceAdjustmentModel } from '../models/accountBalanceAdjustmentModel.js'
import { accountCategoryModel } from '../models/accountCategoryModel.js'
import { financialAccountModel, type FinancialAccountIcon, type UpdateFinancialAccountInput } from '../models/financialAccountModel.js'
import { incomeEntryModel } from '../models/incomeEntryModel.js'
import { transactionModel } from '../models/transactionModel.js'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const accountReminderSchema = z.union([
  z.object({ type: z.literal('none') }),
  z.object({
    type: z.literal('preset'),
    label: z.string().trim().min(1).max(120),
  }),
  z.object({
    type: z.literal('custom'),
    quantity: z.number().int().min(1).max(52),
    unit: z.enum(['days', 'weeks']),
    hour: z.number().int().min(0).max(23),
    label: z.string().trim().min(1).max(120),
  }),
])

const accountIconSchema = z
  .object({
    kind: z.enum(['preset', 'company', 'image']),
    label: z.string().trim().min(1).max(120),
    imageUrl: z.string().trim().url().nullable().optional(),
    companyQuery: z.string().trim().max(120).nullable().optional(),
  })
  .nullable()

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
})

const renameCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
})

const categoryIdSchema = z.object({
  id: z.string().trim().min(1),
})

const createAccountSchema = z.object({
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  mode: z.enum(['credit', 'balance']),
  amount: z.number().finite(),
  creditLimit: z.number().finite().nullable(),
  paymentDayOfMonth: z.number().int().min(1).max(31).nullable(),
  reminder: accountReminderSchema,
  icon: accountIconSchema,
  accountType: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(32),
  notes: z.string().max(600),
})

const updateAccountSchema = createAccountSchema.partial().refine(
  (value) =>
    value.categoryId !== undefined ||
    value.name !== undefined ||
    value.mode !== undefined ||
    value.amount !== undefined ||
    value.creditLimit !== undefined ||
    value.paymentDayOfMonth !== undefined ||
    value.reminder !== undefined ||
    value.icon !== undefined ||
    value.accountType !== undefined ||
    value.color !== undefined ||
    value.notes !== undefined,
  { message: 'At least one field must be provided' },
)

const accountIdSchema = z.object({
  id: z.string().trim().min(1),
})

const adjustBalanceSchema = z.object({
  nextAmount: z.number().finite(),
})

async function ensureUserExists(req: Request) {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const existingUser = await userModel.getById(req.auth.userId)
  if (existingUser) {
    return
  }

  await userModel.upsertFromAuth({
    id: req.auth.userId,
    email: req.auth.email ?? `${req.auth.userId}@financetracker.local`,
    displayName: req.auth.email?.split('@')[0] ?? env.LOCAL_AUTH_USER_NAME,
  })
}

export const listAccountCategories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  await ensureUserExists(req)
  const categories = await accountCategoryModel.listByUser(req.auth.userId)
  res.status(200).json(categories)
})

export const createAccountCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  await ensureUserExists(req)
  const payload = createCategorySchema.parse(req.body)
  const category = await accountCategoryModel.create(req.auth.userId, payload.name)
  res.status(201).json(category)
})

export const renameAccountCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = categoryIdSchema.parse(req.params)
  const { name } = renameCategorySchema.parse(req.body)
  const category = await accountCategoryModel.rename(id, req.auth.userId, name)

  if (!category) {
    throw new AppError('Category not found', 404)
  }

  res.status(200).json(category)
})

export const moveAccountCategoryToBottom = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = categoryIdSchema.parse(req.params)
  const category = await accountCategoryModel.moveToBottom(id, req.auth.userId)

  if (!category) {
    throw new AppError('Category not found', 404)
  }

  res.status(200).json(category)
})

export const listFinancialAccounts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const accounts = await financialAccountModel.listByUser(req.auth.userId)
  res.status(200).json(accounts)
})

export const createFinancialAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  await ensureUserExists(req)
  const payload = createAccountSchema.parse(req.body)
  const account = await financialAccountModel.create({
    userId: req.auth.userId,
    ...payload,
    icon: payload.icon as FinancialAccountIcon,
  })
  res.status(201).json(account)
})

export const updateFinancialAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = accountIdSchema.parse(req.params)
  const payload = updateAccountSchema.parse(req.body)
  const account = await financialAccountModel.update(id, req.auth.userId, payload as UpdateFinancialAccountInput)

  if (!account) {
    throw new AppError('Account not found', 404)
  }

  res.status(200).json(account)
})

export const deleteFinancialAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = accountIdSchema.parse(req.params)
  const removed = await financialAccountModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Account not found', 404)
  }

  res.status(204).send()
})

export const adjustFinancialAccountBalance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = accountIdSchema.parse(req.params)
  const payload = adjustBalanceSchema.parse(req.body)
  const existing = await financialAccountModel.getById(id, req.auth.userId)

  if (!existing) {
    throw new AppError('Account not found', 404)
  }

  const amountDelta = payload.nextAmount - existing.amount

  await db.transaction(async (query) => {
    await query(
      `
      UPDATE financial_accounts
      SET
        amount = $3,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      `,
      [id, req.auth!.userId, payload.nextAmount],
    )

    if (amountDelta !== 0) {
      await query(
        `
        INSERT INTO account_balance_adjustments (user_id, account_id, amount_delta, target_amount)
        VALUES ($1, $2, $3, $4)
        `,
        [req.auth!.userId, id, amountDelta, payload.nextAmount],
      )
    }
  })

  const account = await financialAccountModel.getById(id, req.auth.userId)
  if (!account) {
    throw new AppError('Failed to update account balance', 500)
  }

  res.status(200).json(account)
})

export const listFinancialAccountActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = accountIdSchema.parse(req.params)
  const account = await financialAccountModel.getById(id, req.auth.userId)
  if (!account) {
    throw new AppError('Account not found', 404)
  }

  const [adjustments, transactions, incomes] = await Promise.all([
    accountBalanceAdjustmentModel.listByAccount(req.auth.userId, id),
    transactionModel.listByAccount(req.auth.userId, id),
    incomeEntryModel.listByAccount(req.auth.userId, id),
  ])

  const activity = [
    ...adjustments.map((entry) => ({
      id: entry.id,
      type: 'balance_adjustment' as const,
      title: 'Balance adjustment',
      subtitle: null,
      amount: entry.amountDelta,
      createdAt: entry.createdAt,
      isPaid: true,
    })),
    ...transactions.map((entry) => ({
      id: entry.id,
      type: 'expense' as const,
      title: entry.note?.trim() || entry.categoryName || 'Expense',
      subtitle: entry.categoryName,
      amount: -Math.abs(entry.amount),
      createdAt: entry.transactionDate,
      isPaid: entry.isPaid,
    })),
    ...incomes.map((entry) => ({
      id: entry.id,
      type: 'income' as const,
      title: entry.name?.trim() || entry.category,
      subtitle: entry.category,
      amount: Math.abs(entry.amount),
      createdAt: entry.receivedAt,
      isPaid: entry.isPaid,
    })),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

  res.status(200).json(activity)
})
