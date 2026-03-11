import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { db } from '../config/db.js'
import { authCredentialModel } from '../models/authCredentialModel.js'
import { authSettingsModel } from '../models/authSettingsModel.js'
import { userModel } from '../models/userModel.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { AppError } from '../utils/appError.js'
import { createLocalAuthToken } from '../utils/localAuth.js'
import { createPasswordHash, verifyPasswordHash } from '../utils/passwordHash.js'

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
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
})

const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(100),
})

const updateAuthSettingsSchema = z.object({
  publicRegistrationEnabled: z.boolean(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
})

const isBootstrapAdmin = (req: Request): boolean => {
  return req.auth?.userId === env.LOCAL_AUTH_USER_ID
}

const resolveDisplayNameFromEmail = (email: string): string => {
  const candidate = email.split('@')[0]?.trim()
  return candidate && candidate.length > 0 ? candidate : 'User'
}

const sendSuccessfulLogin = async (
  res: Response,
  input: { userId: string; email: string; displayName: string },
) => {
  const accessToken = await createLocalAuthToken({ userId: input.userId, email: input.email })

  res.cookie(env.LOCAL_AUTH_COOKIE_NAME, accessToken, getCookieOptions())

  res.status(200).json({
    tokenType: 'Bearer',
    expiresIn: env.LOCAL_AUTH_JWT_EXPIRES_IN,
    user: {
      id: input.userId,
      email: input.email,
      displayName: input.displayName,
    },
  })
}

const syncUserProfile = async (input: {
  userId: string
  email: string
  displayName: string
  preserveExistingDisplayName?: boolean
}) => {
  try {
    if (input.preserveExistingDisplayName) {
      const existing = await userModel.getById(input.userId)
      if (existing) {
        return existing
      }
    }

    await userModel.upsertFromAuth({
      id: input.userId,
      email: input.email,
      displayName: input.displayName,
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
    if (
      !credential &&
      bootstrapUsername &&
      env.APP_PASSWORD_HASH &&
      bootstrapUsername === loginUsername
    ) {
      const isBootstrapPasswordMatch = await verifyPasswordHash(
        parsed.password,
        env.APP_PASSWORD_HASH,
      )
      if (isBootstrapPasswordMatch) {
        await syncUserProfile({
          userId: env.LOCAL_AUTH_USER_ID,
          email: bootstrapUsername,
          displayName: 'Andre',
          preserveExistingDisplayName: true,
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
            displayName: 'Andre',
          })
          return
        }
      }
    }

    if (!credential) {
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

    const existingUser = await userModel.getById(userId)
    const fallbackDisplayName =
      userId === env.LOCAL_AUTH_USER_ID ? 'Andre' : resolveDisplayNameFromEmail(email)
    const displayName = existingUser?.displayName?.trim() || fallbackDisplayName

    await syncUserProfile({ userId, email, displayName, preserveExistingDisplayName: true })

    await sendSuccessfulLogin(res, { userId, email, displayName })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/register-status', async (_req, res, next) => {
  try {
    if (env.AUTH_PROVIDER !== 'local') {
      res.status(200).json({ publicRegistrationEnabled: false })
      return
    }

    const settings = await authSettingsModel.get()
    res.status(200).json(settings)
  } catch (error) {
    next(error)
  }
})

authRouter.post('/register', async (req, res, next) => {
  try {
    if (env.AUTH_PROVIDER !== 'local') {
      res.status(400).json({ message: 'Local registration is disabled' })
      return
    }

    const settings = await authSettingsModel.get()
    if (!settings.publicRegistrationEnabled) {
      res.status(403).json({ message: 'Public registration is currently disabled' })
      return
    }

    const parsedResult = registerSchema.safeParse(req.body)
    if (!parsedResult.success) {
      res.status(400).json({ message: 'Invalid registration payload', issues: parsedResult.error.flatten() })
      return
    }

    const payload = parsedResult.data

    const existingByEmail = await userModel.getByEmail(payload.email)
    if (existingByEmail) {
      res.status(409).json({ message: 'An account with this email already exists' })
      return
    }

    const existingCredential = await authCredentialModel.getByUsername(payload.email)
    if (existingCredential) {
      res.status(409).json({ message: 'An account with this email already exists' })
      return
    }

    const userId = randomUUID()
    const passwordHash = await createPasswordHash(payload.password)

    try {
      await db.transaction(async (query) => {
        await query(
          `
          INSERT INTO users (id, email, display_name, monthly_income)
          VALUES ($1, $2, $3, 0)
          `,
          [userId, payload.email, payload.displayName],
        )

        await query(
          `
          INSERT INTO auth_credentials (user_id, username, password_hash)
          VALUES ($1, $2, $3)
          `,
          [userId, payload.email, passwordHash],
        )
      })
    } catch (error) {
      const databaseError = error as { code?: string }
      if (databaseError.code === '23505') {
        res.status(409).json({ message: 'An account with this email already exists' })
        return
      }

      throw error
    }

    await sendSuccessfulLogin(res, {
      userId,
      email: payload.email,
      displayName: payload.displayName,
    })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/settings', requireAuth, async (req, res, next) => {
  try {
    if (!isBootstrapAdmin(req)) {
      throw new AppError('Only bootstrap admin can access auth settings', 403)
    }

    const settings = await authSettingsModel.get()
    res.status(200).json(settings)
  } catch (error) {
    next(error)
  }
})

authRouter.patch('/settings', requireAuth, async (req, res, next) => {
  try {
    if (!isBootstrapAdmin(req)) {
      throw new AppError('Only bootstrap admin can update auth settings', 403)
    }

    const payload = updateAuthSettingsSchema.parse(req.body)
    const updated = await authSettingsModel.update(payload)
    res.status(200).json(updated)
  } catch (error) {
    next(error)
  }
})

authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401)
    }

    if (env.AUTH_PROVIDER !== 'local') {
      throw new AppError('Password changes are only available for local auth', 400)
    }

    const payload = changePasswordSchema.parse(req.body)
    const credential = await authCredentialModel.getByUserId(req.auth.userId)

    if (!credential) {
      throw new AppError('Credential not found', 404)
    }

    const isPasswordMatch = await verifyPasswordHash(payload.currentPassword, credential.passwordHash)
    if (!isPasswordMatch) {
      throw new AppError('Current password is incorrect', 400)
    }

    const nextPasswordHash = await createPasswordHash(payload.newPassword)
    await authCredentialModel.updateByUserId(req.auth.userId, { passwordHash: nextPasswordHash })

    res.status(204).send()
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
