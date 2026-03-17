import { Router } from 'express'
import {
  adjustFinancialAccountBalance,
  createAccountCategory,
  createFinancialAccount,
  deleteFinancialAccount,
  listAccountCategories,
  listFinancialAccountActivity,
  listFinancialAccounts,
  moveAccountCategoryToBottom,
  renameAccountCategory,
  updateFinancialAccount,
} from '../controllers/financialAccountController.js'

export const financialAccountRouter = Router()

financialAccountRouter.get('/categories', listAccountCategories)
financialAccountRouter.post('/categories', createAccountCategory)
financialAccountRouter.patch('/categories/:id', renameAccountCategory)
financialAccountRouter.post('/categories/:id/move-to-bottom', moveAccountCategoryToBottom)
financialAccountRouter.get('/', listFinancialAccounts)
financialAccountRouter.post('/', createFinancialAccount)
financialAccountRouter.get('/:id/activity', listFinancialAccountActivity)
financialAccountRouter.post('/:id/adjust-balance', adjustFinancialAccountBalance)
financialAccountRouter.patch('/:id', updateFinancialAccount)
financialAccountRouter.delete('/:id', deleteFinancialAccount)
