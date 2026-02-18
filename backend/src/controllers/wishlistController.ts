import { isIP } from 'node:net'
import { z } from 'zod'
import type { Request, Response } from 'express'
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

const decodeHtmlEntities = (value: string) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')

const extractMetaContent = (html: string, keys: string[]) => {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${escaped}["'][^>]*>`,
      'i',
    )
    const match = html.match(regex)
    const content = match?.[1] ?? match?.[2]
    if (content) return decodeHtmlEntities(content.trim())
  }

  return ''
}

const extractTitle = (html: string) => {
  const ogTitle = extractMetaContent(html, ['og:title', 'twitter:title'])
  if (ogTitle) return ogTitle

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
  if (!titleMatch?.[1]) return ''
  return decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim())
}

const extractImageUrl = (html: string, baseUrl: string) => {
  const raw = extractMetaContent(html, ['og:image', 'twitter:image', 'twitter:image:src'])
  if (!raw) return ''

  try {
    return new URL(raw, baseUrl).toString()
  } catch {
    return ''
  }
}

const extractPrice = (html: string) => {
  const directMeta = extractMetaContent(html, [
    'product:price:amount',
    'og:price:amount',
    'twitter:data1',
    'price',
    'product:price',
  ])

  const parsedDirect = Number(directMeta.replace(/[^0-9.,]/g, '').replace(',', '.'))
  if (directMeta && !Number.isNaN(parsedDirect) && parsedDirect >= 0) {
    return parsedDirect
  }

  const jsonLdPriceMatch = html.match(/"price"\s*:\s*"?([0-9]+(?:[.,][0-9]{1,2})?)"?/i)
  if (!jsonLdPriceMatch?.[1]) return null

  const parsedJsonLd = Number(jsonLdPriceMatch[1].replace(',', '.'))
  if (Number.isNaN(parsedJsonLd) || parsedJsonLd < 0) return null
  return parsedJsonLd
}

export const previewWishlistProduct = asyncHandler(async (req: Request, res: Response) => {
  const parsedQuery = previewQuerySchema.parse(req.query)
  const normalizedUrl = parsedQuery.url.trim()

  const parsedUrl = new URL(normalizedUrl)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new AppError('Only http/https URLs are supported', 400)
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    throw new AppError('This host is not allowed', 400)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      throw new AppError(`Could not fetch product page (${response.status})`, 502)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('text/html')) {
      throw new AppError('URL does not point to an HTML page', 400)
    }

    const html = await response.text()

    res.status(200).json({
      title: extractTitle(html) || null,
      imageUrl: extractImageUrl(html, response.url || normalizedUrl) || null,
      price: extractPrice(html),
      sourceUrl: response.url || normalizedUrl,
    })
  } finally {
    clearTimeout(timeout)
  }
})
