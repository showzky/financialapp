import { db } from '../config/db.js'

export type AccountBalanceAdjustment = {
  id: string
  userId: string
  accountId: string
  amountDelta: number
  targetAmount: number
  createdAt: string
}

export const accountBalanceAdjustmentModel = {
  async create(
    userId: string,
    accountId: string,
    amountDelta: number,
    targetAmount: number,
  ): Promise<AccountBalanceAdjustment> {
    const result = await db.query<AccountBalanceAdjustment>(
      `
      INSERT INTO account_balance_adjustments (user_id, account_id, amount_delta, target_amount)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id AS "userId",
        account_id AS "accountId",
        amount_delta::float8 AS "amountDelta",
        target_amount::float8 AS "targetAmount",
        created_at AS "createdAt"
      `,
      [userId, accountId, amountDelta, targetAmount],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create balance adjustment')
    }

    return row
  },

  async listByAccount(userId: string, accountId: string): Promise<AccountBalanceAdjustment[]> {
    const result = await db.query<AccountBalanceAdjustment>(
      `
      SELECT
        id,
        user_id AS "userId",
        account_id AS "accountId",
        amount_delta::float8 AS "amountDelta",
        target_amount::float8 AS "targetAmount",
        created_at AS "createdAt"
      FROM account_balance_adjustments
      WHERE user_id = $1 AND account_id = $2
      ORDER BY created_at DESC
      `,
      [userId, accountId],
    )

    return result.rows
  },
}
