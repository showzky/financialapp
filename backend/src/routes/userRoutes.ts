// ADD THIS: user route registration
import { Router } from 'express'
import {
  deleteCurrentUser,
  getCurrentUser,
  updateCurrentUser,
  upsertCurrentUser,
} from '../controllers/userController.js'

export const userRouter = Router()

userRouter.post('/me', upsertCurrentUser)
userRouter.get('/me', getCurrentUser)
userRouter.patch('/me', updateCurrentUser)
userRouter.delete('/me', deleteCurrentUser)
