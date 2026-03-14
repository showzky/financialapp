import React, { useState, useRef, useEffect } from 'react'
import { vacationApi } from '../services/vacationApi'
import { getHudAlertMessage } from '../services/backendClient'
import type { VacationExpense } from '../types/vacation'
import { cleanVacationDescription } from '../utils/vacationPresentation'

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

const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6862]'
const fieldClass = 'obsidian-field w-full px-4 py-[14px] text-sm tracking-[0.01em]'

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
  const [date, setDate] = useState('')
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

  React.useEffect(() => {
    if (expenseToEdit) {
      setAmount((expenseToEdit.amount / 100).toString())
      const customLabel = extractCustomCategoryFromDescription(expenseToEdit.description)
      if (customLabel) {
        setCategory(CUSTOM_CATEGORY_VALUE)
        setCustomCategory(customLabel)
        setDescription(cleanVacationDescription(expenseToEdit.description))
      } else {
        setCategory(expenseToEdit.category)
        setCustomCategory('')
        setDescription(expenseToEdit.description || '')
      }
      setDate(expenseToEdit.date)
    } else {
      setAmount('')
      setCategory('')
      setCustomCategory('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [expenseToEdit, isOpen])

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
          date,
        })
      } else {
        expense = await vacationApi.addExpense(vacationId, {
          category: rawCategory,
          amount: getAmountInCents(),
          description: description || undefined,
          date,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(0,0,0,0.72)] p-3 backdrop-blur-md sm:p-4">
      <div className="grid min-h-full place-items-start sm:place-items-center">
        <div className="vacation-panel relative w-full max-w-md p-4 shadow-[0_32px_80px_rgba(0,0,0,0.6)] sm:p-5">
          <div className="pointer-events-none absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-50" />
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a84c]/75">
                Vacation
              </p>
              <h2 className="font-italiana text-[32px] leading-none tracking-[-0.01em] text-[#f0ede8]">
                {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] text-base leading-none text-[#6b6862] transition-all duration-200 hover:border-[rgba(255,255,255,0.18)] hover:bg-[#202026] hover:text-[#f0ede8]"
              aria-label="Close add expense modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Amount (KR)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={fieldClass}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <div ref={categoryRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen((s) => !s)}
                  className={`${fieldClass} flex items-center justify-between text-left`}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6b6862]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                  </svg>
                </button>

                {isCategoryOpen && (
                  <ul
                    role="listbox"
                    tabIndex={-1}
                    className="obsidian-subpanel absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-[16px] border border-[rgba(255,255,255,0.10)] bg-[#111114] py-1 shadow-lg"
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
                          if (opt.value === CUSTOM_CATEGORY_VALUE) {
                            setTimeout(() => {
                              const el = categoryRef.current?.querySelector('input') as HTMLInputElement | null
                              el?.focus()
                            }, 0)
                          }
                        }}
                        className="cursor-pointer px-4 py-2 text-[#f0ede8] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
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
                  className={`${fieldClass} mt-2`}
                  placeholder="e.g., entertainment, taxi, souvenirs"
                  required
                />
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldClass}
                placeholder="Optional note"
              />
            </div>

            {hudAlert ? (
              <div className="rounded-[1rem] border border-[rgba(201,107,107,0.28)] bg-[rgba(201,107,107,0.08)] px-3 py-2 text-xs text-[#f1c3c3]">
                {hudAlert}
              </div>
            ) : null}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="vacation-action flex-1 px-4 py-3 text-sm font-semibold"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="vacation-action vacation-action--gold flex-1 px-4 py-3 text-sm font-semibold"
                disabled={isSubmitting || !canSubmitWithCategory()}
              >
                {isSubmitting ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
