import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoanTable } from '@/components/LoanTable'
import type { Loan } from '@/types/loan'

describe('LoanTable', () => {
  const mockOnMarkRepaid = vi.fn()
  const mockOnDelete = vi.fn()

  const sampleLoans: Loan[] = [
    {
      id: '1',
      recipient: 'John Doe',
      amount: 1000,
      dateGiven: '2024-01-01T00:00:00Z',
      expectedRepaymentDate: '2024-02-01T00:00:00Z',
      repaidAt: null,
      status: 'outstanding',
      daysRemaining: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      recipient: 'Jane Smith',
      amount: 500,
      dateGiven: '2024-01-01T00:00:00Z',
      expectedRepaymentDate: '2024-02-01T00:00:00Z',
      repaidAt: '2024-02-01T00:00:00Z',
      status: 'repaid',
      daysRemaining: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loans correctly', () => {
    render(
      <LoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkRepaid={mockOnMarkRepaid}
        markingId={null}
        onDelete={mockOnDelete}
        deletingId={null}
      />,
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Mark repaid')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows delete button only for repaid loans', () => {
    render(
      <LoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkRepaid={mockOnMarkRepaid}
        markingId={null}
        onDelete={mockOnDelete}
        deletingId={null}
      />,
    )

    // Should have one "Mark repaid" for outstanding loan
    expect(screen.getByText('Mark repaid')).toBeInTheDocument()
    // Should have one "Delete" for repaid loan
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    render(
      <LoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkRepaid={mockOnMarkRepaid}
        markingId={null}
        onDelete={mockOnDelete}
        deletingId={null}
      />,
    )

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith('2') // repaid loan id
  })

  it('shows "Deleting…" when deletingId matches', () => {
    render(
      <LoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkRepaid={mockOnMarkRepaid}
        markingId={null}
        onDelete={mockOnDelete}
        deletingId="2"
      />,
    )

    expect(screen.getByText('Deleting…')).toBeInTheDocument()
  })

  it('does not show delete button when onDelete is not provided', () => {
    render(
      <LoanTable
        loans={sampleLoans}
        currencySymbol="KR"
        onMarkRepaid={mockOnMarkRepaid}
        markingId={null}
      />,
    )

    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })
})
