import type { AppliedImportTargetKind, BudgetTransaction } from '@/types/transaction'
import type { ClassifiedRevolutImportRow } from '@/components/flow/revolutImportClassifier'
import { transactionApi } from '@/services/transactionApi'
import { wishlistApi, type WishlistItemDto } from '@/services/wishlistApi'
import type { AppliedRowRecord } from '@/components/flow/revolutCsv'

export const REVOLUT_IMPORT_NOTE_PREFIX = '[revolut-import]' // ADDED THIS

export type ImportExecutionResult = // ADDED THIS
  | {
      ok: true
      transaction?: BudgetTransaction
      appliedTargetKind: AppliedImportTargetKind
      appliedTargetId?: string
    }
  | { ok: false; error: string }

// ADDED THIS: Route a confirmed row to the correct backend write path
export const executeImportRow = async (
  row: ClassifiedRevolutImportRow,
  wishlistTargetId?: string,
): Promise<ImportExecutionResult> => {
  const type = row.classification.type

  if (type === 'expense') {
    return executeExpenseImport(row)
  }

  if (type === 'transfer' && wishlistTargetId) {
    return executeWishlistTransferImport(row, wishlistTargetId)
  }

  // Income, ignore, and unmapped transfers are acknowledged locally
  return { ok: true, appliedTargetKind: 'local' }
}

const executeExpenseImport = async (
  row: ClassifiedRevolutImportRow,
): Promise<ImportExecutionResult> => {
  const categoryId = row.classification.categoryId

  if (!categoryId) {
    return { ok: false, error: 'No category assigned' }
  }

  try {
    const transaction = await transactionApi.create({
      categoryId,
      amount: Math.abs(row.amount),
      transactionDate: row.date,
      note: `${REVOLUT_IMPORT_NOTE_PREFIX} ${row.description}`,
    })

    return { ok: true, transaction, appliedTargetKind: 'transaction', appliedTargetId: transaction.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Write failed' }
  }
}

const executeWishlistTransferImport = async (
  row: ClassifiedRevolutImportRow,
  wishlistItemId: string,
): Promise<ImportExecutionResult> => {
  try {
    // Fetch current saved amount so we can add the transfer delta
    const items = await wishlistApi.list()
    const target = items.find((item: WishlistItemDto) => item.id === wishlistItemId)

    if (!target) {
      return { ok: false, error: 'Wishlist item not found' }
    }

    const newSavedAmount = target.savedAmount + Math.abs(row.amount)
    await wishlistApi.update(wishlistItemId, { savedAmount: newSavedAmount })

    return { ok: true, appliedTargetKind: 'wishlist', appliedTargetId: wishlistItemId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Wishlist update failed' }
  }
}

export const deleteAppliedImportRow = async (
  row: ClassifiedRevolutImportRow,
  record: AppliedRowRecord,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const targetKind = record.appliedTargetKind ?? (record.transactionId ? 'transaction' : 'local')

  try {
    if (targetKind === 'transaction') {
      const transactionId = record.appliedTargetId ?? record.transactionId

      if (!transactionId) {
        return { ok: false, error: 'Missing transaction id for delete' }
      }

      await transactionApi.remove(transactionId)
      return { ok: true }
    }

    if (targetKind === 'wishlist') {
      const wishlistItemId = record.appliedTargetId

      if (!wishlistItemId) {
        return { ok: false, error: 'Missing wishlist target for delete' }
      }

      const items = await wishlistApi.list()
      const target = items.find((item: WishlistItemDto) => item.id === wishlistItemId)

      if (!target) {
        return { ok: false, error: 'Wishlist item not found' }
      }

      await wishlistApi.update(wishlistItemId, {
        savedAmount: Math.max(0, target.savedAmount - Math.abs(row.amount)),
      })

      return { ok: true }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Delete failed' }
  }
}
