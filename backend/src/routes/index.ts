// ADD THIS: centralized API route mounting
import { Router } from 'express'
import { borrowedLoanRouter } from './borrowedLoanRoutes.js'
import { accountAssetRouter } from './accountAssetRoutes.js'
import { financialAccountRouter } from './financialAccountRoutes.js'
import { categoryRouter } from './categoryRoutes.js'
import { incomeEntryRouter } from './incomeEntryRoutes.js'
import { loanRouter } from './loanRoutes.js'
import { monthlyBudgetTargetRouter } from './monthlyBudgetTargetRoutes.js'
import { monthlyBudgetCategoryAssignmentRouter } from './monthlyBudgetCategoryAssignmentRoutes.js'
import { notificationRouter } from './notificationRoutes.js'
import { revolutImportStateRouter } from './revolutImportStateRoutes.js'
import { transactionRouter } from './transactionRoutes.js'
import { userRouter } from './userRoutes.js'
import { wishlistRouter } from './wishlistRoutes.js'
import { vacationRouter } from './vacationRoutes.js'
import { subscriptionRouter } from './subscriptionRoutes.js'

export const apiRouter = Router()

apiRouter.use('/borrowed-loans', borrowedLoanRouter)
apiRouter.use('/account-assets', accountAssetRouter)
apiRouter.use('/financial-accounts', financialAccountRouter)
apiRouter.use('/categories', categoryRouter)
apiRouter.use('/income-entries', incomeEntryRouter)
apiRouter.use('/loans', loanRouter)
apiRouter.use('/monthly-budget-targets', monthlyBudgetTargetRouter)
apiRouter.use('/monthly-budget-category-assignments', monthlyBudgetCategoryAssignmentRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/revolut-import-state', revolutImportStateRouter)
apiRouter.use('/transactions', transactionRouter)
apiRouter.use('/users', userRouter)
apiRouter.use('/wishlist', wishlistRouter)
apiRouter.use('/vacations', vacationRouter)
apiRouter.use('/subscriptions', subscriptionRouter)
