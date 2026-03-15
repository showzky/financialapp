import { Router } from 'express'
import {
  createIncomeEntry,
  deleteIncomeEntry,
  getIncomeEntryById,
  listIncomeEntries,
  updateIncomeEntry,
} from '../controllers/incomeEntryController.js'

export const incomeEntryRouter = Router()

incomeEntryRouter.post('/', createIncomeEntry)
incomeEntryRouter.get('/', listIncomeEntries)
incomeEntryRouter.get('/:id', getIncomeEntryById)
incomeEntryRouter.patch('/:id', updateIncomeEntry)
incomeEntryRouter.delete('/:id', deleteIncomeEntry)
