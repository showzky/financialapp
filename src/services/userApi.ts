// ADD THIS: user profile API integration for persistent preferences
import { backendRequest } from './backendClient'

type RemoteUser = {
  id: string
  email: string
  displayName: string
  monthlyIncome: number
  createdAt: string
}

type UpdateCurrentUserPayload = {
  displayName?: string
  monthlyIncome?: number
}

export const userApi = {
  getMe: (): Promise<RemoteUser> => {
    return backendRequest<RemoteUser>('/users/me', { method: 'GET' })
  },

  updateMe: (payload: UpdateCurrentUserPayload): Promise<RemoteUser> => {
    return backendRequest<RemoteUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
}
