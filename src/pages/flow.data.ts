import type { BudgetCategory, BudgetState } from '@/types/budget'
import {
  DASHBOARD_CREDIT_NOTE_PREFIX,
  DASHBOARD_EXPENSE_NOTE_PREFIX,
  type BudgetTransaction,
} from '@/types/transaction'
import { classifyRevolutImport } from '@/components/flow/revolutImportClassifier'
import type { StoredRevolutImportState } from '@/components/flow/revolutCsv'
import type { FlowAnchorGroups, FlowLegendItem, FlowNode, FlowSummary, FlowTone } from '@/pages/flow.types'

export type FlowBudgetTotals = {
  allocated: number
  spent: number
  remaining: number
}

const FLOW_HEADER_TAG = '// FINANCIAL_OS // LIVE CATEGORY MONITORING'
const FLOW_TITLE = 'MISSION CONTROL'
export const FLOW_REVOLUT_IMPORT_NODE_ID = 'system-revolut-import'

const clampFlowRate = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(Math.max(value, 0), 1)
}

const formatFlowCategoryLabel = (name: string) => name.trim().toUpperCase() || 'UNTITLED CATEGORY'

const getBudgetCategoryRate = (category: BudgetCategory) => {
  if (category.type === 'fixed') {
    return category.allocated > 0 ? 1 : 0
  }

  if (category.allocated <= 0) {
    return 0
  }

  return clampFlowRate(category.spent / category.allocated)
}

const getBudgetCategoryTone = (category: BudgetCategory): FlowTone => {
  if (category.type === 'fixed') {
    return 'fixed'
  }

  const rate = getBudgetCategoryRate(category)

  if (rate >= 0.8) {
    return 'bleed'
  }

  if (rate >= 0.55) {
    return 'warn'
  }

  return 'ok'
}

const getFlowTransactionDirection = (transaction: BudgetTransaction) => {
  if (transaction.note?.startsWith(DASHBOARD_CREDIT_NOTE_PREFIX)) {
    return 1
  }

  if (transaction.note?.startsWith(DASHBOARD_EXPENSE_NOTE_PREFIX)) {
    return -1
  }

  return -1
}

const getFlowTransactionMerchant = (transaction: BudgetTransaction) => {
  if (!transaction.note) {
    return 'Dashboard expense'
  }

  return transaction.note
    .replace(DASHBOARD_EXPENSE_NOTE_PREFIX, '')
    .replace(DASHBOARD_CREDIT_NOTE_PREFIX, '')
    .trim()
}

const createBudgetDetailTransactions = (
  category: BudgetCategory,
  transactions: BudgetTransaction[],
) =>
  transactions
    .filter((transaction) => transaction.categoryId === category.id)
    .sort((left, right) => {
      const leftKey = `${left.transactionDate}-${left.createdAt}`
      const rightKey = `${right.transactionDate}-${right.createdAt}`
      return rightKey.localeCompare(leftKey)
    })
    .slice(0, 5)
    .map((transaction) => ({
      id: transaction.id,
      merchant: getFlowTransactionMerchant(transaction),
      date: transaction.transactionDate,
      amount: transaction.amount * getFlowTransactionDirection(transaction),
    }))

const createFlowIncomeNode = (state: BudgetState): FlowNode => ({
  id: 'monthly-income',
  group: 'income',
  tone: 'income',
  title: 'MONTHLY INCOME',
  typeLabel: '// INCOME',
  amount: state.income,
  sublabel: `${state.month.toUpperCase()} PROFILE SYNC`,
  desktopTop: 145,
  detail: {
    tag: 'INCOME',
    rate: state.income > 0 ? 1 : 0,
    note: 'Income is pulled from your dashboard profile. Changes there flow into this view automatically.',
    transactions: [],
  },
})

