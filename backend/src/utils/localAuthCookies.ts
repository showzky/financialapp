import type { Response } from 'express'
import { env } from '../config/env.js'
import type { LocalSession } from '../services/localSessionService.js'

const baseCookieOptions = {
  httpOnly: true,
  sameSite: env.LOCAL_AUTH_COOKIE_SAME_SITE,
  secure: env.NODE_ENV === 'production',
  path: '/',
} as const

export const getAccessCookieOptions = () => ({
  ...baseCookieOptions,
})

export const getRefreshCookieOptions = () => ({
  ...baseCookieOptions,
  maxAge: env.LOCAL_AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
})

export const applyLocalAuthCookies = (res: Response, session: LocalSession) => {
  res.cookie(env.LOCAL_AUTH_COOKIE_NAME, session.accessToken, getAccessCookieOptions())
  res.cookie(env.LOCAL_AUTH_REFRESH_COOKIE_NAME, session.refreshToken, getRefreshCookieOptions())
}

export const clearLocalAuthCookies = (res: Response) => {
  res.clearCookie(env.LOCAL_AUTH_COOKIE_NAME, getAccessCookieOptions())
  res.clearCookie(env.LOCAL_AUTH_REFRESH_COOKIE_NAME, getRefreshCookieOptions())
}