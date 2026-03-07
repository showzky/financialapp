import type { Request, Response } from 'express'
import { borrowedLoanModel } from '../models/borrowedLoanModel.js'
import {
  borrowedLoanIdSchema,
  createBorrowedLoanSchema,
  updateBorrowedLoanSchema,
} from '../schemas/borrowedLoanSchema.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

export const listBorrowedLoans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await borrowedLoanModel.listByUser(req.auth.userId)
  res.status(200).json(rows)
})

export const getBorrowedLoanSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const summary = await borrowedLoanModel.getSummary(req.auth.userId)
  res.status(200).json(summary)
})

export const createBorrowedLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = createBorrowedLoanSchema.parse(req.body)

  const created = await borrowedLoanModel.create({
    userId: req.auth.userId,
    lender: payload.lender,
    originalAmount: payload.originalAmount,
    currentBalance: payload.currentBalance,
    payoffDate: payload.payoffDate,
    notes: payload.notes ?? null,
  })

  res.status(201).json(created)
})

export const updateBorrowedLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = borrowedLoanIdSchema.parse(req.params)
  const payload = updateBorrowedLoanSchema.parse(req.body)

  const existing = await borrowedLoanModel.getById(id, req.auth.userId)
  if (!existing) {
    throw new AppError('Borrowed loan not found', 404)
  }

  if (existing.status === 'paid_off') {
    throw new AppError('Paid-off borrowed loans cannot be edited', 400)
  }

  const nextOriginalAmount = payload.originalAmount ?? existing.originalAmount
  const nextCurrentBalance = payload.currentBalance ?? existing.currentBalance
  if (nextCurrentBalance > nextOriginalAmount) {
    throw new AppError('Current balance cannot exceed original amount', 400)
  }

  const updated = await borrowedLoanModel.update(id, req.auth.userId, payload)
  if (!updated) {
    throw new AppError('Borrowed loan not found', 404)
  }

  res.status(200).json(updated)
})

export const markBorrowedLoanPaidOff = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = borrowedLoanIdSchema.parse(req.params)
  const updated = await borrowedLoanModel.markPaidOff(id, req.auth.userId)
  if (!updated) {
    throw new AppError('Borrowed loan not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteBorrowedLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = borrowedLoanIdSchema.parse(req.params)
  const existing = await borrowedLoanModel.getById(id, req.auth.userId)

  if (!existing) {
    throw new AppError('Borrowed loan not found', 404)
  }

  if (existing.status !== 'paid_off') {
    throw new AppError('Only paid-off borrowed loans can be deleted', 400)
  }

  const removed = await borrowedLoanModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Borrowed loan not found', 404)
  }

  res.status(204).send()
})