import { describe, expect, it } from 'vitest'
import { flowNodes } from '@/pages/flow.data'
import { clampFlowOrbCenter, getFlowNodeReaction } from '@/components/flow/flowSceneMath'

describe('flow scene math', () => {
  it('clamps the orb center inside the scene bounds', () => {
    expect(clampFlowOrbCenter(50, 50, 1200, 700)).toEqual({ x: 140, y: 110 })
    expect(clampFlowOrbCenter(1180, 690, 1200, 700)).toEqual({ x: 1060, y: 590 })
  })

  it('keeps fixed nodes resisting drag more than income nodes', () => {
    const fixedNode = flowNodes.find((node) => node.id === 'husleie')
    const incomeNode = flowNodes.find((node) => node.id === 'revolut')

    expect(fixedNode).toBeDefined()
    expect(incomeNode).toBeDefined()

    const drag = { x: 120, y: 40 }
    const fixedReaction = getFlowNodeReaction(fixedNode!, drag, 10)
    const incomeReaction = getFlowNodeReaction(incomeNode!, drag, 10)

    expect(Math.abs(fixedReaction.offsetX)).toBeLessThan(Math.abs(incomeReaction.offsetX))
    expect(incomeReaction.scale).toBeGreaterThan(fixedReaction.scale)
  })

  it('adds extra wobble to bleeding nodes during drag', () => {
    const bleedNode = flowNodes.find((node) => node.id === 'transport')
    expect(bleedNode).toBeDefined()

    const baseReaction = getFlowNodeReaction(bleedNode!, { x: 0, y: 0 }, 0)
    const draggedReaction = getFlowNodeReaction(bleedNode!, { x: 120, y: 30 }, 12)

    expect(baseReaction).toEqual({ offsetX: 0, offsetY: 0, scale: 1 })
    expect(Math.abs(draggedReaction.offsetX)).toBeGreaterThan(10)
    expect(draggedReaction.scale).toBeGreaterThan(1)
  })
})