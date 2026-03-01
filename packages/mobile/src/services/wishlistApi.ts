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

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim() || 'http://10.0.2.2:4000/api/v1'

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
    const response = await fetch(`${BACKEND_URL}/wishlist`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Wishlist request failed (${response.status})`)
    }

    const rows = (await response.json()) as WishlistItemDto[]
    return rows.map(mapItem)
  },
}
