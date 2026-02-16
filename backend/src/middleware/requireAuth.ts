// ADD THIS: Supabase JWT verification middleware using JWKS
import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../config/env.js'
import { AppError } from '../utils/appError.js'

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

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = parseBearerToken(req.header('authorization'))

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

    next()
  } catch (error) {
    next(error)
  }
}
