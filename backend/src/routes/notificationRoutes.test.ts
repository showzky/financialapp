import assert from 'node:assert/strict'
import test from 'node:test'
import { notificationRouter } from './notificationRoutes.js'

type RouteLayer = {
  route?: {
    path: string
    methods: Record<string, boolean>
    stack: Array<{ handle: unknown }>
  }
}

const getRouteLayers = (): RouteLayer[] => {
  const stack = (notificationRouter as unknown as { stack: RouteLayer[] }).stack ?? []
  return stack.filter((layer) => layer.route)
}

test('notificationRouter exposes expected route contracts', () => {
  const signatures = getRouteLayers()
    .flatMap((layer) => {
      if (!layer.route) return []

      return Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route?.path}`)
    })
    .sort()

  assert.deepEqual(signatures, ['DELETE /push-tokens', 'POST /push-tokens'])
})

test('notification write routes are guarded by the same limiter middleware', () => {
  const routeLayers = getRouteLayers()

  const postLayer = routeLayers.find(
    (layer) => layer.route?.path === '/push-tokens' && layer.route.methods.post,
  )
  const deleteLayer = routeLayers.find(
    (layer) => layer.route?.path === '/push-tokens' && layer.route.methods.delete,
  )

  assert.ok(postLayer?.route)
  assert.ok(deleteLayer?.route)

  const postFirstHandler = postLayer.route.stack[0]
  const deleteFirstHandler = deleteLayer.route.stack[0]

  assert.ok(postFirstHandler)
  assert.ok(deleteFirstHandler)
  assert.equal(postFirstHandler.handle, deleteFirstHandler.handle)
})