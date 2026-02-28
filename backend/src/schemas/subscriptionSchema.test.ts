import assert from 'node:assert/strict'
import test from 'node:test'
import { ZodError } from 'zod'
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  toggleSubscriptionStatusSchema,
} from './subscriptionSchema.js'

test('createSubscriptionSchema accepts valid payload and normalizes blank notes to null', () => {
  const parsed = createSubscriptionSchema.parse({
    name: 'Netflix',
    provider: 'Netflix',
    category: 'streaming',
    status: 'active',
    cadence: 'monthly',
    priceCents: 12900,
    nextRenewalDate: '2026-03-15',
    notes: '   ',
  })

  assert.equal(parsed.notes, null)
  assert.equal(parsed.nextRenewalDate, '2026-03-15')
})

test('createSubscriptionSchema rejects invalid calendar dates', () => {
  assert.throws(
    () =>
      createSubscriptionSchema.parse({
        name: 'Netflix',
        provider: 'Netflix',
        category: 'streaming',
        status: 'active',
        cadence: 'monthly',
        priceCents: 12900,
        nextRenewalDate: '2026-02-31',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ZodError)
      return true
    },
  )
})

test('updateSubscriptionSchema requires at least one field', () => {
  assert.throws(
    () => updateSubscriptionSchema.parse({}),
    (error: unknown) => {
      assert.ok(error instanceof ZodError)
      return true
    },
  )
})

test('toggleSubscriptionStatusSchema only allows supported statuses', () => {
  const valid = toggleSubscriptionStatusSchema.parse({ status: 'paused' })
  assert.equal(valid.status, 'paused')

  assert.throws(
    () => toggleSubscriptionStatusSchema.parse({ status: 'invalid-status' }),
    (error: unknown) => {
      assert.ok(error instanceof ZodError)
      return true
    },
  )
})
