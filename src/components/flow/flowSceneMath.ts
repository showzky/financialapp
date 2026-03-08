import type { FlowNode } from '@/pages/flow.types'

export type FlowOrbShift = {
  x: number
  y: number
}

export type FlowNodeReaction = {
  offsetX: number
  offsetY: number
  scale: number
}

export const clampFlowOrbCenter = (x: number, y: number, width: number, height: number) => ({
  x: Math.max(140, Math.min(width - 140, x)),
  y: Math.max(110, Math.min(height - 110, y)),
})

export const getFlowNodeReaction = (
  node: FlowNode,
  orbShift: FlowOrbShift,
  tickCount: number,
): FlowNodeReaction => {
  const magnitude = Math.min(Math.hypot(orbShift.x, orbShift.y), 220)
  const intensity = magnitude / 220
  const wobblePhase = tickCount * 0.12 + node.desktopTop * 0.035

  if (intensity === 0) {
    return {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    }
  }

  switch (node.tone) {
    case 'fixed':
      return {
        offsetX: orbShift.x * -0.05,
        offsetY: orbShift.y * -0.035,
        scale: 1,
      }
    case 'bleed':
      return {
        offsetX: orbShift.x * 0.11 + Math.sin(wobblePhase) * 6 * intensity,
        offsetY: orbShift.y * 0.12 + Math.cos(wobblePhase * 1.15) * 4 * intensity,
        scale: 1 + intensity * 0.02,
      }
    case 'warn':
      return {
        offsetX: orbShift.x * 0.09 + Math.sin(wobblePhase) * 2.4 * intensity,
        offsetY: orbShift.y * 0.08,
        scale: 1 + intensity * 0.012,
      }
    case 'income':
      return {
        offsetX: orbShift.x * 0.14,
        offsetY: orbShift.y * 0.08,
        scale: 1 + intensity * 0.03,
      }
    case 'save':
      return {
        offsetX: orbShift.x * 0.1,
        offsetY: orbShift.y * 0.1,
        scale: 1 + intensity * 0.018,
      }
    case 'receivable':
      return {
        offsetX: orbShift.x * 0.08,
        offsetY: orbShift.y * 0.06,
        scale: 1 + intensity * 0.01,
      }
    case 'ok':
    default:
      return {
        offsetX: orbShift.x * 0.1,
        offsetY: orbShift.y * 0.085,
        scale: 1 + intensity * 0.014,
      }
  }
}