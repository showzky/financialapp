import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlowCanvasScene } from '@/components/flow/FlowCanvasScene'
import { FlowDetailPanel } from '@/components/flow/FlowDetailPanel'
import { FlowImportConsole } from '@/components/flow/FlowImportConsole'
import { FlowNodeCard } from '@/components/flow/FlowNodeCard'
import { useBudgets } from '@/hooks/useBudgets'
import { buildFlowDashboard, flowLegend } from '@/pages/flow.data'
import {
  formatFlowCurrency,
  getFlowHealthState,
  getFlowSummaryStat,
  groupFlowNodes,
} from '@/pages/flow.utils'
import '@/styles/flow-dashboard.css'

const useCompactFlowLayout = (breakpoint = 1100) => {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.innerWidth <= breakpoint
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompact(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [breakpoint])

  return isCompact
}

export const Flow = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const { state, totals, transactions } = useBudgets()
  const navigate = useNavigate()
  const isCompact = useCompactFlowLayout()
  const { summary: flowSummary, nodes: flowNodes, anchors: flowAnchors } = useMemo(
    () => buildFlowDashboard(state, totals, transactions),
    [state, totals, transactions],
  )

  const nodesById = useMemo(() => new Map(flowNodes.map((node) => [node.id, node])), [flowNodes])
  const groupedNodes = useMemo(() => groupFlowNodes(flowNodes), [flowNodes])
  const selectedNode = selectedNodeId ? (nodesById.get(selectedNodeId) ?? null) : null
  const healthState = getFlowHealthState(flowSummary.health)
  const incomeStat = getFlowSummaryStat(flowSummary, 'income-total')
  const spentStat = getFlowSummaryStat(flowSummary, 'spent-total')
  const pocketMoneyStat = getFlowSummaryStat(flowSummary, 'pocket-money')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || selectedNodeId) {
        return
      }

      navigate('/')
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate, selectedNodeId])

  return (
    <div className="flow-dashboard-page">
      <div className="flow-dashboard-shell">
        <header className="flow-header">
          <div className="flow-header__primary">
            <Link to="/" className="flow-header__return" aria-label="Return to dashboard">
              <span>← Return to Dashboard</span>
              <span className="flow-header__return-hint" aria-hidden="true">
                Esc
              </span>
            </Link>
            <div className="flow-header__tag">{flowSummary.headerTag}</div>
            <h1 className="flow-header__title">{flowSummary.title}</h1>
          </div>

          <div className="flow-header__stats" aria-label="Flow summary stats">
            {flowSummary.stats.map((stat, index) => (
              <div key={stat.id} className="flow-header__stat-block">
                <div className="flow-header__stat">
                  <span className="flow-header__stat-label">{stat.label}</span>
                  <span className={`flow-header__stat-value flow-header__stat-value--${stat.tone}`}>
                    {formatFlowCurrency(stat.value).replace('KR ', '')}
                  </span>
                </div>

                {index < flowSummary.stats.length - 1 ? (
                  <div className="flow-header__divider" aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="flow-header__net-worth">
            <span className="flow-header__net-worth-label">// NET WORTH</span>
            <span className="flow-header__net-worth-value">
              {formatFlowCurrency(flowSummary.netWorth)}
            </span>
          </div>
        </header>

        <section className="flow-health" aria-label="Budget health status">
          <span className="flow-health__label">// BUDGET HEALTH</span>
          <div className="flow-health__track" aria-hidden="true">
            <div
              className="flow-health__fill"
              style={{
                width: `${Math.round(flowSummary.health * 100)}%`,
                background: `linear-gradient(90deg, ${healthState.color}, rgba(255,255,255,0.35))`,
              }}
            />
          </div>
          <span className="flow-health__value" style={{ color: healthState.color }}>
            {Math.round(flowSummary.health * 100)}% - {healthState.label}
          </span>
        </section>

        <section className="flow-legend" aria-label="Flow legend">
          {flowLegend.map((item) => (
            <div key={item.id} className="flow-legend__item">
              <span
                className="flow-legend__dot"
                style={{ backgroundColor: item.color, opacity: item.opacity ?? 1 }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <p className="flow-hint">// DRAG CORE OR TAP ANY NODE TO INSPECT //</p>

        <FlowImportConsole />

        {isCompact ? (
          <div className="flow-compact-layout">
            <section className="flow-core-card" aria-label="Flow core monitor">
              <span className="flow-core-card__eyebrow">// CORE ORB //</span>
              <div className="flow-core-card__orb" aria-hidden="true">
                <div className="flow-core-card__orb-ring" />
                <div className="flow-core-card__orb-ring flow-core-card__orb-ring--delayed" />
                <div className="flow-core-card__orb-center" />
              </div>
              <div className="flow-core-card__summary">
                <span>Income: {formatFlowCurrency(incomeStat?.value ?? 0)}</span>
                <span>Spent: {formatFlowCurrency(spentStat?.value ?? 0)}</span>
                <span>Lommepenger: {formatFlowCurrency(pocketMoneyStat?.value ?? 0)}</span>
              </div>
            </section>

            <section className="flow-section" aria-labelledby="flow-income-heading">
              <h2 id="flow-income-heading" className="flow-section__title">
                Income Inputs
              </h2>
              <div className="flow-section__grid">
                {groupedNodes.income.map((node) => (
                  <FlowNodeCard key={node.id} node={node} onSelect={setSelectedNodeId} isCompact />
                ))}
              </div>
            </section>

            <section className="flow-section" aria-labelledby="flow-fixed-heading">
              <h2 id="flow-fixed-heading" className="flow-section__title">
                Fixed Drains
              </h2>
              <div className="flow-section__grid flow-section__grid--two-columns">
                {groupedNodes.fixed.map((node) => (
                  <FlowNodeCard key={node.id} node={node} onSelect={setSelectedNodeId} isCompact />
                ))}
              </div>
            </section>

            <section className="flow-section" aria-labelledby="flow-card-heading">
              <h2 id="flow-card-heading" className="flow-section__title">
                Card Pressure
              </h2>
              <div className="flow-section__grid flow-section__grid--two-columns">
                {[...groupedNodes.card, ...groupedNodes.result].map((node) => (
                  <FlowNodeCard key={node.id} node={node} onSelect={setSelectedNodeId} isCompact />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <FlowCanvasScene
            health={flowSummary.health}
            anchors={flowAnchors}
            nodes={flowNodes}
            onSelectNode={setSelectedNodeId}
          />
        )}
      </div>

      <FlowDetailPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />
    </div>
  )
}
