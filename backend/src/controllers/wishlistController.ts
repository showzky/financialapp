import { isIP } from 'node:net'
import { z } from 'zod'
import type { Request, Response } from 'express'
import { getProductData } from '../services/productMetadataService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'
import { wishlistItemModel } from '../models/wishlistItemModel.js'

const previewQuerySchema = z.object({
  url: z.string().url(),
})

const wishlistPrioritySchema = z.enum(['High', 'Medium', 'Low'])

const wishlistItemSchema = z.object({
  title: z.string().trim().min(1).max(300),
  url: z.string().trim().url(),
  price: z.number().finite().nonnegative().nullable(),
  imageUrl: z.string().trim().url().or(z.literal('')).optional(),
  category: z.string().trim().max(100).optional(),
  priority: wishlistPrioritySchema.optional(),
  savedAmount: z.number().finite().nonnegative().optional(),
})

const wishlistItemUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    url: z.string().trim().url().optional(),
    price: z.number().finite().nonnegative().nullable().optional(),
    imageUrl: z.string().trim().url().or(z.literal('')).optional(),
    category: z.string().trim().max(100).optional(),
    priority: wishlistPrioritySchema.optional(),
    savedAmount: z.number().finite().nonnegative().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.url !== undefined ||
      value.price !== undefined ||
      value.imageUrl !== undefined ||
      value.category !== undefined ||
      value.priority !== undefined ||
      value.savedAmount !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

const wishlistItemIdSchema = z.object({
  id: z.string().trim().min(1),
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

export const createWishlistItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = wishlistItemSchema.parse(req.body)
  const created = await wishlistItemModel.create({
    userId: req.auth.userId,
    title: payload.title,
    url: payload.url,
    price: payload.price,
    imageUrl: payload.imageUrl ?? '',
    category: payload.category ?? '',
    priority: payload.priority ?? 'Medium',
    savedAmount: payload.savedAmount ?? 0,
  })

  res.status(201).json(created)
})

export const listWishlistItems = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await wishlistItemModel.listByUser(req.auth.userId)
  res.status(200).json(rows)
})

export const updateWishlistItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = wishlistItemIdSchema.parse(req.params)
  const payload = wishlistItemUpdateSchema.parse(req.body)
  const updated = await wishlistItemModel.update(id, req.auth.userId, payload)

  if (!updated) {
    throw new AppError('Wishlist item not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteWishlistItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = wishlistItemIdSchema.parse(req.params)
  const removed = await wishlistItemModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Wishlist item not found', 404)
  }

  res.status(204).send()
})

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
