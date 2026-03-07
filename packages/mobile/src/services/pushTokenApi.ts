// ADDED THIS
import { Platform } from 'react-native'
import { BackendError, backendClient } from './backendClient'

export type PushTokenSyncStatus = 'synced' | 'deferred'

export type RegisterPushTokenInput = {
  token: string
}

const isDeferredBackendStatus = (status: number): boolean => [404, 405, 501].includes(status)

export const pushTokenApi = {
  async registerPushToken(input: RegisterPushTokenInput): Promise<PushTokenSyncStatus> {
    try {
      await backendClient.post<void>('/notifications/push-tokens', {
        token: input.token,
        platform: Platform.OS,
      })

      return 'synced'
    } catch (error) {
      if (error instanceof BackendError && isDeferredBackendStatus(error.status)) {
        return 'deferred'
      }

      throw error
    }
  },

  async removePushToken(token: string): Promise<void> {
    try {
      await backendClient.request<void>({
        path: '/notifications/push-tokens',
        method: 'DELETE',
        body: {
          token,
        },
      })
    } catch (error) {
      if (error instanceof BackendError && isDeferredBackendStatus(error.status)) {
        return
      }

      throw error
    }
  },
}
