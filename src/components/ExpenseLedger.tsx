import React, { useMemo, useState } from 'react'
import { ConfirmModal } from './ConfirmModal'
import type { VacationExpense } from '../types/vacation'
import { vacationApi } from '../services/vacationApi'
import {
  cleanVacationDescription,
  formatVacationCategoryLabel,
  formatVacationCurrency,
  getVacationCategoryColor,
  getVacationExpenseDisplayCategory,
} from '../utils/vacationPresentation'

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
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [expensePendingDelete, setExpensePendingDelete] = useState<VacationExpense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const categories = useMemo(() => {
    return ['all', ...new Set(expenses.map((expense) => getVacationExpenseDisplayCategory(expense)))]
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return expenses.filter((expense) => {
      const displayCategory = getVacationExpenseDisplayCategory(expense)
      const description = cleanVacationDescription(expense.description).toLowerCase()
      const matchesCategory = activeCategory === 'all' || displayCategory === activeCategory
      const matchesSearch =
        normalizedSearch.length === 0 ||
        displayCategory.toLowerCase().includes(normalizedSearch) ||
        description.includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, expenses, search])

  const handleDelete = async () => {
    if (!expensePendingDelete) {
      return
    }

    try {
      setIsDeleting(true)
      await vacationApi.deleteExpense(vacationId, expensePendingDelete.id)
      onExpenseDeleted(expensePendingDelete.id)
      setExpensePendingDelete(null)
    } catch (error) {
      console.error('Failed to delete expense:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="vacation-panel p-6 sm:p-7">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="vacation-kicker mb-2">Expense Ledger</p>
            <h2 className="font-italiana text-[2rem] leading-none tracking-[-0.02em] text-[#f0ede8] sm:text-[2.35rem]">
              Activity Feed
            </h2>
          </div>
          <div className="text-sm text-[#b8b4ae]">
            {filteredExpenses.length} entries · {formatVacationCurrency(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
          </div>
        </div>

        <div className="mb-5 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="vacation-field px-4 py-3 text-sm"
            placeholder="Search by category or note"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = activeCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                    isActive
                      ? 'border-[rgba(201,168,76,0.24)] bg-[rgba(201,168,76,0.10)] text-[#e2c06a]'
                      : 'border-[rgba(255,255,255,0.08)] bg-[#18181c] text-[#6b6862]'
                  }`}
                >
                  {category === 'all' ? 'All' : formatVacationCategoryLabel(category)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="custom-scrollbar max-h-[720px] space-y-3 overflow-y-auto pr-1">
          {filteredExpenses.length === 0 ? (
            <div className="rounded-[1.1rem] border border-dashed border-[rgba(255,255,255,0.08)] px-5 py-10 text-center text-sm text-[#6b6862]">
              No ledger entries match the current filters.
            </div>
          ) : (
            <ul role="list" className="space-y-3">
              {filteredExpenses.map((expense) => {
                const displayCategory = getVacationExpenseDisplayCategory(expense)
                const cleanedDescription = cleanVacationDescription(expense.description) || 'No description'
                const categoryColor = getVacationCategoryColor(displayCategory)

                return (
                  <li
                    key={expense.id}
                    className="rounded-[1.15rem] border border-[rgba(255,255,255,0.06)] bg-[#18181c] px-4 py-4 transition-colors hover:border-[rgba(255,255,255,0.12)]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className="mt-1 h-3 w-3 flex-none rounded-full"
                          style={{ backgroundColor: categoryColor, boxShadow: `0 0 14px ${categoryColor}55` }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[#f0ede8]">
                              {formatVacationCategoryLabel(displayCategory)}
                            </span>
                            <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-[#6b6862]">
                              {expense.date}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#b8b4ae]">{cleanedDescription}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <span className="vacation-metric mr-2 text-base text-[#f0ede8]">
                          {formatVacationCurrency(expense.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEditExpense(expense)}
                          className="vacation-action px-3 py-2 text-xs font-semibold"
                          aria-label={`Edit expense ${expense.id}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpensePendingDelete(expense)}
                          className="vacation-action vacation-action--danger px-3 py-2 text-xs font-semibold"
                          aria-label={`Delete expense ${expense.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={expensePendingDelete !== null}
        title="Delete expense"
        body={
          expensePendingDelete
            ? `Remove ${formatVacationCategoryLabel(getVacationExpenseDisplayCategory(expensePendingDelete))} from the ledger?`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          void handleDelete()
        }}
        onCancel={() => {
          if (!isDeleting) {
            setExpensePendingDelete(null)
          }
        }}
        isConfirming={isDeleting}
      />
    </>
  )
}
