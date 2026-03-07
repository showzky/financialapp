import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Loans } from '@/pages/Loans'

const loanApiMock = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  markRepaid: vi.fn(),
  remove: vi.fn(),
}))

const borrowedLoanApiMock = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  markPaidOff: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/services/loanApi', () => ({
  loanApi: loanApiMock,
}))

vi.mock('@/services/borrowedLoanApi', () => ({
  borrowedLoanApi: borrowedLoanApiMock,
}))

vi.mock('@/components/AddLoanModal', () => ({
  AddLoanModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Add loan modal</div> : null),
}))

vi.mock('@/components/AddBorrowedLoanModal', () => ({
  AddBorrowedLoanModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Add personal loan modal</div> : null,
}))

vi.mock('@/components/EditLoanModal', () => ({
  EditLoanModal: () => null,
}))

vi.mock('@/components/EditBorrowedLoanModal', () => ({
  EditBorrowedLoanModal: () => null,
}))

vi.mock('@/components/RecurringAutomationToast', () => ({
  RecurringAutomationToast: () => null,
}))

vi.mock('@/components/ConfirmModal', () => ({
  ConfirmModal: ({
    isOpen,
    title,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean
    title: string
    onConfirm: () => void
    onCancel: () => void
  }) =>
    isOpen ? (
      <div>
        <p>{title}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}))

describe('Loans page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    loanApiMock.list.mockResolvedValue([
      {
        id: 'lent-1',
        recipient: 'John Doe',
        amount: 1500,
        dateGiven: '2024-01-01T00:00:00Z',
        expectedRepaymentDate: '2024-02-01T00:00:00Z',
        notes: null,
        repaidAt: null,
        status: 'outstanding',
        daysRemaining: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    borrowedLoanApiMock.list.mockResolvedValue([
      {
        id: 'borrowed-1',
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
    ])

    borrowedLoanApiMock.markPaidOff.mockResolvedValue({
      id: 'borrowed-1',
      lender: 'Storebrand',
      originalAmount: 300000,
      currentBalance: 0,
      payoffDate: '2035-01-01T00:00:00Z',
      notes: 'Fixed rate',
      paidOffAt: '2026-03-07T00:00:00Z',
      status: 'paid_off',
      daysRemaining: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2026-03-07T00:00:00Z',
    })
  })

  it('renders the lent tab by default and keeps the lent add flow wired', async () => {
    render(<Loans />)

    await screen.findByText('John Doe')

    expect(screen.getByText('Loans given to others')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add new lent loan' }))
    expect(screen.getByText('Add loan modal')).toBeInTheDocument()
  })

  it('switches to my loans and renders borrowed-loan content', async () => {
    render(<Loans />)

    await screen.findByText('John Doe')
    fireEvent.click(screen.getByRole('button', { name: 'My loans' }))

    expect(await screen.findByText('Storebrand')).toBeInTheDocument()
    expect(screen.getByText('Current balance: KR 220,000')).toBeInTheDocument()
  })

  it('keeps lent mark-repaid wiring intact after the tab split', async () => {
    loanApiMock.markRepaid.mockResolvedValueOnce({
      id: 'lent-1',
      recipient: 'John Doe',
      amount: 1500,
      dateGiven: '2024-01-01T00:00:00Z',
      expectedRepaymentDate: '2024-02-01T00:00:00Z',
      notes: null,
      repaidAt: '2026-03-07T00:00:00Z',
      status: 'repaid',
      daysRemaining: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2026-03-07T00:00:00Z',
    })

    render(<Loans />)

    await screen.findByText('John Doe')
    fireEvent.click(screen.getByRole('button', { name: 'Mark repaid' }))

    await waitFor(() => {
      expect(loanApiMock.markRepaid).toHaveBeenCalledWith('lent-1')
    })
  })

  it('confirms before marking a borrowed loan as paid off', async () => {
    render(<Loans />)

    await screen.findByText('John Doe')
    fireEvent.click(screen.getByRole('button', { name: 'My loans' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Mark paid off' }))

    expect(screen.getByText('Mark Personal Loan as Paid Off?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(borrowedLoanApiMock.markPaidOff).toHaveBeenCalledWith('borrowed-1')
    })
  })

  it('keeps the lent tab usable when personal loans fail to load', async () => {
    borrowedLoanApiMock.list.mockRejectedValueOnce(new Error('Could not load personal loans'))

    render(<Loans />)

    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Could not load personal loans')).toBeInTheDocument()
    expect(screen.getByText('Loans given to others')).toBeInTheDocument()
  })
})