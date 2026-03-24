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
  logo: string
}

const SEARCH_RESULT_LIMIT = 6

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

  return suggestions.slice(0, SEARCH_RESULT_LIMIT).map((item) => ({
    label: item.name,
    domain: item.domain,
    imageUrl: item.logo,
  }))
}