const createFlowCategoryNode = (
  category: BudgetCategory,
  index: number,
  transactions: BudgetTransaction[],
): FlowNode => {
  const rate = getBudgetCategoryRate(category)
  const tone = getBudgetCategoryTone(category)
  const amount = category.type === 'fixed' ? category.allocated : category.spent
  const remaining = Math.max(category.allocated - category.spent, 0)

  return {
    id: category.id,
    group: category.type === 'fixed' ? 'fixed' : 'card',
    tone,
    title: formatFlowCategoryLabel(category.name),
    typeLabel: category.type === 'fixed' ? '// FIXED CATEGORY' : '// DASHBOARD CATEGORY',
    amount,
    sublabel:
      category.type === 'fixed'
        ? 'FIXED DASHBOARD DRAIN'
        : `${remaining.toLocaleString('en-US')} LEFT OF ${category.allocated.toLocaleString('en-US')}`,
    desktopTop: category.type === 'fixed' ? 35 + index * 104 : 325 + index * 92,
    badge:
      category.type === 'fixed'
        ? category.allocated > 0
          ? 'MONTHLY COMMITMENT'
          : 'READY'
        : category.allocated > 0
          ? `${Math.round(rate * 100)}% USED`
          : 'NO BUDGET YET',
    progress: category.type === 'fixed' ? (category.allocated > 0 ? 1 : 0) : rate,
    detail: {
      tag: category.type === 'fixed' ? 'FIXED CATEGORY' : 'DASHBOARD CATEGORY',
      rate,
      note:
        category.type === 'fixed'
          ? 'This fixed category comes directly from the dashboard. Deleting it there removes it from Flow as well.'
          : 'This dashboard category is live. Allocation, spending, creation, and deletion all sync through the shared budget state.',
      transactions: createBudgetDetailTransactions(category, transactions),
    },
  }
}

const createFlowResultNode = (availableBuffer: number, totalAllocated: number, committedSpend: number): FlowNode => ({
  id: 'available-buffer',
  group: 'result',
  tone: availableBuffer > 0 ? 'save' : 'warn',
  title: 'AVAILABLE BUFFER',
  typeLabel: '// RESULT',
  amount: availableBuffer,
  sublabel: totalAllocated > 0 ? 'UNASSIGNED AFTER CATEGORY PLAN' : 'READY FOR NEW CATEGORIES',
  desktopTop: 525,
  badge: `${Math.round(totalAllocated > 0 ? (availableBuffer / Math.max(totalAllocated + availableBuffer, 1)) * 100 : 100)}% FREE`,
  progress: clampFlowRate(totalAllocated > 0 ? availableBuffer / Math.max(totalAllocated + availableBuffer, 1) : 1),
  detail: {
    tag: 'RESULT',
    rate: clampFlowRate(availableBuffer / Math.max(availableBuffer + committedSpend, 1)),
    note: 'Available buffer is derived from income minus allocated categories. When dashboard categories are added or removed, this recalculates automatically.',
    transactions: [],
  },
})

const getRevolutImportVelocityState = (revolutImport: StoredRevolutImportState, categories: BudgetCategory[]) => {
  const analysis = classifyRevolutImport(revolutImport, categories)
  const totalRows = Math.max(revolutImport.summary.rows.length, 1)

  if (revolutImport.summary.rows.length === 0) {
    return {
      tone: 'ok' as FlowTone,
      rate: 0.18,
      badge: 'UPLOAD FILE',
      note:
        'System-owned Flow node for Revolut statement preview. It behaves like a Flow card, but it is not a dashboard category and is not managed by the dashboard category UI.',
      transactions: revolutImport.summary.rows,
    }
  }

  const reviewShare = analysis.reviewCount / totalRows
  const missingShare = analysis.missingCategoryCount / totalRows
  // CHANGED THIS: count applied rows to reduce pressure
  const appliedCount = analysis.rows.filter((row) => row.classification.appliedStatus === 'applied').length
  const rate = clampFlowRate(Math.max(reviewShare, missingShare, analysis.transferCount > 0 ? 0.24 : 0.18))
  const isBleeding = reviewShare >= 0.65 || analysis.missingCategoryCount >= 2
  const isWarning = !isBleeding && analysis.reviewCount > 0

  return {
    tone: (isBleeding ? 'bleed' : isWarning ? 'warn' : 'ok') as FlowTone,
    rate,
    badge: isBleeding
      ? `${analysis.reviewCount} REVIEW`
      : isWarning
        ? `${analysis.reviewCount} CHECKS`
        : appliedCount > 0
          ? `${appliedCount} APPLIED` // ADDED THIS
          : `${analysis.autoMatchedCount} READY`,
    note: isBleeding
      ? 'Imported rows still need heavy review before they should influence the card lane.'
      : isWarning
        ? 'Imported rows are mostly understood, but some still need checks, funding confirmation, or category setup.'
        : 'Imported rows are grouped and ready. The boss node is supervising review health, not acting as a spending category.',
    transactions: analysis.rows,
  }
}

