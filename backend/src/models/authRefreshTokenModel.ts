import { db } from '../config/db.js'

export type AuthRefreshToken = {
  tokenHash: string
  userId: string
  expiresAt: string
  createdAt: string
  revokedAt: string | null
  replacedByTokenHash: string | null
}

const selectColumns = `
  token_hash AS "tokenHash",
  user_id AS "userId",
  expires_at AS "expiresAt",
  created_at AS "createdAt",
  revoked_at AS "revokedAt",
  replaced_by_token_hash AS "replacedByTokenHash"
`

export const authRefreshTokenModel = {
  async create(input: {
    userId: string
    tokenHash: string
    expiresAt: string
  }): Promise<AuthRefreshToken> {
    const result = await db.query<AuthRefreshToken>(
      `
      INSERT INTO auth_refresh_tokens (token_hash, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING ${selectColumns}
      `,
      [input.tokenHash, input.userId, input.expiresAt],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create auth refresh token')
    }

    return row
  },

  async getActiveByTokenHash(tokenHash: string): Promise<AuthRefreshToken | null> {
    const result = await db.query<AuthRefreshToken>(
      `
      SELECT ${selectColumns}
      FROM auth_refresh_tokens
      WHERE token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash],
    )

    return result.rows[0] ?? null
  },

  async rotate(input: {
    currentTokenHash: string
    nextTokenHash: string
    userId: string
    nextExpiresAt: string
  }): Promise<AuthRefreshToken> {
    return db.transaction(async (query) => {
      const currentResult = await query<AuthRefreshToken>(
        `
        UPDATE auth_refresh_tokens
        SET
          revoked_at = NOW(),
          replaced_by_token_hash = $2
        WHERE token_hash = $1
          AND user_id = $3
          AND revoked_at IS NULL
          AND expires_at > NOW()
        RETURNING ${selectColumns}
        `,
        [input.currentTokenHash, input.nextTokenHash, input.userId],
      )

      if (!currentResult.rows[0]) {
        throw new Error('Refresh token is invalid or expired')
      }

      const nextResult = await query<AuthRefreshToken>(
        `
        INSERT INTO auth_refresh_tokens (token_hash, user_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING ${selectColumns}
        `,
        [input.nextTokenHash, input.userId, input.nextExpiresAt],
      )

      const nextRow = nextResult.rows[0]
      if (!nextRow) {
        throw new Error('Failed to rotate auth refresh token')
      }

      return nextRow
    })
  },

  async revokeByTokenHash(tokenHash: string): Promise<boolean> {
    const result = await db.query(
      `
      UPDATE auth_refresh_tokens
      SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL
      `,
      [tokenHash],
    )

    return (result.rowCount ?? 0) > 0
  },

  async revokeAllByUserId(userId: string): Promise<number> {
    const result = await db.query(
      `
      UPDATE auth_refresh_tokens
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND revoked_at IS NULL
      `,
      [userId],
    )

    return result.rowCount ?? 0
  },
}