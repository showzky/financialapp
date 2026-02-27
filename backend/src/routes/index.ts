// ADD THIS: centralized API route mounting
import { Router } from 'express'
import { categoryRouter } from './categoryRoutes.js'
import { loanRouter } from './loanRoutes.js'
import { transactionRouter } from './transactionRoutes.js'
import { userRouter } from './userRoutes.js'
import { wishlistRouter } from './wishlistRoutes.js'
import { vacationRouter } from './vacationRoutes.js'
import { subscriptionRouter } from './subscriptionRoutes.js'

export const apiRouter = Router()

apiRouter.use('/categories', categoryRouter)
apiRouter.use('/loans', loanRouter)
apiRouter.use('/transactions', transactionRouter)
apiRouter.use('/users', userRouter)
apiRouter.use('/wishlist', wishlistRouter)
apiRouter.use('/vacations', vacationRouter)
apiRouter.use('/subscriptions', subscriptionRouter)
