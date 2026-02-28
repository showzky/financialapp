import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
	createSubscription,
	deleteSubscription,
	listSubscriptions,
	toggleSubscriptionStatus,
	updateSubscription,
} from '../controllers/subscriptionController.js'

export const subscriptionRouter = Router()

const subscriptionWriteRateLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
})

subscriptionRouter.get('/', listSubscriptions)
subscriptionRouter.post('/', subscriptionWriteRateLimiter, createSubscription)
subscriptionRouter.patch('/:id', subscriptionWriteRateLimiter, updateSubscription)
subscriptionRouter.delete('/:id', subscriptionWriteRateLimiter, deleteSubscription)
subscriptionRouter.patch('/:id/toggle-status', subscriptionWriteRateLimiter, toggleSubscriptionStatus)

