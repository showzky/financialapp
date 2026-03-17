import { backendClient } from './backendClient'
import type {
  AccountActivity,
  AccountCategory,
  FinancialAccount,
  FinancialAccountDraft,
} from '../shared/contracts/accounts'

export const financialAccountApi = {
  async listCategories(): Promise<AccountCategory[]> {
    return backendClient.get('/financial-accounts/categories')
  },

  async createCategory(name: string): Promise<AccountCategory> {
    return backendClient.post('/financial-accounts/categories', { name })
  },

  async renameCategory(id: string, name: string): Promise<AccountCategory> {
    return backendClient.patch(`/financial-accounts/categories/${id}`, { name })
  },

  async moveCategoryToBottom(id: string): Promise<AccountCategory> {
    return backendClient.post(`/financial-accounts/categories/${id}/move-to-bottom`, {})
  },

  async listAccounts(): Promise<FinancialAccount[]> {
    return backendClient.get('/financial-accounts')
  },

  async createAccount(payload: Omit<FinancialAccountDraft, 'category'> & { categoryId: string }): Promise<FinancialAccount> {
    return backendClient.post('/financial-accounts', payload)
  },

  async updateAccount(
    id: string,
    payload: Partial<Omit<FinancialAccountDraft, 'category'>> & { categoryId?: string },
  ): Promise<FinancialAccount> {
    return backendClient.patch(`/financial-accounts/${id}`, payload)
  },

  async deleteAccount(id: string): Promise<void> {
    return backendClient.delete(`/financial-accounts/${id}`)
  },

  async adjustBalance(id: string, nextAmount: number): Promise<FinancialAccount> {
    return backendClient.post(`/financial-accounts/${id}/adjust-balance`, { nextAmount })
  },

  async listActivity(id: string): Promise<AccountActivity[]> {
    return backendClient.get(`/financial-accounts/${id}/activity`)
  },
}
