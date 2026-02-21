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
    <div className="hud-glass-card">
      <div className="flex items-center gap-2 mb-6">
        <span className="hud-status-dot" />
        <h3 className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--color-text-muted)] m-0">
          Expense Ledger
        </h3>
      </div>

      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {expenses.length === 0 ? (
          <div className="text-center text-[var(--color-text-muted)] py-4">
            No expenses recorded
          </div>
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
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg transition-colors hover:bg-white/10 group/row"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${colorClass} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {cleanDescription(expense.description)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-80 group-hover/row:opacity-100 transition-opacity">
                    <span className="hud-monospaced text-sm text-[var(--color-text-primary)]">
                      KR {Math.floor(expense.amount / 100)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditExpense(expense)}
                      className="text-xs px-2 py-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded hover:bg-[var(--color-accent)]/40 transition-colors"
                      aria-label={`Edit expense ${expense.id}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense.id)}
                      className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"
                      aria-label={`Delete expense ${expense.id}`}
                    >
                      🗑️
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
