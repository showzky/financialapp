import assert from 'node:assert/strict'
import test from 'node:test'
import { apiRouter } from './index.js'

type Layer = {
  route?: {
    path: string
  }
  regexp?: {
    toString(): string
  }
  name?: string
}

test('apiRouter mounts the additive borrowed-loans router', () => {
  const stack = (apiRouter as unknown as { stack: Layer[] }).stack ?? []
  const borrowedLoansLayer = stack.find((layer) => layer.name === 'router' && layer.regexp?.toString().includes('borrowed-loans'))

  assert.ok(borrowedLoansLayer)
})

test('apiRouter keeps the existing lent-loans router mounted', () => {
  const stack = (apiRouter as unknown as { stack: Layer[] }).stack ?? []
  const lentLoansLayer = stack.find(
    (layer) => layer.name === 'router' && layer.regexp?.toString() === '/^\\/loans\\/?(?=\\/|$)/i',
  )

  assert.ok(lentLoansLayer)
})