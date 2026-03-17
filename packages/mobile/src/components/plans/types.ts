import type { CategoryDto } from '../../services/categoryApi'

export type PlansTabKey = 'wishlist' | 'borrowed' | 'lent'

export type WishlistActivity = {
  id: string
  kind: 'created' | 'purchased' | 'edited'
  title: string
  amount: number
  date: string
}

export type WishlistPlanItem = {
  id: string
  name: string
  notes: string
  category: CategoryDto | null
  productUrl: string
  imageUri: string | null
  price: number
  savedAmount: number
  date: string
  activities: WishlistActivity[]
}
