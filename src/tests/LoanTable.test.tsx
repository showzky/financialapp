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
    {
      id: '3',
      recipient: 'Bob Wilson',
      amount: 200,
      dateGiven: '2024-01-01T00:00:00Z',
      expectedRepaymentDate: '2024-01-15T00:00:00Z',
      repaidAt: null,
      status: 'due_soon',
      daysRemaining: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '4',
      recipient: 'Alice Brown',
      amount: 300,
      dateGiven: '2024-01-01T00:00:00Z',
      expectedRepaymentDate: '2024-01-10T00:00:00Z',
      repaidAt: null,
      status: 'overdue',
      daysRemaining: -5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
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

  it('renders status indicators with correct color classes', () => {
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

    // Check outstanding status has correct classes
    const outstandingStatus = screen.getByText('Outstanding')
    expect(outstandingStatus).toHaveClass('bg-surface-strong', 'text-text-primary')

    // Check due_soon status has correct classes
    const dueSoonStatus = screen.getByText('Due soon')
    expect(dueSoonStatus).toHaveClass('bg-amber-100', 'text-amber-700')

    // Check overdue status has correct classes
    const overdueStatus = screen.getByText('Overdue')
    expect(overdueStatus).toHaveClass('bg-red-100', 'text-red-700')

    // Check repaid status has correct classes
    const statusSpans = screen.getAllByText('Repaid')
    const repaidStatus = statusSpans.find(span => span.tagName === 'SPAN' && span.classList.contains('bg-emerald-100'))
    expect(repaidStatus).toHaveClass('bg-emerald-100', 'text-emerald-700')
  })
})