const createFlowRevolutImportNode = (revolutImport: StoredRevolutImportState, categories: BudgetCategory[]): FlowNode => {
  const transactionCount = revolutImport.summary.rows.length
  const totalSpent = revolutImport.summary.totalSpent
  const velocityState = getRevolutImportVelocityState(revolutImport, categories)

  return {
    id: FLOW_REVOLUT_IMPORT_NODE_ID,
    group: 'card',
    tone: velocityState.tone,
    title: 'REVOLUT IMPORT',
    typeLabel: '// SYSTEM IMPORT',
    amount: totalSpent,
    sublabel:
      transactionCount > 0
        ? `${transactionCount} ROWS • ${revolutImport.fileName.toUpperCase()}`
        : 'CLICK TO OPEN STATEMENT IMPORTER',
    desktopTop: 112,
    badge: velocityState.badge,
    progress: velocityState.rate,
    detail: {
      tag: 'SYSTEM IMPORT',
      rate: velocityState.rate,
      note: velocityState.note,
      transactions: velocityState.transactions.slice(0, 5).map((row) => ({
        id: row.id,
        merchant: row.description,
        date: row.date,
        amount: row.amount,
      })),
    },
  }
}

const buildFlowAnchorsForNodes = (nodes: FlowNode[]): FlowAnchorGroups => {
  const incomeNodes = nodes.filter((node) => node.group === 'income')
  const fixedNodes = nodes.filter((node) => node.group === 'fixed')
  const drainNodes = nodes.filter((node) => node.group === 'card' || node.group === 'result')
  const incomeAngles = [205, 220, 235, 250, 265]
  const fixedAngles = [314, 326, 338, 350, 2, 14, 26, 38]
  const drainAngles = [354, 8, 22, 36, 50, 64, 78, 92, 106]

  return {
    income: incomeNodes.map((node, index) => ({
      id: `income-${node.id}`,
      kind: 'income',
      color: '#00ff96',
      width: 3 - Math.min(index, 2) * 0.5,
      orbAngle: incomeAngles[index] ?? incomeAngles[incomeAngles.length - 1],
      x: 162,
      y: node.desktopTop + 33,
    })),
    fixed: fixedNodes.map((node, index) => ({
      id: `fixed-${node.id}`,
      kind: 'fixed',
      color: '#ff6600',
      width: index === 0 ? 2.5 : 1.75,
      orbAngle: fixedAngles[index] ?? fixedAngles[fixedAngles.length - 1],
      y: node.desktopTop + 32,
    })),
    card: drainNodes.map((node, index) => ({
      id: `card-${node.id}`,
      kind: 'card',
      color: node.group === 'result' ? '#00ff96' : node.tone === 'bleed' ? '#ff2244' : node.tone === 'warn' ? '#ff9500' : '#00b4ff',
      width: node.group === 'result' ? 2 : index === 0 ? 2.5 : 2,
      orbAngle: drainAngles[index] ?? drainAngles[drainAngles.length - 1],
      y: node.desktopTop + 32,
      bleed: node.tone === 'bleed',
    })),
  }
}

