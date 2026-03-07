import assert from 'node:assert/strict'
import test from 'node:test'
import { borrowedLoanRouter } from './borrowedLoanRoutes.js'

type RouteLayer = {
  route?: {
    path: string
    methods: Record<string, boolean>
    stack: Array<{ handle: unknown }>
  }
}

const getRouteLayers = (): RouteLayer[] => {
  const stack = (borrowedLoanRouter as unknown as { stack: RouteLayer[] }).stack ?? []
  return stack.filter((layer) => layer.route)
}

test('borrowedLoanRouter exposes expected route contracts', () => {
  const signatures = getRouteLayers()
    .flatMap((layer) => {
      const route = layer.route
      if (!route) return []

      return Object.keys(route.methods).map((method) => `${method.toUpperCase()} ${route.path}`)
    })
    .sort()

  assert.deepEqual(signatures, [
    'DELETE /:id',
    'GET /',
    'GET /summary',
    'PATCH /:id',
    'PATCH /:id/paid-off',
    'POST /',
  ])
})

test('borrowed loan write routes are guarded by write limiter middleware', () => {
  const routeLayers = getRouteLayers()

  const postLayer = routeLayers.find((layer) => layer.route?.path === '/' && layer.route.methods.post)
  const patchLayer = routeLayers.find((layer) => layer.route?.path === '/:id' && layer.route.methods.patch)
  const deleteLayer = routeLayers.find((layer) => layer.route?.path === '/:id' && layer.route.methods.delete)
  const paidOffLayer = routeLayers.find(
    (layer) => layer.route?.path === '/:id/paid-off' && layer.route.methods.patch,
  )

  assert.ok(postLayer?.route)
  assert.ok(patchLayer?.route)
  assert.ok(deleteLayer?.route)
  assert.ok(paidOffLayer?.route)

  const postLimiterHandle = postLayer.route.stack[0]?.handle
  const patchLimiterHandle = patchLayer.route.stack[0]?.handle
  const deleteLimiterHandle = deleteLayer.route.stack[0]?.handle
  const paidOffLimiterHandle = paidOffLayer.route.stack[0]?.handle

  assert.equal(postLimiterHandle, patchLimiterHandle)
  assert.equal(postLimiterHandle, deleteLimiterHandle)
  assert.equal(postLimiterHandle, paidOffLimiterHandle)

  const getLayer = routeLayers.find((layer) => layer.route?.path === '/' && layer.route.methods.get)
  assert.ok(getLayer?.route)
  assert.notEqual(getLayer.route.stack[0]?.handle, postLimiterHandle)
})