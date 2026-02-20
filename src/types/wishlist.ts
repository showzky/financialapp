// ADD THIS: strict priority scale used across wishlist UI + API
export const wishlistPriorityOptions = ['High', 'Medium', 'Low'] as const

export type WishlistPriority = (typeof wishlistPriorityOptions)[number]
export type WishlistMetadataStatus = 'fresh' | 'stale' | 'unknown'
export type WishlistPriceTrendDirection = 'up' | 'down' | 'flat' | 'unknown'

// ADD THIS: numeric weights for stable priority sorting
export const wishlistPriorityWeight: Record<WishlistPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
}

export type WishlistItem = {
  id: string
  title: string
  url: string
  normalizedUrl: string
  price: number | null
  imageUrl: string
  category: string
  priority: WishlistPriority
  savedAmount: number
  metadataStatus: WishlistMetadataStatus
  metadataLastCheckedAt: string | null
  metadataLastSuccessAt: string | null
  latestTrackedPrice: number | null
  previousTrackedPrice: number | null
  priceTrendDirection: WishlistPriceTrendDirection
  priceTrendPercent: number | null
}
