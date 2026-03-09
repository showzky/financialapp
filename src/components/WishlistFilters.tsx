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
  High: 'border-[rgba(201,107,107,0.28)] bg-[rgba(201,107,107,0.14)] text-[#c96b6b] shadow-sm hover:bg-[rgba(201,107,107,0.2)] focus-visible:ring-[rgba(201,107,107,0.45)]',
  Medium:
    'border-[rgba(201,168,76,0.28)] bg-[rgba(201,168,76,0.14)] text-[#e2c06a] shadow-sm hover:bg-[rgba(201,168,76,0.2)] focus-visible:ring-[rgba(201,168,76,0.45)]',
  Low: 'border-[rgba(94,189,151,0.28)] bg-[rgba(94,189,151,0.14)] text-[#5ebd97] shadow-sm hover:bg-[rgba(94,189,151,0.2)] focus-visible:ring-[rgba(94,189,151,0.45)]',
}

// ADD THIS: chip tone map to keep category and priority pills visually consistent
const chipToneMap: Record<string, string> = {
  category: 'border border-[rgba(91,163,201,0.22)] bg-[rgba(91,163,201,0.1)] text-[#5ba3c9]',
  High: 'border border-[rgba(201,107,107,0.22)] bg-[rgba(201,107,107,0.12)] text-[#c96b6b]',
  Medium: 'border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.12)] text-[#e2c06a]',
  Low: 'border border-[rgba(94,189,151,0.22)] bg-[rgba(94,189,151,0.12)] text-[#5ebd97]',
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
    className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.10)] bg-[#202026] px-5 py-2 text-sm font-semibold text-[#f0ede8] transition-all hover:border-[rgba(201,168,76,0.24)] hover:text-[#e2c06a]"
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
      className="h-4 w-4 rounded-full border border-current text-xs leading-none transition hover:bg-[rgba(255,255,255,0.12)]"
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
          'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
        const selectedCategoryClasses =
          'border-[rgba(201,168,76,0.28)] bg-[rgba(201,168,76,0.14)] text-[#f5d98a] shadow-sm hover:bg-[rgba(201,168,76,0.2)] focus-visible:ring-[rgba(201,168,76,0.45)]'
        const unselectedClasses =
          'border border-[rgba(255,255,255,0.08)] bg-[#18181c] text-[#b8b4ae] hover:border-[rgba(255,255,255,0.14)] hover:text-[#f0ede8] focus-visible:ring-[rgba(201,168,76,0.3)]'
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
    <section className="mx-auto mt-6 w-full max-w-6xl rounded-[30px] border border-[rgba(255,255,255,0.055)] bg-[#111114] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
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
                className="text-xs font-semibold text-[#6b6862] transition hover:text-[#e2c06a]"
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

        <div className="flex items-center justify-end gap-3 border-t border-[rgba(255,255,255,0.055)] pt-4">
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm font-semibold uppercase tracking-tight text-[#c96b6b] transition hover:text-[#ddb1b1]"
          >
            Clear filters
          </button>
          <span className="text-xs text-text-muted">Filters saved for this view</span>
        </div>
      </div>
    </section>
  )
}
