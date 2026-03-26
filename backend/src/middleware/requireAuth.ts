// ADD THIS: Supabase JWT verification middleware using JWKS
import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../config/env.js'
import { userModel } from '../models/userModel.js'
import { refreshLocalSession } from '../services/localSessionService.js'
import { AppError } from '../utils/appError.js'
import { applyLocalAuthCookies } from '../utils/localAuthCookies.js'
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

const parseLocalRefreshCookie = (req: Request): string | null => {
  const refreshCookie = req.cookies?.[env.LOCAL_AUTH_REFRESH_COOKIE_NAME]
  if (typeof refreshCookie === 'string' && refreshCookie.trim().length > 0) {
    return refreshCookie
  }

  return null
}

const isLocalhostRequest = (req: Request): boolean => {
  const hostHeader = req.get('host')?.toLowerCase() ?? ''
  const hostname = req.hostname?.toLowerCase() ?? ''
  const forwardedHost = req.get('x-forwarded-host')?.toLowerCase() ?? ''

  const hostsToCheck = [hostHeader, hostname, forwardedHost]

  return hostsToCheck.some(
    (value) =>
      value === 'localhost' ||
      value.startsWith('localhost:') ||
      value === '127.0.0.1' ||
      value.startsWith('127.0.0.1:') ||
      value === '[::1]' ||
      value.startsWith('[::1]:'),
  )
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authorizationHeader = req.header('authorization')

    if (env.AUTH_PROVIDER === 'local') {
      if (authorizationHeader) {
        const token = parseBearerToken(authorizationHeader)
        req.auth = await verifyLocalAuthToken(token)
      } else {
        const cookieToken = req.cookies?.[env.LOCAL_AUTH_COOKIE_NAME]
        let verifiedCookieAuth: { userId: string; email?: string } | null = null

        if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
          try {
            verifiedCookieAuth = await verifyLocalAuthToken(cookieToken)
          } catch {
            verifiedCookieAuth = null
          }
        }

        if (!verifiedCookieAuth) {
          const refreshCookie = parseLocalRefreshCookie(req)
          if (!refreshCookie) {
            throw new AppError('Missing authorization token', 401)
          }

          const session = await refreshLocalSession(refreshCookie)
          applyLocalAuthCookies(_res, session)
          req.auth = {
            userId: session.userId,
            email: session.email,
          }
        } else {
          req.auth = verifiedCookieAuth
        }
      }
    } else if (!authorizationHeader) {
      const canBypassDevAuth =
        env.NODE_ENV !== 'production' && env.ALLOW_DEV_AUTH_BYPASS && isLocalhostRequest(req)

      if (!canBypassDevAuth) {
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

    // Only create a fallback profile row when missing; do not overwrite saved account fields.
    try {
      const authUserId = req.auth.userId
      const existingUser = await userModel.getById(authUserId)

      if (!existingUser) {
        await userModel.upsertFromAuth({
          id: authUserId,
          email: req.auth.email ?? `${authUserId}@financetracker.local`,
          displayName: req.auth.email
            ? req.auth.email.split('@')[0] || env.DEV_USER_NAME
            : env.DEV_USER_NAME,
        })
      }
    } catch {
      // Profile sync failed; continue anyway since auth itself succeeded.
    }

    next()
  } catch (error) {
    next(error)
  }
}
