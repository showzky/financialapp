import { db } from '../config/db.js'

export type BorrowedLoanStatus = 'active' | 'due_soon' | 'overdue' | 'paid_off'

export type BorrowedLoan = {
  id: string
  userId: string
  lender: string
  originalAmount: number
  currentBalance: number
  interestRate: number
  payoffDate: string
  notes: string | null
  paidOffAt: string | null
  status: BorrowedLoanStatus
  daysRemaining: number | null
  createdAt: string
  updatedAt: string
}

export type CreateBorrowedLoanModelInput = {
  userId: string
  lender: string
  originalAmount: number
  currentBalance: number
  interestRate: number
  payoffDate: string
  notes?: string | null
}

export type UpdateBorrowedLoanModelInput = {
  lender?: string | undefined
  originalAmount?: number | undefined
  currentBalance?: number | undefined
  interestRate?: number | undefined
  payoffDate?: string | undefined
  notes?: string | null | undefined
}

export type BorrowedLoanSummary = {
  totalCurrentBalance: number
  activeCount: number
  overdueCount: number
  dueSoonCount: number
  paidOffCount: number
}

const borrowedLoanSelect = `
  id,
  user_id AS "userId",
  lender,
  original_amount::float8 AS "originalAmount",
  current_balance::float8 AS "currentBalance",
  interest_rate::float8 AS "interestRate",
  payoff_date AS "payoffDate",
  notes,
  paid_off_at AS "paidOffAt",
  CASE
    WHEN paid_off_at IS NOT NULL THEN 'paid_off'
    WHEN payoff_date < CURRENT_DATE THEN 'overdue'
    WHEN payoff_date <= (CURRENT_DATE + INTERVAL '7 days')::date THEN 'due_soon'
    ELSE 'active'
  END AS status,
  CASE
    WHEN paid_off_at IS NOT NULL THEN NULL
    ELSE (payoff_date - CURRENT_DATE)::int
  END AS "daysRemaining",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

export const borrowedLoanModel = {
  async listByUser(userId: string): Promise<BorrowedLoan[]> {
    const result = await db.query<BorrowedLoan>(
      `
      SELECT ${borrowedLoanSelect}
      FROM borrowed_loans
      WHERE user_id = $1
      ORDER BY
        CASE WHEN paid_off_at IS NULL THEN 0 ELSE 1 END,
        payoff_date ASC,
        created_at DESC
      `,
      [userId],
    )

    return result.rows
  },

  async getById(id: string, userId: string): Promise<BorrowedLoan | null> {
    const result = await db.query<BorrowedLoan>(
      `
      SELECT ${borrowedLoanSelect}
      FROM borrowed_loans
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async create(input: CreateBorrowedLoanModelInput): Promise<BorrowedLoan> {
    const result = await db.query<BorrowedLoan>(
      `
      INSERT INTO borrowed_loans (
        user_id,
        lender,
        original_amount,
        current_balance,
        interest_rate,
        payoff_date,
        notes,
        paid_off_at
      )
      VALUES (
        $1,
        $2,
        $3::numeric(12, 2),
        $4::numeric(12, 2),
        $5::numeric(5, 2),
        $6::date,
        $7,
        CASE
          WHEN $4::numeric(12, 2) <= 0::numeric THEN NOW()
          ELSE NULL::timestamptz
        END
      )
      RETURNING ${borrowedLoanSelect}
      `,
      [
        input.userId,
        input.lender,
        input.originalAmount,
        input.currentBalance,
        input.interestRate,
        input.payoffDate,
        input.notes ?? null,
      ],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create borrowed loan')
    }

    return row
  },

  async update(
    id: string,
    userId: string,
    input: UpdateBorrowedLoanModelInput,
  ): Promise<BorrowedLoan | null> {
    const hasOriginalAmountUpdate = input.originalAmount !== undefined
    const hasCurrentBalanceUpdate = input.currentBalance !== undefined
    const hasInterestRateUpdate = input.interestRate !== undefined
    const hasNotesUpdate = input.notes !== undefined

    const result = await db.query<BorrowedLoan>(
      `
      UPDATE borrowed_loans
      SET
        lender = COALESCE($3, lender),
        original_amount = CASE WHEN $4 THEN $5::numeric(12, 2) ELSE original_amount END,
        current_balance = CASE WHEN $6 THEN $7::numeric(12, 2) ELSE current_balance END,
        interest_rate = CASE WHEN $8 THEN $9::numeric(5, 2) ELSE interest_rate END,
        paid_off_at = CASE
          WHEN $6 AND $7::numeric(12, 2) <= 0::numeric THEN COALESCE(paid_off_at, NOW())
          WHEN $6 AND $7::numeric(12, 2) > 0::numeric THEN NULL
          ELSE paid_off_at
        END,
        payoff_date = COALESCE($10::date, payoff_date),
        notes = CASE WHEN $11 THEN $12 ELSE notes END,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${borrowedLoanSelect}
      `,
      [
        id,
        userId,
        input.lender ?? null,
        hasOriginalAmountUpdate,
        input.originalAmount ?? null,
        hasCurrentBalanceUpdate,
        input.currentBalance ?? null,
        hasInterestRateUpdate,
        input.interestRate ?? null,
        input.payoffDate ?? null,
        hasNotesUpdate,
        input.notes ?? null,
      ],
    )

    return result.rows[0] ?? null
  },

  async markPaidOff(id: string, userId: string): Promise<BorrowedLoan | null> {
    const result = await db.query<BorrowedLoan>(
      `
      UPDATE borrowed_loans
      SET
        current_balance = 0,
        paid_off_at = COALESCE(paid_off_at, NOW()),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${borrowedLoanSelect}
      `,
      [id, userId],
    )

    return result.rows[0] ?? null
  },

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `
      DELETE FROM borrowed_loans
      WHERE id = $1
        AND user_id = $2
      `,
      [id, userId],
    )

    return result.rowCount === 1
  },

  async getSummary(userId: string): Promise<BorrowedLoanSummary> {
    const result = await db.query<BorrowedLoanSummary>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN paid_off_at IS NULL THEN current_balance ELSE 0 END), 0)::float8 AS "totalCurrentBalance",
        COALESCE(COUNT(*) FILTER (WHERE paid_off_at IS NULL), 0)::int AS "activeCount",
        COALESCE(COUNT(*) FILTER (WHERE paid_off_at IS NULL AND payoff_date < CURRENT_DATE), 0)::int AS "overdueCount",
        COALESCE(COUNT(*) FILTER (
          WHERE paid_off_at IS NULL
            AND payoff_date >= CURRENT_DATE
            AND payoff_date <= (CURRENT_DATE + INTERVAL '7 days')::date
        ), 0)::int AS "dueSoonCount",
        COALESCE(COUNT(*) FILTER (WHERE paid_off_at IS NOT NULL), 0)::int AS "paidOffCount"
      FROM borrowed_loans
      WHERE user_id = $1
      `,
      [userId],
    )

    return (
      result.rows[0] ?? {
        totalCurrentBalance: 0,
        activeCount: 0,
        overdueCount: 0,
        dueSoonCount: 0,
        paidOffCount: 0,
      }
    )
  },
}
