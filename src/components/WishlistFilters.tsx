import { useMemo, useState } from 'react'

type WishlistFiltersProps = {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  priorities: string[]
  selectedPriority: string
  onPriorityChange: (priority: string) => void
  onClearFilters: () => void
  defaultCategoryLabel: string
  defaultPriorityLabel: string
}

type ActiveFilterChip = {
  id: string
  label: string
  onRemove: () => void
  // ADD THIS: tone stores final Tailwind class strings, not enum labels
  tone: string
}

const priorityToneMap: Record<string, string> = {
  High: 'border-transparent bg-red-500 text-white shadow-sm hover:bg-red-500/90 focus-visible:ring-red-400',
  Medium:
    'border-transparent bg-amber-500 text-white shadow-sm hover:bg-amber-500/90 focus-visible:ring-amber-400',
  Low: 'border-transparent bg-emerald-500 text-white shadow-sm hover:bg-emerald-500/90 focus-visible:ring-emerald-400',
}

// ADD THIS: chip tone map to keep category and priority pills visually consistent
const chipToneMap: Record<string, string> = {
  category: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  High: 'bg-red-100 text-red-700 border border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
}

// ADD THIS: toggle button with animated chevron and hover/focus polish
const FilterToggle = ({
  isOpen,
  activeCount,
  onToggle,
}: {
  isOpen: boolean
  activeCount: number
  onToggle: () => void
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={isOpen}
    aria-controls="wishlist-filter-panel"
    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-text-primary transition-transform duration-200 hover:scale-102 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
  >
    <span>Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
    <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
        <path
          d="M10 6.5l5 5H5l5-5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  </button>
)

// ADD THIS: removable summary chips share the same styling in collapsed and expanded layouts
const FilterChip = ({
  label,
  onRemove,
  tone,
}: {
  label: string
  onRemove: () => void
  tone: string
}) => (
  <span
    className={`flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${tone}`}
  >
    <span>{label}</span>
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="h-4 w-4 rounded-full border border-current text-xs leading-none transition hover:bg-white"
    >
      ×
    </button>
  </span>
)

// ADD THIS: pill groups with inline checkmarks for the selected option
const FilterGroup = ({
  label,
  options,
  selectedValue,
  onSelect,
  variant,
}: {
  label: string
  options: string[]
  selectedValue: string
  onSelect: (value: string) => void
  variant: 'category' | 'priority'
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold uppercase tracking-wide text-text-primary">{label}</p>
      <p className="text-xs text-text-muted">{selectedValue}</p>
    </div>
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isSelected = option === selectedValue
        const baseClasses =
          'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
        const selectedCategoryClasses =
          'border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-600/90 focus-visible:ring-indigo-400 focus-visible:ring-offset-white'
        const unselectedClasses =
          'border-slate-300 bg-white text-text-primary hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-indigo-400 focus-visible:ring-offset-2'
        const prioritySelected = variant === 'priority' && priorityToneMap[option]
        const optionClasses = `${baseClasses} ${isSelected ? (prioritySelected ?? selectedCategoryClasses) : unselectedClasses}`

        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={optionClasses}
            aria-pressed={isSelected}
          >
            {isSelected ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3">
                <path
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
            <span className="leading-none">{option}</span>
          </button>
        )
      })}
    </div>
  </div>
)

export const WishlistFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priorities,
  selectedPriority,
  onPriorityChange,
  onClearFilters,
  defaultCategoryLabel,
  defaultPriorityLabel,
}: WishlistFiltersProps) => {
  // default to collapsed so the filter panel doesn’t dominate the page
  // application state will expand when the user clicks the toggle
  const [isExpanded, setIsExpanded] = useState(false)

  // ADD THIS: derive removable chip data for both summary and expanded views
  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = []

    if (selectedCategory !== defaultCategoryLabel) {
      chips.push({
        id: 'category',
        label: selectedCategory,
        onRemove: () => onCategoryChange(defaultCategoryLabel),
        tone: chipToneMap.category,
      })
    }

    if (selectedPriority !== defaultPriorityLabel) {
      chips.push({
        id: 'priority',
        label: `${selectedPriority} priority`,
        onRemove: () => onPriorityChange(defaultPriorityLabel),
        tone: chipToneMap[selectedPriority] ?? chipToneMap.category,
      })
    }

    return chips
  }, [
    selectedCategory,
    selectedPriority,
    defaultCategoryLabel,
    defaultPriorityLabel,
    onCategoryChange,
    onPriorityChange,
  ])

  const activeFilterCount = activeFilterChips.length
  const collapsedSummary = activeFilterChips.map((chip) => chip.label).join(' · ')

  // ADD THIS: modern collapsible filter layout with chips, grouped pills, and helper actions
  return (
    <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterToggle
          isOpen={isExpanded}
          activeCount={activeFilterCount}
          onToggle={() => setIsExpanded((current) => !current)}
        />
        {!isExpanded && activeFilterCount === 0 ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Showing all items
          </p>
        ) : null}
        {!isExpanded && activeFilterCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-text-muted">{collapsedSummary}</p>
            {activeFilterChips.map((chip) => (
              <FilterChip
                key={chip.id}
                label={chip.label}
                onRemove={chip.onRemove}
                tone={chip.tone}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div
        id="wishlist-filter-panel"
        data-testid="filter-panel"
        className={`mt-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-6 pb-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Active filters
              </p>
              <button
                type="button"
                onClick={onClearFilters}
                className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.length === 0 ? (
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-text-muted">
                  No filters selected
                </p>
              ) : (
                activeFilterChips.map((chip) => (
                  <FilterChip
                    key={`expanded-${chip.id}`}
                    label={chip.label}
                    onRemove={chip.onRemove}
                    tone={chip.tone}
                  />
                ))
              )}
            </div>
          </div>

          <FilterGroup
            label="Category"
            options={categories}
            selectedValue={selectedCategory}
            onSelect={onCategoryChange}
            variant="category"
          />

          <FilterGroup
            label="Priority"
            options={priorities}
            selectedValue={selectedPriority}
            onSelect={onPriorityChange}
            variant="priority"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm font-semibold uppercase tracking-tight text-red-600 transition hover:text-red-700"
          >
            Clear filters
          </button>
          <span className="text-xs text-text-muted">Filters saved for this view</span>
        </div>
      </div>
    </section>
  )
}
