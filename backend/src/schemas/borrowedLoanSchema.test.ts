import assert from 'node:assert/strict'
import test from 'node:test'
import { ZodError } from 'zod'
import { createBorrowedLoanSchema, updateBorrowedLoanSchema } from './borrowedLoanSchema.js'

test('createBorrowedLoanSchema accepts valid payload and normalizes blank notes to null', () => {
  const parsed = createBorrowedLoanSchema.parse({
    lender: 'Storebrand',
    originalAmount: 250000,
    currentBalance: 190000,
    interestRate: 5.4,
    payoffDate: '2035-05-01',
    notes: '   ',
  })

  assert.equal(parsed.notes, null)
  assert.equal(parsed.payoffDate, '2035-05-01')
})

test('createBorrowedLoanSchema rejects invalid payoff dates', () => {
  assert.throws(
    () =>
      createBorrowedLoanSchema.parse({
        lender: 'Storebrand',
        originalAmount: 250000,
        currentBalance: 190000,
        interestRate: 5.4,
        payoffDate: '2035-02-31',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ZodError)
      return true
    },
  )
})

test('createBorrowedLoanSchema rejects current balance above original amount', () => {
  assert.throws(
    () =>
      createBorrowedLoanSchema.parse({
        lender: 'Storebrand',
        originalAmount: 100000,
        currentBalance: 125000,
        interestRate: 5.4,
        payoffDate: '2035-05-01',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ZodError)
      return true
    },
  )
})

test('updateBorrowedLoanSchema requires at least one field', () => {
  assert.throws(
    () => updateBorrowedLoanSchema.parse({}),
    (error: unknown) => {
      assert.ok(error instanceof ZodError)
      return true
    },
  )
})

test('updateBorrowedLoanSchema allows current balance to reach zero', () => {
  const parsed = updateBorrowedLoanSchema.parse({ currentBalance: 0 })
  assert.equal(parsed.currentBalance, 0)
})