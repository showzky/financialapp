import { db } from '../config/db.js'

export type LoanStatus = 'outstanding' | 'due_soon' | 'overdue' | 'repaid'

export type Loan = {
  id: string
  userId: string
  recipient: string
  amount: number
  dateGiven: string
  expectedRepaymentDate: string
  repaidAt: string | null
  status: LoanStatus
  daysRemaining: number | null
  createdAt: string
  updatedAt: string
}

export type CreateLoanInput = {
  userId: string
  recipient: string
  amount: number
  dateGiven: string
  expectedRepaymentDate: string
}

export type UpdateLoanInput = {
  recipient?: string | undefined
  amount?: number | undefined
  dateGiven?: string | undefined
  expectedRepaymentDate?: string | undefined
}

export type LoanSummary = {
  totalOutstandingAmount: number
  activeCount: number
  overdueCount: number
  dueSoonCount: number
  repaidCount: number
}

const loanSelect = `
  id,
  user_id AS "userId",
  recipient,
  amount::float8 AS amount,
  date_given AS "dateGiven",
  expected_repayment_date AS "expectedRepaymentDate",
  repaid_at AS "repaidAt",
  CASE
    WHEN repaid_at IS NOT NULL THEN 'repaid'
    WHEN expected_repayment_date < CURRENT_DATE THEN 'overdue'
    WHEN expected_repayment_date <= (CURRENT_DATE + INTERVAL '7 days')::date THEN 'due_soon'
    ELSE 'outstanding'
  END AS status,
  CASE
    WHEN repaid_at IS NOT NULL THEN NULL
    ELSE (expected_repayment_date - CURRENT_DATE)::int
  END AS "daysRemaining",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

export const loanModel = {
  async listByUser(userId: string): Promise<Loan[]> {
    const result = await db.query<Loan>(
      `
      SELECT ${loanSelect}
      FROM loans_given
      WHERE user_id = $1
      ORDER BY
        CASE WHEN repaid_at IS NULL THEN 0 ELSE 1 END,
        expected_repayment_date ASC,
        created_at DESC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<Loan | null> {
    const result = await db.query<Loan>(
      `
      SELECT ${loanSelect}
      FROM loans_given
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async create(input: CreateLoanInput): Promise<Loan> {
    const result = await db.query<Loan>(
      `
      INSERT INTO loans_given (
        user_id,
        recipient,
        amount,
        date_given,
        expected_repayment_date
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${loanSelect}
      `,
      [input.userId, input.recipient, input.amount, input.dateGiven, input.expectedRepaymentDate],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create loan')
    }

    return row
  },

  async update(id: string, userId: string, input: UpdateLoanInput): Promise<Loan | null> {
    const hasAmountUpdate = input.amount !== undefined

    const result = await db.query<Loan>(
      `
      UPDATE loans_given
      SET
        recipient = COALESCE($3, recipient),
        amount = CASE WHEN $7 THEN $4 ELSE amount END,
        date_given = COALESCE($5, date_given),
        expected_repayment_date = COALESCE($6, expected_repayment_date),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${loanSelect}
      `,
      [
        id,
        userId,
        input.recipient ?? null,
        input.amount === undefined ? null : input.amount,
        input.dateGiven ?? null,
        input.expectedRepaymentDate ?? null,
        hasAmountUpdate,
      ],
    )

    return result.rows[0] ?? null
  },

  async markRepaid(id: string, userId: string): Promise<Loan | null> {
    const result = await db.query<Loan>(
      `
      UPDATE loans_given
      SET
        repaid_at = COALESCE(repaid_at, NOW()),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${loanSelect}
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM loans_given
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },

  async getSummary(userId: string): Promise<LoanSummary> {
    const result = await db.query<LoanSummary>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN repaid_at IS NULL THEN amount ELSE 0 END), 0)::float8 AS "totalOutstandingAmount",
        COALESCE(COUNT(*) FILTER (WHERE repaid_at IS NULL), 0)::int AS "activeCount",
        COALESCE(COUNT(*) FILTER (WHERE repaid_at IS NULL AND expected_repayment_date < CURRENT_DATE), 0)::int AS "overdueCount",
        COALESCE(COUNT(*) FILTER (
          WHERE repaid_at IS NULL
            AND expected_repayment_date >= CURRENT_DATE
            AND expected_repayment_date <= (CURRENT_DATE + INTERVAL '7 days')::date
        ), 0)::int AS "dueSoonCount",
        COALESCE(COUNT(*) FILTER (WHERE repaid_at IS NOT NULL), 0)::int AS "repaidCount"
      FROM loans_given
      WHERE user_id = $1
      `,
      [userId],
    )

    return (
      result.rows[0] ?? {
        totalOutstandingAmount: 0,
        activeCount: 0,
        overdueCount: 0,
        dueSoonCount: 0,
        repaidCount: 0,
      }
    )
  },
}
