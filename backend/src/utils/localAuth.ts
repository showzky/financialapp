// ADD THIS: secure local authentication helpers (scrypt + signed JWT)
import { jwtVerify, SignJWT } from 'jose'
import { env } from '../config/env.js'
import { AppError } from './appError.js'
import { verifyPasswordHash } from './passwordHash.js'

const TOKEN_ISSUER = 'financialapp-backend'
const TOKEN_AUDIENCE = 'financialapp-client'

export const verifyLocalPassword = async (plainPassword: string): Promise<boolean> => {
  if (env.AUTH_PROVIDER !== 'local' || !env.LOCAL_AUTH_PASSWORD_HASH) {
    return false
  }

  try {
    return await verifyPasswordHash(plainPassword, env.LOCAL_AUTH_PASSWORD_HASH)
  } catch {
    throw new AppError('Invalid LOCAL_AUTH_PASSWORD_HASH format', 500)
  }
}

export const createLocalAuthToken = async (payload: {
  userId: string
  email: string
}): Promise<string> => {
  if (!env.LOCAL_AUTH_JWT_SECRET) {
    throw new AppError('Missing LOCAL_AUTH_JWT_SECRET', 500)
  }

  const secret = new TextEncoder().encode(env.LOCAL_AUTH_JWT_SECRET)

  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(env.LOCAL_AUTH_JWT_EXPIRES_IN)
    .sign(secret)
}

export const verifyLocalAuthToken = async (
  token: string,
): Promise<{ userId: string; email?: string }> => {
  if (!env.LOCAL_AUTH_JWT_SECRET) {
    throw new AppError('Missing LOCAL_AUTH_JWT_SECRET', 500)
  }

  const secret = new TextEncoder().encode(env.LOCAL_AUTH_JWT_SECRET)

  const { payload } = await jwtVerify(token, secret, {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  })

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new AppError('Invalid local token subject', 401)
  }

  return {
    userId: payload.sub,
    ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
  }
}

