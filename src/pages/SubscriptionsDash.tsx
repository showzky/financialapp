import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { SubscriptionLedger, type Subscription } from '@/components/subscriptions/SubscriptionLedger'
import '@/styles/hud.css'
import { SubscriptionModal } from '@/components/subscriptions/SubscriptionModal'
import { subscriptionApi } from '@/services/subscriptionApi'

export const SubscriptionsDash: React.FC = () => {
  const [hudAlert, setHudAlert] = useState('')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)

  const handleAddClick = () => {
    setEditingSubscription(null)
    setIsModalOpen(true)
  }
  const activeCount = useMemo(
    () => subscriptions.filter((s) => s.status === 'active').length,
    [subscriptions],
  )

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const rows = await subscriptionApi.list()
      setSubscriptions(rows)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load subscriptions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSubscriptions()
  }, [loadSubscriptions])

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setIsModalOpen(true)
  }

  const handleDelete = (subscription: Subscription) => {
    setSubscriptions((current) => current.filter((s) => s.id !== subscription.id))
  }

  const handleToggleStatus = (subscription: Subscription) => {
    setSubscriptions((current) =>
      current.map((s) => {
        if (s.id !== subscription.id) return s
        const nextStatus = s.status === 'active' ? 'paused' : 'active'
        return { ...s, status: nextStatus }
      }),
    )
    setHudAlert(`HUD Alert: Toggled status for "${subscription.name}".`)
  }

  return (
    <div className="relative min-h-screen pt-12 overflow-hidden bg-[var(--app-bg)]">
      <div className="fixed top-0 left-0 w-full h-[2px] bg-[var(--color-accent)]/10 shadow-[0_0_15px_var(--color-accent)_0.2)] z-[50] animate-scan" />
      <div className="vacation-hud-grid relative z-10 mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {hudAlert ? (
          <div className="glass-panel border border-red-400/30 px-4 py-3 text-sm text-red-200">
            {hudAlert}
          </div>
        ) : null}

        <div className="hud-glass-card">
          <div className="flex items-center gap-2 mb-6">
            <span className="hud-status-dot" />
            <h3 className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--color-text-muted)] m-0">
              Subscription Dashboard
            </h3>
          </div>
          <div className="glass-panel px-4 py-3 text-sm text-[var(--color-text-muted)]">
            Frontend-only dashboard scaffold. Active nodes: <span className="hud-monospaced">{activeCount}</span>
          </div>
        </div>

        <SubscriptionLedger
          subscriptions={subscriptions}
          isLoading={isLoading}
          loadError={loadError}
          onRetryLoad={loadSubscriptions}
          onEdit={handleEdit}
          onAdd={handleAddClick}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />

        <SubscriptionModal
          isOpen={isModalOpen}
          subscription={editingSubscription}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSubscription(null)
          }}
          onSave={(saved) => {
            setSubscriptions((current) => {
              const index = current.findIndex((s) => s.id === saved.id)
              if (index === -1) return [saved, ...current]
              const next = current.slice()
              next[index] = saved
              return next
            })
            setHudAlert(
              editingSubscription
                ? `HUD Alert: Updated "${saved.name}".`
                : `HUD Alert: Added "${saved.name}".`,
            )
          }}
        />
      </div>
    </div>
  )
}

export default SubscriptionsDash
