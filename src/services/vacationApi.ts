// ADD THIS: vacation API integration for fund and expense management
import { backendRequest } from './backendClient'
import type { VacationFund, VacationExpense } from '../types/vacation'

type AddExpensePayload = {
  category: string
  amount: number // in cents
  description?: string
  date: string
  isVacation: true
}

type AddFundsPayload = {
  amount: number // in cents
}

type AdjustFundsPayload = {
  deltaAmount: number // in cents, positive or negative
  note?: string
}

type UpdateExpensePayload = {
  category?: string
  amount?: number
  description?: string
  date?: string
}

export const vacationApi = {
  addExpense: (vacationId: string, payload: AddExpensePayload): Promise<VacationExpense> => {
    return backendRequest<VacationExpense>(`/vacations/${vacationId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateExpense: (
    vacationId: string,
    expenseId: string,
    payload: UpdateExpensePayload,
  ): Promise<VacationExpense> => {
    return backendRequest<VacationExpense>(`/vacations/${vacationId}/expenses/${expenseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  deleteExpense: (vacationId: string, expenseId: string): Promise<void> => {
    return backendRequest<void>(`/vacations/${vacationId}/expenses/${expenseId}`, {
      method: 'DELETE',
    })
  },

  addFunds: (vacationId: string, payload: AddFundsPayload): Promise<VacationFund> => {
    return backendRequest<VacationFund>(`/vacations/${vacationId}/add-funds`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  adjustFunds: (vacationId: string, payload: AdjustFundsPayload): Promise<VacationFund> => {
    return backendRequest<VacationFund>(`/vacations/${vacationId}/adjust-funds`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  createVacation: (payload: {
    name: string
    targetAmount: number
    startDate: string
    endDate: string
  }): Promise<VacationFund> => {
    return backendRequest<VacationFund>('/vacations', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getVacations: (): Promise<VacationFund[]> => {
    return backendRequest<VacationFund[]>('/vacations')
  },

  getExpenses: (vacationId: string): Promise<VacationExpense[]> => {
    return backendRequest<VacationExpense[]>(`/vacations/${vacationId}/expenses`)
  },
}
