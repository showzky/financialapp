import { db } from '../config/db.js'

export type PushPlatform = 'ios' | 'android'

export type PushNotificationToken = {
  id: string
  userId: string
  token: string
  platform: PushPlatform
  createdAt: string
  updatedAt: string
}

export type UpsertPushNotificationTokenInput = {
  userId: string
  token: string
  platform: PushPlatform
}

export const pushNotificationTokenModel = {
  async upsert(input: UpsertPushNotificationTokenInput): Promise<PushNotificationToken> {
    const result = await db.query<PushNotificationToken>(
      `
      INSERT INTO push_notification_tokens (user_id, token, platform)
      VALUES ($1, $2, $3)
      ON CONFLICT (token)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        updated_at = NOW()
      RETURNING
        id,
        user_id AS "userId",
        token,
        platform,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [input.userId, input.token, input.platform],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to upsert push notification token')
    }

    return row
  },

  async removeByUserAndToken(userId: string, token: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM push_notification_tokens
      WHERE user_id = $1 AND token = $2
      `,
      [userId, token],
    )

    return result.rowCount === 1
  },

  async listByUser(userId: string): Promise<PushNotificationToken[]> {
    const result = await db.query<PushNotificationToken>(
      `
      SELECT
        id,
        user_id AS "userId",
        token,
        platform,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM push_notification_tokens
      WHERE user_id = $1
      ORDER BY updated_at DESC, created_at DESC
      `,
      [userId],
    )

    return result.rows
  },
}