export const buildFlowSummary = (state: BudgetState, totals: FlowBudgetTotals): FlowSummary => {
  const fixedAllocated = state.categories
    .filter((category) => category.type === 'fixed')
    .reduce((sum, category) => sum + category.allocated, 0)
  const committedSpend = fixedAllocated + totals.spent
  const availableBuffer = Math.max(state.income - totals.allocated, 0)
  const health = clampFlowRate(state.income > 0 ? (state.income - committedSpend) / state.income : 0)

  return {
    headerTag: FLOW_HEADER_TAG,
    title: FLOW_TITLE,
    stats: [
      {
        id: 'income-total',
        label: '// INCOME',
        tone: 'green',
        value: state.income,
      },
      {
        id: 'spent-total',
        label: '// COMMITTED',
        tone: 'red',
        value: committedSpend,
      },
      {
        id: 'pocket-money',
        label: '// AVAILABLE',
        tone: 'blue',
        value: availableBuffer,
      },
    ],
    netWorth: Math.max(state.income - committedSpend, 0),
    health,
  }
}

export const buildFlowNodes = (
  state: BudgetState,
  totals: FlowBudgetTotals,
  transactions: BudgetTransaction[],
  revolutImport: StoredRevolutImportState,
): FlowNode[] => {
  const incomeNode = createFlowIncomeNode(state)
  const fixedNodes = state.categories
    .filter((category) => category.type === 'fixed')
    .map((category, index) => createFlowCategoryNode(category, index, transactions))
  const budgetNodes = state.categories
    .filter((category) => category.type === 'budget')
    .map((category, index) => createFlowCategoryNode(category, index, transactions))
  const availableBuffer = Math.max(state.income - totals.allocated, 0)
  const fixedAllocated = fixedNodes.reduce((sum, node) => sum + node.amount, 0)
  const resultNode = createFlowResultNode(availableBuffer, totals.allocated, fixedAllocated + totals.spent)
  const revolutImportNode = createFlowRevolutImportNode(revolutImport, state.categories)

  return [incomeNode, revolutImportNode, ...fixedNodes, ...budgetNodes, resultNode]
}

export const buildFlowAnchors = (nodes: FlowNode[]) => buildFlowAnchorsForNodes(nodes)

export const buildFlowDashboard = (
  state: BudgetState,
  totals: FlowBudgetTotals,
  transactions: BudgetTransaction[],
  revolutImport: StoredRevolutImportState,
) => {
  const nodes = buildFlowNodes(state, totals, transactions, revolutImport)

  return {
    summary: buildFlowSummary(state, totals),
    nodes,
    anchors: buildFlowAnchors(nodes),
  }
}

export const flowSummary: FlowSummary = {
  headerTag: '// FINANCIAL_OS // MARCH 2026 // LIVE MONITORING',
  title: 'MISSION CONTROL',
  stats: [
    {
      id: 'income-total',
      label: '// INCOME',
      tone: 'green',
      value: 37_210,
    },
    {
      id: 'spent-total',
      label: '// SPENT',
      tone: 'red',
      value: 16_420,
    },
    {
      id: 'pocket-money',
      label: '// LOMMEPENGER',
      tone: 'blue',
      value: 8_186,
    },
  ],
  netWorth: 142_500,
  health: 0.62,
}

export const flowLegend: FlowLegendItem[] = [
  {
    id: 'income',
    label: 'INCOME FLOW',
    color: '#00ff96',
  },
  {
    id: 'fixed',
    label: 'FIXED DRAIN (STEADY)',
    color: '#ff6600',
  },
  {
    id: 'bleed',
    label: 'CARD BLEEDING (FAST)',
    color: '#ff2244',
  },
  {
    id: 'ok',
    label: 'CARD OK',
    color: '#00b4ff',
  },
  {
    id: 'save',
    label: 'SAVINGS',
    color: '#00ff96',
    opacity: 0.6,
  },
]

