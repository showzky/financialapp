import assert from 'node:assert/strict'
import test from 'node:test'
import { subscriptionRouter } from './subscriptionRoutes.js'

type RouteLayer = {
  route?: {
    path: string
    methods: Record<string, boolean>
    stack: Array<{ handle: unknown }>
  }
}

const getRouteLayers = (): RouteLayer[] => {
  const stack = (subscriptionRouter as unknown as { stack: RouteLayer[] }).stack ?? []
  return stack.filter((layer) => layer.route)
}

test('subscriptionRouter exposes expected route contracts', () => {
  const signatures = getRouteLayers()
    .flatMap((layer) => {
      if (!layer.route) return []

      return Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route?.path}`)
    })
    .sort()

  assert.deepEqual(signatures, [
    'DELETE /:id',
    'GET /',
    'PATCH /:id',
    'PATCH /:id/toggle-status',
    'POST /',
  ])
})

test('write routes are guarded by write limiter middleware', () => {
  const routeLayers = getRouteLayers()

  const postLayer = routeLayers.find((layer) => layer.route?.path === '/' && layer.route.methods.post)
  const patchLayer = routeLayers.find((layer) => layer.route?.path === '/:id' && layer.route.methods.patch)
  const deleteLayer = routeLayers.find((layer) => layer.route?.path === '/:id' && layer.route.methods.delete)
  const toggleLayer = routeLayers.find(
    (layer) => layer.route?.path === '/:id/toggle-status' && layer.route.methods.patch,
  )

  assert.ok(postLayer?.route)
  assert.ok(patchLayer?.route)
  assert.ok(deleteLayer?.route)
  assert.ok(toggleLayer?.route)

  const postFirstHandler = postLayer.route.stack[0]
  const patchFirstHandler = patchLayer.route.stack[0]
  const deleteFirstHandler = deleteLayer.route.stack[0]
  const toggleFirstHandler = toggleLayer.route.stack[0]

  assert.ok(postFirstHandler)
  assert.ok(patchFirstHandler)
  assert.ok(deleteFirstHandler)
  assert.ok(toggleFirstHandler)

  const postLimiterHandle = postFirstHandler.handle
  const patchLimiterHandle = patchFirstHandler.handle
  const deleteLimiterHandle = deleteFirstHandler.handle
  const toggleLimiterHandle = toggleFirstHandler.handle

  assert.equal(postLimiterHandle, patchLimiterHandle)
  assert.equal(postLimiterHandle, deleteLimiterHandle)
  assert.equal(postLimiterHandle, toggleLimiterHandle)

  const getLayer = routeLayers.find((layer) => layer.route?.path === '/' && layer.route.methods.get)
  assert.ok(getLayer?.route)
  const getFirstHandle = getLayer.route.stack[0]?.handle
  assert.notEqual(getFirstHandle, postLimiterHandle)
})
