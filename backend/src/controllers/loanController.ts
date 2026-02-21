import { z } from 'zod'
import type { Request, Response } from 'express'
import { loanModel } from '../models/loanModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

// ADD THIS - robust date parsing for Zod
const dateFromString = (v: unknown) =>
  typeof v === 'string' && v.trim() ? new Date(v as string) : v

const createLoanSchema = z
  .object({
    recipient: z.string().trim().min(1).max(150),
    amount: z.number().finite().positive(),
    dateGiven: z.preprocess(dateFromString, z.date()), // ADD THIS
    expectedRepaymentDate: z.preprocess(dateFromString, z.date()), // ADD THIS
  })
  .refine((value) => value.expectedRepaymentDate >= value.dateGiven, {
    message: 'Expected repayment date must be on or after date given',
    path: ['expectedRepaymentDate'],
  })

const updateLoanSchema = z
  .object({
    recipient: z.string().trim().min(1).max(150).optional(),
    amount: z.number().finite().positive().optional(),
    dateGiven: z.preprocess(dateFromString, z.date()).optional(), // ADD THIS
    expectedRepaymentDate: z.preprocess(dateFromString, z.date()).optional(), // ADD THIS
  })
  .refine(
    (value) =>
      value.recipient !== undefined ||
      value.amount !== undefined ||
      value.dateGiven !== undefined ||
      value.expectedRepaymentDate !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

const loanIdSchema = z.object({ id: z.string().trim().min(1) })

export const listLoans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await loanModel.listByUser(req.auth.userId)
  res.status(200).json(rows)
})

export const getLoanSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const summary = await loanModel.getSummary(req.auth.userId)
  res.status(200).json(summary)
})

export const createLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = createLoanSchema.parse(req.body)

  const created = await loanModel.create({
    userId: req.auth.userId,
    recipient: payload.recipient,
    amount: payload.amount,
    dateGiven: payload.dateGiven.toISOString(), // ADD THIS
    expectedRepaymentDate: payload.expectedRepaymentDate.toISOString(), // ADD THIS
  })

  res.status(201).json(created)
})

export const updateLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = loanIdSchema.parse(req.params)
  const payload = updateLoanSchema.parse(req.body)

  const existing = await loanModel.getById(id, req.auth.userId)
  if (!existing) {
    throw new AppError('Loan not found', 404)
  }

  // normalise existing dates (already added earlier)
  const existingDateGiven = new Date(existing.dateGiven) // ADD THIS
  const existingExpectedRepaymentDate = new Date(existing.expectedRepaymentDate) // ADD THIS

  const nextDateGiven = payload.dateGiven ?? existingDateGiven
  const nextExpectedDate = payload.expectedRepaymentDate ?? existingExpectedRepaymentDate
  if (nextExpectedDate < nextDateGiven) {
    throw new AppError('Expected repayment date must be on or after date given', 400)
  }

  // ADD THIS – convert any Date objects back to strings for the model
  const updateData = {
    ...payload,
    dateGiven: payload.dateGiven?.toISOString(),
    expectedRepaymentDate: payload.expectedRepaymentDate?.toISOString(),
  }

  const updated = await loanModel.update(id, req.auth.userId, updateData)
  if (!updated) {
    throw new AppError('Loan not found', 404)
  }

  res.status(200).json(updated)
})

export const markLoanRepaid = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = loanIdSchema.parse(req.params)
  const updated = await loanModel.markRepaid(id, req.auth.userId)

  if (!updated) {
    throw new AppError('Loan not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = loanIdSchema.parse(req.params)
  const removed = await loanModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Loan not found', 404)
  }

  res.status(204).send()
})
