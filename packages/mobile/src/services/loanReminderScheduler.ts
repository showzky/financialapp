import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import type { Loan } from '../shared'
import { notificationApi } from './notificationApi'

const LOAN_REMINDER_STORAGE_KEY = 'app:notifications:loan-reminders'
const REMINDER_DAYS_BEFORE_DUE = 1
const REMINDER_HOUR_LOCAL = 9

type LoanReminderMap = Record<string, string>

const readReminderMap = async (): Promise<LoanReminderMap> => {
  try {
    const raw = await AsyncStorage.getItem(LOAN_REMINDER_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter((entry): entry is [string, string] => {
        const [, value] = entry
        return typeof value === 'string' && value.length > 0
      }),
    )
  } catch {
    return {}
  }
}

const writeReminderMap = async (value: LoanReminderMap): Promise<void> => {
  await AsyncStorage.setItem(LOAN_REMINDER_STORAGE_KEY, JSON.stringify(value))
}

const cancelScheduledReminder = async (identifier: string | undefined): Promise<void> => {
  if (!identifier) {
    return
  }

  try {
    await notificationApi.cancelScheduledNotificationAsync(identifier)
  } catch {
    // Ignore stale identifiers that may already be gone.
  }
}

const buildLoanDueSoonPayload = (loan: Loan) => ({
  id: `${loan.id}:due-soon`,
  topic: 'loans' as const,
  kind: 'loan_due_soon' as const,
  title: 'Loan due soon',
  body: `${loan.recipient} should repay ${formatNOK(loan.amount)} by ${formatDate(loan.expectedRepaymentDate)}.`,
  route: 'Loans' as const,
  entityId: loan.id,
  sentAt: new Date().toISOString(),
  data: {
    recipient: loan.recipient,
    amount: loan.amount,
    dueDate: loan.expectedRepaymentDate,
    status: loan.status,
  },
})

const formatDate = (value: string): string => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatNOK = (value: number): string => `NOK ${value.toLocaleString('en-US')}`

const getReminderDate = (loan: Loan): Date | null => {
  if (loan.status === 'repaid') {
    return null
  }

  const dueDate = new Date(`${loan.expectedRepaymentDate.slice(0, 10)}T${String(REMINDER_HOUR_LOCAL).padStart(2, '0')}:00:00`)
  if (Number.isNaN(dueDate.getTime())) {
    return null
  }

  dueDate.setDate(dueDate.getDate() - REMINDER_DAYS_BEFORE_DUE)
  return dueDate
}

const shouldKeepReminder = (loan: Loan, triggerDate: Date | null): triggerDate is Date => {
  return loan.status !== 'repaid' && triggerDate !== null && triggerDate.getTime() > Date.now()
}

export const loanReminderScheduler = {
  async clearAllAsync(): Promise<void> {
    const reminderMap = await readReminderMap()

    await Promise.all(Object.values(reminderMap).map((identifier) => cancelScheduledReminder(identifier)))
    await writeReminderMap({})
  },

  async syncLoanDueSoonReminders(loans: Loan[]): Promise<void> {
    const reminderMap = await readReminderMap()
    const nextReminderMap: LoanReminderMap = {}
    const activeLoanIds = new Set(loans.map((loan) => loan.id))

    for (const [loanId, identifier] of Object.entries(reminderMap)) {
      if (!activeLoanIds.has(loanId)) {
        await cancelScheduledReminder(identifier)
      }
    }

    for (const loan of loans) {
      const existingIdentifier = reminderMap[loan.id]
      await cancelScheduledReminder(existingIdentifier)

      const triggerDate = getReminderDate(loan)
      if (!shouldKeepReminder(loan, triggerDate)) {
        continue
      }

      const identifier = await notificationApi.scheduleNotificationAsync(buildLoanDueSoonPayload(loan), {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      })

      nextReminderMap[loan.id] = identifier
    }

    await writeReminderMap(nextReminderMap)
  },
}
