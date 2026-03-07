import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildCreateBorrowedLoanPayload,
  buildUpdateBorrowedLoanPayload,
  getBorrowedLoanFormErrors,
  isValidIsoDate,
} from './borrowedLoanForm'

const sampleBorrowedLoan = {
  id: 'borrowed-1',
  lender: 'Storebrand',
  originalAmount: 300000,
  currentBalance: 220000,
  interestRate: 5.2,
  payoffDate: '2035-01-01T00:00:00Z',
  notes: 'Fixed rate',
  paidOffAt: null,
  status: 'active' as const,
  daysRemaining: 120,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

test('isValidIsoDate rejects impossible calendar dates', () => {
  assert.equal(isValidIsoDate('2035-02-31'), false)
  assert.equal(isValidIsoDate('2035-02-28'), true)
})

test('getBorrowedLoanFormErrors validates lender, balance range, and payoff date', () => {
  const errors = getBorrowedLoanFormErrors({
    lender: ' ',
    originalAmount: '1000',
    currentBalance: '1200',
    interestRate: '5.2',
    payoffDate: '2035-02-31',
    notes: '',
  })

  assert.equal(errors.lender, 'Lender is required')
  assert.equal(errors.currentBalance, 'Current balance cannot exceed original amount')
  assert.equal(errors.payoffDate, 'Use format YYYY-MM-DD')
})

test('buildCreateBorrowedLoanPayload trims lender and notes', () => {
  const payload = buildCreateBorrowedLoanPayload({
    lender: '  DNB  ',
    originalAmount: '1000',
    currentBalance: '800',
    interestRate: '5.2',
    payoffDate: '2035-01-01',
    notes: '  fixed rate  ',
  })

  assert.deepEqual(payload, {
    lender: 'DNB',
    originalAmount: 1000,
    currentBalance: 800,
    interestRate: 5.2,
    payoffDate: '2035-01-01',
    notes: 'fixed rate',
  })
})

test('buildUpdateBorrowedLoanPayload only includes changed fields', () => {
  const payload = buildUpdateBorrowedLoanPayload(sampleBorrowedLoan, {
    lender: '  DNB  ',
    originalAmount: '300000',
    currentBalance: '200000',
    interestRate: '5.2',
    payoffDate: '2035-01-01',
    notes: '  updated note  ',
  })

  assert.deepEqual(payload, {
    lender: 'DNB',
    currentBalance: 200000,
    notes: 'updated note',
  })
})
