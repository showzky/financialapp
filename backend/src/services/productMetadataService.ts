import axios from 'axios'
import { load } from 'cheerio'
import { env } from '../config/env.js'
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

type CachedProductMetadata = {
  expiresAt: number
  data: ProductMetadata
}

const previewCache = new Map<string, CachedProductMetadata>()
const PREVIEW_CACHE_TTL_MS = 5 * 60 * 1000
const PREVIEW_CACHE_INCOMPLETE_TTL_MS = 30 * 1000

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
  if (normalized.includes('logo') || normalized.includes('favicon') || normalized.includes('icon'))
    score -= 8
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp'))
    score += 2

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

const extractCurrencyPriceMatches = (value: string): string[] => {
  const results = new Set<string>()
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const patterns = [
    /(?:nok|kr|usd|eur|gbp|sek|dkk|\$|€|£)\s*([0-9][0-9\s.,]*)/gi,
    /([0-9][0-9\s.,]*)\s*(?:nok|kr|usd|eur|gbp|sek|dkk|\$|€|£)/gi,
  ]

  patterns.forEach((pattern) => {
    for (const match of normalized.matchAll(pattern)) {
      const candidate = (match[1] ?? '').trim()
      if (candidate) {
        results.add(candidate)
      }
    }
  })

  return Array.from(results)
}

const PRICE_LIKE_KEYWORDS = [
  'price',
  'saleprice',
  'salesprice',
  'sale_price',
  'sales_price',
  'sale-price',
  'currentprice',
  'current_price',
  'current-price',
  'displayprice',
  'display_price',
  'productprice',
  'product_price',
  'offerprice',
  'offer_price',
  'finalprice',
  'final_price',
  'unitprice',
  'unit_price',
  'regularprice',
  'regular_price',
  'nowprice',
  'now_price',
  'wasprice',
  'was_price',
  'discountedprice',
  'discounted_price',
  'pricevalue',
  'price_value',
  'amount',
  'amountvalue',
  'priceamount',
  'pricewithtax',
  'priceincvat',
  'priceinclvat',
  'listprice',
  'lowestprice',
  'lowest_price',
  'highestprice',
  'specialprice',
  'pris',
  'kampanjepris',
  'normalpris',
]

const hasPriceLikeKey = (key: string) =>
  PRICE_LIKE_KEYWORDS.some((keyword) => key.includes(keyword))

const collectPriceCandidates = ($: ReturnType<typeof load>) => {
  const candidates = new Set<string>()

  const addCandidate = (value?: string | null) => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return

    candidates.add(trimmed)
    extractCurrencyPriceMatches(trimmed).forEach((match) => candidates.add(match))
  }

  $(
    [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[name="price"]',
      'meta[itemprop="price:amount"]',
      'meta[itemprop="price"]',
      '[itemprop="price"]',
      '[data-price]',
      '[data-price-amount]',
      '[data-sale-price]',
      '[data-product-price]',
      '[data-testid*="price" i]',
      '[class*="price" i]',
      '[id*="price" i]',
      '[aria-label*="price" i]',
      '[class*="amount" i]',
      '[id*="amount" i]',
    ].join(', '),
  )
    .toArray()
    .forEach((tag) => {
      const element = $(tag)
      addCandidate(element.attr('content'))
      addCandidate(element.attr('value'))
      addCandidate(element.attr('data-price'))
      addCandidate(element.attr('data-price-amount'))
      addCandidate(element.attr('data-sale-price'))
      addCandidate(element.attr('data-product-price'))
      addCandidate(element.attr('aria-label'))
      addCandidate(element.text())
    })

  $('script')
    .toArray()
    .forEach((tag) => {
      const scriptText = $(tag).text()
      if (!scriptText) return

      const normalized = scriptText.toLowerCase()
      if (
        !normalized.includes('price') &&
        !normalized.includes('amount') &&
        !normalized.includes('currency') &&
        !normalized.includes('sale') &&
        !normalized.includes('offer') &&
        !/[$€£]|nok|kr|usd|eur|gbp|sek|dkk/i.test(scriptText)
      ) {
        return
      }

      addCandidate(scriptText)
    })

  const bodyText = $('body').text().replace(/\s+/g, ' ')
  extractCurrencyPriceMatches(bodyText).slice(0, 25).forEach((match) => candidates.add(match))

  return Array.from(candidates)
}

const fallbackTitleFromUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    const last = parsed.pathname.split('/').filter(Boolean).at(-1)
    if (!last) return parsed.hostname

    return decodeURIComponent(last).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
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

const extractFromAppJson = (raw: string): JsonLdExtraction => {
  const titles = new Set<string>()
  const images = new Set<string>()
  const prices = new Set<string>()

  const titleKeys = new Set(['name', 'title', 'productname', 'producttitle'])
  const imageKeys = new Set(['image', 'imageurl', 'mainimage', 'thumbnail', 'primaryimage'])
  const priceKeys = new Set(PRICE_LIKE_KEYWORDS)

  try {
    const parsed = JSON.parse(raw) as unknown
    const queue: unknown[] = [parsed]
    let visited = 0

    while (queue.length > 0 && visited < 10000) {
      visited += 1
      const current = queue.shift()
      if (!current) continue

      if (Array.isArray(current)) {
        queue.push(...current)
        continue
      }

      if (typeof current !== 'object') continue

      const record = current as Record<string, unknown>
      for (const [rawKey, value] of Object.entries(record)) {
        const key = rawKey.replace(/[_-]/g, '').toLowerCase()

        if (typeof value === 'string') {
          const text = value.trim()
          if (!text) continue

          if (titleKeys.has(key) && text.length > 2) {
            titles.add(text)
          }

          if (imageKeys.has(key) && /^https?:\/\//i.test(text)) {
            images.add(text)
          }

          if (hasPriceLikeKey(key)) {
            prices.add(text)
          }

          continue
        }

        if (typeof value === 'number' && Number.isFinite(value) && hasPriceLikeKey(key)) {
          prices.add(String(value))
          continue
        }

        if (value && typeof value === 'object') {
          queue.push(value)
        }
      }
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

const fetchHtmlViaBrowserless = async (
  url: string,
  mode: 'content' | 'unblock',
): Promise<string> => {
  const token = env.BROWSERLESS_TOKEN
  if (!token) throw new Error('No browserless token')

  const baseUrl = env.BROWSERLESS_BASE_URL
  const timeout = env.BROWSERLESS_TIMEOUT_MS
  const endpoint = `${baseUrl}/${mode}?token=${encodeURIComponent(token)}`

  if (mode === 'unblock') {
    const response = await axios.post(
      endpoint,
      {
        url,
        browserWSEndpoint: false,
        content: true,
        cookies: false,
        screenshot: false,
      },
      {
        timeout,
        headers: { 'Content-Type': 'application/json' },
      },
    )

    const body = response.data as { content?: string }
    if (typeof body?.content === 'string' && body.content.length > 0) {
      return body.content
    }

    throw new Error('Browserless unblock returned no content')
  }

  // content mode
  const response = await axios.post(
    endpoint,
    {
      url,
      gotoOptions: { waitUntil: 'networkidle2', timeout },
      waitForSelector: {
        selector: '[class*="price" i], [itemprop="price"], [data-price], [data-price-amount]',
        timeout: 6000,
      },
      evaluate: `
        (() => {
          try {
            const nd = window.__NEXT_DATA__
            if (nd) {
              const el = document.getElementById('__NEXT_DATA__')
              if (el) el.setAttribute('data-extracted', 'true')
            }
          } catch {}
          return document.documentElement.outerHTML
        })()
      `,
    },
    {
      timeout: timeout + 10000,
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text',
    },
  )

  const body = typeof response.data === 'string' ? response.data : ''
  if (body.length > 0) return body

  throw new Error('Browserless content returned empty')
}

const fetchHtmlPlain = async (url: string): Promise<{ html: string; finalUrl: string }> => {
  const response = await axios.get<string>(url, {
    timeout: 6500,
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

  const requestWithResponseUrl = response.request as
    | { res?: { responseUrl?: string } }
    | undefined

  return {
    html: response.data,
    finalUrl: requestWithResponseUrl?.res?.responseUrl || url,
  }
}

const fetchRenderedHtml = async (
  url: string,
): Promise<{ html: string; finalUrl: string }> => {
  const mode = env.BROWSERLESS_MODE
  const hasToken = Boolean(env.BROWSERLESS_TOKEN)

  if (!hasToken) {
    return fetchHtmlPlain(url)
  }

  // auto: try unblock → content → plain
  if (mode === 'auto') {
    try {
      const html = await fetchHtmlViaBrowserless(url, 'unblock')
      return { html, finalUrl: url }
    } catch { /* fall through */ }

    try {
      const html = await fetchHtmlViaBrowserless(url, 'content')
      return { html, finalUrl: url }
    } catch { /* fall through */ }

    return fetchHtmlPlain(url)
  }

  // explicit mode (content or unblock) with plain fallback
  try {
    const html = await fetchHtmlViaBrowserless(url, mode)
    return { html, finalUrl: url }
  } catch {
    return fetchHtmlPlain(url)
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

  const cached = previewCache.get(url)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  let html = ''
  let finalUrl = url

  try {
    const result = await fetchRenderedHtml(url)
    html = result.html
    finalUrl = result.finalUrl
  } catch {
    throw new AppError('Could not fetch product data', 502)
  }

  const $ = load(html)

  const jsonLdExtractions: JsonLdExtraction[] = []
  $('script[type="application/ld+json"]')
    .toArray()
    .forEach((tag) => {
      const raw = $(tag).text()
      if (!raw) return
      jsonLdExtractions.push(extractJsonLdMetadata(raw))
    })

  const appJsonExtractions: JsonLdExtraction[] = []
  $('script#__NEXT_DATA__, script#__NUXT_DATA__, script[type="application/json"][id*="data" i]')
    .toArray()
    .forEach((tag) => {
      const raw = $(tag).text()
      if (!raw || raw.trim().length < 2) return
      appJsonExtractions.push(extractFromAppJson(raw))
    })

  const allExtractions = [...jsonLdExtractions, ...appJsonExtractions]

  const jsonLdTitle =
    allExtractions.flatMap((entry) => entry.titles).find((entry) => entry.trim().length > 0) || ''

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

  $(
    'meta[property="og:image:secure_url"], meta[property="og:image:url"], meta[property="og:image"], meta[name="twitter:image"], meta[name="twitter:image:src"]',
  )
    .toArray()
    .forEach((tag) => {
      const content = $(tag).attr('content')?.trim()
      if (!content) return
      imageCandidates.add(content)
    })

  allExtractions
    .flatMap((entry) => entry.images)
    .forEach((candidate) => imageCandidates.add(candidate))

  const bestImage =
    Array.from(imageCandidates)
      .map((candidate) => toAbsoluteUrl(candidate, finalUrl))
      .filter(Boolean)
      .map((candidate) => ({
        candidate,
        score: scoreImageCandidate(candidate),
      }))
      .sort((a, b) => b.score - a.score)[0]?.candidate || ''

  const jsonLdPrice =
    allExtractions
      .flatMap((entry) => entry.prices)
      .map((entry) => normalizePrice(entry))
      .find((entry): entry is string => Boolean(entry)) || null

  const selectorPrice = collectPriceCandidates($)
    .map((entry) => normalizePrice(entry))
    .find((entry): entry is string => Boolean(entry)) || null

  const normalizedPrice = jsonLdPrice || selectorPrice

  const result = {
    title,
    image: bestImage,
    price: normalizedPrice,
  }

  previewCache.set(url, {
    expiresAt: Date.now() + (result.price ? PREVIEW_CACHE_TTL_MS : PREVIEW_CACHE_INCOMPLETE_TTL_MS),
    data: result,
  })

  if (previewCache.size > 300) {
    const now = Date.now()
    for (const [cacheKey, cacheEntry] of previewCache) {
      if (cacheEntry.expiresAt <= now) {
        previewCache.delete(cacheKey)
      }
    }
  }

  return result
}
