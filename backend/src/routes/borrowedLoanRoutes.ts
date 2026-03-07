import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  createBorrowedLoan,
  deleteBorrowedLoan,
  getBorrowedLoanSummary,
  listBorrowedLoans,
  markBorrowedLoanPaidOff,
  updateBorrowedLoan,
} from '../controllers/borrowedLoanController.js'

export const borrowedLoanRouter = Router()

const borrowedLoanWriteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

borrowedLoanRouter.get('/', listBorrowedLoans)
borrowedLoanRouter.get('/summary', getBorrowedLoanSummary)
borrowedLoanRouter.post('/', borrowedLoanWriteRateLimiter, createBorrowedLoan)
borrowedLoanRouter.patch('/:id', borrowedLoanWriteRateLimiter, updateBorrowedLoan)
borrowedLoanRouter.patch('/:id/paid-off', borrowedLoanWriteRateLimiter, markBorrowedLoanPaidOff)
borrowedLoanRouter.delete('/:id', borrowedLoanWriteRateLimiter, deleteBorrowedLoan)