export const flowNodes: FlowNode[] = [
  {
    id: 'revolut',
    group: 'income',
    tone: 'income',
    title: 'REVOLUT',
    typeLabel: '// INCOME',
    amount: 31_423,
    sublabel: 'LONN ETTER SKATT',
    desktopTop: 60,
    detail: {
      tag: 'INCOME',
      rate: 0.84,
      note: 'Primary salary inflow after tax. Feeds core balance and stabilizes drains.',
      transactions: [
        { id: 'salary-payout', merchant: 'Salary payout', date: '2026-03-01', amount: 31_423 },
        { id: 'transfer-bills', merchant: 'Transfer to bills', date: '2026-03-02', amount: -5_000 },
        { id: 'card-top-up', merchant: 'Card top-up', date: '2026-03-02', amount: -2_500 },
      ],
    },
  },
  {
    id: 'sparebank',
    group: 'income',
    tone: 'income',
    title: 'SPAREBANK1',
    typeLabel: '// INCOME',
    amount: 5_787,
    sublabel: 'BILLS ACCOUNT',
    desktopTop: 185,
    detail: {
      tag: 'INCOME',
      rate: 0.42,
      note: 'Bills buffer account. Used for fixed drains. Keep stable to avoid spikes.',
      transactions: [
        { id: 'transfer-in', merchant: 'Transfer in', date: '2026-03-02', amount: 5_787 },
        { id: 'insurance-hit', merchant: 'Insurance', date: '2026-03-04', amount: -1_710 },
      ],
    },
  },
  {
    id: 'loans',
    group: 'income',
    tone: 'receivable',
    title: 'LOANS OUT',
    typeLabel: '// RECEIVABLE',
    amount: 44_666,
    sublabel: '3 ACTIVE • 8 REPAID',
    desktopTop: 330,
    detail: {
      tag: 'RECEIVABLE',
      rate: 0.22,
      note: 'Money owed to you. Not cashflow-safe until collected. Treat as illiquid.',
      transactions: [
        { id: 'hakon', merchant: 'Hakon repayment', date: '2026-02-24', amount: 1_200 },
        { id: 'new-loan', merchant: 'New loan issued', date: '2026-02-15', amount: -2_500 },
      ],
    },
  },
  {
    id: 'husleie',
    group: 'fixed',
    tone: 'fixed',
    title: '🏠 HUSLEIE',
    typeLabel: '// FIXED DRAIN',
    amount: 6_500,
    sublabel: 'NON-NEGOTIABLE MONTHLY AUTO',
    desktopTop: 15,
    badge: 'MONTHLY AUTO',
    progress: 1,
    detail: {
      tag: 'FIXED DRAIN',
      rate: 1,
      note: 'Monthly auto drain. Non-negotiable short-term. Ensure bill buffer covers it.',
      transactions: [
        { id: 'rent-payment', merchant: 'Rent payment', date: '2026-03-01', amount: -6_500 },
      ],
    },
  },
  {
    id: 'telefon',
    group: 'fixed',
    tone: 'fixed',
    title: '📱 TELEFON',
    typeLabel: '// FIXED DRAIN',
    amount: 1_950,
    sublabel: 'SUBSCRIPTION-LIKE DRAIN',
    desktopTop: 120,
    badge: 'MONTHLY AUTO',
    progress: 1,
    detail: {
      tag: 'FIXED DRAIN',
      rate: 1,
      note: 'Stable subscription-like drain. Consider renegotiation or a cheaper plan if needed.',
      transactions: [
        { id: 'telco-invoice', merchant: 'Telco invoice', date: '2026-03-03', amount: -1_950 },
      ],
    },
  },
  {
    id: 'forsikring',
    group: 'fixed',
    tone: 'fixed',
    title: '🛡 FORSIKRING',
    typeLabel: '// FIXED DRAIN',
    amount: 1_710,
    sublabel: 'ANNUAL REVIEW CANDIDATE',
    desktopTop: 220,
    badge: 'MONTHLY AUTO',
    progress: 1,
    detail: {
      tag: 'FIXED DRAIN',
      rate: 1,
      note: 'Insurance drain. Keep it steady and optimize annually if possible.',
      transactions: [
        { id: 'insurance-payment', merchant: 'Insurance', date: '2026-03-04', amount: -1_710 },
      ],
    },
  },
  {
    id: 'transport',
    group: 'card',
    tone: 'bleed',
    title: '🚗 TRANSPORT',
    typeLabel: '// REVOLUT CARD',
    amount: 4_178,
    sublabel: 'FAST LEAKAGE DETECTED',
    desktopTop: 320,
    badge: 'BLEEDING 82%',
    progress: 0.82,
    detail: {
      tag: 'REVOLUT CARD',
      rate: 0.82,
      note: 'Bleeding detected: fuel, toll, and parking are stacking. Watch for repeated hits.',
      transactions: [
        { id: 'circle-k', merchant: 'Circle K', date: '2026-03-02', amount: -890 },
        { id: 'bomring', merchant: 'Bomring', date: '2026-03-02', amount: -72 },
        { id: 'parking', merchant: 'Parking', date: '2026-03-01', amount: -160 },
        { id: 'fuel', merchant: 'Fuel', date: '2026-02-28', amount: -1_250 },
      ],
    },
  },
  {
    id: 'mat',
    group: 'card',
    tone: 'warn',
    title: '🍔 MAT',
    typeLabel: '// REVOLUT CARD',
    amount: 3_900,
    sublabel: 'WATCH STATE',
    desktopTop: 420,
    badge: 'WATCH 65%',
    progress: 0.65,
    detail: {
      tag: 'REVOLUT CARD',
      rate: 0.65,
      note: 'Watch state. Reduce drift by batching groceries and limiting impulse stops.',
      transactions: [
        { id: 'rema', merchant: 'Rema 1000', date: '2026-03-02', amount: -412 },
        { id: 'burger-king', merchant: 'Burger King', date: '2026-03-01', amount: -189 },
        { id: 'kiwi', merchant: 'Kiwi', date: '2026-02-28', amount: -321 },
      ],
    },
  },
  {
    id: 'lommepenger',
    group: 'result',
    tone: 'save',
    title: '💰 LOMMEPENGER',
    typeLabel: '// RESULT',
    amount: 8_186,
    sublabel: 'BUFFER SURVIVAL RATE',
    desktopTop: 505,
    badge: '22% RATE',
    progress: 0.22,
    detail: {
      tag: 'RESULT',
      rate: 0.22,
      note: 'Pocket money rate is stable. Keep drains under control to protect this buffer.',
      transactions: [
        { id: 'buffer', merchant: 'Remaining buffer', date: '2026-03-03', amount: 8_186 },
      ],
    },
  },
]

