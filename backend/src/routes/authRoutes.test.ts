import assert from 'node:assert/strict'
import test from 'node:test'
import { authRouter } from './authRoutes.js'
import { requireAuth } from '../middleware/requireAuth.js'

type RouteLayer = {
  route?: {
    path: string
    methods: Record<string, boolean>
    stack: Array<{ handle: unknown }>
  }
}

const getRouteLayers = (): RouteLayer[] => {
  const stack = (authRouter as unknown as { stack: RouteLayer[] }).stack ?? []
  return stack.filter((layer) => layer.route)
}

test('authRouter exposes expected route contracts', () => {
  const signatures = getRouteLayers()
    .flatMap((layer) => {
      if (!layer.route) return []
      return Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route?.path}`)
    })
    .sort()

  assert.deepEqual(signatures, [
    'GET /register-status',
    'GET /settings',
    'PATCH /settings',
    'POST /login',
    'POST /logout',
    'POST /register',
  ])
})

test('auth settings routes are guarded by requireAuth middleware', () => {
  const routeLayers = getRouteLayers()

  const getSettingsLayer = routeLayers.find(
    (layer) => layer.route?.path === '/settings' && layer.route.methods.get,
  )
  const patchSettingsLayer = routeLayers.find(
    (layer) => layer.route?.path === '/settings' && layer.route.methods.patch,
  )

  assert.ok(getSettingsLayer?.route)
  assert.ok(patchSettingsLayer?.route)

  assert.equal(getSettingsLayer.route.stack[0]?.handle, requireAuth)
  assert.equal(patchSettingsLayer.route.stack[0]?.handle, requireAuth)
})
