import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { FlowAnchorGroups, FlowNode } from '@/pages/flow.types'
import { FlowNodeCard } from '@/components/flow/FlowNodeCard'
import { groupFlowNodes } from '@/pages/flow.utils'
import {
  clampFlowNodePosition,
  getFlowNodeCardWidth,
  readStoredFlowNodePositions,
  resolveFlowNodePositions,
  writeStoredFlowNodePositions,
  type FlowNodePositionMap,
} from '@/components/flow/flowNodeLayout'
import {
  clampFlowOrbCenter,
  getFlowNodeReaction,
  type FlowOrbShift,
} from '@/components/flow/flowSceneMath'

type FlowCanvasSceneProps = {
  health: number
  anchors: FlowAnchorGroups
  nodes: FlowNode[]
  onSelectNode: (nodeId: string) => void
}

export const FlowCanvasScene = ({ health, anchors, nodes, onSelectNode }: FlowCanvasSceneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const orbShiftRef = useRef<FlowOrbShift>({ x: 0, y: 0 })
  const nodePositionsRef = useRef<FlowNodePositionMap>({})
  const dragStateRef = useRef({
    isDragging: false,
    pointerOffsetX: 0,
    pointerOffsetY: 0,
  })
  const nodeDragStateRef = useRef<{
    nodeId: string | null
    pointerOffsetX: number
    pointerOffsetY: number
    originX: number
    originY: number
    moved: boolean
  }>({
    nodeId: null,
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })
  const suppressClickNodeIdRef = useRef<string | null>(null)
  const tickCountRef = useRef(0)
  const [orbShift, setOrbShift] = useState<FlowOrbShift>({ x: 0, y: 0 })
  const [isDraggingOrb, setIsDraggingOrb] = useState(false)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [nodePositions, setNodePositions] = useState<FlowNodePositionMap>({})

  const desktopNodes = useMemo(() => groupFlowNodes(nodes), [nodes])
  const reactiveNodes = useMemo(
    () =>
      nodes.map((node) => ({
        node,
        reaction: getFlowNodeReaction(node, orbShift, tickCountRef.current),
      })),
    [nodes, orbShift],
  )
  const reactiveNodeMap = useMemo(
    () => new Map(reactiveNodes.map((entry) => [entry.node.id, entry.reaction])),
    [reactiveNodes],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const width = container.offsetWidth
    const height = container.offsetHeight
    const resolved = resolveFlowNodePositions(nodes, width, height, readStoredFlowNodePositions())
    nodePositionsRef.current = resolved
    setNodePositions(resolved)
  }, [nodes])

  useEffect(() => {
    if (Object.keys(nodePositions).length === 0) {
      return
    }

    writeStoredFlowNodePositions(nodePositions)
  }, [nodePositions])

  const handleSelectNode = (nodeId: string) => {
    if (suppressClickNodeIdRef.current === nodeId) {
      suppressClickNodeIdRef.current = null
      return
    }

    onSelectNode(nodeId)
  }

  const handleNodeDragStart = (nodeId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const currentPosition = nodePositionsRef.current[nodeId]
    if (!currentPosition) {
      return
    }

    const rect = container.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top

    nodeDragStateRef.current = {
      nodeId,
      pointerOffsetX: pointerX - currentPosition.x,
      pointerOffsetY: pointerY - currentPosition.y,
      originX: currentPosition.x,
      originY: currentPosition.y,
      moved: false,
    }
    setDraggingNodeId(nodeId)
    event.preventDefault()
  }

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return undefined
    }

    let width = 0
    let height = 0
    let baseCenterX = 0
    let baseCenterY = 0
    let centerX = 0
    let centerY = 0
    let frameId = 0
    let tickCount = 0
    let orbRadius = 88
    let particles: Array<{
      anchor: ((typeof anchors.income)[number] | (typeof anchors.fixed)[number] | (typeof anchors.card)[number]) & {
        nodeId: string
      }
      progress: number
      speed: number
      size: number
      alpha: number
    }> = []

    const resize = () => {
      width = container.offsetWidth
      height = container.offsetHeight
      baseCenterX = width / 2
      baseCenterY = height / 2
      const clampedCenter = clampFlowOrbCenter(
        baseCenterX + orbShiftRef.current.x,
        baseCenterY + orbShiftRef.current.y,
        width,
        height,
      )
      orbShiftRef.current = {
        x: clampedCenter.x - baseCenterX,
        y: clampedCenter.y - baseCenterY,
      }
      centerX = clampedCenter.x
      centerY = clampedCenter.y
      canvas.width = width
      canvas.height = height
      setOrbShift(orbShiftRef.current)

      const resolvedNodePositions = resolveFlowNodePositions(
        nodes,
        width,
        height,
        nodePositionsRef.current,
      )
      nodePositionsRef.current = resolvedNodePositions
      setNodePositions(resolvedNodePositions)
    }

    resize()

    const supportsResizeObserver = typeof ResizeObserver === 'function'
    const observer = supportsResizeObserver ? new ResizeObserver(resize) : null
    observer?.observe(container)
    if (!supportsResizeObserver) {
      window.addEventListener('resize', resize)
    }

    const getNodeAnchorPoint = (node: FlowNode) => {
      const position = nodePositionsRef.current[node.id]
      const cardWidth = getFlowNodeCardWidth(node)
      const anchorY = position.y + 34

      if (node.group === 'income') {
        return {
          x: position.x + cardWidth,
          y: anchorY,
        }
      }

      return {
        x: position.x,
        y: anchorY,
      }
    }

    const incomeNodes = nodes.filter((node) => node.group === 'income')
    const fixedNodes = nodes.filter((node) => node.group === 'fixed')
    const drainNodes = [
      ...nodes.filter((node) => node.group === 'card'),
      ...nodes.filter((node) => node.group === 'result'),
    ]

    const updateOrbShift = (nextShift: FlowOrbShift) => {
      orbShiftRef.current = nextShift
      centerX = baseCenterX + nextShift.x
      centerY = baseCenterY + nextShift.y
      setOrbShift((currentShift) => {
        if (currentShift.x === nextShift.x && currentShift.y === nextShift.y) {
          return currentShift
        }

        return nextShift
      })
    }

    const getPointerPoint = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }

    const orbPoint = (degrees: number) => {
      const angle = (degrees * Math.PI) / 180
      return {
        x: centerX + orbRadius * Math.cos(angle),
        y: centerY + orbRadius * Math.sin(angle),
      }
    }

    const quadraticPoint = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      progress: number,
    ) => {
      const inverse = 1 - progress
      return {
        x: inverse * inverse * x0 + 2 * inverse * progress * x1 + progress * progress * x2,
        y: inverse * inverse * y0 + 2 * inverse * progress * y1 + progress * progress * y2,
      }
    }

    const orbColor = (alpha = 1) => {
      const red = Math.round(255 * (1 - health * 0.55))
      const green = Math.round(180 * (health * 0.95) + 40)
      const blue = Math.round(210 * (health * 0.9) + 40)
      return `rgba(${red},${green},${blue},${alpha})`
    }

    const drawLine = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      lineWidth: number,
      alpha: number,
      dashSpeed: number,
      glowSize: number,
    ) => {
      context.save()
      context.globalAlpha = alpha
      context.strokeStyle = color
      context.lineWidth = lineWidth
      context.shadowColor = color
      context.shadowBlur = glowSize
      context.setLineDash(lineWidth > 2 ? [10, 5] : [6, 5])
      context.lineDashOffset = -tickCount * dashSpeed
      context.beginPath()
      context.moveTo(x0, y0)
      context.quadraticCurveTo(x1, y1, x2, y2)
      context.stroke()

      context.globalAlpha = alpha * 0.18
      context.lineWidth = lineWidth * 3
      context.shadowBlur = glowSize * 2
      context.setLineDash([])
      context.beginPath()
      context.moveTo(x0, y0)
      context.quadraticCurveTo(x1, y1, x2, y2)
      context.stroke()
      context.restore()
    }

    const drawOrb = () => {
      const chaos = 1 - health
      const dragBoost = dragStateRef.current.isDragging ? 10 : 0
      orbRadius = 88 + Math.sin(tickCount * 0.04) * 2.2 + chaos * 3.6 + dragBoost * 0.15

      const aura = context.createRadialGradient(
        centerX,
        centerY,
        orbRadius * 0.4,
        centerX,
        centerY,
        orbRadius * 2.2,
      )
      aura.addColorStop(0, orbColor(0.12))
      aura.addColorStop(0.35, orbColor(0.06))
      aura.addColorStop(1, 'rgba(0,0,0,0)')
      context.fillStyle = aura
      context.beginPath()
      context.arc(centerX, centerY, orbRadius * 2.2, 0, Math.PI * 2)
      context.fill()

      if (dragStateRef.current.isDragging) {
        context.save()
        context.strokeStyle = orbColor(0.52)
        context.lineWidth = 1.4
        context.shadowColor = orbColor(0.65)
        context.shadowBlur = 26
        context.setLineDash([10, 10])
        context.lineDashOffset = -tickCount * 1.8
        context.beginPath()
        context.arc(centerX, centerY, orbRadius + 26, 0, Math.PI * 2)
        context.stroke()
        context.restore()
      }

      for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
        const radius = orbRadius + 18 + ringIndex * 14 + Math.sin(tickCount * 0.03 + ringIndex) * 2
        context.save()
        context.globalAlpha = 0.22 - ringIndex * 0.05
        context.strokeStyle = orbColor(0.9)
        context.lineWidth = 1
        context.shadowColor = orbColor(0.7)
        context.shadowBlur = 12 + ringIndex * 6
        context.setLineDash([10, 12 + ringIndex * 4])
        context.lineDashOffset = -tickCount * (0.9 + ringIndex * 0.35)
        context.beginPath()
        context.arc(centerX, centerY, radius, 0, Math.PI * 2)
        context.stroke()
        context.restore()
      }

      const core = context.createRadialGradient(
        centerX - orbRadius * 0.25,
        centerY - orbRadius * 0.35,
        orbRadius * 0.2,
        centerX,
        centerY,
        orbRadius,
      )
      core.addColorStop(0, 'rgba(255,255,255,0.16)')
      core.addColorStop(0.25, orbColor(0.22))
      core.addColorStop(1, 'rgba(6,15,26,0.92)')
      context.fillStyle = core
      context.beginPath()
      context.arc(centerX, centerY, orbRadius, 0, Math.PI * 2)
      context.fill()

      context.save()
      context.strokeStyle = orbColor(0.55)
      context.lineWidth = 1.2
      context.shadowColor = orbColor(0.85)
      context.shadowBlur = 22
      context.globalAlpha = 0.65
      context.beginPath()
      context.arc(centerX, centerY, orbRadius - 1.2, 0, Math.PI * 2)
      context.stroke()
      context.restore()

      const arcs = Math.round(6 + chaos * 10)
      for (let arcIndex = 0; arcIndex < arcs; arcIndex += 1) {
        const start = (tickCount * 0.01 + arcIndex * ((Math.PI * 2) / arcs)) % (Math.PI * 2)
        const span = 0.4 + Math.sin(tickCount * 0.02 + arcIndex) * 0.18
        const radius =
          orbRadius - 10 - (arcIndex % 3) * 6 + Math.sin(tickCount * 0.06 + arcIndex) * 2

        context.save()
        context.strokeStyle = health < 0.45 ? 'rgba(255,34,68,0.55)' : orbColor(0.45)
        context.lineWidth = 1
        context.globalAlpha = 0.22 + chaos * 0.25
        context.shadowColor = context.strokeStyle
        context.shadowBlur = 18 + chaos * 20
        context.beginPath()
        context.arc(centerX, centerY, radius, start, start + span)
        context.stroke()
        context.restore()
      }
    }

    const spawnParticles = () => {
      const incomeSources = incomeNodes.map((node, index) => ({ ...anchors.income[index], nodeId: node.id }))
      const fixedSources = fixedNodes.map((node, index) => ({ ...anchors.fixed[index], nodeId: node.id }))
      const drainSources = drainNodes.map((node, index) => ({ ...anchors.card[index], nodeId: node.id }))

      const spawn = (anchor: ((typeof anchors.income)[number] | (typeof anchors.fixed)[number] | (typeof anchors.card)[number]) & { nodeId: string }) => {
        const speed =
          anchor.kind === 'income'
            ? 0.004 + Math.random() * 0.003
            : anchor.bleed
              ? 0.01 + Math.random() * 0.007
              : 0.004 + Math.random() * 0.003
        const size = anchor.width > 2.2 ? 3.6 : 2.6
        particles.push({
          anchor,
          progress: 0,
          speed,
          size,
          alpha: 0.6 + Math.random() * 0.35,
        })
      }

      if (Math.random() < 0.65 && incomeSources.length > 0) {
        spawn(incomeSources[Math.floor(Math.random() * incomeSources.length)])
      }

      if (Math.random() < 0.55 && fixedSources.length > 0) {
        spawn(fixedSources[Math.floor(Math.random() * fixedSources.length)])
      }

      if (Math.random() < 0.85 && drainSources[0]) {
        spawn(drainSources[0])
      }

      if (Math.random() < 0.55 && drainSources[1]) {
        spawn(drainSources[1])
      }

      if (Math.random() < 0.45 && drainSources[2]) {
        spawn(drainSources[2])
      }

      if (particles.length > 220) {
        particles = particles.slice(particles.length - 220)
      }
    }

    const drawFlows = () => {
      incomeNodes.forEach((node, index) => {
        const anchor = anchors.income[index]
        if (!anchor) {
          return
        }

        const nodePoint = getNodeAnchorPoint(node)
        const orb = orbPoint(anchor.orbAngle)
        const midX = (nodePoint.x + orb.x) / 2
        const midY = (nodePoint.y + orb.y) / 2 - 50
        drawLine(
          nodePoint.x,
          nodePoint.y,
          midX,
          midY,
          orb.x,
          orb.y,
          anchor.color,
          anchor.width,
          0.4,
          2.2,
          14,
        )
      })

      fixedNodes.forEach((node, index) => {
        const anchor = anchors.fixed[index]
        if (!anchor) {
          return
        }

        const nodePoint = getNodeAnchorPoint(node)
        const orb = orbPoint(anchor.orbAngle)
        const midX = (orb.x + nodePoint.x) / 2 - 14
        const midY = (orb.y + nodePoint.y) / 2 - 26
        drawLine(
          orb.x,
          orb.y,
          midX,
          midY,
          nodePoint.x,
          nodePoint.y,
          anchor.color,
          anchor.width,
          0.34,
          1.8,
          14,
        )
      })

      drainNodes.forEach((node, index) => {
        const anchor = anchors.card[index]
        if (!anchor) {
          return
        }

        const nodePoint = getNodeAnchorPoint(node)
        const orb = orbPoint(anchor.orbAngle)
        const midX = (orb.x + nodePoint.x) / 2 + 14
        const midY = (orb.y + nodePoint.y) / 2 + 28
        const alpha = anchor.bleed ? 0.5 : 0.34
        const dashSpeed = anchor.bleed ? 3.4 : 2
        const glow = anchor.bleed ? 18 : 14
        const dragIntensity = dragStateRef.current.isDragging ? 1.18 : 1
        drawLine(
          orb.x,
          orb.y,
          midX,
          midY,
          nodePoint.x,
          nodePoint.y,
          anchor.color,
          anchor.width,
          alpha * dragIntensity,
          dashSpeed * dragIntensity,
          glow * dragIntensity,
        )
      })
    }

    const handlePointerDown = (event: PointerEvent) => {
      const point = getPointerPoint(event)
      const distance = Math.hypot(point.x - centerX, point.y - centerY)

      if (nodeDragStateRef.current.nodeId) {
        return
      }

      if (distance > orbRadius + 24) {
        return
      }

      dragStateRef.current = {
        isDragging: true,
        pointerOffsetX: point.x - centerX,
        pointerOffsetY: point.y - centerY,
      }
      setIsDraggingOrb(true)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (nodeDragStateRef.current.nodeId) {
        const activeNode = nodes.find((node) => node.id === nodeDragStateRef.current.nodeId)
        if (!activeNode) {
          return
        }

        const point = getPointerPoint(event)
        const nextPosition = clampFlowNodePosition(
          activeNode,
          {
            x: point.x - nodeDragStateRef.current.pointerOffsetX,
            y: point.y - nodeDragStateRef.current.pointerOffsetY,
          },
          width,
          height,
        )

        nodeDragStateRef.current.moved =
          Math.hypot(
            nextPosition.x - nodeDragStateRef.current.originX,
            nextPosition.y - nodeDragStateRef.current.originY,
          ) > 6
        nodePositionsRef.current = {
          ...nodePositionsRef.current,
          [activeNode.id]: nextPosition,
        }
        setNodePositions((currentPositions) => ({
          ...currentPositions,
          [activeNode.id]: nextPosition,
        }))
        return
      }

      if (!dragStateRef.current.isDragging) {
        return
      }

      const point = getPointerPoint(event)
      const nextCenter = clampFlowOrbCenter(
        point.x - dragStateRef.current.pointerOffsetX,
        point.y - dragStateRef.current.pointerOffsetY,
        width,
        height,
      )

      updateOrbShift({
        x: nextCenter.x - baseCenterX,
        y: nextCenter.y - baseCenterY,
      })
    }

    const stopDragging = () => {
      if (nodeDragStateRef.current.nodeId) {
        suppressClickNodeIdRef.current = nodeDragStateRef.current.moved
          ? nodeDragStateRef.current.nodeId
          : null
        nodeDragStateRef.current.nodeId = null
        nodeDragStateRef.current.pointerOffsetX = 0
        nodeDragStateRef.current.pointerOffsetY = 0
        nodeDragStateRef.current.originX = 0
        nodeDragStateRef.current.originY = 0
        nodeDragStateRef.current.moved = false
        setDraggingNodeId(null)
      }

      if (!dragStateRef.current.isDragging) {
        return
      }

      dragStateRef.current.isDragging = false
      dragStateRef.current.pointerOffsetX = 0
      dragStateRef.current.pointerOffsetY = 0
      setIsDraggingOrb(false)
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    const updateAndDrawParticles = () => {
      tickCountRef.current = tickCount
      particles = particles.filter((particle) => {
        particle.progress += particle.speed
        if (particle.progress >= 1) {
          return false
        }

        const { anchor } = particle
        const position = (() => {
          if (anchor.kind === 'income') {
            const sourceNode = incomeNodes.find((node) => node.id === anchor.nodeId)
            if (!sourceNode) {
              return { x: centerX, y: centerY }
            }

            const nodePoint = getNodeAnchorPoint(sourceNode)
            const orb = orbPoint(anchor.orbAngle)
            const midX = (nodePoint.x + orb.x) / 2
            const midY = (nodePoint.y + orb.y) / 2 - 50
            return quadraticPoint(nodePoint.x, nodePoint.y, midX, midY, orb.x, orb.y, particle.progress)
          }

          const sourceNode = [...fixedNodes, ...drainNodes].find((node) => node.id === anchor.nodeId)
          if (!sourceNode) {
            return { x: centerX, y: centerY }
          }

          const nodePoint = getNodeAnchorPoint(sourceNode)
          const orb = orbPoint(anchor.orbAngle)
          const midX = (orb.x + nodePoint.x) / 2 + (anchor.kind === 'fixed' ? -14 : 14)
          const midY = (orb.y + nodePoint.y) / 2 + (anchor.kind === 'fixed' ? -26 : 28)
          return quadraticPoint(orb.x, orb.y, midX, midY, nodePoint.x, nodePoint.y, particle.progress)
        })()

        context.save()
        context.globalAlpha = particle.alpha
        context.fillStyle = anchor.color
        context.shadowColor = anchor.color
        context.shadowBlur = anchor.bleed ? 18 : 12
        context.beginPath()
        context.arc(position.x, position.y, particle.size, 0, Math.PI * 2)
        context.fill()

        context.globalAlpha = particle.alpha * 0.25
        context.strokeStyle = anchor.color
        context.lineWidth = 1.5
        context.beginPath()
        context.moveTo(position.x, position.y)
        context.lineTo(position.x - 8, position.y - 4)
        context.stroke()
        context.restore()

        return true
      })
    }

    const renderFrame = () => {
      tickCount += 1
      context.clearRect(0, 0, width, height)

      const vignette = context.createRadialGradient(
        centerX,
        centerY,
        40,
        centerX,
        centerY,
        Math.max(width, height) * 0.65,
      )
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
      context.fillStyle = vignette
      context.fillRect(0, 0, width, height)

      drawOrb()
      drawFlows()

      if (Math.random() < 0.75) {
        spawnParticles()
      }

      updateAndDrawParticles()
      frameId = window.requestAnimationFrame(renderFrame)
    }

    frameId = window.requestAnimationFrame(renderFrame)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
      if (!supportsResizeObserver) {
        window.removeEventListener('resize', resize)
      }
    }
  }, [anchors, health, nodes])

  return (
    <div
      className={`flow-canvas-wrap ${isDraggingOrb ? 'flow-canvas-wrap--dragging' : 'flow-canvas-wrap--interactive'}`}
      ref={containerRef}
    >
      <canvas ref={canvasRef} className="flow-canvas" aria-hidden="true" />

      {desktopNodes.income.map((node) => (
        <FlowNodeCard
          key={node.id}
          node={node}
          onSelect={handleSelectNode}
          reaction={reactiveNodeMap.get(node.id)}
          desktopPosition={nodePositions[node.id]}
          onDragStart={handleNodeDragStart}
          isDragging={draggingNodeId === node.id}
        />
      ))}

      {desktopNodes.fixed.map((node) => (
        <FlowNodeCard
          key={node.id}
          node={node}
          onSelect={handleSelectNode}
          reaction={reactiveNodeMap.get(node.id)}
          desktopPosition={nodePositions[node.id]}
          onDragStart={handleNodeDragStart}
          isDragging={draggingNodeId === node.id}
        />
      ))}

      {desktopNodes.card.map((node) => (
        <FlowNodeCard
          key={node.id}
          node={node}
          onSelect={handleSelectNode}
          reaction={reactiveNodeMap.get(node.id)}
          desktopPosition={nodePositions[node.id]}
          onDragStart={handleNodeDragStart}
          isDragging={draggingNodeId === node.id}
        />
      ))}

      {desktopNodes.result.map((node) => (
        <FlowNodeCard
          key={node.id}
          node={node}
          onSelect={handleSelectNode}
          reaction={reactiveNodeMap.get(node.id)}
          desktopPosition={nodePositions[node.id]}
          onDragStart={handleNodeDragStart}
          isDragging={draggingNodeId === node.id}
        />
      ))}
    </div>
  )
}
