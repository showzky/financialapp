import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import type { Request, Response, NextFunction } from 'express'
import {
  createSubscription,
  deleteSubscription,
  toggleSubscriptionStatus,
  updateSubscription,
} from './subscriptionController.js'
import { subscriptionModel, type Subscription } from '../models/subscriptionModel.js'
import { AppError } from '../utils/appError.js'

const sampleSubscription: Subscription = {
  id: 'a8b6f534-3300-42b3-bf8f-d5dfa4f31111',
  userId: 'b3f21186-447c-4b3c-b6be-9f711a5939a1',
  name: 'CineStream',
  provider: 'CineStream',
  category: 'streaming',
  status: 'active',
  cadence: 'monthly',
  priceCents: 12900,
  nextRenewalDate: '2026-03-05',
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const originalModelMethods = {
  create: subscriptionModel.create,
  update: subscriptionModel.update,
  remove: subscriptionModel.remove,
  toggleStatus: subscriptionModel.toggleStatus,
}

afterEach(() => {
  subscriptionModel.create = originalModelMethods.create
  subscriptionModel.update = originalModelMethods.update
  subscriptionModel.remove = originalModelMethods.remove
  subscriptionModel.toggleStatus = originalModelMethods.toggleStatus
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

test('createSubscription returns 401 when auth is missing', async () => {
  const req = { body: {} } as Request
  const { response } = createResponseMock()

  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  createSubscription(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 401)
})

test('createSubscription returns 201 and created payload', async () => {
  let capturedInput: Parameters<typeof subscriptionModel.create>[0] | null = null
  subscriptionModel.create = async (input) => {
    capturedInput = input
    return {
      ...sampleSubscription,
      id: 'new-sub-id',
      name: input.name,
      provider: input.provider,
      category: input.category,
      status: input.status,
      cadence: input.cadence,
      priceCents: input.priceCents,
      nextRenewalDate: input.nextRenewalDate,
      notes: input.notes ?? null,
    }
  }

  const req = {
    auth: { userId: sampleSubscription.userId },
    body: {
      name: 'Cloud Vault',
      provider: 'Vault Corp',
      category: 'storage',
      status: 'active',
      cadence: 'monthly',
      priceCents: 9900,
      nextRenewalDate: '2026-03-30',
      notes: 'team plan',
    },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  createSubscription(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(getStatusCode(), 201)
  assert.deepEqual(capturedInput, {
    userId: sampleSubscription.userId,
    name: 'Cloud Vault',
    provider: 'Vault Corp',
    category: 'storage',
    status: 'active',
    cadence: 'monthly',
    priceCents: 9900,
    nextRenewalDate: '2026-03-30',
    notes: 'team plan',
  })

  const jsonBody = getJsonBody() as Subscription
  assert.equal(jsonBody.id, 'new-sub-id')
})

test('updateSubscription sends 404 when model returns null', async () => {
  subscriptionModel.update = async () => null

  const req = {
    auth: { userId: sampleSubscription.userId },
    params: { id: sampleSubscription.id },
    body: { name: 'Updated Name' },
  } as unknown as Request

  const { response } = createResponseMock()

  let nextError: unknown = null
  const next: NextFunction = (error?: unknown) => {
    nextError = error ?? null
  }

  updateSubscription(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.ok(nextError instanceof AppError)
  assert.equal(nextError.statusCode, 404)
})

test('deleteSubscription returns 204 when row is deleted', async () => {
  let capturedId = ''
  subscriptionModel.remove = async (id: string) => {
    capturedId = id
    return true
  }

  const req = {
    auth: { userId: sampleSubscription.userId },
    params: { id: sampleSubscription.id },
  } as unknown as Request

  const { response, getStatusCode, getSentBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  deleteSubscription(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(getStatusCode(), 204)
  assert.equal(capturedId, sampleSubscription.id)
  assert.equal(getSentBody(), undefined)
})

test('toggleSubscriptionStatus returns 200 with updated status', async () => {
  let capturedStatus: Subscription['status'] | '' = ''
  subscriptionModel.toggleStatus = async (_id, _userId, status) => {
    capturedStatus = status
    return {
      ...sampleSubscription,
      status,
    }
  }

  const req = {
    auth: { userId: sampleSubscription.userId },
    params: { id: sampleSubscription.id },
    body: { status: 'paused' },
  } as unknown as Request

  const { response, getStatusCode, getJsonBody } = createResponseMock()
  const next: NextFunction = (error?: unknown) => {
    if (error) throw error
  }

  toggleSubscriptionStatus(req, response, next)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(getStatusCode(), 200)
  assert.equal(capturedStatus, 'paused')
  assert.equal((getJsonBody() as Subscription).status, 'paused')
})
