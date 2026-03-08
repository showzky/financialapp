import { useEffect } from 'react'
import type { FlowNode } from '@/pages/flow.types'
import { formatFlowCurrency, formatFlowPercent, getFlowPanelAccent } from '@/pages/flow.utils'

type FlowDetailPanelProps = {
  node: FlowNode | null
  onClose: () => void
}

export const FlowDetailPanel = ({ node, onClose }: FlowDetailPanelProps) => {
  useEffect(() => {
    if (!node) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [node, onClose])

  if (!node) {
    return null
  }

  const accent = getFlowPanelAccent(node)

  return (
    <>
      <button
        type="button"
        className="flow-overlay flow-overlay--visible"
        aria-label="Close flow detail panel"
        onClick={onClose}
      />

      <aside className="flow-panel flow-panel--open" aria-label="Flow detail panel">
        <div className="flow-panel__glow" />

        <div className="flow-panel__header">
          <div className="flow-panel__title-wrap">
            <h2 className="flow-panel__title">{node.title}</h2>
            <span className="flow-panel__tag" style={{ color: accent, borderColor: `${accent}55` }}>
              {node.detail.tag}
            </span>
          </div>

          <button type="button" className="flow-panel__close" onClick={onClose}>
            [ CLOSE ]
          </button>
        </div>

        <div className="flow-panel__grid">
          <div className="flow-panel__stat">
            <span className="flow-panel__label">Amount</span>
            <span className="flow-panel__value">{formatFlowCurrency(node.amount)}</span>
          </div>

          <div className="flow-panel__stat">
            <span className="flow-panel__label">Signal</span>
            <span className="flow-panel__value" style={{ color: accent }}>
              {formatFlowPercent(node.detail.rate)}
            </span>
          </div>

          <div className="flow-panel__stat">
            <span className="flow-panel__label">Status</span>
            <span className="flow-panel__value" style={{ color: accent }}>
              {node.detail.tag}
            </span>
          </div>
        </div>

        <div className="flow-panel__meter-wrap">
          <div className="flow-panel__meter-label">
            <span>// INTENSITY</span>
            <span>{formatFlowPercent(node.detail.rate)}</span>
          </div>
          <div className="flow-panel__meter-track">
            <div
              className="flow-panel__meter-fill"
              style={{
                width: `${Math.round(node.detail.rate * 100)}%`,
                background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.45))`,
              }}
            />
          </div>
        </div>

        <p className="flow-panel__note">{node.detail.note}</p>

        <div className="flow-panel__transactions">
          <span className="flow-panel__transactions-label">// RECENT TRANSACTIONS</span>

          <div className="flow-panel__transactions-list">
            {node.detail.transactions.length > 0 ? (
              node.detail.transactions.map((transaction) => {
                const amountColor = transaction.amount >= 0 ? '#00ff96' : '#ff2244'

                return (
                  <div key={transaction.id} className="flow-panel__transaction-item">
                    <div>
                      <div className="flow-panel__transaction-merchant">{transaction.merchant}</div>
                      <div className="flow-panel__transaction-date">{transaction.date}</div>
                    </div>

                    <div className="flow-panel__transaction-amount" style={{ color: amountColor }}>
                      {transaction.amount >= 0 ? '+' : '-'}
                      {formatFlowCurrency(Math.abs(transaction.amount)).replace('KR ', '')}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flow-panel__transaction-item">
                <div>
                  <div className="flow-panel__transaction-merchant">No tracked activity yet</div>
                  <div className="flow-panel__transaction-date">Live dashboard sync</div>
                </div>

                <div className="flow-panel__transaction-amount" style={{ color: '#9db7d4' }}>
                  WAITING
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
