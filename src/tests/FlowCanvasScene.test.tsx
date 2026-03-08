import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FlowCanvasScene } from '@/components/flow/FlowCanvasScene'
import { flowAnchors, flowNodes, flowSummary } from '@/pages/flow.data'

const STORAGE_KEY = 'flow:desktop-node-layout'

const createMockCanvasContext = () => {
  const gradient = {
    addColorStop: vi.fn(),
  }

  return {
    createRadialGradient: vi.fn(() => gradient),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    setLineDash: vi.fn(),
    lineTo: vi.fn(),
    lineDashOffset: 0,
    globalAlpha: 1,
    strokeStyle: '',
    lineWidth: 1,
    shadowColor: '',
    shadowBlur: 0,
    fillStyle: '',
  }
}

const installSceneTestEnvironment = () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const originalRequestAnimationFrame = window.requestAnimationFrame
  const originalCancelAnimationFrame = window.cancelAnimationFrame
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
  const originalRect = HTMLElement.prototype.getBoundingClientRect

  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => createMockCanvasContext())
  window.requestAnimationFrame = vi.fn(() => 1)
  window.cancelAnimationFrame = vi.fn()

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return 1200
    },
  })

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() {
      return 700
    },
  })

  HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 1200,
    height: 700,
    right: 1200,
    bottom: 700,
    toJSON: () => ({}),
  }))

  return () => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
    window.requestAnimationFrame = originalRequestAnimationFrame
    window.cancelAnimationFrame = originalCancelAnimationFrame

    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth)
    }

    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
    }

    HTMLElement.prototype.getBoundingClientRect = originalRect
  }
}

describe('FlowCanvasScene node drag persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads persisted node positions from local storage on mount', async () => {
    const restoreEnvironment = installSceneTestEnvironment()
    const onSelectNode = vi.fn()

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          revolut: { x: 134, y: 130 },
        }),
      )

      render(
        <FlowCanvasScene
          health={flowSummary.health}
          anchors={flowAnchors}
          nodes={flowNodes}
          onSelectNode={onSelectNode}
        />,
      )

      await waitFor(() => {
        const revolutButton = screen.getByRole('button', { name: 'Open details for REVOLUT' })
        expect(revolutButton).toHaveStyle({ left: '134px', top: '130px' })
      })
    } finally {
      restoreEnvironment()
    }
  })

  it('still opens a node on click when there is no meaningful drag movement', () => {
    const restoreEnvironment = installSceneTestEnvironment()
    const onSelectNode = vi.fn()

    try {
      render(
        <FlowCanvasScene
          health={flowSummary.health}
          anchors={flowAnchors}
          nodes={flowNodes}
          onSelectNode={onSelectNode}
        />,
      )

      const revolutButton = screen.getByRole('button', { name: 'Open details for REVOLUT' })

      fireEvent.pointerDown(revolutButton, { clientX: 60, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 62, clientY: 92 })
      fireEvent.pointerUp(window, { clientX: 62, clientY: 92 })
      fireEvent.click(revolutButton)

      expect(onSelectNode).toHaveBeenCalledWith('revolut')
    } finally {
      restoreEnvironment()
    }
  })
})