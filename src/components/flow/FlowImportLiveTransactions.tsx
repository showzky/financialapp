import { useMemo, useState } from 'react'
import type { BudgetCategory } from '@/types/budget'
import type { BudgetTransaction } from '@/types/transaction'
import { ConfirmModal } from '@/components/ConfirmModal'
import { REVOLUT_IMPORT_NOTE_PREFIX } from '@/components/flow/revolutImportExecutor'
import type { StoredRevolutImportState } from '@/components/flow/revolutCsv'
import { formatFlowCurrency } from '@/pages/flow.utils'
import { transactionApi } from '@/services/transactionApi'

type FlowImportLiveTransactionsProps = {
  categories: BudgetCategory[]
  transactions: BudgetTransaction[]
  value: StoredRevolutImportState
  onChange: (nextValue: StoredRevolutImportState) => void
  onTransactionRemoved?: (transactionId: string) => void
}

type ImportedTransactionGroup = {
  categoryId: string
  categoryName: string
  total: number
  transactions: BudgetTransaction[]
}

const getImportedTransactionLabel = (transaction: BudgetTransaction) =>
  transaction.note?.replace(REVOLUT_IMPORT_NOTE_PREFIX, '').trim() || 'Imported transaction'

export const FlowImportLiveTransactions = ({
  categories,
  transactions,
  value,
  onChange,
  onTransactionRemoved,
}: FlowImportLiveTransactionsProps) => {
  const [pendingDeleteTransactionId, setPendingDeleteTransactionId] = useState<string | null>(null)
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const importedTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.note?.startsWith(REVOLUT_IMPORT_NOTE_PREFIX))
        .sort((left, right) => {
          const leftKey = `${left.transactionDate}-${left.createdAt}`
          const rightKey = `${right.transactionDate}-${right.createdAt}`
          return rightKey.localeCompare(leftKey)
        }),
    [transactions],
  )

  const groupedTransactions = useMemo<ImportedTransactionGroup[]>(() => {
    const categoriesById = new Map(categories.map((category) => [category.id, category]))
    const groups = new Map<string, ImportedTransactionGroup>()

    importedTransactions.forEach((transaction) => {
      const category = categoriesById.get(transaction.categoryId)
      const categoryName = category?.name ?? 'Unknown node'
      const current = groups.get(transaction.categoryId)

      if (current) {
        current.total += transaction.amount
        current.transactions.push(transaction)
        return
      }

      groups.set(transaction.categoryId, {
        categoryId: transaction.categoryId,
        categoryName,
        total: transaction.amount,
        transactions: [transaction],
      })
    })

    return Array.from(groups.values()).sort((left, right) => right.total - left.total)
  }, [categories, importedTransactions])

  const pendingDeleteTransaction = useMemo(
    () => importedTransactions.find((transaction) => transaction.id === pendingDeleteTransactionId) ?? null,
    [importedTransactions, pendingDeleteTransactionId],
  )

  const handleDeleteTransaction = async (transactionId: string) => {
    setDeletingTransactionId(transactionId)
    setError('')

    try {
      await transactionApi.remove(transactionId)
      onTransactionRemoved?.(transactionId)

      const nextAppliedRows = Object.fromEntries(
        Object.entries(value.appliedRows ?? {}).filter(([, record]) => {
          const targetId = record.appliedTargetId ?? record.transactionId
          return targetId !== transactionId
        }),
      )

      onChange({
        ...value,
        appliedRows: nextAppliedRows,
      })

      setPendingDeleteTransactionId(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete imported transaction.')
    } finally {
      setDeletingTransactionId(null)
    }
  }

  return (
    <section className="flow-import-ledger" aria-label="Imported transaction cleanup">
      <div className="flow-import-ledger__summary">
        <div className="flow-import-ledger__metric">
          <span className="flow-import-ledger__metric-label">LIVE IMPORTED TOTAL</span>
          <span className="flow-import-ledger__metric-value">
            {formatFlowCurrency(importedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0))}
          </span>
        </div>

        <div className="flow-import-ledger__metric">
          <span className="flow-import-ledger__metric-label">AFFECTED NODES</span>
          <span className="flow-import-ledger__metric-value">{groupedTransactions.length}</span>
        </div>

        <div className="flow-import-ledger__metric">
          <span className="flow-import-ledger__metric-label">LIVE IMPORT ROWS</span>
          <span className="flow-import-ledger__metric-value">{importedTransactions.length}</span>
        </div>
      </div>

      {error ? <div className="flow-import-ledger__status flow-import-ledger__status--error">{error}</div> : null}

      {groupedTransactions.length > 0 ? (
        <div className="flow-import-ledger__groups">
          {groupedTransactions.map((group) => (
            <section
              key={group.categoryId}
              className="flow-import-ledger__group"
              aria-label={`Imported transactions for ${group.categoryName}`}
            >
              <div className="flow-import-ledger__group-header">
                <div>
                  <div className="flow-import-ledger__group-title">{group.categoryName}</div>
                  <div className="flow-import-ledger__group-meta">
                    {group.transactions.length} imported transaction{group.transactions.length === 1 ? '' : 's'} live in this node
                  </div>
                </div>

                <div className="flow-import-ledger__group-total">{formatFlowCurrency(group.total)}</div>
              </div>

              <div className="flow-import-ledger__list">
                {group.transactions.map((transaction) => (
                  <div key={transaction.id} className="flow-import-ledger__item">
                    <div>
                      <div className="flow-import-ledger__item-title">{getImportedTransactionLabel(transaction)}</div>
                      <div className="flow-import-ledger__item-meta">{transaction.transactionDate}</div>
                    </div>

                    <div className="flow-import-ledger__item-actions">
                      <div className="flow-import-ledger__item-amount">{formatFlowCurrency(transaction.amount)}</div>
                      <button
                        type="button"
                        className="flow-import-ledger__delete"
                        aria-label={`Delete imported transaction ${getImportedTransactionLabel(transaction)}`}
                        disabled={deletingTransactionId === transaction.id}
                        onClick={() => setPendingDeleteTransactionId(transaction.id)}
                      >
                        {deletingTransactionId === transaction.id ? 'Deleting...' : 'Remove live transaction'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flow-import-ledger__empty">
          NO LIVE IMPORTED TRANSACTIONS YET. APPLY A ROW FROM THE QUEUE TO MAKE IT APPEAR HERE.
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDeleteTransaction)}
        title="Remove live imported transaction"
        body="This deletes the real imported transaction from the affected node and removes any matching applied import marker in the current import session."
        confirmText="Remove transaction"
        cancelText="Cancel"
        isConfirming={Boolean(pendingDeleteTransaction && deletingTransactionId === pendingDeleteTransaction.id)}
        onCancel={() => setPendingDeleteTransactionId(null)}
        onConfirm={() => {
          if (!pendingDeleteTransaction) {
            return
          }

          void handleDeleteTransaction(pendingDeleteTransaction.id)
        }}
      />
    </section>
  )
}