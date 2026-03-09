import React from 'react'
import type { VacationExpense } from '../types/vacation'
import { vacationApi } from '../services/vacationApi'

type ExpenseLedgerProps = {
  expenses: VacationExpense[]
  vacationId: string
  onExpenseDeleted: (id: string) => void
  onEditExpense: (expense: VacationExpense) => void
}

export const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({
  expenses,
  vacationId,
  onExpenseDeleted,
  onEditExpense,
}) => {
  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await vacationApi.deleteExpense(vacationId, expenseId)
        onExpenseDeleted(expenseId)
      } catch (error) {
        console.error('Failed to delete expense:', error)
      }
    }
  }

  const getCategoryColor = (category?: string): string => {
    const key = typeof category === 'string' ? category.toLowerCase() : ''
    switch (key) {
      case 'flights':
        return 'bg-pink-400'
      case 'food':
        return 'bg-yellow-400'
      case 'hotel':
        return 'bg-emerald-400'
      default:
        return 'bg-gray-400'
    }
  }

  const formatCategoryLabel = (category?: string): string => {
    if (!category) return ''
    return category
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ')
  }

  const extractCustomCategoryFromDescription = (
    description?: string | null,
  ): string | null => {
    if (!description) return null
    const m = description.match(/^\[Custom Category:\s*(.+?)\]/)
    return m ? m[1].trim() : null
  }

  const cleanDescription = (description?: string | null): string => {
    if (!description) return 'No description'
    return description.replace(/^\[Custom Category:\s*.+?\]\s*/, '') || 'No description'
  }

  return (
    <div className="obsidian-panel p-5 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="obsidian-dot" />
        <h3 className="obsidian-kicker m-0">Expense Ledger</h3>
      </div>

      <div className="custom-scrollbar max-h-[500px] space-y-2 overflow-y-auto pr-2">
        {expenses.length === 0 ? (
          <div className="py-4 text-center text-[#b8b4ae]">No expenses recorded</div>
        ) : (
          <ul role="list" className="space-y-2">
            {expenses.map((expense) => {
              const custom =
                expense.category === 'miscellaneous'
                  ? (extractCustomCategoryFromDescription(expense.description) ?? expense.category)
                  : expense.category

              const label = formatCategoryLabel(custom)
              const colorClass = getCategoryColor(custom)

              return (
                <li
                  key={expense.id}
                  className="obsidian-subpanel group/row flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:border-[rgba(255,255,255,0.1)]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-3 w-3 rounded-full ${colorClass} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[#f0ede8]">{label}</div>
                      <div className="truncate text-xs text-[#b8b4ae]">
                        {cleanDescription(expense.description)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-90 transition-opacity group-hover/row:opacity-100">
                    <span className="obsidian-metric text-sm text-[#f0ede8]">
                      KR {Math.floor(expense.amount / 100)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditExpense(expense)}
                      className="obsidian-button px-3 py-2 text-xs font-semibold"
                      aria-label={`Edit expense ${expense.id}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense.id)}
                      className="obsidian-button obsidian-button--danger px-3 py-2 text-xs font-semibold"
                      aria-label={`Delete expense ${expense.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
