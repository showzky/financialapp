import type { BudgetCategory } from '@/types/budget'
import type { RevolutImportRow, RowApplicationStatus, StoredRevolutImportState } from '@/components/flow/revolutCsv' // CHANGED THIS

export type RevolutImportType = 'expense' | 'income' | 'transfer' | 'loan' | 'ignore' | 'review'

export type RevolutFundingSource = 'food-fund' | 'lommepenger' | 'none'

export type RevolutImportConfidence = 'high' | 'medium' | 'low' | 'undefined'

export type RevolutImportResolution =
  | 'mapped-existing-category'
  | 'mapped-missing-category'
  | 'transfer'
  | 'income'
  | 'ignore'
  | 'needs-review'

export type RevolutImportOverride = {
  type?: RevolutImportType
  categoryId?: string
  fundingSource?: RevolutFundingSource
}

export type ClassifiedRevolutImportRow = RevolutImportRow & {
  classification: {
    type: RevolutImportType
    confidence: RevolutImportConfidence
    resolution: RevolutImportResolution
    categoryId?: string
    categoryName?: string
    suggestedCategoryName?: string
    fundingSource: RevolutFundingSource
    fundingSourceLabel: string
    targetLabel?: string
    badge: string
    statusLabel: string
    autoMatched: boolean
    needsReview: boolean
    note: string
    appliedStatus?: RowApplicationStatus // ADDED THIS
  }
}

export type ClassifiedRevolutImportGroups = {
  needsReview: ClassifiedRevolutImportRow[]
  missingCategories: ClassifiedRevolutImportRow[]
  transfers: ClassifiedRevolutImportRow[]
  mappedExpenses: ClassifiedRevolutImportRow[]
  mappedIncome: ClassifiedRevolutImportRow[]
  ignored: ClassifiedRevolutImportRow[]
}

export type ClassifiedRevolutImportAnalysis = {
  rows: ClassifiedRevolutImportRow[]
  groups: ClassifiedRevolutImportGroups
  autoMatchedCount: number
  reviewCount: number
  transferCount: number
  missingCategoryCount: number
  foodFundAllocated: number
  foodFundSpent: number
  foodFundRemaining: number
  projectedFoodFundRemaining: number
  projectedFoodFromPocket: number
}

const FOOD_CATEGORY_MATCHER = /^(food|mat)$/i
const GROCERY_MERCHANT_MATCHER = /(rema|kiwi|coop|meny|joker|bunnpris|spar|obs|extra)/i
const TRANSFER_MATCHER = /(to pocket|pocket transfer|wishlist pocket|wishlist)/i

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const toLabel = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const getBudgetCategories = (categories: BudgetCategory[]) =>
  categories.filter((category) => category.type === 'budget')

const findFoodCategory = (categories: BudgetCategory[]) =>
  getBudgetCategories(categories).find((category) => FOOD_CATEGORY_MATCHER.test(category.name.trim())) ?? null

const findExistingCategoryMatch = (description: string, categories: BudgetCategory[]) => {
  const normalizedDescription = normalizeText(description)

  return getBudgetCategories(categories).find((category) => {
    const normalizedCategoryName = normalizeText(category.name)
    return normalizedCategoryName.length >= 3 && normalizedDescription.includes(normalizedCategoryName)
  })
}

const getTransferTargetLabel = (description: string) => {
  const normalized = normalizeText(description)
  const withoutPrefix = normalized.replace(/^to pocket( nok)?\s*/, '').trim()
  return withoutPrefix ? `Wishlist Pocket: ${toLabel(withoutPrefix)}` : 'Internal pocket transfer'
}

const getFundingSourceLabel = (fundingSource: RevolutFundingSource) => {
  switch (fundingSource) {
    case 'food-fund':
      return 'Food fund'
    case 'lommepenger':
      return 'Lommepenger'
    default:
      return 'N/A'
  }
}

