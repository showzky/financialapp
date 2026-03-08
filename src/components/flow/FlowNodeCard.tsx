import { useRef } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
import type { FlowNodeReaction } from '@/components/flow/flowSceneMath'
import type { FlowNodePosition } from '@/components/flow/flowNodeLayout'
import type { FlowNode } from '@/pages/flow.types'
import { formatFlowCurrency } from '@/pages/flow.utils'

type FlowNodeCardProps = {
  node: FlowNode
  onSelect: (nodeId: string) => void
  isCompact?: boolean
  reaction?: FlowNodeReaction
  desktopPosition?: FlowNodePosition
  onDragStart?: (nodeId: string, event: PointerEvent<HTMLButtonElement>) => void
  isDragging?: boolean
}

export const FlowNodeCard = ({
  node,
  onSelect,
  isCompact = false,
  reaction,
  desktopPosition,
  onDragStart,
  isDragging = false,
}: FlowNodeCardProps) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleSelect = (event: MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current ?? event.currentTarget
    button.classList.remove('is-pulsing')
    void button.offsetWidth
    button.classList.add('is-pulsing')
    onSelect(node.id)
  }

  const style: CSSProperties | undefined = isCompact
    ? undefined
    : {
        left: `${desktopPosition?.x ?? 0}px`,
        top: `${desktopPosition?.y ?? node.desktopTop}px`,
        ['--flow-node-offset-x' as string]: `${reaction?.offsetX ?? 0}px`,
        ['--flow-node-offset-y' as string]: `${reaction?.offsetY ?? 0}px`,
        ['--flow-node-scale' as string]: `${reaction?.scale ?? 1}`,
      }
  const positionClass = isCompact ? 'flow-node--compact' : 'flow-node--desktop'

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`flow-node flow-node--${node.group} ${positionClass} ${isDragging ? 'flow-node--dragging' : ''}`}
      data-tone={node.tone}
      style={style}
      aria-label={`Open details for ${node.title}`}
      onClick={handleSelect}
      onPointerDown={isCompact || !onDragStart ? undefined : (event) => onDragStart(node.id, event)}
    >
      <span className="flow-node__type">{node.typeLabel}</span>
      <span className="flow-node__name">{node.title}</span>
      <span className="flow-node__amount">{formatFlowCurrency(node.amount)}</span>
      <span className="flow-node__sub">{node.sublabel}</span>

      {typeof node.progress === 'number' ? (
        <span className="flow-node__bar" aria-hidden="true">
          <span
            className="flow-node__fill"
            style={{ width: `${Math.round(node.progress * 100)}%` }}
          />
        </span>
      ) : null}

      {node.badge ? <span className="flow-node__badge">{node.badge}</span> : null}
    </button>
  )
}
