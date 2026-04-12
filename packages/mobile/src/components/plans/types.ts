import type { CategoryDto } from '../../services/categoryApi'

export type PlansTabKey = 'wishlist' | 'borrowed' | 'lent' | 'subscriptions'

export const WISHLIST_SORT_OPTIONS = [
  'closest-funded',
  'highest-price',
  'lowest-left',
  'newest',
] as const

export type WishlistSortOption = (typeof WISHLIST_SORT_OPTIONS)[number]

export const DEFAULT_WISHLIST_SORT_OPTION: WishlistSortOption = 'newest'

export type WishlistCategoryDisplayPreference = {
  collapsed: boolean
  sort: WishlistSortOption
}

export function isWishlistSortOption(value: string): value is WishlistSortOption {
  return (WISHLIST_SORT_OPTIONS as readonly string[]).includes(value)
}

export type BorrowedLoanPaymentEntry = {
  id: string
  amount: number
  principalPortion: number
  interestPortion: number
  date: string
}

export type BorrowedLoanPlanItem = {
  id: string
  lender: string
  originalAmount: number
  currentBalance: number
  interestRate: number
  payoffDate: string
  notes: string
  iconUrl?: string | null
  payments: BorrowedLoanPaymentEntry[]
}

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