const createBaseClassification = (
  row: RevolutImportRow,
  categories: BudgetCategory[],
  override?: RevolutImportOverride,
) => {
  const description = normalizeText(row.description)
  const existingCategoryMatch = findExistingCategoryMatch(row.description, categories)
  const foodCategory = findFoodCategory(categories)
  const isTransfer = TRANSFER_MATCHER.test(description)
  const isGroceryMerchant = GROCERY_MERCHANT_MATCHER.test(description)

  if (override?.type === 'ignore') {
    return {
      type: 'ignore' as RevolutImportType,
      confidence: 'high' as RevolutImportConfidence,
      resolution: 'ignore' as RevolutImportResolution,
      fundingSource: 'none' as RevolutFundingSource,
      badge: 'IGNORED',
      statusLabel: 'Ignored by manual tag',
      autoMatched: false,
      needsReview: false,
      note: 'This row is ignored and does not affect category pressure or review counts.',
    }
  }

  if (isTransfer || override?.type === 'transfer') {
    return {
      type: 'transfer' as RevolutImportType,
      confidence: 'high' as RevolutImportConfidence,
      resolution: 'transfer' as RevolutImportResolution,
      fundingSource: 'none' as RevolutFundingSource,
      targetLabel: getTransferTargetLabel(row.description),
      badge: 'TRANSFER',
      statusLabel: 'Internal move',
      autoMatched: true,
      needsReview: false,
      note: 'Transfers stay inside the boss node and do not count as category spending.',
    }
  }

  if (row.amount > 0 || override?.type === 'income') {
    return {
      type: 'income' as RevolutImportType,
      confidence: 'high' as RevolutImportConfidence,
      resolution: 'income' as RevolutImportResolution,
      fundingSource: 'none' as RevolutFundingSource,
      badge: 'INCOME',
      statusLabel: 'Income detected',
      autoMatched: true,
      needsReview: false,
      note: 'Income rows stay separate from spend classification and do not create drain pressure.',
    }
  }

  if (override?.type === 'expense' && override.categoryId) {
    const overrideCategory = getBudgetCategories(categories).find((category) => category.id === override.categoryId)

    if (overrideCategory) {
      return {
        type: 'expense' as RevolutImportType,
        confidence: 'high' as RevolutImportConfidence,
        resolution: 'mapped-existing-category' as RevolutImportResolution,
        categoryId: overrideCategory.id,
        categoryName: overrideCategory.name,
        fundingSource: 'none' as RevolutFundingSource,
        badge: 'EXPENSE',
        statusLabel: 'Manual category tag',
        autoMatched: true,
        needsReview: false,
        note: 'This row was manually tagged and now feeds the chosen dashboard category.',
      }
    }
  }

  if (existingCategoryMatch) {
    return {
      type: 'expense' as RevolutImportType,
      confidence: 'high' as RevolutImportConfidence,
      resolution: 'mapped-existing-category' as RevolutImportResolution,
      categoryId: existingCategoryMatch.id,
      categoryName: existingCategoryMatch.name,
      fundingSource: 'none' as RevolutFundingSource,
      badge: 'EXPENSE',
      statusLabel: `Matched ${existingCategoryMatch.name}`,
      autoMatched: true,
      needsReview: false,
      note: 'This row matches an existing dashboard category and can feed that card lane directly.',
    }
  }

  if (isGroceryMerchant || override?.type === 'expense') {
    if (foodCategory) {
      return {
        type: 'expense' as RevolutImportType,
        confidence: override?.fundingSource ? 'high' as RevolutImportConfidence : 'medium' as RevolutImportConfidence,
        resolution: 'mapped-existing-category' as RevolutImportResolution,
        categoryId: foodCategory.id,
        categoryName: foodCategory.name,
        fundingSource: 'none' as RevolutFundingSource,
        badge: 'FOOD',
        statusLabel: override?.fundingSource ? 'Food funding confirmed' : 'Food category matched',
        autoMatched: true,
        needsReview: !override?.fundingSource,
        note: override?.fundingSource
          ? 'This grocery row is mapped to Food with a confirmed funding source.'
          : 'This grocery row is mapped to Food, but the funding source still needs confirmation.',
      }
    }

    return {
      type: 'expense' as RevolutImportType,
      confidence: 'medium' as RevolutImportConfidence,
      resolution: 'mapped-missing-category' as RevolutImportResolution,
      suggestedCategoryName: 'Food',
      fundingSource: 'none' as RevolutFundingSource,
      badge: 'MISSING',
      statusLabel: 'Food category missing',
      autoMatched: false,
      needsReview: true,
      note: 'The import suggests Food, but that dashboard category does not exist yet.',
    }
  }

  return {
    type: 'review' as RevolutImportType,
    confidence: 'undefined' as RevolutImportConfidence,
    resolution: 'needs-review' as RevolutImportResolution,
    fundingSource: 'none' as RevolutFundingSource,
    badge: 'REVIEW',
    statusLabel: 'Needs manual tag',
    autoMatched: false,
    needsReview: true,
    note: 'The system could not safely classify this row. Tag it before treating it as spend.',
  }
}