export const flowAnchors: FlowAnchorGroups = {
  income: [
    { id: 'income-1', kind: 'income', color: '#00ff96', width: 3, orbAngle: 200, x: 162, y: 93 },
    { id: 'income-2', kind: 'income', color: '#00c870', width: 2, orbAngle: 215, x: 162, y: 213 },
    { id: 'income-3', kind: 'income', color: '#ff9500', width: 1.5, orbAngle: 230, x: 162, y: 353 },
  ],
  fixed: [
    { id: 'fixed-1', kind: 'fixed', color: '#ff6600', width: 2.5, orbAngle: 315, y: 47 },
    { id: 'fixed-2', kind: 'fixed', color: '#ff7722', width: 1.5, orbAngle: 330, y: 152 },
    { id: 'fixed-3', kind: 'fixed', color: '#ff8833', width: 1.5, orbAngle: 342, y: 252 },
  ],
  card: [
    {
      id: 'card-1',
      kind: 'card',
      color: '#ff2244',
      width: 2.5,
      orbAngle: 355,
      y: 353,
      bleed: true,
    },
    { id: 'card-2', kind: 'card', color: '#ff9500', width: 2, orbAngle: 10, y: 453 },
    { id: 'card-3', kind: 'card', color: '#00ff96', width: 2, orbAngle: 25, y: 537 },
  ],
}
