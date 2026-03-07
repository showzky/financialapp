import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import type { NextFunction, Request, Response } from 'express'
import {
  createLoan,
  deleteLoan,
  getLoanSummary,
  listLoans,
  markLoanRepaid,
  updateLoan,
} from './loanController.js'
import { loanModel, type Loan, type LoanSummary } from '../models/loanModel.js'
import { AppError } from '../utils/appError.js'

const sampleLoan: Loan = {
  id: '19e9ed29-6fd9-4ddc-afb2-4946717a3bf6',
  userId: 'afdfdc1b-9f83-45ed-9593-e3ebb9c18fd5',
  recipient: 'Maja Olsen',
  amount: 12500,
  dateGiven: '2026-03-01T00:00:00.000Z',
  expectedRepaymentDate: '2026-04-01T00:00:00.000Z',
  notes: 'First installment due next month',
  repaidAt: null,
  status: 'outstanding',
  daysRemaining: 25,
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
}

const sampleSummary: LoanSummary = {
  totalOutstandingAmount: 12500,
  activeCount: 1,
  overdueCount: 0,
  dueSoonCount: 0,
  repaidCount: 0,
}

const originalModelMethods = {
  listByUser: loanModel.listByUser,
  getSummary: loanModel.getSummary,
  create: loanModel.create,
  getById: loanModel.getById,
  update: loanModel.update,
  markRepaid: loanModel.markRepaid,
  remove: loanModel.remove,
}

afterEach(() => {
  loanModel.listByUser = originalModelMethods.listByUser
  loanModel.getSummary = originalModelMethods.getSummary
  loanModel.create = originalModelMethods.create
  loanModel.getById = originalModelMethods.getById
  loanModel.update = originalModelMethods.update
  loanModel.markRepaid = originalModelMethods.markRepaid
  loanModel.remove = originalModelMethods.remove
})

const createResponseMock = () => {
  let statusCode: number | null = null
  let jsonBody: unknown = null
  let sentBody: unknown = null

  const response = {
    status(code: number) {
      statusCode = code
      return this
    },
    json(body: unknown) {
      jsonBody = body
      return this
    },
    send(body?: unknown) {
      sentBody = body
      return this
    },
  } as unknown as Response

  return {
    response,
    getStatusCode: () => statusCode,
    getJsonBody: () => jsonBody,
    getSentBody: () => sentBody,
  }
}

test('listLoans returns 401 when auth is missing', async () => {
  const req = {} as Request
  const { response } = createResponseMock()

  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  listLoans(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 401)
})

