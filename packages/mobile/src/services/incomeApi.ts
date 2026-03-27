import { backendClient } from './backendClient'

export type IncomeEntry = {
  id: string
  userId: string
  incomeCategoryId: string | null
  accountId: string | null
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

// Repeat cadence — stored for future automation; not yet enforced server-side
export type RepeatOption = 'none' | 'weekly' | 'monthly' | 'custom'

export type CreateIncomeEntryPayload = {
  incomeCategoryId?: string
  accountId?: string
  category: string
  name?: string
  amount: number
  receivedAt: string
  accountName?: string
  isPaid?: boolean
  repeat?: RepeatOption
  repeatCustomDate?: string // ISO date string, only meaningful when repeat === 'custom'
}

export const incomeApi = {
  async createIncomeEntry(payload: CreateIncomeEntryPayload): Promise<IncomeEntry> {
    return backendClient.post('/income-entries', payload)
  },

  async listIncomeEntries(): Promise<IncomeEntry[]> {
    return backendClient.get('/income-entries')
  },

  async getIncomeEntry(id: string): Promise<IncomeEntry> {
    return backendClient.get(`/income-entries/${id}`)
  },

  async updateIncomeEntry(
    id: string,
    payload: Partial<CreateIncomeEntryPayload>,
  ): Promise<IncomeEntry> {
    return backendClient.patch(`/income-entries/${id}`, payload)
  },

  async deleteIncomeEntry(id: string): Promise<void> {
    return backendClient.delete(`/income-entries/${id}`)
  },
}
