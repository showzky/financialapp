import { z } from 'zod'

export const borrowedLoanStatusSchema = z.enum(['active', 'due_soon', 'overdue', 'paid_off'])

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

const isValidIsoDate = (value: string): boolean => {
  const match = isoDateRegex.exec(value)
  if (!match) return false

  const year = Number(match[0].slice(0, 4))
  const month = Number(match[0].slice(5, 7))
  const day = Number(match[0].slice(8, 10))
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const notesSchema = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => (value.length === 0 ? null : value))

const payoffDateSchema = z
  .string()
  .regex(isoDateRegex, 'payoffDate must be in YYYY-MM-DD format')
  .refine(isValidIsoDate, 'payoffDate must be a real calendar date')

const interestRateSchema = z.number().finite().min(0).max(100)

export const createBorrowedLoanSchema = z.object({
  lender: z.string().trim().min(1).max(150),
  originalAmount: z.number().finite().positive(),
  currentBalance: z.number().finite().min(0),
  interestRate: interestRateSchema,
  payoffDate: payoffDateSchema,
  notes: notesSchema.nullable().optional(),
}).refine((value) => value.currentBalance <= value.originalAmount, {
  message: 'Current balance cannot exceed original amount',
  path: ['currentBalance'],
})

export const updateBorrowedLoanSchema = z
  .object({
    lender: z.string().trim().min(1).max(150).optional(),
    originalAmount: z.number().finite().positive().optional(),
    currentBalance: z.number().finite().min(0).optional(),
    interestRate: interestRateSchema.optional(),
    payoffDate: payoffDateSchema.optional(),
    notes: notesSchema.nullable().optional(),
  })
  .refine(
    (value) =>
      value.lender !== undefined ||
      value.originalAmount !== undefined ||
      value.currentBalance !== undefined ||
      value.interestRate !== undefined ||
      value.payoffDate !== undefined ||
      value.notes !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

export const borrowedLoanIdSchema = z.object({
  id: z.string().trim().uuid(),
})

export type CreateBorrowedLoanInput = z.infer<typeof createBorrowedLoanSchema>
export type UpdateBorrowedLoanInput = z.infer<typeof updateBorrowedLoanSchema>
