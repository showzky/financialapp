import { Router } from 'express'

import {
  deleteMonthlyBudgetCategoryAssignment,
  listMonthlyBudgetCategoryAssignments,
  upsertMonthlyBudgetCategoryAssignment,
} from '../controllers/monthlyBudgetCategoryAssignmentController.js'

export const monthlyBudgetCategoryAssignmentRouter = Router()

monthlyBudgetCategoryAssignmentRouter.get('/', listMonthlyBudgetCategoryAssignments)
monthlyBudgetCategoryAssignmentRouter.patch('/:categoryId', upsertMonthlyBudgetCategoryAssignment)
monthlyBudgetCategoryAssignmentRouter.delete('/:categoryId', deleteMonthlyBudgetCategoryAssignment)
