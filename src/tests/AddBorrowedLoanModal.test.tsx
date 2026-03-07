import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AddBorrowedLoanModal } from '@/components/AddBorrowedLoanModal'

describe('AddBorrowedLoanModal', () => {
  it('blocks submit when current balance exceeds original amount', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<AddBorrowedLoanModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Lender / institution'), {
      target: { value: 'Storebrand' },
    })
    fireEvent.change(screen.getByLabelText('Original amount'), {
      target: { value: '1000' },
    })
    fireEvent.change(screen.getByLabelText('Current balance'), {
      target: { value: '1200' },
    })
    fireEvent.change(screen.getByLabelText('Payoff / due date'), {
      target: { value: '2030-01-01' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add personal loan' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Current balance cannot exceed the original amount.')).toBeInTheDocument()
  })

  it('submits normalized payload when the form is valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<AddBorrowedLoanModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Lender / institution'), {
      target: { value: '  DNB  ' },
    })
    fireEvent.change(screen.getByLabelText('Original amount'), {
      target: { value: '1000' },
    })
    fireEvent.change(screen.getByLabelText('Current balance'), {
      target: { value: '800' },
    })
    fireEvent.change(screen.getByLabelText('Payoff / due date'), {
      target: { value: '2030-01-01' },
    })
    fireEvent.change(screen.getByLabelText('Notes'), {
      target: { value: '  fixed rate  ' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add personal loan' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        lender: 'DNB',
        originalAmount: 1000,
        currentBalance: 800,
        payoffDate: '2030-01-01',
        notes: 'fixed rate',
      })
    })
  })
})