import { useState } from 'react'

/**
 * Props passed to the top‑level filters component.
 */
export interface WishlistFiltersProps {
  /** list of all category options (first entry is the “all” label) */
  availableCategoryFilters: string[]
  selectedCategoryFilter: string
  onCategoryChange: (value: string) => void

  /** list of all priority options (first entry is the “all” label) */
  availablePriorityFilters: string[]
  selectedPriorityFilter: string
  onPriorityChange: (value: string) => void

  /**
   * Called when the user taps “clear all”.  The page can wire this to
   * reset both category and priority simultaneously.
   */
  onClearAll?: () => void
}

/**
 * A small chip used to summarise a single filter, optionally
 * rendering a close button when an `onRemove` handler is provided.
 */
export interface FilterChipProps {
  label: string
  onRemove?: () => void
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-sm font-medium text-text-primary shadow">
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          className="ml-2 flex-shrink-0 text-text-muted hover:text-text-primary"
          onClick={onRemove}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}

/**
 * A self‑contained wishlist filter panel.  It renders a toggle button
 * that opens an expandable area with selectors, and always shows a row
 * of summary chips when any filter other than the “all” option is
 * active.  Open/close state is managed internally.
 */
export function WishlistFilters({
  availableCategoryFilters,
  selectedCategoryFilter,
  onCategoryChange,
  availablePriorityFilters,
  selectedPriorityFilter,
  onPriorityChange,
  onClearAll,
}: WishlistFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => setIsOpen((o) => !o)

  const clearCategory = () =>
    onCategoryChange(availableCategoryFilters[0] ?? '')
  const clearPriority = () =>
    onPriorityChange(availablePriorityFilters[0] ?? '')

  const anyFilterActive =
    selectedCategoryFilter !== availableCategoryFilters[0] ||
    selectedPriorityFilter !== availablePriorityFilters[0]

  // color styles for priority pills
  const priorityStyles: Record<string, { base: string; selected: string }> = {
    All: {
      base: 'border-slate-300 bg-surface text-text-primary hover:border-slate-400',
      selected: 'border-transparent bg-slate-700 text-white',
    },
    High: {
      base: 'border-red-300 bg-red-50 text-red-700 hover:border-red-400',
      selected: 'border-transparent bg-red-500 text-white',
    },
    Medium: {
      base: 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400',
      selected: 'border-transparent bg-amber-500 text-white',
    },
    Low: {
      base: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
      selected: 'border-transparent bg-emerald-500 text-white',
    },
  }

  return (
    <div className="mb-4">
      {/* toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-white hover:bg-primary-dark"
      >
        Filters {isOpen ? '▲' : '▼'}
      </button>

      {/* summary chips & clear all */}
      {anyFilterActive && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {selectedCategoryFilter !== availableCategoryFilters[0] && (
            <FilterChip
              label={`Category: ${selectedCategoryFilter}`}
              onRemove={clearCategory}
            />
          )}
          {selectedPriorityFilter !== availablePriorityFilters[0] && (
            <FilterChip
              label={`Priority: ${selectedPriorityFilter}`}
              onRemove={clearPriority}
            />
          )}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="ml-2 text-sm text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* expanded panel */}
      {isOpen && (
        <div className="mt-4 space-y-4 rounded bg-surface p-4 shadow">
          <div>
            <p className="text-sm font-medium text-text-primary">Category</p>
            <div
              role="group"
              aria-label="Category filter"
              className="mt-1 flex flex-wrap items-center gap-2"
            >
              {availableCategoryFilters.map((cat) => {
                const isSelected = selectedCategoryFilter === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onCategoryChange(cat)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                      isSelected
                        ? 'border-transparent bg-slate-700 text-white'
                        : 'border-slate-300 bg-surface text-text-primary hover:border-slate-400'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-text-primary">Priority</p>
            <div
              role="group"
              aria-label="Priority filter"
              className="mt-1 flex flex-wrap items-center gap-2"
            >
              {availablePriorityFilters.map((pri) => {
                const isSelected = selectedPriorityFilter === pri
                const styles = priorityStyles[pri] || priorityStyles.All
                return (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => onPriorityChange(pri)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                      isSelected ? styles.selected : styles.base
                    }`}
                    aria-pressed={isSelected}
                  >
                    {pri}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-text-muted">
            Showing category:{' '}
            <span className="font-medium text-text-primary">
              {selectedCategoryFilter}
            </span>{' '}
            · priority:{' '}
            <span className="font-medium text-text-primary">
              {selectedPriorityFilter}
            </span>
          </p>
        </div>
      )}

      {!isOpen && anyFilterActive && (
        <p className="mt-2 text-xs text-text-muted">
          Active filters:{' '}
          <span className="font-medium text-text-primary">
            {selectedCategoryFilter}
          </span>{' '}
          ·{' '}
          <span className="font-medium text-text-primary">
            {selectedPriorityFilter}
          </span>
        </p>
      )}
    </div>
  )
}
