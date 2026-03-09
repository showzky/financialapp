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

const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6862]'
const fieldClass = 'obsidian-field w-full px-4 py-[14px] text-sm tracking-[0.01em]'

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(0,0,0,0.72)] p-3 backdrop-blur-md sm:p-4">
      <div className="grid min-h-full place-items-start sm:place-items-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.10)] bg-[#111114] p-4 shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:p-5">
          <div className="pointer-events-none absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-50" />
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a84c]/75">
                Vacation
              </p>
              <h2 className="font-italiana text-[32px] leading-none tracking-[-0.01em] text-[#f0ede8]">
                Add Funds to Ferie Tank
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] text-base leading-none text-[#6b6862] transition-all duration-200 hover:border-[rgba(255,255,255,0.18)] hover:bg-[#202026] hover:text-[#f0ede8]"
              aria-label="Close add funds modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Adjustment Amount (KR)</label>
              <input
                type="number"
                min={undefined}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={fieldClass}
                placeholder="e.g. 500.00 or -120.00"
                required
              />
              <p className="mt-2 text-xs text-[#6b6862]">
                Positive adds funds. Negative subtracts to correct the vault.
              </p>
            </div>

            {hudAlert ? (
              <div className="obsidian-subpanel border border-[rgba(201,107,107,0.28)] bg-[rgba(201,107,107,0.08)] px-3 py-2 text-xs text-[#f1c3c3]">
                {hudAlert}
              </div>
            ) : null}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="obsidian-button obsidian-button--ghost flex-1 px-4 py-3 text-sm font-semibold"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="obsidian-button obsidian-button--gold flex-1 px-4 py-3 text-sm font-semibold"
                disabled={isSubmitting || !canSubmitFunds()}
              >
                {isSubmitting ? 'Applying...' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
