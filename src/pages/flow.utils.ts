import type { FlowNode, FlowSummary } from '@/pages/flow.types'

export const formatFlowCurrency = (value: number) => `KR ${value.toLocaleString('en-US')}`

export const formatFlowPercent = (value: number) => `${Math.round(value * 100)}%`

export const getFlowHealthState = (health: number) => {
  if (health >= 0.75) {
    return {
      color: '#00ff96',
      label: 'GREEN',
    }
  }

  if (health >= 0.45) {
    return {
      color: '#ff9500',
      label: 'WATCH',
    }
  }

  return {
    color: '#ff2244',
    label: 'CRITICAL',
  }
}

export const getFlowPanelAccent = (node: FlowNode) => {
  switch (node.tone) {
    case 'fixed':
      return '#ff6600'
    case 'receivable':
      return '#ff9500'
    case 'income':
    case 'save':
      return '#00ff96'
    case 'bleed':
      return '#ff2244'
    case 'warn':
      return '#ff9500'
    case 'ok':
    default:
      return '#00b4ff'
  }
}

export const groupFlowNodes = (nodes: FlowNode[]) => ({
  income: nodes.filter((node) => node.group === 'income'),
  fixed: nodes.filter((node) => node.group === 'fixed'),
  card: nodes.filter((node) => node.group === 'card'),
  result: nodes.filter((node) => node.group === 'result'),
})

export const getFlowSummaryStat = (summary: FlowSummary, statId: string) =>
  summary.stats.find((stat) => stat.id === statId)
