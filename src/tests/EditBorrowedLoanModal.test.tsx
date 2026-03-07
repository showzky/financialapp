import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditBorrowedLoanModal } from '@/components/EditBorrowedLoanModal'

const sampleLoan = {
  id: 'borrowed-1',
  lender: 'Storebrand',
  originalAmount: 300000,
  currentBalance: 220000,
  interestRate: 4.5,
  payoffDate: '2035-01-01T00:00:00Z',
  notes: 'Fixed rate',
  paidOffAt: null,
  status: 'active' as const,
  daysRemaining: 120,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('EditBorrowedLoanModal', () => {
  it('blocks submit when current balance exceeds original amount', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <EditBorrowedLoanModal isOpen={true} loan={sampleLoan} onClose={vi.fn()} onSubmit={onSubmit} />,
    )

    fireEvent.change(screen.getByLabelText('Original amount'), {
      target: { value: '1000' },
    })
    fireEvent.change(screen.getByLabelText('Current balance'), {
      target: { value: '1200' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Current balance cannot exceed the original amount.')).toBeInTheDocument()
  })

  it('submits normalized updated payload after changes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <EditBorrowedLoanModal isOpen={true} loan={sampleLoan} onClose={vi.fn()} onSubmit={onSubmit} />,
    )

    fireEvent.change(screen.getByLabelText('Lender / institution'), {
      target: { value: '  DNB  ' },
    })
    fireEvent.change(screen.getByLabelText('Notes'), {
      target: { value: '  updated note  ' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('borrowed-1', {
        lender: 'DNB',
        originalAmount: 300000,
        currentBalance: 220000,
        interestRate: 4.5,
        payoffDate: '2035-01-01',
        notes: 'updated note',
      })
    })
  })
})
