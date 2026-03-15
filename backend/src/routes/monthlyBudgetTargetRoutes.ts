import { Router } from 'express'

import {
  getMonthlyBudgetTarget,
  upsertMonthlyBudgetTarget,
} from '../controllers/monthlyBudgetTargetController.js'

export const monthlyBudgetTargetRouter = Router()

monthlyBudgetTargetRouter.get('/', getMonthlyBudgetTarget)
monthlyBudgetTargetRouter.patch('/', upsertMonthlyBudgetTarget)
