export type AccountMode = 'credit' | 'balance'

export type AccountReminderUnit = 'days' | 'weeks'

export type AccountReminder =
  | { type: 'none' }
  | { type: 'preset'; label: string }
  | {
      type: 'custom'
      quantity: number
      unit: AccountReminderUnit
      hour: number
      label: string
    }

export type AccountIconChoice = {
  kind: 'preset' | 'company' | 'image'
  label: string
  imageUrl?: string | null
  companyQuery?: string | null
}

export type FinancialAccountDraft = {
  name: string
  mode: AccountMode
  amount: number
  creditLimit: number | null
  paymentDayOfMonth: number | null
  reminder: AccountReminder
  icon: AccountIconChoice | null
  accountType: string
  category: string
  color: string
  notes: string
}

export type AccountCategory = {
  id: string
  userId: string
  name: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type FinancialAccount = FinancialAccountDraft & {
  id: string
  userId: string
  categoryId: string
  categoryName: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type AccountActivity =
  | {
      id: string
      type: 'balance_adjustment'
      title: string
      subtitle: string | null
      amount: number
      createdAt: string
      isPaid: boolean
    }
  | {
      id: string
      type: 'expense' | 'income'
      title: string
      subtitle: string | null
      amount: number
      createdAt: string
      isPaid: boolean
    }
