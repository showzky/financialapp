import axios from 'axios'
import { AppError } from '../utils/appError.js'

export type AccountIconSearchResult = {
  label: string
  domain: string
  imageUrl: string
}

type ClearbitSuggestion = {
  name: string
  domain: string
  logo: string | null
}

const SEARCH_RESULT_LIMIT = 6

const buildLogoCandidates = (item: ClearbitSuggestion): string[] => {
  const candidates = [
    item.logo?.trim() || null,
    item.domain.trim()
      ? `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.domain.trim())}`
      : null,
  ]

  return candidates.filter((candidate): candidate is string => Boolean(candidate))
}

const toDataUrl = (contentType: string, data: ArrayBuffer | Buffer) => {
  const normalizedContentType = contentType.split(';')[0]?.trim() || 'image/png'
  const binary = data instanceof ArrayBuffer ? Buffer.from(new Uint8Array(data)) : Buffer.from(data)
  return `data:${normalizedContentType};base64,${binary.toString('base64')}`
}

export const searchAccountIcons = async (query: string): Promise<AccountIconSearchResult[]> => {
  const normalized = query.trim().replace(/\s+/g, ' ')
  if (normalized.length < 2) {
    return []
  }

  let suggestions: ClearbitSuggestion[]

  try {
    const response = await axios.get<ClearbitSuggestion[]>(
      'https://autocomplete.clearbit.com/v1/companies/suggest',
      {
        params: { query: normalized },
        timeout: 6000,
        headers: {
          Accept: 'application/json',
        },
      },
    )
    suggestions = response.data
  } catch {
    throw new AppError('Could not search for company logos', 502)
  }

  const resolvedResults = await Promise.all(
    suggestions.slice(0, SEARCH_RESULT_LIMIT).map(async (item) => {
      const logoCandidates = buildLogoCandidates(item)

      for (const candidateUrl of logoCandidates) {
        try {
          const imageResponse = await axios.get<ArrayBuffer>(candidateUrl, {
            responseType: 'arraybuffer',
            timeout: 6000,
          })

          const contentType = String(imageResponse.headers['content-type'] ?? 'image/png')
          return {
            label: item.name,
            domain: item.domain,
            imageUrl: toDataUrl(contentType, imageResponse.data),
          }
        } catch {
          continue
        }
      }

      return {
        label: item.name,
        domain: item.domain,
        imageUrl: logoCandidates[0] ?? '',
      }
    }),
  )

  return resolvedResults
}
