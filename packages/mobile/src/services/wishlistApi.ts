import { backendClient } from './backendClient'

export type WishlistItem = {
  id: string
  title: string
  price: number | null
  category?: string | null
  notes?: string | null
  purchased: boolean
}

type WishlistItemDto = {
  id: string
  title: string
  price: number | null
  category?: string | null
  notes?: string | null
  status?: 'active' | 'purchased'
}

const mapItem = (item: WishlistItemDto): WishlistItem => ({
  id: item.id,
  title: item.title,
  price: item.price ?? null,
  category: item.category ?? null,
  notes: item.notes ?? null,
  purchased: item.status === 'purchased',
})

export const wishlistApi = {
  async list(): Promise<WishlistItem[]> {
    const rows = await backendClient.get<WishlistItemDto[]>('/wishlist')
    return rows.map(mapItem)
  },
}
