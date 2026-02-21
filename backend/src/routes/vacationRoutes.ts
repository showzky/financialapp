import { Router } from 'express'
import {
  listVacations,
  createVacation,
  addFunds,
  adjustFunds,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/vacationController.js'

export const vacationRouter = Router()

vacationRouter.get('/', listVacations)
vacationRouter.post('/', createVacation)
vacationRouter.patch('/:id/add-funds', addFunds)
vacationRouter.patch('/:id/adjust-funds', adjustFunds)

vacationRouter.get('/:id/expenses', listExpenses)
vacationRouter.post('/:id/expenses', createExpense)
vacationRouter.patch('/:id/expenses/:expenseId', updateExpense)
vacationRouter.delete('/:id/expenses/:expenseId', deleteExpense)
