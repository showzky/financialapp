import { describe, expect, it, beforeEach } from 'vitest'
import { flowNodes } from '@/pages/flow.data'
import {
  clampFlowNodePosition,
  getDefaultFlowNodePositions,
  readStoredFlowNodePositions,
  resolveFlowNodePositions,
  writeStoredFlowNodePositions,
} from '@/components/flow/flowNodeLayout'

describe('flow node layout persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('creates default desktop positions from node groups', () => {
    const defaults = getDefaultFlowNodePositions(flowNodes, 1200, 700)

    expect(defaults.revolut).toEqual({ x: 14, y: 60 })
    expect(defaults.husleie.x).toBe(1026)
    expect(defaults.lommepenger.y).toBeLessThanOrEqual(584)
  })

  it('persists and reads node positions from local storage', () => {
    const positions = {
      revolut: { x: 44, y: 92 },
    }

    writeStoredFlowNodePositions(positions)

    expect(readStoredFlowNodePositions()).toEqual(positions)
  })

  it('ignores malformed stored positions', () => {
    window.localStorage.setItem('flow:desktop-node-layout', JSON.stringify({ revolut: { x: 'bad', y: 44 } }))

    expect(readStoredFlowNodePositions()).toBeNull()
  })

  it('clamps stored positions back inside the scene bounds', () => {
    const node = flowNodes.find((entry) => entry.id === 'transport')
    expect(node).toBeDefined()

    expect(clampFlowNodePosition(node!, { x: 5000, y: 5000 }, 1200, 700)).toEqual({
      x: 1032,
      y: 584,
    })
  })

  it('merges stored positions with defaults for missing nodes', () => {
    const resolved = resolveFlowNodePositions(
      flowNodes,
      1200,
      700,
      {
        revolut: { x: 99, y: 88 },
      },
    )

    expect(resolved.revolut).toEqual({ x: 99, y: 88 })
    expect(resolved.mat).toEqual({ x: 1026, y: 420 })
  })
})