// ADDED THIS
export const notificationTopics = ['loans', 'wishlist', 'vacations', 'system'] as const

export type AppNotificationTopic = (typeof notificationTopics)[number]

export const notificationKinds = [
  'generic',
  'loan_due_soon',
  'loan_overdue',
  'loan_repaid',
  'wishlist_reminder',
  'wishlist_price_drop',
  'vacation_reminder',
] as const

export type AppNotificationKind = (typeof notificationKinds)[number]

export const notificationRoutes = ['Home', 'Loans', 'Wishlist', 'Indicators', 'Settings'] as const

export type AppNotificationRoute = (typeof notificationRoutes)[number]

export type AppNotificationDataValue = string | number | boolean | null

export type AppNotificationData = Record<string, AppNotificationDataValue>

export type AppNotificationPayload = {
  id?: string
  topic: AppNotificationTopic
  kind: AppNotificationKind
  title: string
  body: string
  route?: AppNotificationRoute
  entityId?: string
  sentAt?: string
  data?: AppNotificationData
}

export type NotificationPermissionState = 'unknown' | 'granted' | 'denied'

export type NotificationPreferences = {
  enabled: boolean
  topics: Record<AppNotificationTopic, boolean>
}

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false,
  topics: {
    loans: true,
    wishlist: true,
    vacations: true,
    system: true,
  },
}

export const isAppNotificationTopic = (value: unknown): value is AppNotificationTopic =>
  typeof value === 'string' && notificationTopics.includes(value as AppNotificationTopic)

export const isAppNotificationKind = (value: unknown): value is AppNotificationKind =>
  typeof value === 'string' && notificationKinds.includes(value as AppNotificationKind)

export const isAppNotificationRoute = (value: unknown): value is AppNotificationRoute =>
  typeof value === 'string' && notificationRoutes.includes(value as AppNotificationRoute)

export const isAppNotificationPayload = (value: unknown): value is AppNotificationPayload => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.title === 'string' &&
    typeof candidate.body === 'string' &&
    isAppNotificationTopic(candidate.topic) &&
    isAppNotificationKind(candidate.kind) &&
    (candidate.route === undefined || isAppNotificationRoute(candidate.route))
  )
}
