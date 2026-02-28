import { z } from 'zod'

export const subscriptionStatusSchema = z.enum(['active', 'paused', 'canceled'])
export const billingCadenceSchema = z.enum(['monthly', 'yearly'])

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

export const createSubscriptionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  provider: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  status: subscriptionStatusSchema.default('active'),
  cadence: billingCadenceSchema,
  priceCents: z.number().int().positive(),
  nextRenewalDate: z
    .string()
    .regex(isoDateRegex, 'nextRenewalDate must be in YYYY-MM-DD format')
    .refine(isValidIsoDate, 'nextRenewalDate must be a real calendar date'),
  notes: notesSchema.nullable().optional(),
})

export const updateSubscriptionSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    provider: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    status: subscriptionStatusSchema.optional(),
    cadence: billingCadenceSchema.optional(),
    priceCents: z.number().int().positive().optional(),
    nextRenewalDate: z
      .string()
      .regex(isoDateRegex, 'nextRenewalDate must be in YYYY-MM-DD format')
      .refine(isValidIsoDate, 'nextRenewalDate must be a real calendar date')
      .optional(),
    notes: notesSchema.nullable().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.provider !== undefined ||
      value.category !== undefined ||
      value.status !== undefined ||
      value.cadence !== undefined ||
      value.priceCents !== undefined ||
      value.nextRenewalDate !== undefined ||
      value.notes !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

export const subscriptionIdSchema = z.object({
  id: z.string().trim().uuid(),
})

export const toggleSubscriptionStatusSchema = z.object({
  status: subscriptionStatusSchema,
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
export type ToggleSubscriptionStatusInput = z.infer<typeof toggleSubscriptionStatusSchema>
