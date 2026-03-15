export type CategoryKind = 'expense' | 'income'

export type CategorySeed = {
  name: string
  parentName: string
  icon: string
  color: string
  iconColor: string
  type?: 'budget' | 'fixed'
  dueDayOfMonth?: number
  sortOrder: number
}

export const EXPENSE_PARENT_CATEGORIES = [
  'Supermarket',
  'Clothing',
  'House',
  'Entertainment',
  'Transport',
  'Gifts',
  'Travel',
  'Education',
  'Food',
  'Work',
  'Electronics',
  'Sport',
  'Restaurant',
  'Health',
  'Communications',
  'Other',
] as const

export const INCOME_PARENT_CATEGORIES = [
  'Salary',
  'Business',
  'Investment',
  'Rewards',
  'Gifts',
  'Other',
] as const

export const DEFAULT_EXPENSE_CATEGORIES: CategorySeed[] = [
  { name: 'Supermarket', parentName: 'Supermarket', icon: 'cart-outline', color: '#1f2a3d', iconColor: '#ff7d5c', sortOrder: 1 },
  { name: 'Clothing', parentName: 'Clothing', icon: 'shirt-outline', color: '#1f2a3d', iconColor: '#6d91ff', sortOrder: 2 },
  { name: 'House', parentName: 'House', icon: 'home-outline', color: '#1f2a3d', iconColor: '#f3f3f7', sortOrder: 3 },
  { name: 'Entertainment', parentName: 'Entertainment', icon: 'game-controller-outline', color: '#1f2a3d', iconColor: '#ff9dd2', sortOrder: 4 },
  { name: 'Transport', parentName: 'Transport', icon: 'car-sport-outline', color: '#1f2a3d', iconColor: '#7da8ff', sortOrder: 5 },
  { name: 'Gifts', parentName: 'Gifts', icon: 'gift-outline', color: '#1f2a3d', iconColor: '#ff8a6f', sortOrder: 6 },
  { name: 'Travel', parentName: 'Travel', icon: 'airplane-outline', color: '#1f2a3d', iconColor: '#8ec6ff', sortOrder: 7 },
  { name: 'Education', parentName: 'Education', icon: 'school-outline', color: '#1f2a3d', iconColor: '#7bc96f', sortOrder: 8 },
  { name: 'Food', parentName: 'Food', icon: 'restaurant-outline', color: '#1f2a3d', iconColor: '#e64545', sortOrder: 9 },
  { name: 'Work', parentName: 'Work', icon: 'briefcase-outline', color: '#1f2a3d', iconColor: '#ae7dff', sortOrder: 10 },
  { name: 'Electronics', parentName: 'Electronics', icon: 'hardware-chip-outline', color: '#1f2a3d', iconColor: '#ffd05f', sortOrder: 11 },
  { name: 'Sport', parentName: 'Sport', icon: 'barbell-outline', color: '#1f2a3d', iconColor: '#9dd857', sortOrder: 12 },
  { name: 'Restaurant', parentName: 'Restaurant', icon: 'wine-outline', color: '#1f2a3d', iconColor: '#ff7d5c', sortOrder: 13 },
  { name: 'Health', parentName: 'Health', icon: 'medkit-outline', color: '#1f2a3d', iconColor: '#7bc96f', sortOrder: 14 },
  { name: 'Communications', parentName: 'Communications', icon: 'phone-portrait-outline', color: '#1f2a3d', iconColor: '#ffcb5c', sortOrder: 15 },
  { name: 'Other', parentName: 'Other', icon: 'ellipsis-horizontal', color: '#1f2a3d', iconColor: '#d8d8e6', sortOrder: 16 },
]

export const DEFAULT_INCOME_CATEGORIES: CategorySeed[] = [
  { name: 'Salary', parentName: 'Salary', icon: 'cash-outline', color: '#1f2a3d', iconColor: '#78d89c', sortOrder: 1 },
  { name: 'Business', parentName: 'Business', icon: 'briefcase-outline', color: '#1f2a3d', iconColor: '#8ec6ff', sortOrder: 2 },
  { name: 'Investment', parentName: 'Investment', icon: 'trending-up-outline', color: '#1f2a3d', iconColor: '#f0c45a', sortOrder: 3 },
  { name: 'Rewards', parentName: 'Rewards', icon: 'star-outline', color: '#1f2a3d', iconColor: '#e6a46b', sortOrder: 4 },
  { name: 'Gifts', parentName: 'Gifts', icon: 'gift-outline', color: '#1f2a3d', iconColor: '#ff9892', sortOrder: 5 },
  { name: 'Other', parentName: 'Other', icon: 'ellipsis-horizontal', color: '#1f2a3d', iconColor: '#c4b3e3', sortOrder: 6 },
]

export function isValidParentCategory(kind: CategoryKind, parentName: string) {
  const options = kind === 'expense' ? EXPENSE_PARENT_CATEGORIES : INCOME_PARENT_CATEGORIES
  return options.includes(parentName as never)
}
