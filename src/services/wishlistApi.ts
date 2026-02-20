import { backendRequest } from './backendClient'
import {
  type WishlistMetadataStatus,
  type WishlistPriceTrendDirection,
  type WishlistPriority,
  type WishlistItemStatus,
} from '@/types/wishlist'

export type WishlistItemDto = {
  id: string
  title: string
  url: string
  normalizedUrl: string
  price: number | null
  imageUrl: string
  category: string
  priority: WishlistPriority
  status: WishlistItemStatus
  purchasedAt: string | null
  purchasedAmount: number | null
  savedAmount: number
  metadataStatus: WishlistMetadataStatus
  metadataLastCheckedAt: string | null
  metadataLastSuccessAt: string | null
  latestTrackedPrice: number | null
  previousTrackedPrice: number | null
  priceTrendDirection: WishlistPriceTrendDirection
  priceTrendPercent: number | null
  createdAt: string
  updatedAt: string
}

type WishlistPreviewResponse = {
  title: string | null
  imageUrl: string | null
  price: number | null
  sourceUrl: string
}

type UpsertWishlistItemPayload = {
  title: string
  url: string
  price: number | null
  imageUrl?: string
  category?: string
  priority?: WishlistPriority
  savedAmount?: number
}

type UpdateWishlistItemPayload = {
  title?: string
  url?: string
  price?: number | null
  imageUrl?: string
  category?: string
  priority?: WishlistPriority
  savedAmount?: number
}

export const wishlistApi = {
  list: () => {
    return backendRequest<WishlistItemDto[]>('/wishlist', { method: 'GET' })
  },

  create: (payload: UpsertWishlistItemPayload) => {
    return backendRequest<WishlistItemDto>('/wishlist', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  update: (id: string, payload: UpdateWishlistItemPayload) => {
    return backendRequest<WishlistItemDto>(`/wishlist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  remove: (id: string) => {
    return backendRequest<void>(`/wishlist/${id}`, { method: 'DELETE' })
  },

  markPurchased: (id: string, purchasedAmount?: number) => {
    return backendRequest<WishlistItemDto>(`/wishlist/${id}/purchase`, {
      method: 'PATCH',
      body: JSON.stringify({ purchasedAmount }),
    })
  },

  restorePurchased: (id: string) => {
    return backendRequest<WishlistItemDto>(`/wishlist/${id}/restore`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
  },

  previewFromUrl: (url: string) => {
    const encoded = encodeURIComponent(url)
    return backendRequest<WishlistPreviewResponse>(`/wishlist/preview?url=${encoded}`, { method: 'GET' })
  },
}
