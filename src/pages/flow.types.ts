export type FlowTone = 'income' | 'fixed' | 'bleed' | 'warn' | 'ok' | 'save' | 'receivable'

export type FlowNodeGroup = 'income' | 'fixed' | 'card' | 'result'

export type FlowSummaryStat = {
  id: string
  label: string
  tone: 'green' | 'red' | 'blue'
  value: number
}

export type FlowSummary = {
  headerTag: string
  title: string
  stats: FlowSummaryStat[]
  netWorth: number
  health: number
}

export type FlowLegendItem = {
  id: string
  label: string
  color: string
  opacity?: number
}

export type FlowTransaction = {
  id: string
  merchant: string
  date: string
  amount: number
}

export type FlowNodeDetail = {
  tag: string
  note: string
  rate: number
  transactions: FlowTransaction[]
}

export type FlowNode = {
  id: string
  group: FlowNodeGroup
  tone: FlowTone
  title: string
  typeLabel: string
  amount: number
  sublabel: string
  desktopTop: number
  badge?: string
  progress?: number
  detail: FlowNodeDetail
}

export type FlowAnchor = {
  id: string
  kind: 'income' | 'fixed' | 'card'
  color: string
  width: number
  orbAngle: number
  y: number
  x?: number
  bleed?: boolean
}

export type FlowAnchorGroups = {
  income: FlowAnchor[]
  fixed: FlowAnchor[]
  card: FlowAnchor[]
}
