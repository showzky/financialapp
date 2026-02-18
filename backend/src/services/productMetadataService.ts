import axios from 'axios'
import { load } from 'cheerio'
import { AppError } from '../utils/appError.js'

export type ProductMetadata = {
  title: string
  image: string
  price: string | null
}

type JsonLdExtraction = {
  titles: string[]
  images: string[]
  prices: string[]
}

const toAbsoluteUrl = (value: string, baseUrl: string) => {
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return ''
  }
}

const scoreImageCandidate = (url: string) => {
  const normalized = url.toLowerCase()
  let score = 0

  if (normalized.includes('/img/')) score += 5
  if (normalized.includes('/product')) score += 4
  if (normalized.includes('secure')) score += 2
  if (normalized.includes('logo') || normalized.includes('favicon') || normalized.includes('icon')) score -= 8
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp')) score += 2

  return score
}

const normalizePrice = (value: string) => {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (!cleaned) return null

  const numericMatch = cleaned.match(/[0-9][0-9\s.,]*/)?.[0]
  if (!numericMatch) return null

  const compact = numericMatch.replace(/\s/g, '')
  if (!compact) return null

  const hasComma = compact.includes(',')
  const hasDot = compact.includes('.')

  if (!hasComma && !hasDot) {
    return compact
  }

  if (hasComma && hasDot) {
    const lastComma = compact.lastIndexOf(',')
    const lastDot = compact.lastIndexOf('.')
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandSeparator = decimalSeparator === ',' ? '.' : ','

    const withoutThousands = compact.split(thousandSeparator).join('')
    return decimalSeparator === ',' ? withoutThousands.replace(',', '.') : withoutThousands
  }

  const separator = hasComma ? ',' : '.'
  const parts = compact.split(separator)

  if (parts.length === 1) {
    return compact
  }

  const lastPart = parts.at(-1) ?? ''
  const appearsDecimal = lastPart.length > 0 && lastPart.length <= 2
  if (appearsDecimal) {
    const whole = parts.slice(0, -1).join('')
    return `${whole}.${lastPart}`
  }

  return parts.join('')
}

const fallbackTitleFromUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    const last = parsed.pathname.split('/').filter(Boolean).at(-1)
    if (!last) return parsed.hostname

    return decodeURIComponent(last)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return value
  }
}

const parseJsonLdImages = (raw: string): string[] => {
  const results: string[] = []

  try {
    const parsed = JSON.parse(raw) as unknown
    const queue: unknown[] = [parsed]

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      if (Array.isArray(current)) {
        queue.push(...current)
        continue
      }

      if (typeof current === 'object') {
        const record = current as Record<string, unknown>

        const image = record.image
        if (typeof image === 'string') {
          results.push(image)
        } else if (Array.isArray(image)) {
          image.forEach((entry) => {
            if (typeof entry === 'string') {
              results.push(entry)
            } else if (entry && typeof entry === 'object') {
              const candidateUrl = (entry as Record<string, unknown>).url
              if (typeof candidateUrl === 'string') {
                results.push(candidateUrl)
              }
            }
          })
        } else if (image && typeof image === 'object') {
          const candidateUrl = (image as Record<string, unknown>).url
          if (typeof candidateUrl === 'string') {
            results.push(candidateUrl)
          }
        }

        Object.values(record).forEach((entry) => {
          if (typeof entry === 'object') {
            queue.push(entry)
          }
        })
      }
    }
  } catch {
    return []
  }

  return results
}

const getStringField = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

const parseJsonLdPrices = (value: unknown, sink: Set<string>) => {
  if (!value) return

  if (typeof value === 'string') {
    sink.add(value)
    return
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    sink.add(String(value))
    return
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => parseJsonLdPrices(entry, sink))
    return
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>

    ;['price', 'lowPrice', 'highPrice'].forEach((key) => {
      parseJsonLdPrices(record[key], sink)
    })

    parseJsonLdPrices(record.priceSpecification, sink)
    parseJsonLdPrices(record.offers, sink)
  }
}

