import { Ionicons } from '@expo/vector-icons'
import type { CategoryKind } from '../../services/categoryApi'

export type CategoryIconName = keyof typeof Ionicons.glyphMap

export const CATEGORY_COLOR_OPTIONS = [
  '#1f2a3d',
  '#24324a',
  '#2f2347',
  '#233528',
  '#3d2a23',
  '#2a2a3d',
] as const

export const CATEGORY_ICON_COLOR_OPTIONS = [
  '#ff7d5c',
  '#6d91ff',
  '#f3f3f7',
  '#ff9dd2',
  '#7da8ff',
  '#8ec6ff',
  '#7bc96f',
  '#e64545',
  '#ae7dff',
  '#ffd05f',
  '#9dd857',
  '#ffcb5c',
  '#d8d8e6',
] as const

export const CATEGORY_ICON_OPTIONS: CategoryIconName[] = [
  'cart-outline',
  'shirt-outline',
  'home-outline',
  'game-controller-outline',
  'car-sport-outline',
  'gift-outline',
  'airplane-outline',
  'school-outline',
  'restaurant-outline',
  'briefcase-outline',
  'hardware-chip-outline',
  'barbell-outline',
  'medkit-outline',
  'phone-portrait-outline',
  'cash-outline',
  'trending-up-outline',
  'star-outline',
  'ellipsis-horizontal',
]

export const PARENT_CATEGORY_OPTIONS: Record<CategoryKind, string[]> = {
  expense: [
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
  ],
  income: ['Salary', 'Business', 'Investment', 'Rewards', 'Gifts', 'Other'],
}
