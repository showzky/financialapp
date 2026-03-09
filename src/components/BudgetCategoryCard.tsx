// ADD THIS: Category card showing allocation and burn-down
import { useEffect, useState } from 'react'
import type { BudgetCategory } from '@/types/budget'
import { formatCurrency } from '@/utils/currency'

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
  const [allocatedInput, setAllocatedInput] = useState(String(category.allocated))
  const [spentInput, setSpentInput] = useState(String(category.spent))

  useEffect(() => {
    setAllocatedInput(String(category.allocated))
  }, [category.allocated])

  useEffect(() => {
    setSpentInput(String(category.spent))
  }, [category.spent])

  const commitAllocated = () => {
    const nextAllocated = Math.max(0, Number(allocatedInput) || 0)
    setAllocatedInput(String(nextAllocated))
    if (nextAllocated !== category.allocated) {
      onChangeAmounts(category.id, { allocated: nextAllocated })
    }
  }

  const commitSpent = () => {
    const nextSpent = Math.max(0, Number(spentInput) || 0)
    setSpentInput(String(nextSpent))
    if (nextSpent !== category.spent) {
      onChangeAmounts(category.id, { spent: nextSpent })
    }
  }

  const handleEnterCommit = (
    event: React.KeyboardEvent<HTMLInputElement>,
    commit: () => void,
  ) => {
    if (event.key !== 'Enter') return
    event.currentTarget.blur()
    commit()
  }

  const utilizationPct = Math.round(utilization * 100)
  const overBudget = !isFixed && category.spent > category.allocated && category.allocated > 0

  return (
    <div
      className={`category-card relative overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-[22px_24px] transition hover:-translate-y-px hover:border-[rgba(255,255,255,0.10)] ${isDeleting ? 'is-deleting' : ''}`}
    >
      {/* gold top shimmer on hover (via fixed-card::before equivalent) */}
      {isFixed ? (
        <span className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-0 transition-opacity group-hover:opacity-60" />
      ) : null}

      {isEditing && !readOnly ? (
        <button
          type="button"
          aria-label={`Delete ${category.name}`}
          onClick={() => onDelete?.(category.id)}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(255,255,255,0.10)] bg-[#18181c] text-[14px] font-bold text-[#6b6862] transition hover:border-[#c96b6b] hover:text-[#c96b6b]"
        >
          ×
        </button>
      ) : null}

      {/* Header */}
      <div className={`mb-4 flex items-center justify-between gap-3 ${isEditing ? 'pr-8' : ''}`}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b8b4ae]">
          {category.name}
        </p>
        <span className="rounded-full border border-[rgba(91,163,201,0.2)] bg-[rgba(91,163,201,0.10)] px-2.5 py-1 font-['DM_Mono',monospace] text-[10px] font-medium tracking-[0.06em] text-[#5ba3c9]">
          {isFixed ? 'Fixed' : `${utilizationPct}% used`}
        </span>
      </div>

      {/* Amount */}
      <p className="font-italiana mb-4 text-[38px] leading-none tracking-[-0.01em] text-text-primary">
        {formatCurrency(category.allocated, currencySymbol)}
      </p>

      {/* Progress bar (budget categories only) */}
      {!isFixed ? (
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-[#202026]">
          <span
            className={`block h-full rounded-full transition-[width] duration-300 ${
              overBudget
                ? 'bg-[#c96b6b] shadow-[0_0_10px_rgba(201,107,107,0.5)]'
                : utilizationPct >= 80
                  ? 'bg-[#c9a84c] shadow-[0_0_10px_rgba(201,168,76,0.5)]'
                  : 'bg-[#5ba3c9] shadow-[0_0_10px_rgba(91,163,201,0.5)]'
            }`}
            style={{ width: `${Math.min(utilizationPct, 100)}%` }}
          />
        </div>
      ) : null}

      {/* Inputs */}
      <div className={`mb-3.5 grid gap-2.5 ${isFixed ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b6862]">
            {isFixed ? 'Amount' : 'Budget'}
          </p>
          <input
            type="number"
            min={0}
            step={1}
            value={allocatedInput}
            disabled={readOnly}
            onChange={(event) => setAllocatedInput(event.target.value)}
            onBlur={commitAllocated}
            onKeyDown={(event) => handleEnterCommit(event, commitAllocated)}
            className="w-full rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] px-3 py-2.5 font-['DM_Mono',monospace] text-[13px] font-medium tracking-[0.04em] text-text-primary outline-none transition focus:border-[rgba(91,163,201,0.4)] focus:bg-[#202026]"
          />
        </div>

        {!isFixed ? (
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b6862]">
              Spent
            </p>
            <input
              type="number"
              min={0}
              step={1}
              value={spentInput}
              disabled={readOnly}
              onChange={(event) => setSpentInput(event.target.value)}
              onBlur={commitSpent}
              onKeyDown={(event) => handleEnterCommit(event, commitSpent)}
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] px-3 py-2.5 font-['DM_Mono',monospace] text-[13px] font-medium tracking-[0.04em] text-text-primary outline-none transition focus:border-[rgba(91,163,201,0.4)] focus:bg-[#202026]"
            />
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[12px] text-[#6b6862]">
        <span>
          {isFixed ? 'Amount: ' : 'Spent: '}
          {formatCurrency(isFixed ? category.allocated : category.spent, currencySymbol)}
        </span>
        <span className={overBudget ? 'font-medium text-[#c96b6b]' : remaining > 0 ? 'font-medium text-[#5ebd97]' : ''}>
          {isFixed ? 'Monthly' : `Left: ${formatCurrency(remaining, currencySymbol)}${overBudget ? ' over' : ''}`}
        </span>
      </div>
    </div>
  )
}
