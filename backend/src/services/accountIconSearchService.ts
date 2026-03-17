import axios from 'axios'
import { load } from 'cheerio'
import { AppError } from '../utils/appError.js'

export type AccountIconSearchResult = {
  label: string
  domain: string
  imageUrl: string
}

const SEARCH_RESULT_LIMIT = 6

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, ' ')

const extractDomain = (value: string) => {
  try {
    const parsed = new URL(value)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    if (!hostname) return null
    return hostname
  } catch {
    return null
  }
}

const buildClearbitLogoUrl = (domain: string) => `https://logo.clearbit.com/${domain}`

export const searchAccountIcons = async (query: string): Promise<AccountIconSearchResult[]> => {
  const normalizedQuery = normalizeQuery(query)
  if (normalizedQuery.length < 2) {
    return []
  }

  let html = ''

  try {
    const response = await axios.get<string>('https://duckduckgo.com/html/', {
      timeout: 6500,
      responseType: 'text',
      params: {
        q: `${normalizedQuery} official site`,
      },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'nb-NO,nb;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      validateStatus: (status) => status >= 200 && status < 400,
    })

    html = response.data
  } catch {
    throw new AppError('Could not search for company logos', 502)
  }

  const $ = load(html)
  const results: AccountIconSearchResult[] = []
  const seenDomains = new Set<string>()

  $('.result')
    .toArray()
    .some((element) => {
      const anchor = $(element).find('.result__title a').first()
      const title = anchor.text().replace(/\s+/g, ' ').trim()
      const href = anchor.attr('href')?.trim()
      if (!title || !href) {
        return false
      }

      const domain = extractDomain(href)
      if (!domain || seenDomains.has(domain)) {
        return false
      }

      seenDomains.add(domain)
      results.push({
        label: title,
        domain,
        imageUrl: buildClearbitLogoUrl(domain),
      })

      return results.length >= SEARCH_RESULT_LIMIT
    })

  return results
}
