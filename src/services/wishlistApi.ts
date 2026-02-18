import { backendRequest } from './backendClient'

type WishlistPreviewResponse = {
  title: string | null
  imageUrl: string | null
  price: number | null
  sourceUrl: string
}

export const wishlistApi = {
  previewFromUrl: (url: string) => {
    const encoded = encodeURIComponent(url)
    return backendRequest<WishlistPreviewResponse>(`/wishlist/preview?url=${encoded}`, { method: 'GET' })
  },
}
