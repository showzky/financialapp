import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { notificationApi } from './notificationApi'

const STORAGE_KEY = 'app:notifications:income-reminders'

type ReminderMap = Record<string, string> // incomeEntryId -> notificationIdentifier

const readMap = async (): Promise<ReminderMap> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}

const writeMap = async (map: ReminderMap): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export const incomeReminderScheduler = {
  /**
   * Schedule a local notification reminder for an income entry.
   * If a reminder already exists for this entry it will be replaced.
   * Silently skips if reminderDate is in the past.
   */
  async scheduleAsync(incomeEntryId: string, reminderDate: Date, entryLabel: string): Promise<void> {
    if (reminderDate.getTime() <= Date.now()) return

    const map = await readMap()

    // Cancel the existing reminder for this entry if any
    const existingId = map[incomeEntryId]
    if (existingId) {
      try {
        await notificationApi.cancelScheduledNotificationAsync(existingId)
      } catch {
        // Stale identifier — safe to ignore
      }
    }

    const identifier = await notificationApi.scheduleNotificationAsync(
      {
        id: `income:${incomeEntryId}`,
        topic: 'income',
        kind: 'income_reminder',
        title: 'Income reminder',
        body: entryLabel,
        sentAt: new Date().toISOString(),
      },
      {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    )

    await writeMap({ ...map, [incomeEntryId]: identifier })
  },

  /** Cancel any scheduled reminder for the given income entry. */
  async cancelAsync(incomeEntryId: string): Promise<void> {
    const map = await readMap()
    const existingId = map[incomeEntryId]
    if (!existingId) return
    try {
      await notificationApi.cancelScheduledNotificationAsync(existingId)
    } catch {
      // Already gone
    }
    const { [incomeEntryId]: _removed, ...rest } = map
    await writeMap(rest)
  },
}
