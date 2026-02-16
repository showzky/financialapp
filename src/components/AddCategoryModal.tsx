// ADD THIS: Modal for adding a new budget category
import { useState, type FormEvent } from 'react'
import type { BudgetCategoryType } from '@/types/budget'

type AddCategoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, type: BudgetCategoryType) => void
  defaultType?: BudgetCategoryType
}

export const AddCategoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'budget',
}: AddCategoryModalProps) => {
  const [categoryName, setCategoryName] = useState('') // ADD THIS: local input state
  const [categoryType, setCategoryType] = useState<BudgetCategoryType>(defaultType) // ADD THIS: type selector

  if (!isOpen) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // ADD THIS: submit modal form
    event.preventDefault()
    const trimmedName = categoryName.trim()
    if (!trimmedName) return

    onSubmit(trimmedName, categoryType)
    setCategoryName('')
    setCategoryType(defaultType)
    onClose()
  }

  const handleClose = () => {
    // ADD THIS: reset field when closing
    setCategoryName('')
    setCategoryType(defaultType)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a44]/25 p-4 backdrop-blur-sm">
      <div className="neo-card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Add category</h2>
          <button
            type="button"
            onClick={handleClose}
            className="neo-card neo-pressable px-3 py-1 text-sm font-semibold text-text-muted"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="category-name" className="text-sm font-medium text-text-muted">
              Category name
            </label>
            <input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Example: Health"
              className="w-full rounded-neo border border-transparent bg-surface px-4 py-3 text-text-primary shadow-neo-inset outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
          </div>

          {/* ADD THIS: choose if the category is budget-based or fixed amount */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-text-muted">Category type</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategoryType('budget')}
                className={`neo-card px-3 py-2 text-sm font-semibold ${
                  categoryType === 'budget'
                    ? 'text-accent-strong shadow-neo-inset'
                    : 'text-text-muted'
                }`}
              >
                Budget
              </button>
              <button
                type="button"
                onClick={() => setCategoryType('fixed')}
                className={`neo-card px-3 py-2 text-sm font-semibold ${
                  categoryType === 'fixed'
                    ? 'text-accent-strong shadow-neo-inset'
                    : 'text-text-muted'
                }`}
              >
                Fixed
              </button>
            </div>
          </fieldset>

          <button
            type="submit"
            className="neo-card neo-pressable w-full px-4 py-3 text-sm font-semibold text-text-primary"
          >
            Add category
          </button>
        </form>
      </div>
    </div>
  )
}
