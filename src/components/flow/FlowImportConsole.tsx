import type { ChangeEvent } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { BudgetCategory } from '@/types/budget'
import type { BudgetTransaction } from '@/types/transaction' // ADDED THIS
import { formatFlowCurrency } from '@/pages/flow.utils'
import { ConfirmModal } from '@/components/ConfirmModal'
import {
  classifyRevolutImport,
  type ClassifiedRevolutImportRow,
  type RevolutFundingSource,
  type RevolutImportOverride,
  type RevolutImportType,
} from '@/components/flow/revolutImportClassifier'
import {
  getRowFingerprint, // ADDED THIS
  parseRevolutImportFile,
  type AppliedRowRecord, // ADDED THIS
  type StoredRevolutImportState,
} from '@/components/flow/revolutCsv'
import { deleteAppliedImportRow, executeImportRow } from '@/components/flow/revolutImportExecutor' // ADDED THIS

const FOOD_CATEGORY_NAME_MATCHER = /^(food|mat)$/i

type FlowImportConsoleProps = {
  categories: BudgetCategory[]
  value: StoredRevolutImportState
  onChange: (nextValue: StoredRevolutImportState) => void
  onTransactionCreated?: (transaction: BudgetTransaction) => void // ADDED THIS
  onTransactionRemoved?: (transactionId: string) => void
  layout?: 'panel' | 'modal'
}

