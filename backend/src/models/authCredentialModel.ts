// ADD THIS: authentication credential model for single-owner login
import { db } from '../config/db.js'

export type AuthCredential = {
  userId: string
  username: string
  passwordHash: string
  createdAt: string
}

export const authCredentialModel = {
  async getByUsername(username: string): Promise<AuthCredential | null> {
    const result = await db.query<AuthCredential>(
      `
      SELECT
        user_id AS "userId",
        username,
        password_hash AS "passwordHash",
        created_at AS "createdAt"
      FROM auth_credentials
      WHERE username = $1
      LIMIT 1
      `,
      [username],
    )

    return result.rows[0] ?? null
  },

  async upsert(input: {
    userId: string
    username: string
    passwordHash: string
  }): Promise<AuthCredential> {
    const result = await db.query<AuthCredential>(
      `
      INSERT INTO auth_credentials (user_id, username, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash
      RETURNING
        user_id AS "userId",
        username,
        password_hash AS "passwordHash",
        created_at AS "createdAt"
      `,
      [input.userId, input.username, input.passwordHash],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to upsert auth credential')
    }

    return row
  },
}
