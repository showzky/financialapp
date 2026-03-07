// ADDED THIS
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import {
  isAppNotificationPayload,
  type AppNotificationData,
  type AppNotificationPayload,
  type NotificationPermissionState,
} from '../shared'

const DEFAULT_ANDROID_CHANNEL_ID = 'default'

let isNotificationBehaviorConfigured = false

const normalizePermissionState = (
  status: Notifications.PermissionStatus | undefined,
): NotificationPermissionState => {
  if (status === 'granted') {
    return 'granted'
  }

  if (status === 'denied') {
    return 'denied'
  }

  return 'unknown'
}

const fallbackPayload = (input: {
  id?: string
  title?: string | null
  body?: string | null
  data?: Record<string, unknown>
}): AppNotificationPayload => ({
  id: input.id,
  topic: 'system',
  kind: 'generic',
  title: input.title?.trim() || 'New notification',
  body: input.body?.trim() || 'Open the app to view more details.',
  data: sanitizeData(input.data),
})

const sanitizeData = (data: Record<string, unknown> | undefined): AppNotificationData | undefined => {
  if (!data) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(data).filter(([, value]) =>
      value === null || ['string', 'number', 'boolean'].includes(typeof value),
    ),
  ) as AppNotificationData
}

const normalizePayload = (input: {
  id?: string
  title?: string | null
  body?: string | null
  data?: Record<string, unknown>
}): AppNotificationPayload => {
  if (isAppNotificationPayload(input.data)) {
    return {
      ...input.data,
      id: input.data.id ?? input.id,
      title: input.data.title,
      body: input.data.body,
      data: sanitizeData(input.data.data as Record<string, unknown> | undefined),
    }
  }

  return fallbackPayload(input)
}

export const notificationApi = {
  configureForegroundNotifications() {
    if (isNotificationBehaviorConfigured) {
      return
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })

    isNotificationBehaviorConfigured = true
  },

  async ensureAndroidChannelAsync(): Promise<void> {
    if (Platform.OS !== 'android') {
      return
    }

    await Notifications.setNotificationChannelAsync(DEFAULT_ANDROID_CHANNEL_ID, {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
    })
  },

  async getPermissionStateAsync(): Promise<NotificationPermissionState> {
    const settings = await Notifications.getPermissionsAsync()
    return normalizePermissionState(settings.status)
  },

  async requestPermissionAsync(): Promise<NotificationPermissionState> {
    const current = await Notifications.getPermissionsAsync()

    if (current.status === 'granted') {
      return 'granted'
    }

    const requested = await Notifications.requestPermissionsAsync()
    return normalizePermissionState(requested.status)
  },

  async registerForPushNotificationsAsync(): Promise<string | null> {
    this.configureForegroundNotifications()
    await this.ensureAndroidChannelAsync()

    const permissionState = await this.requestPermissionAsync()
    if (permissionState !== 'granted') {
      return null
    }

    const token = await Notifications.getExpoPushTokenAsync()
    return token.data ?? null
  },

  async scheduleNotificationAsync(
    payload: AppNotificationPayload,
    trigger: Notifications.NotificationTriggerInput = null,
  ): Promise<string> {
    this.configureForegroundNotifications()
    await this.ensureAndroidChannelAsync()

    return Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: DEFAULT_ANDROID_CHANNEL_ID } : {}),
      },
      trigger,
    })
  },

  async cancelScheduledNotificationAsync(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier)
  },

  async cancelAllScheduledNotificationsAsync(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  },

  extractPayloadFromNotification(notification: Notifications.Notification): AppNotificationPayload {
    return normalizePayload({
      id: notification.request.identifier,
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data as Record<string, unknown> | undefined,
    })
  },

  extractPayloadFromResponse(response: Notifications.NotificationResponse): AppNotificationPayload {
    return this.extractPayloadFromNotification(response.notification)
  },

  addReceivedListener(listener: (notification: Notifications.Notification) => void): () => void {
    const subscription = Notifications.addNotificationReceivedListener(listener)
    return () => {
      subscription.remove()
    }
  },

  addResponseListener(listener: (response: Notifications.NotificationResponse) => void): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(listener)
    return () => {
      subscription.remove()
    }
  },
}
