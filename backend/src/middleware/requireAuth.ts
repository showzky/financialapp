// ADD THIS: Supabase JWT verification middleware using JWKS
import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../config/env.js'
import { userModel } from '../models/userModel.js'
import { AppError } from '../utils/appError.js'
import { verifyLocalAuthToken } from '../utils/localAuth.js'

const issuer = env.SUPABASE_JWT_ISSUER ?? `${env.SUPABASE_URL}/auth/v1`
const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

const parseBearerToken = (authorizationHeader: string | undefined): string => {
  if (!authorizationHeader) {
    throw new AppError('Missing authorization header', 401)
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Invalid authorization header format', 401)
  }

  return token
}

const parseLocalAuthToken = (req: Request): string => {
  const authorizationHeader = req.header('authorization')

  if (authorizationHeader) {
    return parseBearerToken(authorizationHeader)
  }

  const cookieToken = req.cookies?.[env.LOCAL_AUTH_COOKIE_NAME]
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return cookieToken
  }

  throw new AppError('Missing authorization token', 401)
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorizationHeader = req.header('authorization')

    if (env.AUTH_PROVIDER === 'local') {
      const token = parseLocalAuthToken(req)
      req.auth = await verifyLocalAuthToken(token)
    } else if (!authorizationHeader) {
      if (env.NODE_ENV === 'production' || !env.ALLOW_DEV_AUTH_BYPASS) {
        throw new AppError('Missing authorization header', 401)
      }

      req.auth = {
        userId: env.DEV_USER_ID,
        email: env.DEV_USER_EMAIL,
      }
    } else {
      const token = parseBearerToken(authorizationHeader)

      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: env.SUPABASE_JWT_AUDIENCE,
      })

      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new AppError('Invalid token subject', 401)
      }

      req.auth =
        typeof payload.email === 'string'
          ? {
              userId: payload.sub,
              email: payload.email,
            }
          : {
              userId: payload.sub,
            }
    }

    // ADD THIS: sync user profile but don't fail auth if DB is unavailable
    try {
      const authUserId = req.auth.userId
      await userModel.upsertFromAuth({
        id: authUserId,
        email: req.auth.email ?? `${authUserId}@financetracker.local`,
        displayName: req.auth.email ? req.auth.email.split('@')[0] || env.DEV_USER_NAME : env.DEV_USER_NAME,
      })
    } catch {
      // Profile sync failed—continue anyway since auth itself succeeded
    }

    next()
  } catch (error) {
    next(error)
  }
}
