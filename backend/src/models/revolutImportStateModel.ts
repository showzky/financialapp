import { db } from '../config/db.js'

export type RevolutImportStateRecord = {
  id: string
  userId: string
  state: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

const revolutImportStateSelect = `
  id,
  user_id AS "userId",
  state,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

export const revolutImportStateModel = {
  async getByUser(userId: string): Promise<RevolutImportStateRecord | null> {
    const result = await db.query<RevolutImportStateRecord>(
      `
      SELECT ${revolutImportStateSelect}
      FROM revolut_import_states
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId],
    )

    return result.rows[0] ?? null
  },

  async upsertByUser(
    userId: string,
    state: Record<string, unknown>,
  ): Promise<RevolutImportStateRecord> {
    const result = await db.query<RevolutImportStateRecord>(
      `
      INSERT INTO revolut_import_states (user_id, state)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (user_id)
      DO UPDATE SET
        state = EXCLUDED.state,
        updated_at = NOW()
      RETURNING ${revolutImportStateSelect}
      `,
      [userId, JSON.stringify(state)],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to persist Revolut import state')
    }

    return row
  },

  async removeByUser(userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM revolut_import_states
      WHERE user_id = $1
      `,
      [userId],
    )

    return (result.rowCount ?? 0) > 0
  },
}
