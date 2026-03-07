// ADDED THIS
import type {
  AppNotificationKind,
  AppNotificationPayload,
  AppNotificationTopic,
} from '../shared'

export type NotificationEventSource = 'received' | 'selected'

export type NotificationEvent = {
  payload: AppNotificationPayload
  source: NotificationEventSource
}

export type NotificationHandlerCriteria = {
  topic?: AppNotificationTopic
  kind?: AppNotificationKind
}

export type NotificationHandler = (event: NotificationEvent) => void | Promise<void>

type RegisteredNotificationHandler = {
  id: number
  criteria: NotificationHandlerCriteria
  handler: NotificationHandler
}

class NotificationManager {
  private nextHandlerId = 1

  private handlers = new Map<number, RegisteredNotificationHandler>()

  registerHandler(criteria: NotificationHandlerCriteria, handler: NotificationHandler): () => void {
    const id = this.nextHandlerId++

    this.handlers.set(id, {
      id,
      criteria,
      handler,
    })

    return () => {
      this.handlers.delete(id)
    }
  }

  async dispatch(event: NotificationEvent): Promise<number> {
    const matches = Array.from(this.handlers.values()).filter(({ criteria }) => {
      if (criteria.topic && criteria.topic !== event.payload.topic) {
        return false
      }

      if (criteria.kind && criteria.kind !== event.payload.kind) {
        return false
      }

      return true
    })

    await Promise.allSettled(matches.map(({ handler }) => handler(event)))

    return matches.length
  }
}

export const notificationManager = new NotificationManager()
