import { Router } from 'express'
import { listSubscriptions } from '../controllers/subscriptionController.js'

export const subscriptionRouter = Router()

subscriptionRouter.get('/', listSubscriptions)

