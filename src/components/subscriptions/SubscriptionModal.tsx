import React, { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  BillingCadence,
  Subscription,
  SubscriptionStatus,
} from '@/types/subscription'
import type { CreateSubscriptionPayload } from '@/services/subscriptionApi'

type SubscriptionFormState = {
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: BillingCadence
  price: string
  nextRenewalDate: string
  notes: string
}

const centsFromInput = (value: string): number => {
  const normalized = value.trim()
  if (normalized.length === 0) return Number.NaN
  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed)) return Number.NaN
  return Math.round(parsed * 100)
}

const emptyFormState: SubscriptionFormState = {
  name: '',
  provider: '',
  category: 'streaming',
  status: 'active',
  cadence: 'monthly',
  price: '',
  nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  notes: '',
}

export type SubscriptionModalProps = {
  isOpen: boolean
  subscription: Subscription | null
  onClose: () => void
  onSave: (payload: CreateSubscriptionPayload) => Promise<void>
}

const fieldLabelClass = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6862]'
const fieldClass = 'obsidian-field px-4 py-[14px] text-sm tracking-[0.01em]'

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  subscription,
  onClose,
  onSave,
}) => {
  const [formState, setFormState] = useState<SubscriptionFormState>(emptyFormState)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!subscription) {
      setFormState(emptyFormState)
      setHasTriedSubmit(false)
      setSaveError('')
      return
    }

    setFormState({
      name: subscription.name,
      provider: subscription.provider,
      category: subscription.category,
      status: subscription.status,
      cadence: subscription.cadence,
      price: (subscription.priceCents / 100).toFixed(2),
      nextRenewalDate: subscription.nextRenewalDate,
      notes: subscription.notes ?? '',
    })
    setHasTriedSubmit(false)
    setSaveError('')
  }, [isOpen, subscription])

  const priceCents = centsFromInput(formState.price)
  const isPriceValid = Number.isFinite(priceCents) && priceCents > 0
  const isDateValid = formState.nextRenewalDate.trim().length > 0
  const isNameValid = formState.name.trim().length > 0
  const isProviderValid = formState.provider.trim().length > 0
  const isFormValid = isNameValid && isProviderValid && isPriceValid && isDateValid

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasTriedSubmit(true)
    if (!isFormValid) return

    const next: CreateSubscriptionPayload = {
      name: formState.name.trim(),
      provider: formState.provider.trim(),
      category: formState.category.trim() || 'other',
      status: formState.status,
      cadence: formState.cadence,
      priceCents,
      nextRenewalDate: formState.nextRenewalDate,
      notes: formState.notes.trim() || undefined,
    }

    setSaveError('')
    setIsSaving(true)

    try {
      await onSave(next)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save subscription')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(0,0,0,0.72)] p-3 backdrop-blur-md sm:p-4">
      <div className="grid min-h-full place-items-start sm:place-items-center">
        <div className="relative w-full max-w-xl overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.10)] bg-[#111114] p-4 shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:p-5">
          <div className="pointer-events-none absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-50" />

          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a84c]/75">
                {subscription ? 'Edit subscription' : 'Add subscription'}
              </p>
              <h2 className="font-italiana text-[32px] leading-none tracking-[-0.01em] text-[#f0ede8]">
                Subscription node
              </h2>
              <p className="mt-2 text-sm text-[#6b6862]">
                Keep your recurring services in the same Obsidian Wealth style as the rest of the dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close subscription modal"
              className="mt-1 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.10)] bg-[#18181c] text-[#6b6862] transition-all duration-200 hover:border-[rgba(255,255,255,0.18)] hover:bg-[#202026] hover:text-[#f0ede8]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="sub-name" className={fieldLabelClass}>
                  Name
                </label>
                <input
                  id="sub-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  className={fieldClass}
                  autoFocus
                />
                {hasTriedSubmit && !isNameValid ? (
                  <p className="text-sm text-[#c96b6b]">Name is required.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="sub-provider" className={fieldLabelClass}>
                  Provider
                </label>
                <input
                  id="sub-provider"
                  type="text"
                  value={formState.provider}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, provider: event.target.value }))
                  }
                  className={fieldClass}
                />
                {hasTriedSubmit && !isProviderValid ? (
                  <p className="text-sm text-[#c96b6b]">Provider is required.</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="sub-category" className={fieldLabelClass}>
                  Category
                </label>
                <input
                  id="sub-category"
                  type="text"
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, category: event.target.value }))
                  }
                  className={fieldClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sub-status" className={fieldLabelClass}>
                  Status
                </label>
                <select
                  id="sub-status"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      status: event.target.value as SubscriptionStatus,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="sub-price" className={fieldLabelClass}>
                  Price (KR)
                </label>
                <input
                  id="sub-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.price}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, price: event.target.value }))
                  }
                  className={fieldClass}
                />
                {hasTriedSubmit && !isPriceValid ? (
                  <p className="text-sm text-[#c96b6b]">Price must be greater than 0.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="sub-cadence" className={fieldLabelClass}>
                  Cadence
                </label>
                <select
                  id="sub-cadence"
                  value={formState.cadence}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      cadence: event.target.value as BillingCadence,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="sub-renewal" className={fieldLabelClass}>
                  Next renewal
                </label>
                <input
                  id="sub-renewal"
                  type="date"
                  value={formState.nextRenewalDate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, nextRenewalDate: event.target.value }))
                  }
                  className={fieldClass}
                />
                {hasTriedSubmit && !isDateValid ? (
                  <p className="text-sm text-[#c96b6b]">Renewal date is required.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="sub-notes" className={fieldLabelClass}>
                  Notes
                </label>
                <input
                  id="sub-notes"
                  type="text"
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, notes: event.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Optional"
                />
              </div>
            </div>

            {saveError ? (
              <p className="text-sm text-[#c96b6b]" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="obsidian-button obsidian-button--ghost w-full px-6 py-3 text-base font-semibold sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="obsidian-button obsidian-button--gold w-full px-6 py-3 text-base font-semibold sm:w-auto"
              >
                {isSaving ? 'Saving...' : subscription ? 'Save changes' : 'Add subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionModal
