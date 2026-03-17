import type {
  AccountActivity,
  AccountCategory,
  FinancialAccount,
  FinancialAccountDraft,
} from '../../shared/contracts/accounts'

export type BalanceCategory = AccountCategory
export type BalanceFinancialAccount = FinancialAccount
export type BalanceAccountDraft = FinancialAccountDraft

export type BalanceCategorySort = 'balance' | 'name' | 'custom'

export type { AccountActivity, AccountCategory, FinancialAccount }
