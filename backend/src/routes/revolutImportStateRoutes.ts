import { Router } from 'express'
import {
  deleteRevolutImportState,
  getRevolutImportState,
  upsertRevolutImportState,
} from '../controllers/revolutImportStateController.js'

export const revolutImportStateRouter = Router()

revolutImportStateRouter.get('/', getRevolutImportState)
revolutImportStateRouter.put('/', upsertRevolutImportState)
revolutImportStateRouter.delete('/', deleteRevolutImportState)
