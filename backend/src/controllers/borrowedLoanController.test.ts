import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import type { NextFunction, Request, Response } from 'express'
import {
  createBorrowedLoan,
  deleteBorrowedLoan,
  getBorrowedLoanSummary,
  listBorrowedLoans,
  markBorrowedLoanPaidOff,
  updateBorrowedLoan,
} from './borrowedLoanController.js'
import {
  borrowedLoanModel,
  type BorrowedLoan,
  type BorrowedLoanSummary,
} from '../models/borrowedLoanModel.js'
import { AppError } from '../utils/appError.js'

const sampleBorrowedLoan: BorrowedLoan = {
  id: '4f8c09c1-9f6b-4e1c-9260-4c86bf7ed53b',
  userId: 'afdfdc1b-9f83-45ed-9593-e3ebb9c18fd5',
  lender: 'Storebrand',
  originalAmount: 250000,
  currentBalance: 190000,
  interestRate: 5.4,
  payoffDate: '2035-05-01',
  notes: 'Fixed rate through 2030',
  paidOffAt: null,
  status: 'active',
  daysRemaining: 100,
  createdAt: '2026-03-07T12:00:00.000Z',
  updatedAt: '2026-03-07T12:00:00.000Z',
}

const sampleSummary: BorrowedLoanSummary = {
  totalCurrentBalance: 190000,
  activeCount: 1,
  overdueCount: 0,
  dueSoonCount: 0,
  paidOffCount: 0,
}

const originalModelMethods = {
  listByUser: borrowedLoanModel.listByUser,
  getSummary: borrowedLoanModel.getSummary,
  create: borrowedLoanModel.create,
  getById: borrowedLoanModel.getById,
  update: borrowedLoanModel.update,
  markPaidOff: borrowedLoanModel.markPaidOff,
  remove: borrowedLoanModel.remove,
}

afterEach(() => {
  borrowedLoanModel.listByUser = originalModelMethods.listByUser
  borrowedLoanModel.getSummary = originalModelMethods.getSummary
  borrowedLoanModel.create = originalModelMethods.create
  borrowedLoanModel.getById = originalModelMethods.getById
  borrowedLoanModel.update = originalModelMethods.update
  borrowedLoanModel.markPaidOff = originalModelMethods.markPaidOff
  borrowedLoanModel.remove = originalModelMethods.remove
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

test('listBorrowedLoans returns 401 when auth is missing', async () => {
  const req = {} as Request
  const { response } = createResponseMock()

  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  listBorrowedLoans(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 401)
})

test('listBorrowedLoans returns the signed-in users borrowed loans', async () => {
  let capturedUserId = ''
  borrowedLoanModel.listByUser = async (userId: string) => {
    capturedUserId = userId
    return [sampleBorrowedLoan]
  }

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  listBorrowedLoans(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(capturedUserId, sampleBorrowedLoan.userId)
  assert.equal(getStatusCode(), 200)
  assert.deepEqual(getJsonBody(), [sampleBorrowedLoan])
})

test('getBorrowedLoanSummary returns the borrowed-loan summary contract', async () => {
  let capturedUserId = ''
  borrowedLoanModel.getSummary = async (userId: string) => {
    capturedUserId = userId
    return sampleSummary
  }

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  getBorrowedLoanSummary(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(capturedUserId, sampleBorrowedLoan.userId)
  assert.equal(getStatusCode(), 200)
  assert.deepEqual(getJsonBody(), sampleSummary)
})

test('createBorrowedLoan passes normalized payload to the model', async () => {
  let capturedInput: Parameters<typeof borrowedLoanModel.create>[0] | null = null
  borrowedLoanModel.create = async (input) => {
    capturedInput = input
    return {
      ...sampleBorrowedLoan,
      lender: input.lender,
      originalAmount: input.originalAmount,
      currentBalance: input.currentBalance,
      payoffDate: input.payoffDate,
      notes: input.notes ?? null,
    }
  }

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    body: {
      lender: 'DNB',
      originalAmount: 320000,
      currentBalance: 215000,
      interestRate: 4.9,
      payoffDate: '2036-04-15',
      notes: '   ',
    },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  createBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(getStatusCode(), 201)
  assert.deepEqual(capturedInput, {
    userId: sampleBorrowedLoan.userId,
    lender: 'DNB',
    originalAmount: 320000,
    currentBalance: 215000,
    interestRate: 4.9,
    payoffDate: '2036-04-15',
    notes: null,
  })
  assert.equal((getJsonBody() as BorrowedLoan).lender, 'DNB')
})

test('updateBorrowedLoan passes partial updates to the borrowed-loan model', async () => {
  let capturedLookup: { id: string; userId: string } | null = null
  let capturedCall:
    | {
        id: string
        userId: string
        payload: Parameters<typeof borrowedLoanModel.update>[2]
      }
    | null = null

  borrowedLoanModel.getById = async (id, userId) => {
    capturedLookup = { id, userId }
    return sampleBorrowedLoan
  }

  borrowedLoanModel.update = async (id, userId, payload) => {
    capturedCall = { id, userId, payload }
    return {
      ...sampleBorrowedLoan,
      currentBalance: payload.currentBalance ?? sampleBorrowedLoan.currentBalance,
      notes: payload.notes ?? sampleBorrowedLoan.notes,
    }
  }

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
    body: {
      currentBalance: 0,
      notes: '  closed early  ',
    },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  updateBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.deepEqual(capturedLookup, {
    id: sampleBorrowedLoan.id,
    userId: sampleBorrowedLoan.userId,
  })
  assert.deepEqual(capturedCall, {
    id: sampleBorrowedLoan.id,
    userId: sampleBorrowedLoan.userId,
    payload: {
      currentBalance: 0,
      notes: 'closed early',
    },
  })
  assert.equal(getStatusCode(), 200)
  assert.equal((getJsonBody() as BorrowedLoan).currentBalance, 0)
})

test('updateBorrowedLoan rejects current balance above original amount', async () => {
  borrowedLoanModel.getById = async () => sampleBorrowedLoan

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
    body: {
      originalAmount: 100000,
      currentBalance: 120000,
    },
  } as unknown as Request

  const { response } = createResponseMock()
  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  updateBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 400)
})

test('updateBorrowedLoan returns 404 when the row does not exist', async () => {
  borrowedLoanModel.getById = async () => null

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
    body: {
      currentBalance: 150000,
    },
  } as unknown as Request

  const { response } = createResponseMock()
  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  updateBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 404)
})

