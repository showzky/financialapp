// ADD THIS: transaction route registration
import { Router } from 'express'
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction,
} from '../controllers/transactionController.js'

export const transactionRouter = Router()

transactionRouter.post('/', createTransaction)
transactionRouter.get('/', listTransactions)
transactionRouter.get('/:id', getTransactionById)
transactionRouter.patch('/:id', updateTransaction)
transactionRouter.delete('/:id', deleteTransaction)
