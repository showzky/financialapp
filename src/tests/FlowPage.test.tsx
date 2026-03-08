import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { useBudgets } from '@/hooks/useBudgets'
import { Flow } from '@/pages/flow'
import { DASHBOARD_EXPENSE_NOTE } from '@/types/transaction'

vi.mock('@/services/userApi', () => ({
  userApi: {
    getMe: vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'andre@example.com',
      displayName: 'Andre',
      monthlyIncome: 37210,
      createdAt: '2026-03-01T00:00:00.000Z',
    }),
  },
}))

vi.mock('@/services/authApi', () => ({
  authApi: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/hooks/useBudgets', () => ({
  useBudgets: vi.fn(),
}))

const mockedUseBudgets = vi.mocked(useBudgets)

const createBudgetContext = (
  overrides?: Partial<{
    income: number
    month: string
    categories: Array<{
      id: string
      name: string
      type: 'budget' | 'fixed'
      allocated: number
      spent: number
    }>
    transactions: Array<{
      id: string
      userId: string
      categoryId: string
      amount: number
      note: string | null
      transactionDate: string
      createdAt: string
    }>
  }>,
): ReturnType<typeof useBudgets> => {
  const state = {
    month: overrides?.month ?? 'March 2026',
    income: overrides?.income ?? 37_210,
    categories:
      overrides?.categories ??
      [
        {
          id: 'rent',
          name: 'Husleie',
          type: 'fixed' as const,
          allocated: 6_500,
          spent: 0,
        },
        {
          id: 'transport',
          name: 'Transport',
          type: 'budget' as const,
          allocated: 4_000,
          spent: 3_280,
        },
      ],
  }

  const totals = {
    allocated: state.categories.reduce((sum, category) => sum + category.allocated, 0),
    spent: state.categories.reduce((sum, category) => sum + category.spent, 0),
    remaining: state.categories.reduce(
      (sum, category) => sum + Math.max(category.allocated - category.spent, 0),
      0,
    ),
  }

  return {
    state,
    totals,
    addCategory: vi.fn(),
    updateIncome: vi.fn(),
    updateCategoryAmounts: vi.fn(),
    removeCategory: vi.fn(),
    reorderCategories: vi.fn(),
    resetDashboard: vi.fn(),
    transactions: overrides?.transactions ?? [],
    recurringTransactions: [],
    addRecurringTransaction: vi.fn(),
    updateRecurringTransaction: vi.fn(),
    deleteRecurringTransaction: vi.fn(),
    checkAndApplyRecurring: vi.fn().mockReturnValue({ appliedCount: 0, appliedNames: [] }),
  }
}

describe('Flow page', () => {
  beforeEach(() => {
    mockedUseBudgets.mockReset()
  })

  it('renders live dashboard categories in the flow view', () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Open details for MONTHLY INCOME' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open details for HUSLEIE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open details for TRANSPORT' })).toBeInTheDocument()
  })

  it('renders the mission control shell and summary stats', () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'MISSION CONTROL' })).toBeInTheDocument()
    expect(screen.getByText('// BUDGET HEALTH')).toBeInTheDocument()
    expect(screen.getByText('// NET WORTH')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to dashboard' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Esc')).toBeInTheDocument()
  })

  it('opens the detail panel when a node is selected', () => {
    mockedUseBudgets.mockReturnValue(
      createBudgetContext({
        transactions: [
          {
            id: 'tx-1',
            userId: 'user-1',
            categoryId: 'transport',
            amount: 500,
            note: DASHBOARD_EXPENSE_NOTE,
            transactionDate: '2026-03-08',
            createdAt: '2026-03-08T12:00:00.000Z',
          },
        ],
      }),
    )

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for TRANSPORT' }))

    expect(screen.getByRole('heading', { name: 'TRANSPORT' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'This dashboard category is live. Allocation, spending, creation, and deletion all sync through the shared budget state.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('// RECENT TRANSACTIONS')).toBeInTheDocument()
    expect(screen.getByText('Dashboard spent entry')).toBeInTheDocument()
  })

  it('closes the detail panel from the close control', () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for TRANSPORT' }))
    fireEvent.click(screen.getByRole('button', { name: '[ CLOSE ]' }))

    expect(screen.queryByRole('heading', { name: 'TRANSPORT' })).not.toBeInTheDocument()
  })

  it('closes the detail panel on escape and restores body scroll', async () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for MONTHLY INCOME' }))

    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'MONTHLY INCOME' })).not.toBeInTheDocument()
    })

    expect(document.body.style.overflow).toBe('')
  })

  it('renders the compact layout when the media query matches', () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    const originalMatchMedia = window.matchMedia
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()

    try {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('1100px'),
        media: query,
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(
        <MemoryRouter>
          <Flow />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: 'Income Inputs' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Fixed Drains' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Card Pressure' })).toBeInTheDocument()
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('registers the /flow route as a dedicated fullscreen view with its own return link', async () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter initialEntries={['/flow']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'MISSION CONTROL' })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Return to dashboard' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'Flow' })).not.toBeInTheDocument()
  })

  it('returns to the dashboard route when Escape is pressed with no panel open', async () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter initialEntries={['/flow']}>
        <Routes>
          <Route path="/flow" element={<Flow />} />
          <Route path="/" element={<div>Dashboard stub</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'MISSION CONTROL' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.getByText('Dashboard stub')).toBeInTheDocument()
    })
  })

  it('updates the flow node list when dashboard categories are added or deleted', () => {
    const initialState = createBudgetContext()
    const withNewCategory = createBudgetContext({
      categories: [
        ...initialState.state.categories,
        {
          id: 'gifts',
          name: 'Gifts',
          type: 'budget',
          allocated: 500,
          spent: 0,
        },
      ],
    })
    const afterDelete = createBudgetContext({
      categories: initialState.state.categories.filter((category) => category.id !== 'transport'),
    })

    mockedUseBudgets.mockReturnValue(initialState)

    const { rerender } = render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Open details for GIFTS' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open details for TRANSPORT' })).toBeInTheDocument()

    mockedUseBudgets.mockReturnValue(withNewCategory)
    rerender(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Open details for GIFTS' })).toBeInTheDocument()

    mockedUseBudgets.mockReturnValue(afterDelete)
    rerender(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Open details for TRANSPORT' })).not.toBeInTheDocument()
  })

  it('opens the Revolut import console shell', () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open import' }))

    expect(screen.getByText('IMPORTER REVOLUT CSV')).toBeInTheDocument()
    expect(screen.getByText('INGEN DATA - IMPORTER CSV')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument()
  })
})
