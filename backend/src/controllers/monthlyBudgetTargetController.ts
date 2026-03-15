import { z } from 'zod'
import type { Request, Response } from 'express'

import { env } from '../config/env.js'
import { monthlyBudgetTargetModel } from '../models/monthlyBudgetTargetModel.js'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
})

const upsertSchema = z.object({
  totalBudget: z.number().finite().nonnegative(),
})

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

function toMonthStart(month: string) {
  return `${month}-01`
}

export const getMonthlyBudgetTarget = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { month } = monthQuerySchema.parse(req.query)
  const row = await monthlyBudgetTargetModel.getByUserAndMonth(userId, toMonthStart(month))

  res.status(200).json({
    month,
    totalBudget: row?.totalBudget ?? null,
  })
})

export const upsertMonthlyBudgetTarget = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { month } = monthQuerySchema.parse(req.query)
  const { totalBudget } = upsertSchema.parse(req.body)

  const row = await monthlyBudgetTargetModel.upsert(userId, toMonthStart(month), totalBudget)

  res.status(200).json({
    month,
    totalBudget: row.totalBudget,
  })
})
