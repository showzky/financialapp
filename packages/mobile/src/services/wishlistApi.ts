import { backendClient } from './backendClient'

export type WishlistPriority = 'High' | 'Medium' | 'Low'

export type WishlistItem = {
  id: string
  title: string
  url: string
  normalizedUrl: string
  price: number | null
  imageUrl?: string | null
  category?: string | null
  notes?: string | null
  priority: WishlistPriority
  savedAmount: number
  purchased: boolean
}

export type WishlistItemDto = {
  id: string
  title: string
  url: string
  normalizedUrl: string
  price: number | null
  imageUrl?: string | null
  category?: string | null
  notes?: string | null
  priority?: WishlistPriority
  savedAmount?: number
  status?: 'active' | 'purchased'
}

export type WishlistPreview = {
  title: string | null
  imageUrl: string | null
  price: number | null
  sourceUrl: string
}

type CreateWishlistItemPayload = {
  title: string
  url: string
  price: number | null
  imageUrl?: string
  category?: string
  notes?: string | null
  priority?: WishlistPriority
  savedAmount?: number
}

type UpdateWishlistItemPayload = {
  title?: string
  url?: string
  price?: number | null
  imageUrl?: string
  category?: string
  notes?: string | null
  priority?: WishlistPriority
  savedAmount?: number
}

const mapItem = (item: WishlistItemDto): WishlistItem => ({
  id: item.id,
  title: item.title,
  url: item.url,
  normalizedUrl: item.normalizedUrl,
  price: item.price ?? null,
  imageUrl: item.imageUrl ?? null,
  category: item.category ?? null,
  notes: item.notes ?? null,
  priority: item.priority ?? 'Medium',
  savedAmount: item.savedAmount ?? 0,
  purchased: item.status === 'purchased',
})

export const wishlistApi = {
  async list(): Promise<WishlistItem[]> {
    const rows = await backendClient.get<WishlistItemDto[]>('/wishlist')
    return rows.map(mapItem)
  },

  async create(payload: CreateWishlistItemPayload): Promise<WishlistItem> {
    const row = await backendClient.post<WishlistItemDto>('/wishlist', payload)
    return mapItem(row)
  },

  async update(id: string, payload: UpdateWishlistItemPayload): Promise<WishlistItem> {
    const row = await backendClient.patch<WishlistItemDto>(`/wishlist/${id}`, payload)
    return mapItem(row)
  },

  async previewFromUrl(url: string): Promise<WishlistPreview> {
    const encodedUrl = encodeURIComponent(url)
    return backendClient.get<WishlistPreview>(`/wishlist/preview?url=${encodedUrl}`)
  },
}
