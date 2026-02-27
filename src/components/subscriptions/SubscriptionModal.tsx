import React, { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { BillingCadence, Subscription, SubscriptionStatus } from '@/components/subscriptions/SubscriptionLedger'

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

const uid = () => crypto.randomUUID()

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
  onSave: (subscription: Subscription) => void
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  subscription,
  onClose,
  onSave,
}) => {
  const [formState, setFormState] = useState<SubscriptionFormState>(emptyFormState)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!subscription) {
      setFormState(emptyFormState)
      setHasTriedSubmit(false)
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
  }, [isOpen, subscription])

  const priceCents = centsFromInput(formState.price)
  const isPriceValid = Number.isFinite(priceCents) && priceCents > 0
  const isDateValid = formState.nextRenewalDate.trim().length > 0
  const isNameValid = formState.name.trim().length > 0
  const isProviderValid = formState.provider.trim().length > 0
  const isFormValid = isNameValid && isProviderValid && isPriceValid && isDateValid

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasTriedSubmit(true)
    if (!isFormValid) return

    const next: Subscription = {
      id: subscription?.id ?? uid(),
      name: formState.name.trim(),
      provider: formState.provider.trim(),
      category: formState.category.trim() || 'other',
      status: formState.status,
      cadence: formState.cadence,
      priceCents,
      nextRenewalDate: formState.nextRenewalDate,
      notes: formState.notes.trim() || undefined,
    }

    onSave(next)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[22px] bg-gradient-to-br from-white/20 to-transparent p-[1px] shadow-[0_0_35px_rgba(var(--accent-rgb),0.2)]">
        <div className="rounded-[21px] border border-white/10 bg-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                {subscription ? 'Edit subscription' : 'Add subscription'}
              </p>
              <h2 className="text-xl font-semibold text-text-primary">Subscription node</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close subscription modal"
              className="rounded-lg border border-white/15 p-2 text-text-muted transition hover:border-white/30 hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="sub-name"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
                  Name
                </label>
                <input
                  id="sub-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                  autoFocus
                />
                {hasTriedSubmit && !isNameValid ? (
                  <p className="text-xs text-error">Name is required.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="sub-provider"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
                  Provider
                </label>
                <input
                  id="sub-provider"
                  type="text"
                  value={formState.provider}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, provider: event.target.value }))
                  }
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                />
                {hasTriedSubmit && !isProviderValid ? (
                  <p className="text-xs text-error">Provider is required.</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="sub-category"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
                  Category
                </label>
                <input
                  id="sub-category"
                  type="text"
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, category: event.target.value }))
                  }
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="sub-status"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
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
                  className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)]"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="sub-price"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
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
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                />
                {hasTriedSubmit && !isPriceValid ? (
                  <p className="text-xs text-error">Price must be greater than 0.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="sub-cadence"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
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
                  className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="sub-renewal"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
                  Next renewal
                </label>
                <input
                  id="sub-renewal"
                  type="date"
                  value={formState.nextRenewalDate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, nextRenewalDate: event.target.value }))
                  }
                  className="glass-panel w-full px-3 py-2 text-[var(--color-text-primary)]"
                />
                {hasTriedSubmit && !isDateValid ? (
                  <p className="text-xs text-error">Renewal date is required.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="sub-notes"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
                >
                  Notes
                </label>
                <input
                  id="sub-notes"
                  type="text"
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 pb-2 pt-1 text-text-primary outline-none transition focus:border-accent focus:shadow-[0_6px_14px_-8px_rgba(var(--accent-rgb),0.95)]"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="glass-panel px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-panel px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:bg-white/10"
              >
                {subscription ? 'Save changes' : 'Add subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionModal

