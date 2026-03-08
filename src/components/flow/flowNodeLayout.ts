import type { FlowNode, FlowNodeGroup } from '@/pages/flow.types'

export type FlowNodePosition = {
  x: number
  y: number
}

export type FlowNodePositionMap = Record<string, FlowNodePosition>

const FLOW_NODE_LAYOUT_STORAGE_KEY = 'flow:desktop-node-layout'
const FLOW_NODE_HEIGHT = 108

const isValidFlowNodePosition = (value: unknown): value is FlowNodePosition => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<FlowNodePosition>
  return typeof candidate.x === 'number' && Number.isFinite(candidate.x) && typeof candidate.y === 'number' && Number.isFinite(candidate.y)
}

const isValidFlowNodePositionMap = (value: unknown): value is FlowNodePositionMap => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every((entry) => isValidFlowNodePosition(entry))
}

const getDesktopNodeWidth = (group: FlowNodeGroup) => {
  if (group === 'income') {
    return 148
  }

  return 160
}

export const getFlowNodeCardWidth = (node: FlowNode) => getDesktopNodeWidth(node.group)

export const clampFlowNodePosition = (
  node: FlowNode,
  position: FlowNodePosition,
  width: number,
  height: number,
): FlowNodePosition => {
  const nodeWidth = getDesktopNodeWidth(node.group)

  return {
    x: Math.max(8, Math.min(width - nodeWidth - 8, position.x)),
    y: Math.max(8, Math.min(height - FLOW_NODE_HEIGHT - 8, position.y)),
  }
}

export const getDefaultFlowNodePositions = (
  nodes: FlowNode[],
  width: number,
  height: number,
): FlowNodePositionMap => {
  const positions: FlowNodePositionMap = {}

  nodes.forEach((node) => {
    const nodeWidth = getDesktopNodeWidth(node.group)
    const baseX = node.group === 'income' ? 14 : width - nodeWidth - 14

    positions[node.id] = clampFlowNodePosition(
      node,
      {
        x: baseX,
        y: node.desktopTop,
      },
      width,
      height,
    )
  })

  return positions
}

export const readStoredFlowNodePositions = (): FlowNodePositionMap | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(FLOW_NODE_LAYOUT_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown
    return isValidFlowNodePositionMap(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const writeStoredFlowNodePositions = (positions: FlowNodePositionMap) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(FLOW_NODE_LAYOUT_STORAGE_KEY, JSON.stringify(positions))
  } catch {
    // Ignore storage failures and keep the in-memory layout.
  }
}

export const resolveFlowNodePositions = (
  nodes: FlowNode[],
  width: number,
  height: number,
  storedPositions: FlowNodePositionMap | null,
): FlowNodePositionMap => {
  const defaults = getDefaultFlowNodePositions(nodes, width, height)

  if (!storedPositions) {
    return defaults
  }

  const resolved: FlowNodePositionMap = {}

  nodes.forEach((node) => {
    const candidate = storedPositions[node.id] ?? defaults[node.id]
    resolved[node.id] = clampFlowNodePosition(node, candidate, width, height)
  })

  return resolved
}