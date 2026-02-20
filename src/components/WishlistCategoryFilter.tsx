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

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl space-y-3">
      <button
        type="button"
        onClick={() => setIsFilterPanelExpanded((current) => !current)}
        className="inline-flex items-center gap-2 text-sm font-medium text-text-primary transition hover:text-accent-strong"
        aria-expanded={isFilterPanelExpanded}
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
        <span className="text-xs text-text-muted">({isFilterPanelExpanded ? 'Hide' : 'Show'})</span>
      </button>

      {isFilterPanelExpanded ? (
        <>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
            Filter by category:
          </div>

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

          <div className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 4v16" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 11h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Filter by priority:
          </div>

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
        </>
      ) : null}
    </section>
  )
}
