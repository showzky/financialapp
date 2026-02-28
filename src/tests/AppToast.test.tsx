import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { AppToast } from '@/components/RecurringAutomationToast'

describe('AppToast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-dismisses after default duration', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    render(<AppToast message="Saved" onClose={onClose} />)

    vi.advanceTimersByTime(2199)
    expect(onClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('supports manual dismiss', () => {
    const onClose = vi.fn()

    render(<AppToast message="Updated" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss toast' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles', () => {
    const onClose = vi.fn()

    const { rerender } = render(<AppToast message="Info" onClose={onClose} variant="info" />)
    expect(screen.getByRole('status')).toHaveClass('bg-white/5', 'text-text-primary')

    rerender(<AppToast message="Oops" onClose={onClose} variant="error" />)
    expect(screen.getByRole('alert')).toHaveClass('bg-error/10', 'text-error')

    rerender(<AppToast message="Done" onClose={onClose} variant="success" />)
    expect(screen.getByRole('status')).toHaveClass('bg-success/10', 'text-success')
  })
})
