import { isIP } from 'node:net'
import { z } from 'zod'
import type { Request, Response } from 'express'
import { getProductData } from '../services/productMetadataService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const previewQuerySchema = z.object({
  url: z.string().url(),
})

const blockedHostnames = new Set(['localhost', '127.0.0.1', '::1'])

const isPrivateIpv4 = (value: string) => {
  const parts = value.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false

  const a = parts[0] ?? -1
  const b = parts[1] ?? -1
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

const isBlockedHost = (hostname: string) => {
  const normalized = hostname.trim().toLowerCase()
  if (blockedHostnames.has(normalized)) return true
  if (normalized.endsWith('.localhost')) return true

  const ipVersion = isIP(normalized)
  if (ipVersion === 4) return isPrivateIpv4(normalized)
  if (ipVersion === 6) {
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd')
  }

  return false
}

const buildFallbackTitleFromUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    const fromPath = parsed.pathname
      .split('/')
      .filter(Boolean)
      .at(-1)

    if (!fromPath) return parsed.hostname

    return decodeURIComponent(fromPath)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return value
  }
}

const parsePriceToNumber = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value.replace(/[^0-9.]/g, ''))
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

export const previewWishlistProduct = asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  const parsedQuery = previewQuerySchema.parse(req.query)
  const normalizedUrl = parsedQuery.url.trim()

  const parsedUrl = new URL(normalizedUrl)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new AppError('Only http/https URLs are supported', 400)
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    throw new AppError('This host is not allowed', 400)
  }

  try {
    const metadata = await getProductData(normalizedUrl)

    res.status(200).json({
      title: metadata.title || buildFallbackTitleFromUrl(normalizedUrl),
      imageUrl: metadata.image || null,
      price: parsePriceToNumber(metadata.price),
      sourceUrl: normalizedUrl,
    })
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 400) {
      throw error
    }

    res.status(200).json({
      title: buildFallbackTitleFromUrl(normalizedUrl),
      imageUrl: null,
      price: null,
      sourceUrl: normalizedUrl,
    })
  }
})
