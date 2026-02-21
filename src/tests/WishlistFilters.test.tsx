import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WishlistFilters } from '@/components/WishlistFilters'

describe('WishlistFilters', () => {
  const categories = ['Home', 'Electronics']
  const priorities = ['High', 'Low']
  const defaultCategory = 'All'
  const defaultPriority = 'All'
  const noop = vi.fn()

  it('starts collapsed by default and shows "Showing all items" when no filters active', () => {
    render(
      <WishlistFilters
        categories={categories}
        selectedCategory={defaultCategory}
        onCategoryChange={noop}
        priorities={priorities}
        selectedPriority={defaultPriority}
        onPriorityChange={noop}
        onClearFilters={noop}
        defaultCategoryLabel={defaultCategory}
        defaultPriorityLabel={defaultPriority}
      />,
    )

    // panel is rendered but collapsed via CSS
    const panel = screen.getByTestId('filter-panel')
    expect(panel).toHaveClass('max-h-0')
    expect(panel).toHaveClass('opacity-0')
    expect(screen.getByText('Showing all items')).toBeInTheDocument()
  })

  it('expands and collapses when the toggle is clicked', () => {
    render(
      <WishlistFilters
        categories={categories}
        selectedCategory={defaultCategory}
        onCategoryChange={noop}
        priorities={priorities}
        selectedPriority={defaultPriority}
        onPriorityChange={noop}
        onClearFilters={noop}
        defaultCategoryLabel={defaultCategory}
        defaultPriorityLabel={defaultPriority}
      />,
    )

    const toggle = screen.getByRole('button', {
      name: (val) => typeof val === 'string' && val.trim().startsWith('Filters'),
    })
    // panel collapsed to start
    const panel = screen.getByTestId('filter-panel')
    expect(panel).toHaveClass('max-h-0')

    // click to expand
    fireEvent.click(toggle)
    expect(panel).toHaveClass('max-h-[1200px]')
    expect(screen.getByText('Active filters')).toBeInTheDocument()

    // click again to collapse and verify hiding
    fireEvent.click(toggle)
    expect(panel).toHaveClass('max-h-0')
  })
})
