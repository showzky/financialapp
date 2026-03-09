import assert from 'node:assert/strict'
import test from 'node:test'
import { uptimeRouter } from './index.js'

type RouteLayer = {
  route?: {
    path: string
    methods: Record<string, boolean>
  }
}

const getRouteSignatures = () => {
  const stack = (uptimeRouter as unknown as { stack: RouteLayer[] }).stack ?? []

  return stack
    .filter((layer) => layer.route)
    .flatMap((layer) => {
      if (!layer.route) return []
      return Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route?.path}`)
    })
    .sort()
}

test('uptimeRouter exposes lightweight health routes', () => {
  assert.deepEqual(getRouteSignatures(), ['GET /health', 'HEAD /health'])
})