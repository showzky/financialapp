import React, { useState } from 'react'
import { vacationApi } from '../services/vacationApi'
import { getHudAlertMessage } from '../services/backendClient'
import type { VacationFund } from '../types/vacation'

type AddFundsModalProps = {
  isOpen: boolean
  vacationId: string
  onClose: () => void
  onFundsAdded: (fund: VacationFund) => void
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({
  isOpen,
  vacationId,
  onClose,
  onFundsAdded,
}) => {
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hudAlert, setHudAlert] = useState('')

  const getAmountInCents = () => Math.round(Number.parseFloat(amount || '0') * 100)
  const canSubmitFunds = () => Number.isFinite(getAmountInCents()) && getAmountInCents() !== 0

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmitFunds()) {
      setHudAlert('HUD Alert: Enter a non-zero amount. Use negative to subtract funds.')
      return
    }

    setIsSubmitting(true)
    setHudAlert('')
    try {
      const fund = await vacationApi.adjustFunds(vacationId, {
        deltaAmount: getAmountInCents(),
        note: 'manual_correction',
      })
      onFundsAdded(fund)
      onClose()
      setAmount('')
    } catch (error) {
      setHudAlert(getHudAlertMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-lg">
      <div className="glass-panel w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Add Funds to Ferie Tank
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="glass-panel px-3 py-1 text-sm font-semibold text-[var(--color-text-muted)] transition-all hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Adjustment Amount (KR)
            </label>
            <input
              type="number"
              min={undefined}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)] placeholder-text-muted"
              placeholder="e.g. 500.00 or -120.00"
              required
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Positive adds funds. Negative subtracts to correct the vault.
            </p>
          </div>

          {hudAlert ? (
            <div className="glass-panel border border-red-400/30 px-3 py-2 text-xs text-red-200">
              {hudAlert}
            </div>
          ) : null}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="glass-panel flex-1 px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-panel flex-1 px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-white/10"
              disabled={isSubmitting || !canSubmitFunds()}
            >
              {isSubmitting ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
