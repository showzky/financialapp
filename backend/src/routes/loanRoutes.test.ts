import assert from 'node:assert/strict'
import test from 'node:test'
import { loanRouter } from './loanRoutes.js'

type RouteLayer = {
  route?: {
    path: string
    methods: Record<string, boolean>
  }
}

const getRouteLayers = (): RouteLayer[] => {
  const stack = (loanRouter as unknown as { stack: RouteLayer[] }).stack ?? []
  return stack.filter((layer) => layer.route)
}

test('loanRouter exposes the current lent-loan route contracts', () => {
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
    'PATCH /:id/repaid',
    'POST /',
  ])
})