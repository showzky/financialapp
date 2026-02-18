// ADD THIS: local authentication routes for personal single-user access
import type { Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { authCredentialModel } from '../models/authCredentialModel.js'
import { userModel } from '../models/userModel.js'
import { createLocalAuthToken } from '../utils/localAuth.js'
import { verifyPasswordHash } from '../utils/passwordHash.js'

export const authRouter = Router()

const getCookieOptions = () => ({
  // ADD THIS: hardened session cookie policy
  httpOnly: true,
  sameSite: env.LOCAL_AUTH_COOKIE_SAME_SITE,
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: env.LOCAL_AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
})

const loginSchema = z.object({
  // ADD THIS: username-style login input mapped to an email value
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
})

const sendSuccessfulLogin = async (
  res: Response,
  input: { userId: string; email: string },
) => {
  const accessToken = await createLocalAuthToken({ userId: input.userId, email: input.email })

  // ADD THIS: store session token in secure httpOnly cookie instead of exposing token to JS
  res.cookie(env.LOCAL_AUTH_COOKIE_NAME, accessToken, getCookieOptions())

  res.status(200).json({
    tokenType: 'Bearer',
    expiresIn: env.LOCAL_AUTH_JWT_EXPIRES_IN,
    user: {
      id: input.userId,
      email: input.email,
      displayName: env.LOCAL_AUTH_USER_NAME,
    },
  })
}

const syncUserProfile = async (input: { userId: string; email: string }) => {
  try {
    await userModel.upsertFromAuth({
      id: input.userId,
      email: input.email,
      displayName: env.LOCAL_AUTH_USER_NAME,
    })
  } catch {
    return
  }
}

authRouter.post('/login', async (req, res, next) => {
  try {
    if (env.AUTH_PROVIDER !== 'local') {
      res.status(400).json({ message: 'Local login is disabled' })
      return
    }

    const parsedResult = loginSchema.safeParse(req.body)
    if (!parsedResult.success) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const parsed = parsedResult.data
    const loginUsername = parsed.email
    let credentialStoreAvailable = true
    let credential = null

    try {
      credential = await authCredentialModel.getByUsername(loginUsername)
    } catch {
      credentialStoreAvailable = false
    }

    // ADD THIS: optional bootstrap from env for first-time setup
    const bootstrapUsername = env.APP_USERNAME?.trim().toLowerCase()
    if (!credential && bootstrapUsername && env.APP_PASSWORD_HASH && bootstrapUsername === loginUsername) {
      const isBootstrapPasswordMatch = await verifyPasswordHash(parsed.password, env.APP_PASSWORD_HASH)
      if (isBootstrapPasswordMatch) {
        await syncUserProfile({
          userId: env.LOCAL_AUTH_USER_ID,
          email: bootstrapUsername,
        })

        if (credentialStoreAvailable) {
          try {
            credential = await authCredentialModel.upsert({
              userId: env.LOCAL_AUTH_USER_ID,
              username: bootstrapUsername,
              passwordHash: env.APP_PASSWORD_HASH,
            })
          } catch {
            credentialStoreAvailable = false
          }
        }

        if (!credentialStoreAvailable) {
          await sendSuccessfulLogin(res, {
            userId: env.LOCAL_AUTH_USER_ID,
            email: bootstrapUsername,
          })
          return
        }
      }
    }

    if (!credential) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    if (credential.userId !== env.LOCAL_AUTH_USER_ID) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const isPasswordMatch = await verifyPasswordHash(parsed.password, credential.passwordHash)
    if (!isPasswordMatch) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const userId = credential.userId
    const email = credential.username

    await syncUserProfile({ userId, email })

    await sendSuccessfulLogin(res, { userId, email })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', (req, res) => {
  // ADD THIS: clear auth cookie on explicit logout
  res.clearCookie(env.LOCAL_AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: env.LOCAL_AUTH_COOKIE_SAME_SITE,
    secure: env.NODE_ENV === 'production',
    path: '/',
  })

  res.status(204).send()
})
