// ADDED THIS
import React, { createContext, useContext } from 'react'
import type { AppNotificationTopic } from '../shared'
import { useAuth } from '../auth/AuthContext'
import { usePushNotifications } from '../hooks/usePushNotifications'
import type {
  NotificationEvent,
  NotificationHandler,
  NotificationHandlerCriteria,
} from '../services/notificationManager'

type NotificationContextValue = {
  preferences: ReturnType<typeof usePushNotifications>['preferences']
  permissionState: ReturnType<typeof usePushNotifications>['permissionState']
  expoPushToken: ReturnType<typeof usePushNotifications>['expoPushToken']
  lastNotificationEvent: NotificationEvent | null
  isReady: boolean
  enablePushNotifications: () => Promise<boolean>
  disablePushNotifications: () => Promise<void>
  setTopicEnabled: (topic: AppNotificationTopic, enabled: boolean) => Promise<void>
  registerHandler: (criteria: NotificationHandlerCriteria, handler: NotificationHandler) => () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const notificationState = usePushNotifications({ authStatus: status })

  return (
    <NotificationContext.Provider value={notificationState}>{children}</NotificationContext.Provider>
  )
}

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }

  return context
}
