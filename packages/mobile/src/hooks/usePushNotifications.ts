// ADDED THIS
import { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  AppNotificationTopic,
  NotificationPermissionState,
  NotificationPreferences,
} from '../shared'
import { defaultNotificationPreferences, notificationTopics } from '../shared'
import { notificationApi } from '../services/notificationApi'
import {
  notificationManager,
  type NotificationEvent,
  type NotificationEventSource,
} from '../services/notificationManager'
import { pushTokenApi, type PushTokenSyncStatus } from '../services/pushTokenApi'

const NOTIFICATION_PREFERENCES_STORAGE_KEY = 'app:notification-preferences'

type UsePushNotificationsInput = {
  authStatus: 'checking' | 'signedOut' | 'signedIn'
}

type UsePushNotificationsResult = {
  preferences: NotificationPreferences
  permissionState: NotificationPermissionState
  expoPushToken: string | null
  lastNotificationEvent: NotificationEvent | null
  isReady: boolean
  enablePushNotifications: () => Promise<boolean>
  disablePushNotifications: () => Promise<void>
  setTopicEnabled: (topic: AppNotificationTopic, enabled: boolean) => Promise<void>
  registerHandler: typeof notificationManager.registerHandler
}

const mergePreferences = (candidate: unknown): NotificationPreferences => {
  if (!candidate || typeof candidate !== 'object') {
    return defaultNotificationPreferences
  }

  const input = candidate as Partial<NotificationPreferences> & {
    topics?: Partial<Record<AppNotificationTopic, boolean>>
  }

  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : defaultNotificationPreferences.enabled,
    topics: notificationTopics.reduce<Record<AppNotificationTopic, boolean>>((accumulator, topic) => {
      accumulator[topic] =
        typeof input.topics?.[topic] === 'boolean'
          ? input.topics[topic]!
          : defaultNotificationPreferences.topics[topic]
      return accumulator
    }, {} as Record<AppNotificationTopic, boolean>),
  }
}

export const usePushNotifications = ({ authStatus }: UsePushNotificationsInput): UsePushNotificationsResult => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences)
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>('unknown')
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [lastNotificationEvent, setLastNotificationEvent] = useState<NotificationEvent | null>(null)
  const [isReady, setIsReady] = useState(false)

  const persistPreferences = useCallback(async (nextPreferences: NotificationPreferences) => {
    setPreferences(nextPreferences)

    try {
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_STORAGE_KEY,
        JSON.stringify(nextPreferences),
      )
    } catch {
      // Ignore storage errors; keep in-memory state.
    }
  }, [])

  const syncPushToken = useCallback(
    async (token: string): Promise<PushTokenSyncStatus> => {
      if (authStatus !== 'signedIn') {
        return 'deferred'
      }

      try {
        return await pushTokenApi.registerPushToken({ token })
      } catch (error) {
        console.warn('Unable to sync push token yet:', error)
        return 'deferred'
      }
    },
    [authStatus],
  )

  const dispatchNotificationEvent = useCallback(
    async (event: { payload: NotificationEvent['payload']; source: NotificationEventSource }) => {
      if (!preferences.enabled) {
        return
      }

      if (!preferences.topics[event.payload.topic]) {
        return
      }

      const nextEvent: NotificationEvent = {
        payload: event.payload,
        source: event.source,
      }

      setLastNotificationEvent(nextEvent)
      await notificationManager.dispatch(nextEvent)
    },
    [preferences],
  )

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    const nextPermissionState = await notificationApi.requestPermissionAsync()
    setPermissionState(nextPermissionState)

    if (nextPermissionState !== 'granted') {
      return false
    }

    await persistPreferences({
      ...preferences,
      enabled: true,
    })

    try {
      const token = await notificationApi.registerForPushNotificationsAsync()
      if (token) {
        setExpoPushToken(token)
        await syncPushToken(token)
      }
    } catch (error) {
      console.warn('Remote push token is not configured yet:', error)
      setExpoPushToken(null)
    }

    return true
  }, [persistPreferences, preferences, syncPushToken])

  const disablePushNotifications = useCallback(async (): Promise<void> => {
    await persistPreferences({
      ...preferences,
      enabled: false,
    })

    try {
      await notificationApi.cancelAllScheduledNotificationsAsync()
    } catch {
      // Ignore failures while clearing local reminders.
    }

    if (!expoPushToken) {
      return
    }

    try {
      await pushTokenApi.removePushToken(expoPushToken)
    } catch (error) {
      console.warn('Unable to remove push token yet:', error)
    }
  }, [expoPushToken, persistPreferences, preferences])

  const setTopicEnabled = useCallback(
    async (topic: AppNotificationTopic, enabled: boolean): Promise<void> => {
      await persistPreferences({
        ...preferences,
        topics: {
          ...preferences.topics,
          [topic]: enabled,
        },
      })
    },
    [persistPreferences, preferences],
  )

  const registerHandler = useCallback<UsePushNotificationsResult['registerHandler']>(
    (criteria, handler) => notificationManager.registerHandler(criteria, handler),
    [],
  )

  useEffect(() => {
    notificationApi.configureForegroundNotifications()

    const hydrate = async () => {
      try {
        const storedPreferences = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY)
        if (storedPreferences) {
          setPreferences(mergePreferences(JSON.parse(storedPreferences) as unknown))
        }
      } catch {
        setPreferences(defaultNotificationPreferences)
      }

      try {
        const nextPermissionState = await notificationApi.getPermissionStateAsync()
        setPermissionState(nextPermissionState)
      } catch {
        setPermissionState('unknown')
      }

      setIsReady(true)
    }

    void hydrate()
  }, [])

  useEffect(() => {
    const unsubscribeReceived = notificationApi.addReceivedListener((notification) => {
      const payload = notificationApi.extractPayloadFromNotification(notification)
      void dispatchNotificationEvent({
        payload,
        source: 'received',
      })
    })

    const unsubscribeResponse = notificationApi.addResponseListener((response) => {
      const payload = notificationApi.extractPayloadFromResponse(response)
      void dispatchNotificationEvent({
        payload,
        source: 'selected',
      })
    })

    return () => {
      unsubscribeReceived()
      unsubscribeResponse()
    }
  }, [dispatchNotificationEvent])

  useEffect(() => {
    if (!isReady || authStatus !== 'signedIn' || !preferences.enabled || !expoPushToken) {
      return
    }

    void syncPushToken(expoPushToken)
  }, [authStatus, expoPushToken, isReady, preferences.enabled, syncPushToken])

  return useMemo(
    () => ({
      preferences,
      permissionState,
      expoPushToken,
      lastNotificationEvent,
      isReady,
      enablePushNotifications,
      disablePushNotifications,
      setTopicEnabled,
      registerHandler,
    }),
    [
      preferences,
      permissionState,
      expoPushToken,
      lastNotificationEvent,
      isReady,
      enablePushNotifications,
      disablePushNotifications,
      setTopicEnabled,
      registerHandler,
    ],
  )
}