const extractJsonLdMetadata = (raw: string): JsonLdExtraction => {
  const titles = new Set<string>()
  const images = new Set<string>()
  const prices = new Set<string>()

  try {
    const parsed = JSON.parse(raw) as unknown
    const queue: unknown[] = [parsed]

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      if (Array.isArray(current)) {
        queue.push(...current)
        continue
      }

      if (typeof current !== 'object') {
        continue
      }

      const record = current as Record<string, unknown>

      const titleCandidate = getStringField(record, ['name', 'title', 'headline'])
      if (titleCandidate) {
        titles.add(titleCandidate)
      }

      const imageCandidates = parseJsonLdImages(JSON.stringify(record))
      imageCandidates.forEach((entry) => images.add(entry))

      parseJsonLdPrices(record, prices)

      Object.values(record).forEach((entry) => {
        if (entry && typeof entry === 'object') {
          queue.push(entry)
        }
      })
    }
  } catch {
    return {
      titles: [],
      images: [],
      prices: [],
    }
  }

  return {
    titles: Array.from(titles),
    images: Array.from(images),
    prices: Array.from(prices),
  }
}

export const getProductData = async (url: string): Promise<ProductMetadata> => {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(url)
  } catch {
    throw new AppError('Invalid URL', 400)
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new AppError('Only http/https URLs are supported', 400)
  }

  let html = ''
  let finalUrl = url

  try {
    const response = await axios.get<string>(url, {
      timeout: 10000,
      maxRedirects: 5,
      responseType: 'text',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'nb-NO,nb;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      validateStatus: (status) => status >= 200 && status < 400,
    })

    html = response.data
    const requestWithResponseUrl = response.request as { res?: { responseUrl?: string } } | undefined
    finalUrl = requestWithResponseUrl?.res?.responseUrl || url
  } catch {
    throw new AppError('Could not fetch product data', 502)
  }

  const $ = load(html)

  const jsonLdExtractions: JsonLdExtraction[] = []
  $('script[type="application/ld+json"]').toArray().forEach((tag) => {
    const raw = $(tag).text()
    if (!raw) return
    jsonLdExtractions.push(extractJsonLdMetadata(raw))
  })

  const jsonLdTitle = jsonLdExtractions.flatMap((entry) => entry.titles).find((entry) => entry.trim().length > 0) || ''

  const title =
    jsonLdTitle ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('title').text().replace(/\s+/g, ' ').trim() ||
    fallbackTitleFromUrl(url)

  const ogDescription =
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    ''

  void ogDescription

  const imageCandidates = new Set<string>()

  $('meta[property="og:image:secure_url"], meta[property="og:image:url"], meta[property="og:image"], meta[name="twitter:image"], meta[name="twitter:image:src"]')
    .toArray()
    .forEach((tag) => {
      const content = $(tag).attr('content')?.trim()
      if (!content) return
      imageCandidates.add(content)
    })

  jsonLdExtractions.flatMap((entry) => entry.images).forEach((candidate) => imageCandidates.add(candidate))

  const bestImage = Array.from(imageCandidates)
    .map((candidate) => toAbsoluteUrl(candidate, finalUrl))
    .filter(Boolean)
    .map((candidate) => ({
      candidate,
      score: scoreImageCandidate(candidate),
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate || ''

  const jsonLdPrice =
    jsonLdExtractions
      .flatMap((entry) => entry.prices)
      .map((entry) => normalizePrice(entry))
      .find((entry): entry is string => Boolean(entry)) || null

  const metaPrice =
    $('meta[property="product:price:amount"]').attr('content')?.trim() ||
    $('meta[property="og:price:amount"]').attr('content')?.trim() ||
    $('meta[name="price"]').attr('content')?.trim() ||
    $('meta[itemprop="price:amount"]').attr('content')?.trim() ||
    $('meta[itemprop="price"]').attr('content')?.trim() ||
    ''

  const selectorPrice =
    $('.price').first().text().trim() ||
    $('#price').first().text().trim() ||
    $('[itemprop="price"]').first().text().trim() ||
    $('[class*="price"]').first().text().trim() ||
    ''

  const normalizedPrice = jsonLdPrice || normalizePrice(metaPrice || selectorPrice)

  return {
    title,
    image: bestImage,
    price: normalizedPrice,
  }
}