export const classifyRevolutImport = (
  state: StoredRevolutImportState,
  categories: BudgetCategory[],
): ClassifiedRevolutImportAnalysis => {
  const overrides = state.overrides ?? {}
  const appliedRows = state.appliedRows ?? {} // ADDED THIS
  const foodCategory = findFoodCategory(categories)
  const foodFundAllocated = foodCategory?.allocated ?? 0
  const foodFundSpent = foodCategory?.spent ?? 0
  let availableFoodFund = Math.max(foodFundAllocated - foodFundSpent, 0)

  const rows = state.summary.rows.map((row) => {
    const override = overrides[row.id]
    const appliedRecord = appliedRows[row.id] // ADDED THIS
    const base = createBaseClassification(row, categories, override)
    let fundingSource = base.fundingSource
    let confidence = base.confidence
    let needsReview = base.needsReview
    let note = base.note

    if (base.type === 'expense' && base.categoryName && FOOD_CATEGORY_MATCHER.test(base.categoryName)) {
      if (override?.fundingSource && override.fundingSource !== 'none') {
        fundingSource = override.fundingSource
        confidence = 'high'
        needsReview = false
        note = `Food transaction confirmed against ${getFundingSourceLabel(fundingSource)}.`
      } else if (availableFoodFund >= Math.abs(row.amount)) {
        fundingSource = 'food-fund'
      } else {
        fundingSource = 'lommepenger'
      }

      // CHANGED THIS: only deduct from preview pool if row is not yet applied
      if (fundingSource === 'food-fund' && appliedRecord?.status !== 'applied') {
        availableFoodFund = Math.max(availableFoodFund - Math.abs(row.amount), 0)
      }
    }

    return {
      ...row,
      classification: {
        ...base,
        confidence,
        fundingSource,
        fundingSourceLabel: getFundingSourceLabel(fundingSource),
        needsReview,
        note,
        appliedStatus: appliedRecord?.status, // ADDED THIS
      },
    }
  })

  const groups: ClassifiedRevolutImportGroups = {
    needsReview: [],
    missingCategories: [],
    transfers: [],
    mappedExpenses: [],
    mappedIncome: [],
    ignored: [],
  }

  rows.forEach((row) => {
    if (row.classification.type === 'ignore') {
      groups.ignored.push(row)
      return
    }

    if (row.classification.resolution === 'mapped-missing-category') {
      groups.missingCategories.push(row)
      return
    }

    if (row.classification.needsReview) {
      groups.needsReview.push(row)
      return
    }

    if (row.classification.type === 'transfer') {
      groups.transfers.push(row)
      return
    }

    if (row.classification.type === 'income') {
      groups.mappedIncome.push(row)
      return
    }

    if (row.classification.type === 'expense') {
      groups.mappedExpenses.push(row)
    }
  })

  const autoMatchedCount = rows.filter((row) => row.classification.autoMatched && !row.classification.needsReview).length
  const reviewCount = groups.needsReview.length + groups.missingCategories.length
  // CHANGED THIS: skip applied rows from preview projection — they're already in live spent
  const projectedFoodFundRemaining = rows.reduce((remaining, row) => {
    if (row.classification.fundingSource !== 'food-fund' || row.classification.appliedStatus === 'applied') {
      return remaining
    }

    return Math.max(remaining - Math.abs(row.amount), 0)
  }, Math.max(foodFundAllocated - foodFundSpent, 0))
  const projectedFoodFromPocket = rows.reduce((sum, row) => {
    if (row.classification.fundingSource !== 'lommepenger' || row.classification.appliedStatus === 'applied') {
      return sum
    }

    return sum + Math.abs(row.amount)
  }, 0)

  return {
    rows,
    groups,
    autoMatchedCount,
    reviewCount,
    transferCount: groups.transfers.length,
    missingCategoryCount: groups.missingCategories.length,
    foodFundAllocated,
    foodFundSpent,
    foodFundRemaining: Math.max(foodFundAllocated - foodFundSpent, 0),
    projectedFoodFundRemaining,
    projectedFoodFromPocket,
  }
}