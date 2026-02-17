// ADD THIS: local authentication routes for personal single-user access
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { userModel } from '../models/userModel.js'
import { createLocalAuthToken, verifyLocalPassword } from '../utils/localAuth.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
})

authRouter.post('/login', async (req, res, next) => {
  try {
    if (env.AUTH_PROVIDER !== 'local') {
      res.status(400).json({ message: 'Local login is disabled' })
      return
    }

    const parsed = loginSchema.parse(req.body)
    const configuredEmail = env.LOCAL_AUTH_EMAIL?.trim().toLowerCase()

    if (!configuredEmail) {
      res.status(500).json({ message: 'Auth configuration error' })
      return
    }

    const isEmailMatch = parsed.email === configuredEmail
    const isPasswordMatch = isEmailMatch ? await verifyLocalPassword(parsed.password) : false

    if (!isEmailMatch || !isPasswordMatch) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const userId = env.LOCAL_AUTH_USER_ID
    const email = configuredEmail

    await userModel.upsertFromAuth({
      id: userId,
      email,
      displayName: env.LOCAL_AUTH_USER_NAME,
    })

    const accessToken = await createLocalAuthToken({ userId, email })

    res.status(200).json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: env.LOCAL_AUTH_JWT_EXPIRES_IN,
      user: {
        id: userId,
        email,
        displayName: env.LOCAL_AUTH_USER_NAME,
      },
    })
  } catch (error) {
    next(error)
  }
})