test('listLoans returns the current lent-loan collection for the signed-in user', async () => {
  let capturedUserId = ''
  loanModel.listByUser = async (userId: string) => {
    capturedUserId = userId
    return [sampleLoan]
  }

  const req = {
    auth: { userId: sampleLoan.userId },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  listLoans(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(capturedUserId, sampleLoan.userId)
  assert.equal(getStatusCode(), 200)
  assert.deepEqual(getJsonBody(), [sampleLoan])
})

test('getLoanSummary returns the current lent-loan summary contract', async () => {
  let capturedUserId = ''
  loanModel.getSummary = async (userId: string) => {
    capturedUserId = userId
    return sampleSummary
  }

  const req = {
    auth: { userId: sampleLoan.userId },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  getLoanSummary(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(capturedUserId, sampleLoan.userId)
  assert.equal(getStatusCode(), 200)
  assert.deepEqual(getJsonBody(), sampleSummary)
})

test('createLoan normalizes notes and forwards ISO dates to the model', async () => {
  let capturedInput: Parameters<typeof loanModel.create>[0] | null = null
  loanModel.create = async (input) => {
    capturedInput = input
    return {
      ...sampleLoan,
      recipient: input.recipient,
      amount: input.amount,
      dateGiven: input.dateGiven,
      expectedRepaymentDate: input.expectedRepaymentDate,
      notes: input.notes ?? null,
    }
  }

  const req = {
    auth: { userId: sampleLoan.userId },
    body: {
      recipient: 'Storebrand',
      amount: 8800,
      dateGiven: '2026-03-05',
      expectedRepaymentDate: '2026-05-05',
      notes: '   ',
    },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  createLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(getStatusCode(), 201)
  assert.deepEqual(capturedInput, {
    userId: sampleLoan.userId,
    recipient: 'Storebrand',
    amount: 8800,
    dateGiven: '2026-03-05T00:00:00.000Z',
    expectedRepaymentDate: '2026-05-05T00:00:00.000Z',
    notes: null,
  })

  const jsonBody = getJsonBody() as Loan
  assert.equal(jsonBody.recipient, 'Storebrand')
  assert.equal(jsonBody.notes, null)
})

test('createLoan omits notes when the request does not include them', async () => {
  let capturedInput: Parameters<typeof loanModel.create>[0] | null = null
  loanModel.create = async (input) => {
    capturedInput = input
    return {
      ...sampleLoan,
      recipient: input.recipient,
      amount: input.amount,
      dateGiven: input.dateGiven,
      expectedRepaymentDate: input.expectedRepaymentDate,
      notes: input.notes ?? null,
    }
  }

  const req = {
    auth: { userId: sampleLoan.userId },
    body: {
      recipient: 'Santander',
      amount: 4200,
      dateGiven: '2026-03-10',
      expectedRepaymentDate: '2026-05-10',
    },
  } as unknown as Request

  const { response, getStatusCode } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  createLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(getStatusCode(), 201)
  assert.deepEqual(capturedInput, {
    userId: sampleLoan.userId,
    recipient: 'Santander',
    amount: 4200,
    dateGiven: '2026-03-10T00:00:00.000Z',
    expectedRepaymentDate: '2026-05-10T00:00:00.000Z',
  })
})

test('updateLoan keeps the lent-loan update contract and normalizes outgoing fields', async () => {
  let capturedLookup: { id: string; userId: string } | null = null
  let capturedUpdate:
    | {
        id: string
        userId: string
        payload: Parameters<typeof loanModel.update>[2]
      }
    | null = null

  loanModel.getById = async (id, userId) => {
    capturedLookup = { id, userId }
    return sampleLoan
  }

  loanModel.update = async (id, userId, payload) => {
    capturedUpdate = { id, userId, payload }
    return {
      ...sampleLoan,
      recipient: payload.recipient ?? sampleLoan.recipient,
      amount: payload.amount ?? sampleLoan.amount,
      expectedRepaymentDate: payload.expectedRepaymentDate ?? sampleLoan.expectedRepaymentDate,
      notes: payload.notes ?? null,
    }
  }

  const req = {
    auth: { userId: sampleLoan.userId },
    params: { id: sampleLoan.id },
    body: {
      recipient: 'DNB',
      expectedRepaymentDate: '2026-06-01',
      notes: '  updated note  ',
    },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  updateLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.deepEqual(capturedLookup, {
    id: sampleLoan.id,
    userId: sampleLoan.userId,
  })
  assert.deepEqual(capturedUpdate, {
    id: sampleLoan.id,
    userId: sampleLoan.userId,
    payload: {
      recipient: 'DNB',
      dateGiven: undefined,
      expectedRepaymentDate: '2026-06-01T00:00:00.000Z',
      notes: 'updated note',
    },
  })
  assert.equal(getStatusCode(), 200)
  assert.equal((getJsonBody() as Loan).recipient, 'DNB')
})

test('markLoanRepaid keeps using the lent-loan model contract', async () => {
  let capturedCall: { id: string; userId: string } | null = null
  loanModel.markRepaid = async (id, userId) => {
    capturedCall = { id, userId }
    return {
      ...sampleLoan,
      repaidAt: '2026-03-07T10:00:00.000Z',
      status: 'repaid',
      daysRemaining: null,
    }
  }

  const req = {
    auth: { userId: sampleLoan.userId },
    params: { id: sampleLoan.id },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  markLoanRepaid(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.deepEqual(capturedCall, {
    id: sampleLoan.id,
    userId: sampleLoan.userId,
  })
  assert.equal(getStatusCode(), 200)
  assert.equal((getJsonBody() as Loan).status, 'repaid')
})

test('deleteLoan keeps using the lent-loan model contract', async () => {
  let capturedCall: { id: string; userId: string } | null = null
  loanModel.remove = async (id, userId) => {
    capturedCall = { id, userId }
    return true
  }

  const req = {
    auth: { userId: sampleLoan.userId },
    params: { id: sampleLoan.id },
  } as unknown as Request

  const { response, getStatusCode, getSentBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  deleteLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.deepEqual(capturedCall, {
    id: sampleLoan.id,
    userId: sampleLoan.userId,
  })
  assert.equal(getStatusCode(), 204)
  assert.equal(getSentBody(), undefined)
})