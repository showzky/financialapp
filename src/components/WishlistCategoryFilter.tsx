import { useState } from 'react'

type WishlistCategoryFilterProps = {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  priorities: string[]
  selectedPriority: string
  onPriorityChange: (priority: string) => void
}

export const WishlistCategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priorities,
  selectedPriority,
  onPriorityChange,
}: WishlistCategoryFilterProps) => {
  // ADD THIS: collapsible filter panel state
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState(true)

  const selectedCategoryLabel = selectedCategory.trim().length > 0 ? selectedCategory : 'All'
  const selectedPriorityLabel = selectedPriority.trim().length > 0 ? selectedPriority : 'All'

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl">
      <button
        type="button"
        onClick={() => setIsFilterPanelExpanded((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-slate-400"
        aria-expanded={isFilterPanelExpanded}
        aria-controls="wishlist-filter-panel"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 6h16" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 12h10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Filters
        <span className="text-xs font-medium text-text-muted">{isFilterPanelExpanded ? 'Hide' : 'Show'}</span>
      </button>

      {isFilterPanelExpanded ? (
        <div id="wishlist-filter-panel" className="mt-3 space-y-4 rounded-2xl border border-slate-200 bg-surface/80 p-4 sm:p-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">Filter by category</p>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => {
                const isSelected = selectedCategory === category

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onCategoryChange(category)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                      isSelected
                        ? 'border-transparent bg-accent-strong text-white'
                        : 'border-slate-300 bg-surface text-text-primary hover:border-slate-400'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">Filter by priority</p>

            <div className="flex flex-wrap items-center gap-2">
              {priorities.map((priority) => {
                const isSelected = selectedPriority === priority

                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => onPriorityChange(priority)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                      isSelected
                        ? 'border-transparent bg-accent-strong text-white'
                        : 'border-slate-300 bg-surface text-text-primary hover:border-slate-400'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {priority}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-text-muted">
            Showing category: <span className="font-medium text-text-primary">{selectedCategoryLabel}</span> · priority:{' '}
            <span className="font-medium text-text-primary">{selectedPriorityLabel}</span>
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-text-muted">
          Active filters: <span className="font-medium text-text-primary">{selectedCategoryLabel}</span> ·{' '}
          <span className="font-medium text-text-primary">{selectedPriorityLabel}</span>
        </p>
      )}
    </section>
  )
}
