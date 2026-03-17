import { backendClient } from './backendClient'

export type AccountIconSearchResult = {
  label: string
  domain: string
  imageUrl: string
}

export const accountAssetApi = {
  async searchIcons(query: string): Promise<AccountIconSearchResult[]> {
    const encodedQuery = encodeURIComponent(query.trim())
    return backendClient.get<AccountIconSearchResult[]>(
      `/account-assets/icons/search?query=${encodedQuery}`,
    )
  },
}
