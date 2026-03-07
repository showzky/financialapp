import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveConfirmAction,
  resolveLoansScreenFetchState,
} from './loanScreenLogic'

const sampleLoan = {
  id: 'lent-1',
  recipient: 'Ola',
  amount: 5000,
  dateGiven: '2026-03-01T00:00:00.000Z',
  expectedRepaymentDate: '2026-04-01T00:00:00.000Z',
  notes: null,
  repaidAt: null,
  status: 'outstanding' as const,
  daysRemaining: 10,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
}

const sampleBorrowedLoan = {
  id: 'borrowed-1',
  lender: 'DNB',
  originalAmount: 300000,
  currentBalance: 220000,
  payoffDate: '2035-01-01T00:00:00.000Z',
  notes: null,
  paidOffAt: null,
  status: 'active' as const,
  daysRemaining: 120,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
}

test('resolveLoansScreenFetchState keeps lent data when personal loans fail', () => {
  const state = resolveLoansScreenFetchState({
    lentListResult: { status: 'fulfilled', value: [sampleLoan] },
    lentSummaryResult: {
      status: 'fulfilled',
      value: {
        totalOutstandingAmount: 5000,
        activeCount: 1,
        overdueCount: 0,
        dueSoonCount: 0,
        repaidCount: 0,
      },
    },
    borrowedListResult: { status: 'rejected', reason: new Error('Could not load personal loans') },
    borrowedSummaryResult: {
      status: 'fulfilled',
      value: {
        totalCurrentBalance: 220000,
        activeCount: 1,
        overdueCount: 0,
        dueSoonCount: 0,
        paidOffCount: 0,
      },
    },
  })

  assert.equal(state.loans.length, 1)
  assert.equal(state.borrowedLoans.length, 0)
  assert.equal(state.lentError, '')
  assert.equal(state.borrowedError, 'Could not load personal loans')
})

test('resolveConfirmAction routes borrowed delete only for paid-off loans', () => {
  assert.throws(
    () =>
      resolveConfirmAction({
        type: 'delete-borrowed',
        loan: sampleBorrowedLoan,
      }),
    /Only paid-off personal loans can be deleted/,
  )

  const action = resolveConfirmAction({
    type: 'delete-borrowed',
    loan: {
      ...sampleBorrowedLoan,
      status: 'paid_off',
      currentBalance: 0,
      paidOffAt: '2026-03-07T12:00:00.000Z',
      daysRemaining: null,
    },
  })

  assert.deepEqual(action, { type: 'delete-borrowed', id: 'borrowed-1' })
})

test('resolveConfirmAction maps lent and paid-off actions to their ids', () => {
  assert.deepEqual(resolveConfirmAction({ type: 'repaid', loan: sampleLoan }), {
    type: 'repaid',
    id: 'lent-1',
  })
  assert.deepEqual(
    resolveConfirmAction({ type: 'paid-off', loan: sampleBorrowedLoan }),
    {
      type: 'paid-off',
      id: 'borrowed-1',
    },
  )
})
