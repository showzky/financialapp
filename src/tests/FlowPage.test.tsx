import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { useBudgets } from '@/hooks/useBudgets'
import { Flow } from '@/pages/flow'
import { transactionApi } from '@/services/transactionApi'
import { DASHBOARD_EXPENSE_NOTE } from '@/types/transaction'

vi.mock('@/services/transactionApi', () => ({
  transactionApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      id: 'tx-import-1',
      userId: 'user-1',
      categoryId: 'food',
      amount: 250,
      note: '[revolut-import] Rema 1000',
      transactionDate: '2026-03-08',
      createdAt: '2026-03-08T12:00:00.000Z',
    }),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

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

// ADDED THIS: mock the import executor so tests don't hit real APIs
vi.mock('@/components/flow/revolutImportExecutor', () => ({
  executeImportRow: vi.fn().mockResolvedValue({ ok: true, transaction: { id: 'tx-import-1', userId: 'user-1', categoryId: 'food', amount: 250, note: '[revolut-import] Rema 1000', transactionDate: '2026-03-08', createdAt: '2026-03-08T12:00:00.000Z' } }),
  deleteAppliedImportRow: vi.fn().mockResolvedValue({ ok: true }),
  REVOLUT_IMPORT_NOTE_PREFIX: '[revolut-import]',
}))

vi.mock('@/hooks/useBudgets', () => ({
  useBudgets: vi.fn(),
}))

const mockedUseBudgets = vi.mocked(useBudgets)
const mockedTransactionApi = vi.mocked(transactionApi)

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
    appendTransaction: vi.fn(), // ADDED THIS
    removeTransaction: vi.fn(),
  }
}

