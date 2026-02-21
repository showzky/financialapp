// ADD THIS: Category card showing allocation and burn-down
import type { BudgetCategory } from '@/types/budget'
import { formatCurrency } from '@/utils/currency'
import { NeoCard } from './NeoCard'
import { ProgressBar } from './ProgressBar'

type BudgetCategoryCardProps = {
  category: BudgetCategory
  onChangeAmounts: (id: string, updates: { allocated?: number; spent?: number }) => void
  isEditing?: boolean
  isDeleting?: boolean
  onDelete?: (id: string) => void
  currencySymbol?: string
  readOnly?: boolean
}

export const BudgetCategoryCard = ({
  category,
  onChangeAmounts,
  isEditing = false,
  isDeleting = false,
  onDelete,
  currencySymbol = 'KR',
  readOnly = false,
}: BudgetCategoryCardProps) => {
  const remaining = Math.max(category.allocated - category.spent, 0)
  const utilization =
    category.allocated === 0 ? 0 : Math.min(category.spent / category.allocated, 1)
  const isFixed = category.type === 'fixed'

  return (
    <NeoCard
      className={`category-card relative flex flex-col gap-3 p-5 ${isDeleting ? 'is-deleting' : ''}`}
    >
      {isEditing && !readOnly ? (
        <button
          type="button"
          aria-label={`Delete ${category.name}`}
          onClick={() => onDelete?.(category.id)}
          className="delete-chip absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full text-sm font-bold text-text-muted"
        >
          ×
        </button>
      ) : null}

      <div className="flex items-start justify-between">
        <div className={`space-y-1 ${isEditing ? 'pr-8' : ''}`}>
          <p className="text-sm text-text-muted">{category.name}</p>
          <p className="text-xl font-semibold text-text-primary">
            {formatCurrency(category.allocated, currencySymbol)}
          </p>
        </div>
        <span className="glass-panel px-3 py-1 text-xs font-semibold text-accent-strong">
          {isFixed ? 'Fixed amount' : `${Math.round(utilization * 100)}% used`}
        </span>
      </div>

      {!isFixed ? <ProgressBar value={category.spent} max={category.allocated} /> : null}

      <div className={`grid gap-3 ${isFixed ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
        <label className="space-y-1 text-xs text-text-muted">
          {isFixed ? 'Amount' : 'Budget'}
          <input
            type="number"
            min={0}
            step={1}
            value={category.allocated}
            disabled={readOnly}
            onChange={(event) =>
              onChangeAmounts(category.id, { allocated: Number(event.target.value) })
            }
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>

        {!isFixed ? (
          <label className="space-y-1 text-xs text-text-muted">
            Spent
            <input
              type="number"
              min={0}
              step={1}
              value={category.spent}
              disabled={readOnly}
              onChange={(event) =>
                onChangeAmounts(category.id, { spent: Number(event.target.value) })
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          {isFixed ? 'Amount:' : 'Spent:'}{' '}
          {formatCurrency(isFixed ? category.allocated : category.spent, currencySymbol)}
        </span>
        <span>
          {isFixed ? 'Type: Fixed' : `Left: ${formatCurrency(remaining, currencySymbol)}`}
        </span>
      </div>
    </NeoCard>
  )
}
