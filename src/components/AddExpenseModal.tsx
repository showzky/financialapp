import React, { useState, useRef, useEffect } from 'react'
import { vacationApi } from '../services/vacationApi'
import { getHudAlertMessage } from '../services/backendClient'
import type { VacationExpense } from '../types/vacation'

const extractCustomCategoryFromDescription = (description?: string | null): string | null => {
  if (!description) return null
  const m = description.match(/^\[Custom Category:\s*(.+?)\]/)
  return m ? m[1].trim() : null
}

const CUSTOM_CATEGORY_VALUE = '__custom__'

type AddExpenseModalProps = {
  isOpen: boolean
  vacationId: string
  onClose: () => void
  onExpenseAdded: (expense: VacationExpense) => void
  expenseToEdit?: VacationExpense
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  vacationId,
  onClose,
  onExpenseAdded,
  expenseToEdit,
}) => {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hudAlert, setHudAlert] = useState('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const categoryRef = useRef<HTMLDivElement | null>(null)

  const getAmountInCents = () => Math.round(Number.parseFloat(amount || '0') * 100)
  const canSubmitExpense = () =>
    Number.isFinite(getAmountInCents()) && getAmountInCents() > 0 && category.trim().length > 0

  const canSubmitWithCategory = () => {
    if (!canSubmitExpense()) {
      return false
    }

    if (category === CUSTOM_CATEGORY_VALUE) {
      return customCategory.trim().length > 0
    }

    return true
  }

  // Prefill for edit
  React.useEffect(() => {
    if (expenseToEdit) {
      setAmount((expenseToEdit.amount / 100).toString())
      const customLabel = extractCustomCategoryFromDescription(expenseToEdit.description)
      if (customLabel) {
        setCategory(CUSTOM_CATEGORY_VALUE)
        setCustomCategory(customLabel)
        // clean up description for display (remove prefix)
        const cleanedDesc = (expenseToEdit.description || '').replace(/^\[Custom Category:\s*(.+?)\]\s*/, '')
        setDescription(cleanedDesc)
      } else {
        setCategory(expenseToEdit.category)
        setCustomCategory('')
        setDescription(expenseToEdit.description || '')
      }
    } else {
      setAmount('')
      setCategory('')
      setCustomCategory('')
      setDescription('')
    }
  }, [expenseToEdit, isOpen])

  // Close category dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!isCategoryOpen) return
      if (categoryRef.current && !categoryRef.current.contains(ev.target as Node)) {
        setIsCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [isCategoryOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmitWithCategory()) {
      setHudAlert('HUD Alert: Enter a valid category and amount greater than 0.')
      return
    }

    setIsSubmitting(true)
    setHudAlert('')
    try {
      const rawCategory = category === CUSTOM_CATEGORY_VALUE ? customCategory : category

      let expense: VacationExpense
      if (expenseToEdit) {
        expense = await vacationApi.updateExpense(vacationId, expenseToEdit.id, {
          category: rawCategory,
          amount: getAmountInCents(),
          description: description || undefined,
          date: new Date().toISOString().split('T')[0],
        })
      } else {
        expense = await vacationApi.addExpense(vacationId, {
          category: rawCategory,
          amount: getAmountInCents(),
          description: description || undefined,
          date: new Date().toISOString().split('T')[0],
          isVacation: true,
        })
      }
      onExpenseAdded(expense)
      onClose()
    } catch (error) {
      setHudAlert(getHudAlertMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-lg">
      <div className="glass-panel w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="glass-panel px-3 py-1 text-sm font-semibold text-[var(--color-text-muted)] transition-all hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Amount (KR)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)] placeholder-text-muted"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Category
            </label>
            <div ref={categoryRef} className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryOpen((s) => !s)}
                className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)] placeholder-text-muted text-left flex items-center justify-between"
                aria-haspopup="listbox"
                aria-expanded={isCategoryOpen}
              >
                <span className="truncate">
                  {category
                    ? category === CUSTOM_CATEGORY_VALUE
                      ? customCategory || 'Custom category'
                      : category.charAt(0).toUpperCase() + category.slice(1)
                    : 'Select category'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-text-muted)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              {isCategoryOpen && (
                <ul
                  role="listbox"
                  tabIndex={-1}
                  className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded shadow-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]"
                >
                  {[
                    { value: '', label: 'Select category' },
                    { value: 'flights', label: 'Flights' },
                    { value: 'food', label: 'Food' },
                    { value: 'hotel', label: 'Hotel' },
                    { value: 'miscellaneous', label: 'Miscellaneous' },
                    { value: CUSTOM_CATEGORY_VALUE, label: 'Custom category' },
                  ].map((opt) => (
                    <li
                      key={opt.value || '__none__'}
                      role="option"
                      aria-selected={category === opt.value}
                      onClick={() => {
                        setCategory(opt.value)
                        setIsCategoryOpen(false)
                        // focus custom input if selecting custom
                        if (opt.value === CUSTOM_CATEGORY_VALUE) {
                          setTimeout(() => {
                            const el = categoryRef.current?.querySelector('input') as HTMLInputElement | null
                            el?.focus()
                          }, 0)
                        }
                      }}
                      className="px-3 py-2 cursor-pointer text-[var(--color-text-primary)] hover:bg-white/10"
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {category === CUSTOM_CATEGORY_VALUE ? (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="glass-panel mt-2 w-full px-3 py-2 text-[var(--color-text-primary)] placeholder-text-muted"
                placeholder="e.g., entertainment, taxi, souvenirs"
                required
              />
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)] placeholder-text-muted"
              placeholder="Optional note"
            />
          </div>

          {hudAlert ? (
            <div className="glass-panel border border-red-400/30 px-3 py-2 text-xs text-red-200">
              {hudAlert}
            </div>
          ) : null}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="glass-panel flex-1 px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-panel flex-1 px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-white/10"
              disabled={isSubmitting || !canSubmitWithCategory()}
            >
              {isSubmitting ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
