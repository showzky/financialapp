import { AppError } from '../utils/appError.js'
import {
  createLocalAuthToken,
  createLocalRefreshToken,
  hashLocalRefreshToken,
} from '../utils/localAuth.js'
import { env } from '../config/env.js'
import { authCredentialModel } from '../models/authCredentialModel.js'
import { authRefreshTokenModel } from '../models/authRefreshTokenModel.js'
import { userModel } from '../models/userModel.js'

export type LocalSession = {
  userId: string
  email: string
  accessToken: string
  refreshToken: string
  expiresIn: string
  refreshTokenExpiresAt: string
}

const createRefreshExpiryDate = (): Date => {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.LOCAL_AUTH_COOKIE_MAX_AGE_DAYS)
  return expiresAt
}

const resolveSessionEmail = async (userId: string): Promise<string> => {
  const user = await userModel.getById(userId)
  if (user?.email?.trim()) {
    return user.email.trim().toLowerCase()
  }

  const credential = await authCredentialModel.getByUserId(userId)
  if (credential?.username?.trim()) {
    return credential.username.trim().toLowerCase()
  }

  throw new AppError('Unable to resolve session user', 401)
}

export const issueLocalSession = async (input: {
  userId: string
  email: string
}): Promise<LocalSession> => {
  const normalizedEmail = input.email.trim().toLowerCase()
  const accessToken = await createLocalAuthToken({ userId: input.userId, email: normalizedEmail })
  const refreshToken = createLocalRefreshToken()
  const refreshTokenExpiresAt = createRefreshExpiryDate()

  await authRefreshTokenModel.create({
    userId: input.userId,
    tokenHash: hashLocalRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiresAt.toISOString(),
  })

  return {
    userId: input.userId,
    email: normalizedEmail,
    accessToken,
    refreshToken,
    expiresIn: env.LOCAL_AUTH_JWT_EXPIRES_IN,
    refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
  }
}

export const refreshLocalSession = async (refreshToken: string): Promise<LocalSession> => {
  const normalizedRefreshToken = refreshToken.trim()
  if (normalizedRefreshToken.length < 32) {
    throw new AppError('Invalid refresh token', 401)
  }

  const currentTokenHash = hashLocalRefreshToken(normalizedRefreshToken)
  const currentToken = await authRefreshTokenModel.getActiveByTokenHash(currentTokenHash)
  if (!currentToken) {
    throw new AppError('Refresh token is invalid or expired', 401)
  }

  const email = await resolveSessionEmail(currentToken.userId)
  const nextRefreshToken = createLocalRefreshToken()
  const refreshTokenExpiresAt = createRefreshExpiryDate()

  await authRefreshTokenModel.rotate({
    currentTokenHash,
    nextTokenHash: hashLocalRefreshToken(nextRefreshToken),
    userId: currentToken.userId,
    nextExpiresAt: refreshTokenExpiresAt.toISOString(),
  })

  const accessToken = await createLocalAuthToken({
    userId: currentToken.userId,
    email,
  })

  return {
    userId: currentToken.userId,
    email,
    accessToken,
    refreshToken: nextRefreshToken,
    expiresIn: env.LOCAL_AUTH_JWT_EXPIRES_IN,
    refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
  }
}

export const revokeLocalSession = async (refreshToken: string): Promise<void> => {
  const normalizedRefreshToken = refreshToken.trim()
  if (normalizedRefreshToken.length === 0) {
    return
  }

  await authRefreshTokenModel.revokeByTokenHash(hashLocalRefreshToken(normalizedRefreshToken))
}

export const revokeAllLocalSessionsForUser = async (userId: string): Promise<void> => {
  await authRefreshTokenModel.revokeAllByUserId(userId)
}