describe('Flow page', () => {
  beforeEach(() => {
    mockedUseBudgets.mockReset()
    mockedTransactionApi.remove.mockClear()
    window.localStorage.clear()
  })

  it('renders live dashboard categories in the flow view', () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Open details for MONTHLY INCOME' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' })).toBeInTheDocument()
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

  it('opens the Revolut import system node detail console', () => {
    mockedUseBudgets.mockReturnValue(createBudgetContext())

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' }))

    expect(screen.getByRole('dialog', { name: 'Revolut import manager' })).toBeInTheDocument()
    expect(screen.getByText('IMPORTER REVOLUT FIL')).toBeInTheDocument()
    expect(screen.getByText('INGEN DATA - IMPORTER FIL')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument()
  })

  it('keeps the Revolut import node blue by default and turns it red for burst spending', () => {
    window.localStorage.setItem(
      'flow:revolut-import-state',
      JSON.stringify({
        fileName: 'revolut.csv',
        summary: {
          rows: [
            {
              id: 'calm-1',
              date: '2026-03-08',
              description: 'Transport pass',
              amount: -590,
              currency: 'NOK',
            },
            {
              id: 'calm-2',
              date: '2026-03-07',
              description: 'To pocket NOK Gaming mus',
              amount: 120,
              currency: 'NOK',
            },
            {
              id: 'calm-3',
              date: '2026-03-06',
              description: 'Salary',
              amount: 3000,
              currency: 'NOK',
            },
          ],
          totalSpent: 590,
          totalIncome: 3000,
          currencies: ['NOK'],
        },
        overrides: {},
      }),
    )

    mockedUseBudgets.mockReturnValue(createBudgetContext())

    const { unmount } = render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' })).toHaveAttribute(
      'data-tone',
      'ok',
    )

    window.localStorage.setItem(
      'flow:revolut-import-state',
      JSON.stringify({
        fileName: 'revolut.csv',
        summary: {
          rows: [
            {
              id: 'burst-1',
              date: '2026-03-08',
              description: 'Marie Johansen Lie',
              amount: -1200,
              currency: 'NOK',
            },
            {
              id: 'burst-2',
              date: '2026-03-08',
              description: 'Maddelen Hugdal',
              amount: -400,
              currency: 'NOK',
            },
            {
              id: 'burst-3',
              date: '2026-03-08',
              description: 'Circle K E6 Lundamo',
              amount: -350,
              currency: 'NOK',
            },
            {
              id: 'burst-4',
              date: '2026-03-07',
              description: 'Salary',
              amount: 1800,
              currency: 'NOK',
            },
          ],
          totalSpent: 1950,
          totalIncome: 1800,
          currencies: ['NOK'],
        },
        overrides: {},
      }),
    )

    unmount()

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' })).toHaveAttribute(
      'data-tone',
      'bleed',
    )
  })

  it('groups the import preview by review state and shows food fund tracking', () => {
    window.localStorage.setItem(
      'flow:revolut-import-state',
      JSON.stringify({
        fileName: 'revolut.csv',
        summary: {
          rows: [
            {
              id: 'food-1',
              date: '2026-03-08',
              description: 'Rema 1000',
              amount: -250,
              currency: 'NOK',
            },
            {
              id: 'transfer-1',
              date: '2026-03-07',
              description: 'To pocket NOK Gaming mus',
              amount: 250,
              currency: 'NOK',
            },
          ],
          totalSpent: 250,
          totalIncome: 250,
          currencies: ['NOK'],
        },
        overrides: {},
      }),
    )

    mockedUseBudgets.mockReturnValue(
      createBudgetContext({
        categories: [
          {
            id: 'food',
            name: 'Food',
            type: 'budget',
            allocated: 6000,
            spent: 1800,
          },
        ],
      }),
    )

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' }))

    expect(screen.getByText('FOOD FUND LEFT')).toBeInTheDocument()
    expect(screen.getByText('KR 4,200')).toBeInTheDocument()
    expect(screen.getByLabelText('Needs review')).toBeInTheDocument()
    expect(screen.getByLabelText('Transfers')).toBeInTheDocument()
    expect(screen.getByText('Wishlist Pocket: Gaming Mus')).toBeInTheDocument()
  })

  it('keeps a row in place until import edits are confirmed', () => {
    window.localStorage.setItem(
      'flow:revolut-import-state',
      JSON.stringify({
        fileName: 'revolut.csv',
        summary: {
          rows: [
            {
              id: 'review-row-1',
              date: '2026-03-08',
              description: 'Stjern',
              amount: -86.28,
              currency: 'NOK',
            },
          ],
          totalSpent: 86.28,
          totalIncome: 0,
          currencies: ['NOK'],
        },
        overrides: {},
      }),
    )

    mockedUseBudgets.mockReturnValue(
      createBudgetContext({
        categories: [
          {
            id: 'food',
            name: 'Food',
            type: 'budget',
            allocated: 6000,
            spent: 1800,
          },
        ],
      }),
    )

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' }))

    fireEvent.change(screen.getByLabelText('Set import type for Stjern'), {
      target: { value: 'expense' },
    })

    fireEvent.change(screen.getByLabelText('Set category for Stjern'), {
      target: { value: 'food' },
    })

    fireEvent.change(screen.getByLabelText('Set funding source for Stjern'), {
      target: { value: 'food-fund' },
    })

    expect(screen.getByLabelText('Needs review')).toBeInTheDocument()
    expect(screen.getByText('Stjern')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply live' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Apply live' }))

    expect(screen.getByLabelText('Mapped expenses')).toBeInTheDocument()
    expect(screen.queryByText('NO CONFIRMED EXPENSES')).not.toBeInTheDocument()
  })

  // ADDED THIS: Confirm triggers a real write and shows APPLIED badge
  it('applies a confirmed expense row and shows the applied badge', async () => {
    window.localStorage.setItem(
      'flow:revolut-import-state',
      JSON.stringify({
        fileName: 'revolut.csv',
        summary: {
          rows: [
            {
              id: 'food-apply-1',
              date: '2026-03-08',
              description: 'Rema 1000',
              amount: -250,
              currency: 'NOK',
            },
          ],
          totalSpent: 250,
          totalIncome: 0,
          currencies: ['NOK'],
        },
        overrides: {
          'food-apply-1': { type: 'expense', categoryId: 'food', fundingSource: 'food-fund' },
        },
      }),
    )

    mockedUseBudgets.mockReturnValue(
      createBudgetContext({
        categories: [
          { id: 'food', name: 'Food', type: 'budget', allocated: 6000, spent: 1800 },
        ],
      }),
    )

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' }))

    expect(screen.getByRole('button', { name: 'Apply live' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Apply live' }))

    await waitFor(() => {
      expect(screen.getByText('APPLIED')).toBeInTheDocument()
    })

    expect(screen.getByText(/LIVE CATEGORY FEED/)).toBeInTheDocument()
  })

  // ADDED THIS: Duplicate row is blocked on second apply attempt
  it('blocks duplicate row application', async () => {
    window.localStorage.setItem(
      'flow:revolut-import-state',
      JSON.stringify({
        fileName: 'revolut.csv',
        summary: {
          rows: [
            {
              id: 'dup-row-1',
              date: '2026-03-08',
              description: 'Rema 1000',
              amount: -250,
              currency: 'NOK',
            },
          ],
          totalSpent: 250,
          totalIncome: 0,
          currencies: ['NOK'],
        },
        overrides: {
          'dup-row-1': { type: 'expense', categoryId: 'food', fundingSource: 'food-fund' },
        },
        appliedRows: {
          'dup-row-1': {
            status: 'applied',
            fingerprint: 'Rema 1000|-250|2026-03-08|revolut.csv',
            appliedAt: '2026-03-08T10:00:00.000Z',
            transactionId: 'tx-existing',
          },
        },
      }),
    )

    mockedUseBudgets.mockReturnValue(
      createBudgetContext({
        categories: [
          { id: 'food', name: 'Food', type: 'budget', allocated: 6000, spent: 2050 },
        ],
      }),
    )

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' }))

    // No confirm action should be visible for already-applied rows
    expect(screen.queryByRole('button', { name: 'Apply live' })).not.toBeInTheDocument()
    expect(screen.getByText('APPLIED')).toBeInTheDocument()
  })

  it('deletes an applied expense row and returns it to the pending queue', async () => {
    window.localStorage.setItem(
      'flow:revolut-import-state',
      JSON.stringify({
        fileName: 'revolut.csv',
        summary: {
          rows: [
            {
              id: 'applied-delete-1',
              date: '2026-03-08',
              description: 'Rema 1000',
              amount: -250,
              currency: 'NOK',
            },
          ],
          totalSpent: 250,
          totalIncome: 0,
          currencies: ['NOK'],
        },
        overrides: {
          'applied-delete-1': { type: 'expense', categoryId: 'food', fundingSource: 'food-fund' },
        },
        appliedRows: {
          'applied-delete-1': {
            status: 'applied',
            fingerprint: 'Rema 1000|-250|2026-03-08|revolut.csv',
            appliedAt: '2026-03-08T10:00:00.000Z',
            transactionId: 'tx-import-1',
            appliedTargetKind: 'transaction',
            appliedTargetId: 'tx-import-1',
          },
        },
      }),
    )

    mockedUseBudgets.mockReturnValue(
      createBudgetContext({
        categories: [{ id: 'food', name: 'Food', type: 'budget', allocated: 6000, spent: 2050 }],
        transactions: [
          {
            id: 'tx-import-1',
            userId: 'user-1',
            categoryId: 'food',
            amount: 250,
            note: '[revolut-import] Rema 1000',
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

    fireEvent.click(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete applied import for Rema 1000' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete applied' }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Delete applied import for Rema 1000' })).not.toBeInTheDocument()
    })

    expect(screen.getByText('Rema 1000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply live' })).toBeInTheDocument()
  })

  it('shows a live cleanup page with imported transactions grouped by affected node', () => {
    mockedUseBudgets.mockReturnValue(
      createBudgetContext({
        categories: [{ id: 'food', name: 'Food', type: 'budget', allocated: 6000, spent: 2050 }],
        transactions: [
          {
            id: 'tx-import-1',
            userId: 'user-1',
            categoryId: 'food',
            amount: 250,
            note: '[revolut-import] Rema 1000',
            transactionDate: '2026-03-08',
            createdAt: '2026-03-08T12:00:00.000Z',
          },
          {
            id: 'tx-import-2',
            userId: 'user-1',
            categoryId: 'food',
            amount: 110.6,
            note: '[revolut-import] Coop Prix',
            transactionDate: '2026-03-07',
            createdAt: '2026-03-07T11:00:00.000Z',
          },
        ],
      }),
    )

    render(
      <MemoryRouter>
        <Flow />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details for REVOLUT IMPORT' }))
    fireEvent.click(screen.getByRole('button', { name: 'Live Cleanup' }))

    expect(screen.getByLabelText('Imported transaction cleanup')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Rema 1000')).toBeInTheDocument()
    expect(screen.getByText('Coop Prix')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete imported transaction Rema 1000' })).toBeInTheDocument()
  })
})