export const FlowImportConsole = ({
  categories,
  value,
  onChange,
  onTransactionCreated,
  onTransactionRemoved,
  layout = 'panel',
}: FlowImportConsoleProps) => { // CHANGED THIS
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [applyingRowId, setApplyingRowId] = useState<string | null>(null) // ADDED THIS
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null)
  const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(null)
  const [draftOverrides, setDraftOverrides] = useState<Record<string, RevolutImportOverride>>(
    () => value.overrides ?? {},
  )
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const importAnalysis = useMemo(() => classifyRevolutImport(value, categories), [categories, value])
  const hasFoodCategory = useMemo(
    () => categories.some((category) => category.type === 'budget' && FOOD_CATEGORY_NAME_MATCHER.test(category.name.trim())),
    [categories],
  )
  const budgetCategories = useMemo(
    () => categories.filter((category) => category.type === 'budget'),
    [categories],
  )
  const liveRows = useMemo(
    () => importAnalysis.rows.filter((row) => row.classification.appliedStatus === 'applied'),
    [importAnalysis.rows],
  )
  const pendingGroups = useMemo(
    () => ({
      needsReview: importAnalysis.groups.needsReview.filter((row) => row.classification.appliedStatus !== 'applied'),
      missingCategories: importAnalysis.groups.missingCategories.filter((row) => row.classification.appliedStatus !== 'applied'),
      transfers: importAnalysis.groups.transfers.filter((row) => row.classification.appliedStatus !== 'applied'),
      mappedExpenses: importAnalysis.groups.mappedExpenses.filter((row) => row.classification.appliedStatus !== 'applied'),
      mappedIncome: importAnalysis.groups.mappedIncome.filter((row) => row.classification.appliedStatus !== 'applied'),
    }),
    [importAnalysis.groups],
  )
  const pendingAutoMatchedCount = useMemo(
    () =>
      Object.values(pendingGroups)
        .flat()
        .filter((row) => row.classification.autoMatched && !row.classification.needsReview).length,
    [pendingGroups],
  )
  const pendingReviewCount = pendingGroups.needsReview.length + pendingGroups.missingCategories.length
  const liveCategoryAllocations = useMemo(() => {
    const allocations = new Map<string, { categoryName: string; amount: number; rowCount: number }>()

    liveRows.forEach((row) => {
      if (row.classification.type !== 'expense' || !row.classification.categoryName) {
        return
      }

      const key = row.classification.categoryId ?? row.classification.categoryName
      const current = allocations.get(key)

      if (current) {
        current.amount += Math.abs(row.amount)
        current.rowCount += 1
        return
      }

      allocations.set(key, {
        categoryName: row.classification.categoryName,
        amount: Math.abs(row.amount),
        rowCount: 1,
      })
    })

    return Array.from(allocations.values()).sort((left, right) => right.amount - left.amount)
  }, [liveRows])

  useEffect(() => {
    setDraftOverrides(value.overrides ?? {})
  }, [value.fileName, value.summary.rows, value.overrides])

  const cleanOverride = (override: RevolutImportOverride | undefined) => {
    if (!override) {
      return undefined
    }

    const nextOverride: RevolutImportOverride = {}

    if (override.type !== undefined) {
      nextOverride.type = override.type
    }

    if (override.categoryId) {
      nextOverride.categoryId = override.categoryId
    }

    if (override.fundingSource && override.fundingSource !== 'none') {
      nextOverride.fundingSource = override.fundingSource
    }

    return Object.keys(nextOverride).length > 0 ? nextOverride : undefined
  }

  const areOverridesEqual = (
    left: RevolutImportOverride | undefined,
    right: RevolutImportOverride | undefined,
  ) => {
    const normalizedLeft = cleanOverride(left)
    const normalizedRight = cleanOverride(right)

    return JSON.stringify(normalizedLeft ?? null) === JSON.stringify(normalizedRight ?? null)
  }

  const handleChooseFile = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const parsed = await parseRevolutImportFile(file)
      onChange({
        fileName: file.name,
        summary: parsed,
        overrides: {},
      })
    } catch {
      setError('Could not read this file. Use a fresh Revolut CSV or Excel export.')
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  const handleDraftOverrideChange = (rowId: string, nextOverride: Partial<RevolutImportOverride>) => {
    setDraftOverrides((currentDrafts) => {
      const currentOverride = currentDrafts[rowId] ?? value.overrides?.[rowId] ?? {}

      return {
        ...currentDrafts,
        [rowId]: {
          ...currentOverride,
          ...nextOverride,
        },
      }
    })
  }

  const persistOverride = (rowId: string) => {
    const nextDraft = cleanOverride(draftOverrides[rowId])
    const nextOverrides = { ...(value.overrides ?? {}) }

    if (nextDraft) {
      nextOverrides[rowId] = nextDraft
    } else {
      delete nextOverrides[rowId]
    }

    const nextValue = {
      ...value,
      overrides: nextOverrides,
    }

    onChange(nextValue)
    return nextValue
  }

  const handleResetOverride = (rowId: string) => {
    const appliedOverride = cleanOverride(value.overrides?.[rowId])

    setDraftOverrides((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }

      if (appliedOverride) {
        nextDrafts[rowId] = appliedOverride
      } else {
        delete nextDrafts[rowId]
      }

      return nextDrafts
    })

    if (!appliedOverride && value.overrides?.[rowId]) {
      const nextOverrides = { ...(value.overrides ?? {}) }
      delete nextOverrides[rowId]
      onChange({
        ...value,
        overrides: nextOverrides,
      })
    }
  }

  const handleClearAppliedOverride = (rowId: string) => {
    const nextOverrides = { ...(value.overrides ?? {}) }
    delete nextOverrides[rowId]

    setDraftOverrides((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }
      delete nextDrafts[rowId]
      return nextDrafts
    })

    onChange({
      ...value,
      overrides: nextOverrides,
    })
  }

  // ADDED THIS: Apply a confirmed row to the backend
  const handleApplyRow = async (
    row: ClassifiedRevolutImportRow,
    stateSnapshot: StoredRevolutImportState = value,
  ) => {
    const fingerprint = getRowFingerprint(row, stateSnapshot.fileName)

    // Duplicate check against already-applied fingerprints
    const existingApplied = stateSnapshot.appliedRows ?? {}
    const isDuplicate = Object.values(existingApplied).some(
      (record) => record.fingerprint === fingerprint && record.status === 'applied',
    )

    if (isDuplicate) {
      const nextApplied: Record<string, AppliedRowRecord> = {
        ...existingApplied,
        [row.id]: { status: 'duplicate-blocked', fingerprint, errorMessage: 'Duplicate row' },
      }
      onChange({ ...stateSnapshot, appliedRows: nextApplied })
      return
    }

    setApplyingRowId(row.id)

    const result = await executeImportRow(row)

    const record: AppliedRowRecord = result.ok
      ? {
          status: 'applied',
          fingerprint,
          appliedAt: new Date().toISOString(),
          transactionId: result.transaction?.id,
          appliedTargetKind: result.appliedTargetKind,
          appliedTargetId: result.appliedTargetId,
        }
      : {
          status: 'failed',
          fingerprint,
          errorMessage: result.error,
        }

    onChange({
      ...stateSnapshot,
      appliedRows: { ...existingApplied, [row.id]: record },
    })

    if (result.ok && result.transaction && onTransactionCreated) {
      onTransactionCreated(result.transaction)
    }

    setApplyingRowId(null)
  }

  const handleDeleteAppliedRow = async (rowId: string) => {
    const record = value.appliedRows?.[rowId]
    const row = importAnalysis.rows.find((candidate) => candidate.id === rowId)

    if (!record || record.status !== 'applied' || !row) {
      setPendingDeleteRowId(null)
      return
    }

    setDeletingRowId(rowId)

    const result = await deleteAppliedImportRow(row, record)

    if (!result.ok) {
      setError(result.error)
      setDeletingRowId(null)
      setPendingDeleteRowId(null)
      return
    }

    if (record.transactionId && onTransactionRemoved) {
      onTransactionRemoved(record.transactionId)
    }

    const nextAppliedRows = { ...(value.appliedRows ?? {}) }
    delete nextAppliedRows[rowId]

    onChange({
      ...value,
      appliedRows: nextAppliedRows,
    })

    setDeletingRowId(null)
    setPendingDeleteRowId(null)
  }

  const handleConfirmRow = async (row: ClassifiedRevolutImportRow) => {
    const nextValue = persistOverride(row.id)
    const nextAnalysis = classifyRevolutImport(nextValue, categories)
    const nextRow = nextAnalysis.rows.find((candidate) => candidate.id === row.id)

    if (!nextRow) {
      return
    }

    if (
      nextRow.classification.appliedStatus === 'applied' ||
      nextRow.classification.appliedStatus === 'duplicate-blocked' ||
      nextRow.classification.type === 'review' ||
      nextRow.classification.needsReview
    ) {
      return
    }

    await handleApplyRow(nextRow, nextValue)
  }

  const renderRow = (row: ClassifiedRevolutImportRow) => {
    const appliedOverride = value.overrides?.[row.id]
    const draftOverride = draftOverrides[row.id] ?? appliedOverride
    const selectedType = draftOverride?.type ?? row.classification.type
    const selectedCategoryId = draftOverride?.categoryId ?? row.classification.categoryId ?? ''
    const selectedFundingSource = draftOverride?.fundingSource ?? row.classification.fundingSource
    const selectedCategoryName =
      budgetCategories.find((category) => category.id === selectedCategoryId)?.name ?? row.classification.categoryName ?? ''
    const canChooseFunding = selectedType === 'expense' && FOOD_CATEGORY_NAME_MATCHER.test(selectedCategoryName)
    const hasPendingChanges = !areOverridesEqual(draftOverride, appliedOverride)
    const hasAppliedOverride = Boolean(cleanOverride(appliedOverride))
    const rowAppliedStatus = row.classification.appliedStatus // ADDED THIS
    const isApplied = rowAppliedStatus === 'applied' // ADDED THIS
    const isApplying = applyingRowId === row.id // ADDED THIS
    const canApply =
      !isApplied &&
      rowAppliedStatus !== 'duplicate-blocked' &&
      !isApplying &&
      selectedType !== 'review' &&
      (selectedType !== 'expense' || Boolean(selectedCategoryId))

    return (
      <div key={row.id} className={`flow-import__review-row ${isApplied ? 'flow-import__review-row--applied' : ''}`}>
        <div className="flow-import__row">
          <div>
            <div className="flow-import__row-merchant">{row.description}</div>
            <div className="flow-import__row-date">
              {row.date} • {row.currency}
            </div>
          </div>

          <div
            className={`flow-import__row-amount ${row.amount < 0 ? 'flow-import__row-amount--expense' : 'flow-import__row-amount--income'}`}
          >
            {row.amount < 0 ? '-' : '+'}
            {formatFlowCurrency(Math.abs(row.amount)).replace('KR ', '')}
          </div>
        </div>

        <div className="flow-import__badges">
          <span className="flow-import__badge">{row.classification.badge}</span>
          <span className="flow-import__badge flow-import__badge--muted">
            {row.classification.confidence.toUpperCase()} CONFIDENCE
          </span>
          {row.classification.targetLabel ? <span className="flow-import__badge">{row.classification.targetLabel}</span> : null}
          {row.classification.categoryName ? <span className="flow-import__badge">{row.classification.categoryName}</span> : null}
          {row.classification.suggestedCategoryName ? (
            <span className="flow-import__badge flow-import__badge--warn">
              MISSING: {row.classification.suggestedCategoryName}
            </span>
          ) : null}
          {row.classification.fundingSource !== 'none' ? (
            <span className="flow-import__badge flow-import__badge--blue">{row.classification.fundingSourceLabel}</span>
          ) : null}
          {isApplied ? ( // ADDED THIS
            <span className="flow-import__badge flow-import__badge--applied">APPLIED</span>
          ) : null}
          {rowAppliedStatus === 'failed' ? ( // ADDED THIS
            <span className="flow-import__badge flow-import__badge--failed">FAILED</span>
          ) : null}
          {rowAppliedStatus === 'duplicate-blocked' ? ( // ADDED THIS
            <span className="flow-import__badge flow-import__badge--duplicate">DUPLICATE</span>
          ) : null}
        </div>

        <div className="flow-import__row-note">{row.classification.note}</div>

        <div className="flow-import__controls">
          <label className="flow-import__control">
            <span>Type</span>
            <select
              className="flow-import__select"
              aria-label={`Set import type for ${row.description}`}
              value={selectedType}
              onChange={(event) =>
                handleDraftOverrideChange(row.id, {
                  type: event.target.value as RevolutImportType,
                  categoryId: event.target.value === 'expense' ? selectedCategoryId : undefined,
                  fundingSource: event.target.value === 'expense' ? selectedFundingSource : undefined,
                })
              }
            >
              <option value="review">Review</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
              <option value="income">Income</option>
              <option value="ignore">Ignore</option>
            </select>
          </label>

          {selectedType === 'expense' ? (
            <label className="flow-import__control">
              <span>Category</span>
              <select
                className="flow-import__select"
                aria-label={`Set category for ${row.description}`}
                value={selectedCategoryId}
                onChange={(event) =>
                  handleDraftOverrideChange(row.id, {
                    type: 'expense',
                    categoryId: event.target.value || undefined,
                  })
                }
              >
                <option value="">Choose category</option>
                {budgetCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {canChooseFunding ? (
            <label className="flow-import__control">
              <span>Funding</span>
              <select
                className="flow-import__select"
                aria-label={`Set funding source for ${row.description}`}
                value={selectedFundingSource}
                onChange={(event) =>
                  handleDraftOverrideChange(row.id, {
                    type: 'expense',
                    fundingSource: event.target.value as RevolutFundingSource,
                  })
                }
              >
                <option value="food-fund">Food fund</option>
                <option value="lommepenger">Lommepenger</option>
              </select>
            </label>
          ) : null}

          {!isApplied && rowAppliedStatus !== 'duplicate-blocked' ? (
            <button
              type="button"
              className="flow-import__apply"
              disabled={!canApply}
              onClick={() => void handleConfirmRow(row)}
            >
              {isApplying ? 'Applying...' : 'Apply live'}
            </button>
          ) : null}

          {hasPendingChanges ? (
            <button
              type="button"
              className="flow-import__reset"
              onClick={() => handleResetOverride(row.id)}
            >
              Cancel
            </button>
          ) : null}

          {hasAppliedOverride && !hasPendingChanges ? (
            <button
              type="button"
              className="flow-import__reset"
              onClick={() => handleClearAppliedOverride(row.id)}
            >
              Reset
            </button>
          ) : null}

          {rowAppliedStatus === 'failed' ? <span className="flow-import__status flow-import__status--error">Last apply failed. Fix the tag and apply again.</span> : null}
        </div>
      </div>
    )
  }

  const renderPendingQueue = () => {
    if (value.summary.rows.length === 0) {
      return <div className="flow-import__empty">INGEN DATA - IMPORTER FIL</div>
    }

    const hasPendingRows = Object.values(pendingGroups).some((rows) => rows.length > 0)

    if (!hasPendingRows) {
      return <div className="flow-import__empty">ALL IMPORTED ROWS ARE ALREADY LIVE IN THEIR TARGETS</div>
    }

    return (
      <>
        {renderGroup('Needs review', pendingGroups.needsReview, 'NO REVIEW QUEUE')}
        {renderGroup('Missing categories', pendingGroups.missingCategories, 'NO MISSING CATEGORIES')}
        {renderGroup('Transfers', pendingGroups.transfers, 'NO INTERNAL TRANSFERS')}
        {renderGroup('Mapped expenses', pendingGroups.mappedExpenses, 'NO CONFIRMED EXPENSES')}
        {renderGroup('Mapped income', pendingGroups.mappedIncome, 'NO INCOME ROWS')}
      </>
    )
  }

  const renderGroup = (title: string, rows: ClassifiedRevolutImportRow[], emptyLabel?: string) => (
    <div className="flow-import__group" aria-label={title}>
      <div className="flow-import__group-header">
        <span className="flow-import__transactions-label">// {title.toUpperCase()}</span>
        <span className="flow-import__group-count">{rows.length}</span>
      </div>

      {rows.length > 0 ? (
        <div className="flow-import__list">{rows.map(renderRow)}</div>
      ) : emptyLabel ? (
        <div className="flow-import__empty">{emptyLabel}</div>
      ) : null}
    </div>
  )

  return (
    <section className={`flow-import flow-import--open ${layout === 'modal' ? 'flow-import--modal' : ''}`} aria-label="Revolut import console">
      <div className="flow-import__toolbar">
        <div className="flow-import__heading">
          <span className="flow-import__eyebrow">// REVOLUT BLEED //</span>
          <span className="flow-import__subtext">
            Boss node for statement review. Existing dashboard categories remain the only real card drains.
          </span>
        </div>

        <div className="flow-import__actions">
          <button type="button" className="flow-import__chip flow-import__chip--primary" onClick={handleChooseFile}>
            Import Revolut File
          </button>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel"
            className="flow-import__input"
            aria-label="Upload Revolut CSV or Excel file"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className={`flow-import__panel ${layout === 'modal' ? 'flow-import__panel--modal' : ''}`}>
        <div className="flow-import__main">
          <div className="flow-import__summary">
            <div className="flow-import__metric">
              <span className="flow-import__metric-label">TOTAL IMPORTED</span>
              <span className="flow-import__metric-value flow-import__metric-value--red">
                {formatFlowCurrency(value.summary.totalSpent)}
              </span>
            </div>

            <div className="flow-import__metric">
              <span className="flow-import__metric-label">READY TO APPLY</span>
              <span className="flow-import__metric-value">{pendingAutoMatchedCount}</span>
            </div>

            <div className="flow-import__metric">
              <span className="flow-import__metric-label">NEEDS REVIEW</span>
              <span className="flow-import__metric-value">{pendingReviewCount}</span>
            </div>

            <div className="flow-import__metric">
              <span className="flow-import__metric-label">FOOD FUND LEFT</span>
              <span className="flow-import__metric-value">
                {hasFoodCategory ? formatFlowCurrency(importAnalysis.foodFundRemaining) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flow-import__dropzone">
            <div className="flow-import__dropicon" aria-hidden="true">
              ↻
            </div>
            <div className="flow-import__droptitle">IMPORTER REVOLUT FIL</div>
            <div className="flow-import__dropnote">
              Revolut app, profil, kontoutskrift, CSV eller Excel. Tag uncertain rows before they become spend.
            </div>
            <button type="button" className="flow-import__upload-button" onClick={handleChooseFile}>
              Choose file
            </button>
            <label htmlFor={inputId} className="flow-import__input-label">
              {value.fileName || 'No file selected'}
            </label>
            {isLoading ? <div className="flow-import__status">Reading file...</div> : null}
            {error ? <div className="flow-import__status flow-import__status--error">{error}</div> : null}
          </div>

          <div className="flow-import__transactions">
            <span className="flow-import__transactions-label">// PENDING IMPORT QUEUE</span>
            {renderPendingQueue()}
          </div>
        </div>

        {layout === 'modal' ? (
          <aside className="flow-import__live-rail">
            <div className="flow-import__live-panel">
              <span className="flow-import__transactions-label">// LIVE CATEGORY FEED</span>
              {liveCategoryAllocations.length > 0 ? (
                <div className="flow-import__live-list">
                  {liveCategoryAllocations.map((allocation) => (
                    <div key={allocation.categoryName} className="flow-import__live-item">
                      <div>
                        <div className="flow-import__live-title">{allocation.categoryName}</div>
                        <div className="flow-import__live-meta">{allocation.rowCount} applied row{allocation.rowCount === 1 ? '' : 's'} now live in this category</div>
                      </div>
                      <div className="flow-import__live-amount">{formatFlowCurrency(allocation.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flow-import__empty">NO CATEGORY ALLOCATIONS ARE LIVE YET</div>
              )}
            </div>

            <div className="flow-import__live-panel">
              <span className="flow-import__transactions-label">// APPLIED ROWS</span>
              {liveRows.length > 0 ? (
                <div className="flow-import__live-list">
                  {liveRows.map((row) => (
                    <div key={row.id} className="flow-import__live-item">
                      <div>
                        <div className="flow-import__live-title">{row.description}</div>
                        <div className="flow-import__live-meta">{row.classification.categoryName ?? row.classification.targetLabel ?? 'Applied locally'}</div>
                        <div className="flow-import__badges flow-import__badges--live">
                          <span className="flow-import__badge flow-import__badge--applied">APPLIED</span>
                        </div>
                      </div>
                      <div className="flow-import__live-actions">
                        <div className="flow-import__live-amount">{formatFlowCurrency(Math.abs(row.amount))}</div>
                        <button
                          type="button"
                          className="flow-import__delete-applied"
                          aria-label={`Delete applied import for ${row.description}`}
                          disabled={deletingRowId === row.id}
                          onClick={() => setPendingDeleteRowId(row.id)}
                        >
                          {deletingRowId === row.id ? 'Deleting...' : 'Delete applied'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flow-import__empty">APPLIED ROWS WILL MOVE HERE AFTER YOU APPLY THEM</div>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingDeleteRowId)}
        title="Delete applied import"
        body="This will remove the applied import from its live target. Imported expenses delete the created transaction. Local-only applies will move back into the pending queue."
        confirmText="Delete applied"
        cancelText="Cancel"
        isConfirming={Boolean(pendingDeleteRowId && deletingRowId === pendingDeleteRowId)}
        onCancel={() => setPendingDeleteRowId(null)}
        onConfirm={() => {
          if (!pendingDeleteRowId) {
            return
          }

          void handleDeleteAppliedRow(pendingDeleteRowId)
        }}
      />
    </section>
  )
}