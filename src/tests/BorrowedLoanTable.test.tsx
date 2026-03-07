import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BorrowedLoanTable } from '@/components/BorrowedLoanTable'
import type { BorrowedLoan } from '@/types/loan'

describe('BorrowedLoanTable', () => {
  const mockOnMarkPaidOff = vi.fn()
  const mockOnDelete = vi.fn()

  const sampleLoans: BorrowedLoan[] = [
    {
      id: '1',
      lender: 'Storebrand',
      originalAmount: 300000,
      currentBalance: 220000,
      payoffDate: '2035-01-01T00:00:00Z',
      notes: 'Fixed rate',
      paidOffAt: null,
      status: 'active',
      daysRemaining: 120,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      lender: 'DNB',
      originalAmount: 50000,
      currentBalance: 0,
      payoffDate: '2024-02-01T00:00:00Z',
      notes: null,
      paidOffAt: '2024-02-01T00:00:00Z',
      status: 'paid_off',
      daysRemaining: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders borrowed loans correctly', () => {
    render(
      <BorrowedLoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkPaidOff={mockOnMarkPaidOff}
        markingId={null}
        onDelete={mockOnDelete}
        deletingId={null}
      />,
    )

    expect(screen.getByText('Storebrand')).toBeInTheDocument()
    expect(screen.getByText('Mark paid off')).toBeInTheDocument()
    expect(screen.getByText(/Paid off loans \(1\)/)).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked for paid-off loans', () => {
    render(
      <BorrowedLoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkPaidOff={mockOnMarkPaidOff}
        markingId={null}
        onDelete={mockOnDelete}
        deletingId={null}
      />,
    )

    fireEvent.click(screen.getByText(/Paid off loans \(1\)/))
    fireEvent.click(screen.getByText('Delete'))

    expect(mockOnDelete).toHaveBeenCalledWith('2')
  })

  it('calls onMarkPaidOff for active borrowed loans', () => {
    render(
      <BorrowedLoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkPaidOff={mockOnMarkPaidOff}
        markingId={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mark paid off' }))

    expect(mockOnMarkPaidOff).toHaveBeenCalledWith('1')
  })

  it('renders empty state when there are no borrowed loans', () => {
    render(
      <BorrowedLoanTable
        loans={[]}
        currencySymbol="KR"
        onMarkPaidOff={mockOnMarkPaidOff}
        markingId={null}
      />,
    )

    expect(screen.getByText(/No personal loans yet/)).toBeInTheDocument()
  })
})