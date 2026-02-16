// ADD THIS: centralized API route mounting
import { Router } from 'express'
import { categoryRouter } from './categoryRoutes.js'
import { transactionRouter } from './transactionRoutes.js'
import { userRouter } from './userRoutes.js'

export const apiRouter = Router()

apiRouter.use('/categories', categoryRouter)
apiRouter.use('/transactions', transactionRouter)
apiRouter.use('/users', userRouter)