test('updateBorrowedLoan rejects edits to paid-off borrowed loans', async () => {
  borrowedLoanModel.getById = async () => ({
    ...sampleBorrowedLoan,
    currentBalance: 0,
    paidOffAt: '2026-03-07T15:00:00.000Z',
    status: 'paid_off',
    daysRemaining: null,
  })

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
    body: {
      notes: 'trying to change history',
    },
  } as unknown as Request

  const { response } = createResponseMock()
  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  updateBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 400)
})

test('markBorrowedLoanPaidOff delegates to the borrowed-loan model', async () => {
  let capturedCall: { id: string; userId: string } | null = null
  borrowedLoanModel.markPaidOff = async (id, userId) => {
    capturedCall = { id, userId }
    return {
      ...sampleBorrowedLoan,
      currentBalance: 0,
      paidOffAt: '2026-03-07T15:00:00.000Z',
      status: 'paid_off',
      daysRemaining: null,
    }
  }

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  markBorrowedLoanPaidOff(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.deepEqual(capturedCall, {
    id: sampleBorrowedLoan.id,
    userId: sampleBorrowedLoan.userId,
  })
  assert.equal(getStatusCode(), 200)
  assert.equal((getJsonBody() as BorrowedLoan).status, 'paid_off')
})

test('markBorrowedLoanPaidOff returns 404 when the row does not exist', async () => {
  borrowedLoanModel.markPaidOff = async () => null

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
  } as unknown as Request

  const { response } = createResponseMock()
  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  markBorrowedLoanPaidOff(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 404)
})

test('deleteBorrowedLoan returns 204 when a paid-off row is deleted', async () => {
  borrowedLoanModel.getById = async () => ({
    ...sampleBorrowedLoan,
    currentBalance: 0,
    paidOffAt: '2026-03-07T15:00:00.000Z',
    status: 'paid_off',
    daysRemaining: null,
  })

  let capturedCall: { id: string; userId: string } | null = null
  borrowedLoanModel.remove = async (id, userId) => {
    capturedCall = { id, userId }
    return true
  }

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
  } as unknown as Request

  const { response, getStatusCode, getSentBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  deleteBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.deepEqual(capturedCall, {
    id: sampleBorrowedLoan.id,
    userId: sampleBorrowedLoan.userId,
  })
  assert.equal(getStatusCode(), 204)
  assert.equal(getSentBody(), undefined)
})

test('deleteBorrowedLoan returns 204 when an active row is deleted', async () => {
  borrowedLoanModel.getById = async () => sampleBorrowedLoan

  let capturedCall: { id: string; userId: string } | null = null
  borrowedLoanModel.remove = async (id, userId) => {
    capturedCall = { id, userId }
    return true
  }

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
  } as unknown as Request

  const { response, getStatusCode, getSentBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  deleteBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.deepEqual(capturedCall, {
    id: sampleBorrowedLoan.id,
    userId: sampleBorrowedLoan.userId,
  })
  assert.equal(getStatusCode(), 204)
  assert.equal(getSentBody(), undefined)
})

test('deleteBorrowedLoan returns 404 when the row does not exist', async () => {
  borrowedLoanModel.getById = async () => null
  borrowedLoanModel.remove = async () => false

  const req = {
    auth: { userId: sampleBorrowedLoan.userId },
    params: { id: sampleBorrowedLoan.id },
  } as unknown as Request

  const { response } = createResponseMock()
  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  deleteBorrowedLoan(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 404)
})