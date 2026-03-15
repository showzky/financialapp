import { backendRequest } from './backendClient'

export type IncomeEntry = {
  id: string
  incomeCategoryId: string | null
  category: string
  parentName: string | null
  icon: string | null
  color: string | null
  iconColor: string | null
  name: string | null
  amount: number
  receivedAt: string
  accountName: string | null
  isPaid: boolean
  createdAt: string
}

export const incomeEntryApi = {
  async list(): Promise<IncomeEntry[]> {
    return backendRequest<IncomeEntry[]>('/income-entries', { method: 'GET' })
  },
}
