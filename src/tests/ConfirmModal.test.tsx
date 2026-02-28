import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmModal } from '@/components/ConfirmModal'

describe('ConfirmModal', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnConfirm.mockClear()
    mockOnCancel.mockClear()
  })

  it('renders modal with correct content when open', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item?"
        body="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    )

    expect(screen.getByText('Delete Item?')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        title="Delete Item?"
        body="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    )

    expect(screen.queryByText('Delete Item?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item?"
        body="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    )

    const confirmButton = screen.getByText('Delete')
    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalled()
    expect(mockOnCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item?"
        body="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when close button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item?"
        body="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    )

    const closeButton = screen.getByRole('button', { name: 'Close confirmation modal' })
    fireEvent.click(closeButton)

    expect(mockOnCancel).toHaveBeenCalled()
    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  it('exposes an accessible close button label', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item?"
        body="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    )

    expect(screen.getByRole('button', { name: 'Close confirmation modal' })).toBeInTheDocument()
  })
})
